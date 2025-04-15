
import { isAddress, verifyMessage } from 'ethers/lib/utils';
import { ADMIN_ADS } from '@app/variables/names';
import { getCacheFromRedis, invalidateRedisCache, redisSetWithTimestamp } from '@app/util/redis';
import { getSignMessageWithUtcDate } from '@app/util/misc';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';
import { SERVER_BASE_URL } from '@app/config/constants';

export const marketsDisplaysCacheKey = 'markets-displays-v1.3';

const invalidateMarkets = async () => {
    await invalidateRedisCache(F2_MARKETS_CACHE_KEY, false);
    fetch(`${SERVER_BASE_URL}/api/f2/fixed-markets`)
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', `public, max-age=1`);
    const {
        method,
    } = req

    switch (method) {
        case 'GET':
            try {
                const cachedData = (await getCacheFromRedis(marketsDisplaysCacheKey, false)) || { updates: [], globalMessage: '', globalMessageStatus: 'info' };
                res.status(200).json({ status: 'success', data: cachedData })
            } catch (e) {
                console.error(e);
                res.status(500).json({ status: 'error', message: 'An error occured' })
            }
            break
        case 'PUT':
            try {
                const { sig, type, marketAddress, noDeposit, isPhasingOut, phasingOutComment, globalMessage, globalMessageStatus, isLeverageSuspended, isBorrowingSuspended, suspendAllDeposits, suspendAllLeverage, suspendAllBorrows } = req.body;

                const whitelisted = ADMIN_ADS.map(a => a.toLowerCase());
                const sigAddress = verifyMessage(getSignMessageWithUtcDate(), sig).toLowerCase();

                if (!whitelisted.includes(sigAddress)) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                };

                if (type === 'message') {
                    if (globalMessage?.length > 500 || !['warning', 'error', 'info', 'success'].includes(globalMessageStatus)) {
                        res.status(400).json({ status: 'warning', message: 'Invalid global message' })
                        return
                    };
                }
                else if (type === 'all-markets') {
                    if (!['yes', 'no'].includes(suspendAllDeposits) || !['yes', 'no'].includes(suspendAllLeverage) || !['yes', 'no'].includes(suspendAllBorrows)) {
                        res.status(400).json({ status: 'warning', message: 'Invalid values' })
                        return
                    }
                }
                else if (!marketAddress || !isAddress(marketAddress) || !['yes', 'no'].includes(noDeposit) || !['yes', 'no'].includes(isPhasingOut) || phasingOutComment?.length > 500 || !['yes', 'no'].includes(isLeverageSuspended) || !['yes', 'no'].includes(isBorrowingSuspended)) {
                    res.status(400).json({ status: 'warning', message: 'Invalid values' })
                    return
                }

                const cachedData = (await getCacheFromRedis(marketsDisplaysCacheKey, false)) || { updates: [], globalMessage: '', globalMessageStatus: 'info' };
                // keep track of updates, updates is an array for both global messages and market updates
                if (!cachedData?.updates) {
                    cachedData.updates = [];
                }

                const now = Date.now();

                if (type === 'all-markets') {
                    cachedData.suspendAllDeposits = suspendAllDeposits === 'yes';
                    cachedData.suspendAllLeverage = suspendAllLeverage === 'yes';
                    cachedData.suspendAllBorrows = suspendAllBorrows === 'yes';

                    cachedData.updates.push({
                        signer: sigAddress,
                        type,
                        timestamp: now,
                        marketAddress: '',
                        noDeposit: cachedData.suspendAllDeposits,
                        isPhasingOut: '',
                        isLeverageSuspended: cachedData.suspendAllLeverage,
                        isBorrowingSuspended: cachedData.suspendAllBorrows,
                        message: '',
                    });

                    await invalidateMarkets();
                } else if (type === 'message') {
                    cachedData.globalMessage = globalMessage;
                    cachedData.globalMessageStatus = globalMessageStatus;
                    cachedData.globalMessageSigner = sigAddress;
                    cachedData.globalMessageTimestamp = now;

                    cachedData.updates.push({
                        signer: sigAddress,
                        type,
                        timestamp: now,
                        marketAddress: '',
                        noDeposit: '',
                        isPhasingOut: '',
                        isLeverageSuspended: '',
                        isBorrowingSuspended: '',
                        message: globalMessage ? `Message Type: ${globalMessageStatus}\n${globalMessage}` : '',
                    });
                } else {
                    cachedData[marketAddress] = {
                        noDeposit: noDeposit === 'yes',
                        isPhasingOut: isPhasingOut === 'yes',
                        isLeverageSuspended: isLeverageSuspended === 'yes',
                        isBorrowingSuspended: isBorrowingSuspended === 'yes',
                        phasingOutComment: isPhasingOut === 'yes' ? phasingOutComment : '',
                    };

                    cachedData.updates.push({
                        signer: sigAddress,
                        type,
                        timestamp: now,
                        marketAddress,
                        noDeposit: noDeposit === 'yes',
                        isPhasingOut: isPhasingOut === 'yes',
                        isLeverageSuspended: isLeverageSuspended === 'yes',
                        isBorrowingSuspended: isBorrowingSuspended === 'yes',
                        message: isPhasingOut === 'yes' ? phasingOutComment : '',
                    });

                    await invalidateMarkets();
                }

                await redisSetWithTimestamp(marketsDisplaysCacheKey, cachedData);

                res.status(200).json({ status: 'success', message: 'Update successful' })
            } catch (e) {
                console.error(e);
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'PUT'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}