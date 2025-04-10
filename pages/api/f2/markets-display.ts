
import { isAddress, verifyMessage } from 'ethers/lib/utils';
import { ADMIN_ADS } from '@app/variables/names';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { getSignMessageWithUtcDate } from '@app/util/misc';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';

export const marketsDisplaysCacheKey = 'markets-displays-v1.1';

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
                const { sig, marketAddress, noDeposit, isPhasingOut, phasingOutComment, globalMessage, globalMessageStatus } = req.body;

                const whitelisted = ADMIN_ADS.map(a => a.toLowerCase());
                const sigAddress = verifyMessage(getSignMessageWithUtcDate(), sig).toLowerCase();

                if (!whitelisted.includes(sigAddress)) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                };

                if (!!globalMessage) {
                    if (globalMessage?.length > 500 || !['warning', 'error', 'info', 'success'].includes(globalMessageStatus)) {
                        res.status(400).json({ status: 'warning', message: 'Invalid global message' })
                        return
                    };
                }
                else if (!marketAddress || !isAddress(marketAddress) || !['yes', 'no'].includes(noDeposit) || !['yes', 'no'].includes(isPhasingOut) || phasingOutComment?.length > 500) {
                    res.status(400).json({ status: 'warning', message: 'Invalid values' })
                    return
                }

                const cachedData = (await getCacheFromRedis(marketsDisplaysCacheKey, false)) || { updates: [], globalMessage: '', globalMessageStatus: 'info' };
                // keep track of updates, updates is an array for both global messages and market updates
                if (!cachedData?.updates) {
                    cachedData.updates = [];
                }

                const now = Date.now();

                if (!!globalMessage) {
                    cachedData.globalMessage = globalMessage;
                    cachedData.globalMessageStatus = globalMessageStatus;
                    cachedData.globalMessageSigner = sigAddress;
                    cachedData.globalMessageTimestamp = now;

                    cachedData.updates.push({
                        signer: sigAddress,
                        type: 'global',
                        timestamp: now,
                        marketAddress: '',
                        noDeposit: '',
                        isPhasingOut: '',
                        message: `Message Type: ${globalMessageStatus}\n${globalMessage}`,
                    });
                } else {
                    cachedData[marketAddress] = {
                        noDeposit: noDeposit === 'yes',
                        isPhasingOut: isPhasingOut === 'yes',
                        phasingOutComment: isPhasingOut === 'yes' ? phasingOutComment : '',
                    };

                    cachedData.updates.push({
                        signer: sigAddress,
                        type: 'market',
                        timestamp: now,
                        marketAddress,
                        noDeposit: noDeposit === 'yes',
                        isPhasingOut: isPhasingOut === 'yes',
                        message: isPhasingOut === 'yes' ? phasingOutComment : '',
                    });

                    const cachedMarketsData = (await getCacheFromRedis(F2_MARKETS_CACHE_KEY, false)) || {};

                    if (cachedMarketsData) {
                        const marketIndex = cachedMarketsData.markets.findIndex(m => m.address === marketAddress);
                        if (marketIndex !== -1) {
                            cachedMarketsData.markets[marketIndex] = {
                                ...cachedMarketsData.markets[marketIndex],
                                noDeposit: cachedData[marketAddress].noDeposit,
                                isPhasingOut: cachedData[marketAddress].isPhasingOut,
                                phasingOutComment: cachedData[marketAddress].message,
                            };
                        }
                        // update firm markets cache accordingly
                        await redisSetWithTimestamp(F2_MARKETS_CACHE_KEY, cachedMarketsData);
                    }
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