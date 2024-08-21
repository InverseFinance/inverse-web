import { getReferralMsg } from '@app/components/common/Modal/ReferralModal';
import { DBR_ABI } from '@app/config/abis';
import { BURN_ADDRESS, ONE_DAY_MS } from '@app/config/constants';
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { verifyMultisigMessage } from '@app/util/multisig';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis';
import { Contract } from 'ethers';
import { verifyMessage, hashMessage, isAddress } from 'ethers/lib/utils';
import { businessChecks, individualInputs } from '../affiliate/register';

const { DBR, MULTISIGS } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const {
        query,
        method,
    } = req

    const { r, account, csv, isApply } = query;

    const referralsKey = `referrals-v1.0.0`;
    const affiliatesKey = `affiliate-applications-v1.0.2`;
    const apiDataKey = `affiliation-v1.0.1`;
    const referralData = await getCacheFromRedis(referralsKey, false, 600);
    const { data: cachedResult, isValid: isCacheValid } = await getCacheFromRedisAsObj(apiDataKey, true, 60);

    const provider = getProvider(NetworkIds.mainnet);
    const dbrContract = new Contract(DBR, DBR_ABI, provider);

    switch (method) {
        case 'GET':
            if (csv === 'true') {
                let CSV = `Account,Referrer,Date\n`;
                const arr = Object.entries(referralData?.referrals || []);
                arr.forEach(([account, accountRefData]) => {
                    CSV += `${account.toLowerCase()},${accountRefData.affiliate.toLowerCase()},${(new Date(accountRefData.timestamp).toUTCString()).replace(/,/g, '')}\n`;
                });
                res.setHeader("Content-Type", "text/csv");
                res.setHeader("Content-Disposition", "attachment; filename=referrals.csv");
                res.status(200).send(CSV);
                return;
            }
            if (isCacheValid) {
                return res.status(200).json(cachedResult);
            }

            const affiliatesData = await getCacheFromRedis(affiliatesKey, false, 600) || { affiliates: [] };
            const affiliates = affiliatesData?.affiliates.map(afData => afData);
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
            if (!!r) {
                if (!r || !isAddress(r) || r === BURN_ADDRESS || !account || !isAddress(account) || account === BURN_ADDRESS || r.toLowerCase() === account.toLowerCase()) {
                    res.status(400).json({ status: 'error', message: 'Invalid address' });
                    return;
                } else if (!!referralData?.referrals[account]) {
                    return res.status(400).json({ status: 'error', message: 'A referral has been already registered' });
                }

                const affiliatesData = await getCacheFromRedis(affiliatesKey, false, 600) || { affiliates: [] };                

                const affData = affiliatesData?.affiliates.find(a => a.affiliate.toLowerCase() === r.toLowerCase());

                // if (affData?.status !== 'active') {
                //     return res.status(400).json({ status: 'error', message: 'This Affiliate address is not active yet.' });
                // }

                const { sig } = req.body
                let sigAddress = '';

                const sigText = getReferralMsg(account, r);

                try {
                    sigAddress = verifyMessage(sigText, sig);
                } catch (e) {
                    console.log(e);
                }

                if (sigAddress?.toLowerCase() !== account.toLowerCase() || !sigAddress) {
                    // try to verify as multisig
                    let multisigVerifyResult;
                    try {
                        multisigVerifyResult = await verifyMultisigMessage(account, hashMessage(sigText), sig);
                    } catch (e) {
                        console.log('multisig verify error');
                        console.log(e);
                    }
                    if (!multisigVerifyResult?.valid) {
                        res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                        return
                    }
                };

                const block = await provider.getBlock('latest');
                const { number: blockNumber, timestamp: blockTs } = block;
                const now = blockTs * 1000;

                const [
                    lastUpdated,
                    debt,
                    dueTokensAccrued,
                ] = await getGroupedMulticallOutputs([
                    { contract: dbrContract, functionName: 'lastUpdated', params: [sigAddress] },
                    { contract: dbrContract, functionName: 'debts', params: [sigAddress] },
                    { contract: dbrContract, functionName: 'dueTokensAccrued', params: [sigAddress] },
                ]);

                const lastUpdatedMs = getBnToNumber(lastUpdated, 0) * 1000;
                const dueTokensAccruedSinceLastUpdate = (now - lastUpdatedMs) * getBnToNumber(debt) / ONE_DAY_MS * 365;
                const beforeReferralDueTokensAccrued = getBnToNumber(dueTokensAccrued) + dueTokensAccruedSinceLastUpdate;

                const result = {
                    timestamp: now,
                    referrals: {
                        ...cachedResult?.referrals,
                        [sigAddress]: {
                            affiliate: r,
                            timestamp: Date.now(),
                            beforeReferralDueTokensAccrued,
                            blockNumber,
                        },
                    },
                };

                await redisSetWithTimestamp(referralsKey, result);
                res.status(200).json(result);
            } else if (isApply === 'true') {
                const {
                    wallet,
                    name,
                    email,
                    emailConfirm,
                    affiliateType,
                    infos,
                    otherInfo,
                } = req.body;
                if (!wallet || !isAddress(wallet) || wallet === BURN_ADDRESS) {
                    res.status(400).json({ status: 'error', message: 'Invalid address' });
                    return;
                }
                else if (
                    !name
                    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                    || email !== emailConfirm
                    || !['individual', 'business'].includes(affiliateType)
                    || Object.keys(infos).some(key => !individualInputs.map(ii => ii.key).concat(businessChecks.map(ii => ii.key)).includes(key))
                    || otherInfo.length > 1000
                ) {
                    res.status(400).json({ status: 'error', message: 'Invalid request' });
                    return;
                }
                
                const affiliatesData = await getCacheFromRedis(affiliatesKey, false, 600) || { affiliates: [] };

                const found = affiliatesData?.affiliates.find(d => d.affiliate.toLowerCase() === wallet.toLowerCase());

                if(!!found) {
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