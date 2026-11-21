import { getReferralMsg } from '@app/components/common/Modal/ReferralModal';
import { DBR_ABI } from '@app/config/abis';
import { BURN_ADDRESS, DRAFT_WHITELIST, ONE_DAY_MS } from '@app/config/constants';
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { verifyMultisigMessage } from '@app/util/multisig';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis';
import { Contract } from 'ethers';
import { verifyMessage, hashMessage, isAddress, getAddress } from 'ethers/lib/utils';
import { businessChecks, getAffiliateApplicationMsg, individualInputs } from '../affiliate/register';
import { getAffiliateStatusMsg } from '@app/components/F2/Infos/FirmAffiliateList';

const { DBR, MULTISIGS } = getNetworkConfigConstants();

// applicant values in the team email
const escapeHtml = (value: any) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// csv cell: quoted, with a leading formula character neutralized, the csv is opened in spreadsheets
const toCsvCell = (value: any) => {
    const str = String(value ?? '');
    return `"${(/^[=+\-@\t\r]/.test(str) ? `'${str}` : str).replace(/"/g, '""')}"`;
}

// the message is signed by the account: an eoa signature, or a multisig one checked by the multisig
const isSignedBy = async (account: string, msg: string, sig: any): Promise<boolean> => {
    if (!sig || typeof sig !== 'string') {
        return false;
    }
    try {
        if (verifyMessage(msg, sig).toLowerCase() === account.toLowerCase()) {
            return true;
        }
    } catch (e) { }
    try {
        return !!(await verifyMultisigMessage(account, hashMessage(msg), sig))?.valid;
    } catch (e) {
        console.log('multisig verify error');
        console.log(e);
        return false;
    }
}

const sendNotifToTeam = async (data: any) => {
    const basics = { name: data.name, email: data.email, affiliate: data.affiliate, affiliateType: data.affiliateType };
    const isIndividual = data.affiliateType === 'individual';

    const mainValues = Object.entries(basics).map(([key, value]) => {
        return `<li>${key}: <strong>${escapeHtml(value)}</strong></li>`;
    }).join('');

    let html = `<h1>A new Affiliate applied!</h1></br></br><p><strong>Main informations:</strong></p><ul>${mainValues}</ul>`

    const socialsAndBusinessInfos = Object.entries(data.infos).map(([key, value]) => {
        const arr = isIndividual ? individualInputs : businessChecks;
        const item = arr.find(item => item.key === key);
        return !!item ? `<li>${item.text}${isIndividual ? `: <strong>${escapeHtml(value)}</strong></li>` : ''}` : '';
    }).join('');

    html += `</br></br>${isIndividual ? '<p><strong>Socials:</strong></p>' : '<p><strong>Business sectors:</strong></p>'}<ul>${socialsAndBusinessInfos}</ul>`;

    html += `</br></br><p><strong>Remark</strong>:</p></br><p><i>${escapeHtml(data.otherInfo)}</i></p>`;

    const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Postmark-Server-Token': process.env.EMAIL_TOKEN,
        },
        body: JSON.stringify({
            From: process.env.REF_EMAIL_FROM,
            To: process.env.REF_EMAIL_TO,
            Cc: process.env.REF_EMAIL_FROM,
            Subject: 'New Affiliate Applied',
            TextBody: 'New Affiliate Applied',
            HtmlBody: `<html><body>${html}</body></html>`,
            MessageStream: 'outbound',
        }),
    });    
}

const toCsv = (affiliates: any) => {
    const socialColumns = individualInputs.map(ii => ii.text).join(',');
    const businessColumns = businessChecks.map(ii => ii.text).join(',');
    const columns = `Affiliate,Name,Email,Type,Application Date,Status,Remark,${socialColumns},${businessColumns}`
    let CSV = `${columns}\n`;
    
    affiliates.forEach((a) => {
        const socialValues = individualInputs.map(ii => toCsvCell(a.infos[ii.key])).join(',');
        const businessValues = businessChecks.map(ii => toCsvCell(a.infos[ii.key])).join(',');
        const mainValues = [a.affiliate, a.name, a.email, a.affiliateType, (new Date(a.timestamp).toUTCString()).replace(/,/g, ''), a.status, a.otherInfo || ''].map(toCsvCell).join(',');
        CSV += `${mainValues},${socialValues},${businessValues}\n`;
    });
    return CSV;
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', `public, max-age=60`);
    const {
        query,
        method,
    } = req

    const { r, account, csv, isApply, csv_access, statuate, updateIndex } = query;

    const referralsKey = `referrals-v1.0.1`;
    const affiliatesKey = `affiliate-applications-v1.0.2`;
    const apiDataKey = `affiliation-v1.0.2`;
    const csvDataKey = `affiliation-csv-v1.0.2`;

    if(csv === 'true' && csv_access !== process.env.REF_CSV_ACCESS) {
        return res.status(400).json({ status: 'error', message: 'Invalid request' });
    }

    const referralData = await getCacheFromRedis(referralsKey, false, 600);
    const { data: cachedResult, isValid: isCacheValid } = await getCacheFromRedisAsObj(csv === 'true' ? csvDataKey : apiDataKey, true, 60);

    const provider = getProvider(NetworkIds.mainnet);
    const dbrContract = new Contract(DBR, DBR_ABI, provider);

    switch (method) {
        case 'GET':
            if (isCacheValid && (updateIndex === '0') || !updateIndex) {
                if(csv === 'true') {
                    res.setHeader("Content-Type", "text/csv");
                    res.setHeader("Content-Disposition", "attachment; filename=affiliates.csv");
                    res.status(200).send(cachedResult.csvData);
                }
                return res.status(200).json(cachedResult);
            }

            const affiliatesData = await getCacheFromRedis(affiliatesKey, false, 600) || { affiliates: [] };
            const affiliates = affiliatesData?.affiliates.map(afData => afData);

            if (csv === 'true') {
                const CSV = toCsv(affiliates);
                await redisSetWithTimestamp(csvDataKey, { csvData: CSV });
                res.setHeader("Content-Type", "text/csv");
                res.setHeader("Content-Disposition", "attachment; filename=affiliates.csv");
                res.status(200).send(CSV);
                return;
            }

            const affiliatesPublicData = affiliates.map(afData => {
                return {
                    name: afData.name,
                    affiliate: afData.affiliate,
                    affiliateType: afData.affiliateType,
                    timestamp: afData.timestamp,
                    status: afData.status,
                }
            });
            const affiliateAddresses = affiliatesPublicData.map(afData => afData.affiliate);

            const affiliateReferrals = Object.entries(referralData?.referrals || {})
                .map(([referred, refData]) => ({
                    referred,
                    affiliate: refData.affiliate,
                    timestamp: refData.timestamp,
                    beforeReferralDueTokensAccrued: refData.beforeReferralDueTokensAccrued,
                    blockNumber: refData.blockNumber,
                }));

            const GWGaddress = MULTISIGS.find(m => m.shortName === 'GWG')?.address;

            // gwg dbr transfer events
            const gwgPaymentEvents = await dbrContract.queryFilter(dbrContract.filters.Transfer(GWGaddress));
            const affiliatePayments = {};
            const affiliatePaymentEvents = [];

            gwgPaymentEvents.forEach(event => {
                if (affiliateAddresses.includes(event.args.to)) {
                    if (!affiliatePayments[event.args.to]) {
                        affiliatePayments[event.args.to] = 0;
                    }
                    const amount = getBnToNumber(event.args.amount);
                    affiliatePayments[event.args.to] += amount;
                    affiliatePaymentEvents.push({
                        amount,
                        txHash: event.transactionHash,
                        affiliate: event.args.to,
                        blockNumber: event.blockNumber,
                    });
                }
            });

            const affiliateResults = {
                timestamp: Date.now(),
                referrals: affiliateReferrals,
                affiliatesPublicData,
                affiliateAddresses,
                affiliatePaymentEvents,
            };
            await redisSetWithTimestamp(apiDataKey, affiliateResults);
            return res.status(200).json(affiliateResults);
            break
        case 'POST':
            if(statuate === 'true') {
                const { sig, newStatus, signer } = req.body
                let sigAddress = '';
                const sigText = getAffiliateStatusMsg(r, newStatus);

                try {
                    sigAddress = verifyMessage(sigText, sig);
                } catch (e) {
                    console.log(e);
                }

                if(!['approved', 'pending', 'rejected', 'revoked'].includes(newStatus) || signer !== sigAddress || !DRAFT_WHITELIST.map(d => d.toLowerCase()).includes(sigAddress.toLowerCase())) {
                    return res.status(400).json({ status: 'error', message: 'Invalid request' });
                }

                const affiliatesData = await getCacheFromRedis(affiliatesKey, false, 600) || { affiliates: [] };
                const affiliateIdx = affiliatesData.affiliates.findIndex(a => a.affiliate.toLowerCase() === r.toLowerCase());

                if(affiliateIdx === -1) {
                    return res.status(400).json({ status: 'error', message: 'Affiliate not found' });
                }                

                const now = Date.now();
                affiliatesData.affiliates[affiliateIdx].status = newStatus;
                affiliatesData.affiliates[affiliateIdx].statusUpdated = now;

                const affiliateResults = {
                    timestamp: now,
                    affiliates: affiliatesData.affiliates,
                };

                await redisSetWithTimestamp(affiliatesKey, affiliateResults);

                return res.status(200).json({
                    status: "ok",
                    message: "Application "+newStatus,
                });
            }
            else if (!!r) {
                if (!r || !isAddress(r) || r === BURN_ADDRESS || !account || !isAddress(account) || account === BURN_ADDRESS || r.toLowerCase() === account.toLowerCase()) {
                    res.status(400).json({ status: 'error', message: 'Invalid address' });
                    return;
                } else if (!!referralData?.referrals?.[getAddress(account)]) {
                    return res.status(400).json({ status: 'error', message: 'A referral has been already registered' });
                }

                const affiliatesData = await getCacheFromRedis(affiliatesKey, false, 600) || { affiliates: [] };

                const affData = affiliatesData?.affiliates.find(a => a.affiliate.toLowerCase() === r.toLowerCase());

                if (affData?.status !== 'approved') {
                    return res.status(400).json({ status: 'error', message: 'This Affiliate address is not active yet.' });
                }

                const { sig } = req.body
                if (!(await isSignedBy(account, getReferralMsg(account, r), sig))) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                }
                // the verified account: the address recovered from a multisig signature is not the account
                const referred = getAddress(account);

                const block = await provider.getBlock('latest');
                const { number: blockNumber, timestamp: blockTs } = block;
                const now = blockTs * 1000;

                const [
                    lastUpdated,
                    debt,
                    dueTokensAccrued,
                ] = await getGroupedMulticallOutputs([
                    { contract: dbrContract, functionName: 'lastUpdated', params: [referred] },
                    { contract: dbrContract, functionName: 'debts', params: [referred] },
                    { contract: dbrContract, functionName: 'dueTokensAccrued', params: [referred] },
                ]);

                const lastUpdatedMs = getBnToNumber(lastUpdated, 0) * 1000;
                const dueTokensAccruedSinceLastUpdate = (now - lastUpdatedMs) * getBnToNumber(debt) / (ONE_DAY_MS * 365);
                const beforeReferralDueTokensAccrued = getBnToNumber(dueTokensAccrued) + dueTokensAccruedSinceLastUpdate;

                const result = {
                    timestamp: now,
                    referrals: {
                        // the stored referrals by referred account, not the referrals of the api data (a list)
                        ...referralData?.referrals,
                        [referred]: {
                            affiliate: r,
                            timestamp: Date.now(),
                            beforeReferralDueTokensAccrued,
                            blockNumber,
                        },
                    },
                };

                await redisSetWithTimestamp(referralsKey, result);
                return res.status(200).json(result);
            } else if (isApply === 'true') {
                const {
                    wallet,
                    name,
                    email,
                    emailConfirm,
                    affiliateType,
                    infos,
                    otherInfo,
                    sig,
                } = req.body;

                // known keys only: a text for a social, a boolean for a business check
                const isInvalidInfos = !infos || typeof infos !== 'object' || Array.isArray(infos)
                    || Object.entries(infos).some(([key, value]) => {
                        if (individualInputs.some(ii => ii.key === key)) {
                            return typeof value !== 'string' || value.length > 200;
                        }
                        return !businessChecks.some(bc => bc.key === key) || typeof value !== 'boolean';
                    });

                if (!wallet || typeof wallet !== 'string' || !isAddress(wallet) || wallet === BURN_ADDRESS) {
                    res.status(400).json({ status: 'error', message: 'Invalid address' });
                    return;
                }
                else if (isInvalidInfos) {
                    res.status(400).json({ status: 'error', message: 'Invalid request' });
                    return;
                }

                const isInvalidIndividual = affiliateType === 'individual' && !Object.entries(infos).filter(([key, value]) => individualInputs.map(ii => ii.key).includes(key)).some(([key, value]) => !!value.trim());
                const isInvalidBusiness = affiliateType === 'business' && !Object.entries(infos).filter(([key, value]) => businessChecks.map(ii => ii.key).includes(key)).some(([key, value]) => !!value);

                if (
                    typeof name !== 'string' || !name.trim() || name.length > 100
                    || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                    || email !== emailConfirm
                    || !['individual', 'business'].includes(affiliateType)
                    || isInvalidIndividual
                    || isInvalidBusiness
                    || (otherInfo !== undefined && typeof otherInfo !== 'string')
                    || (otherInfo || '').length > 1000
                    || /[<>/\\{}]/i.test(name)
                    || /[<>/\\{}]/i.test(otherInfo || '')
                ) {
                    res.status(400).json({ status: 'error', message: 'Invalid request' });
                    return;
                }

                // signed by the payment wallet (eoa or multisig): nobody can apply with the wallet of someone else
                if (!(await isSignedBy(wallet, getAffiliateApplicationMsg(wallet), sig))) {
                    res.status(401).json({ status: 'warning', message: 'The application must be signed by the payment wallet' });
                    return;
                }

                const affiliatesData = await getCacheFromRedis(affiliatesKey, false, 600) || { affiliates: [] };

                const found = affiliatesData?.affiliates.find(d => d.affiliate.toLowerCase() === wallet.toLowerCase());

                if (!!found) {
                    return res.status(400).json({ status: 'error', message: 'Wallet already registered' });
                }

                const now = Date.now();

                const affiliate = {
                    affiliate: wallet,
                    name,
                    email,
                    affiliateType,
                    infos,
                    otherInfo,
                    timestamp: now,
                    status: 'pending',
                };

                try {
                    await sendNotifToTeam(affiliate);
                } catch (e) {
                    console.log('email failed');
                }

                affiliatesData.affiliates.push(affiliate);

                const affiliateResults = {
                    timestamp: now,
                    affiliates: affiliatesData.affiliates,
                };

                await redisSetWithTimestamp(affiliatesKey, affiliateResults);

                return res.status(200).json({
                    affiliate,
                    status: "ok",
                    message: "Application registered!",
                });
            }
            res.status(400).json({ status: 'error', message: 'Invalid request' });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}