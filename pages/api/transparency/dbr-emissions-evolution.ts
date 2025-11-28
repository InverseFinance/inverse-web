import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { BURN_ADDRESS, CHAIN_ID, SDOLA_ADDRESS } from '@app/config/constants';
import { dbrRewardRatesCacheKey, initialDbrRewardRates } from '../cron-dbr-distributor';
import { estimateBlockTimestamp, getTimestampFromUTCDate, timestampToUTC } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';
import { DBR_EMISSIONS_GROUPED_ARCHIVE } from '@app/fixtures/dbr-emissions-grouped';
// import { DBR_EMISSIONS_ARCHIVE } from '@app/fixtures/dbr-emissions';
// import { FORCED_REP_TXS } from '@app/fixtures/forced-rep-txs';
import { getDolaSavingsContract } from '@app/util/dola-staking';
import { getDbrAuctionContract } from '@app/util/dbr-auction';
// import { DBR_BUYS_TXS_ARCHIVE } from '@app/fixtures/dbr-buys-txs';
// import { DSA_CLAIM_TXS_ARCHIVE } from '@app/fixtures/dsa-claim-txs';

const { DBR, TREASURY } = getNetworkConfigConstants();

const getGroupedByDay = (newEvents) => {
    const uniqueDays = [...new Set(newEvents.map(ne => ne.utcDate))];

    return uniqueDays.map(utcDateString => {
        const eventsForDay = newEvents.filter(ne => ne.utcDate === utcDateString);
        const lastEvent = eventsForDay[eventsForDay.length - 1];
        return {
            blockNumber: lastEvent.blockNumber,
            timestamp: getTimestampFromUTCDate(utcDateString),
            utcDate: utcDateString,
            amount: eventsForDay.reduce((acc, ne) => {
                return acc + ne.amount;
            }, 0),
            // sDolaClaims: eventsForDay.reduce((acc, ne) => {
            //     return acc + (ne.isSDolaClaim ? ne.amount : (ne.sDolaClaims || 0));
            // }, 0),
            treasuryMints: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isTreasuryMint ? ne.amount : (ne.treasuryMints || 0));
            }, 0),
            treasuryTransfers: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isTreasuryTransfer ? ne.amount : (ne.treasuryTransfers || 0));
            }, 0),
            forcedReps: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isForcedRep ? ne.amount : (ne.forcedReps || 0));
            }, 0),
            buys: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isAuction ? ne.amount : (ne.buys || 0));
            }, 0),
            dsaClaims: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isDsaClaim ? ne.amount : (ne.dsaClaims || 0));
            }, 0),
            stakingClaims: eventsForDay.reduce((acc, ne) => {
                const isStakingClaim = (!!ne.txHash || !!ne.transactionHash) && !ne.isForcedRep && !ne.isTreasuryTransfer && !ne.isAuction && !ne.sDsaClaim && !ne.isSDolaClaim && !ne.isTreasuryMint;
                return acc + (isStakingClaim ? ne.amount : (ne.stakingClaims || 0));
            }, 0),
            accEmissions: lastEvent.accEmissions,
        }
    });
}

export default async function handler(req, res) {
    const cacheKey = `dbr-emissions-evolution-v1.0.92`;
    const { cacheFirst } = req.query;

    try {
        res.setHeader('Cache-Control', `public, max-age=${300}`);
        const [emissionsCacheRes, ratesCache] = await Promise.all([
            getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', 600, true),
            getCacheFromRedis(dbrRewardRatesCacheKey, false),
        ]);

        const { data: _cachedData, isValid } = emissionsCacheRes;

        if (!!_cachedData && isValid) {
            res.status(200).json({
                ..._cachedData,
                rewardRatesHistory: (ratesCache || initialDbrRewardRates),
            });
            return
        }

        const paidProvider = getPaidProvider(1);
        
        const contract = new Contract(DBR, DBR_ABI, paidProvider);

        const dsaContract = getDolaSavingsContract(paidProvider);
        const dbrAuctionContract = getDbrAuctionContract(paidProvider);

        const cachedData = _cachedData || DBR_EMISSIONS_GROUPED_ARCHIVE;
        // const cachedData = _cachedData || DBR_EMISSIONS_ARCHIVE;
        const cachedEvents = (cachedData?.totalEmissions || []);
        let accEmissions = cachedEvents?.length ? cachedEvents[cachedEvents.length - 1].accEmissions : 0;

        const lastKnownEvent = cachedEvents?.length > 0 ? (cachedEvents[cachedEvents.length - 1]) : {};
        const newStartingBlock = lastKnownEvent ? lastKnownEvent?.blockNumber + 1 : 0;
        const now = Date.now();

        const currentBlock = await paidProvider.getBlockNumber();

        const [
            newMintEvents,
            newTreasuryTransferEvents,
            forcedRepEvents,
            dsaClaimEvents,
            dbrVirtualAuctionBuys,
            dbrClaimsByStakersData,
        ] = await Promise.all([
            getLargeLogs(
                contract,
                contract.filters.Transfer(BURN_ADDRESS),
                newStartingBlock ? newStartingBlock : undefined,
                currentBlock,
                10_000,
            ),
            contract.queryFilter(
                contract.filters.Transfer(TREASURY),
                newStartingBlock ? newStartingBlock : undefined,
            ),
            getLargeLogs(
                contract,
                contract.filters.ForceReplenish(),
                newStartingBlock ? newStartingBlock : undefined,
                currentBlock,
                10_000,
            ),
            dsaContract.queryFilter(
                dsaContract.filters.Claim(),
                newStartingBlock,
            ),
            dbrAuctionContract.queryFilter(
                dbrAuctionContract.filters.Buy(),
                newStartingBlock ? newStartingBlock : 0x0,
            ),
             // dbr claims by stakers
             fetch(`https://app.inverse.watch/api/queries/1141/results.json?api_key=${process.env.WATCH_KEY}`).then(res => res.json()),
        ]);

        const newTransferEvents = newMintEvents.concat(newTreasuryTransferEvents).sort((a, b) => a.blockNumber - b.blockNumber);

        // const forcedRepTxHashes = FORCED_REP_TXS.concat(forcedRepEvents.map(e => e.transactionhash));
        // const auctionBuysTxHashes = DBR_BUYS_TXS_ARCHIVE.concat(dbrVirtualAuctionBuys.map(e => e.transactionHash));
        // const dsaClaimTxHashes = DSA_CLAIM_TXS_ARCHIVE.concat(dsaClaimEvents.map(e => e.transactionHash));
        const forcedRepTxHashes = forcedRepEvents.map(e => e.transactionhash);
        const auctionBuysTxHashes = dbrVirtualAuctionBuys.map(e => e.transactionHash);
        const dsaClaimTxHashes = dsaClaimEvents.map(e => e.transactionHash);

        const newTransfers = newTransferEvents.map(e => {
            const timestamp = estimateBlockTimestamp(e.blockNumber, now, currentBlock);
            const utcDate = timestampToUTC(timestamp);
            const amount = getBnToNumber(e.args[2]);
            // part of dsa claim
            const isSDolaClaim = e.args[1].toLowerCase() === SDOLA_ADDRESS.toLowerCase();
            const isAuction = !isSDolaClaim && auctionBuysTxHashes.includes(e.transactionHash);
            // approximation: all dsa claims are actually sDola claims
            const isDsaClaim = isSDolaClaim && dsaClaimTxHashes.includes(e.transactionHash);
            const isForcedRep = forcedRepTxHashes.includes(e.transactionHash);
            const isTreasuryTransfer = e.args[0].toLowerCase() === TREASURY.toLowerCase();
            const isTreasuryMint = e.args[1].toLowerCase() === TREASURY.toLowerCase();
            if (!isTreasuryTransfer) {
                accEmissions += amount;
            }
            return {
                utcDate,
                timestamp,
                blockNumber: e.blockNumber,
                amount,
                accEmissions,
                isForcedRep,
                isSDolaClaim,
                isTreasuryMint,
                isTreasuryTransfer,
                isAuction,
                isDsaClaim,
            };
        }).filter(e => e.amount > 0);

        const resultData = {
            timestamp: now,
            accClaimedByStakers: dbrClaimsByStakersData.query_result.data[dbrClaimsByStakersData.query_result.data.length-1].cumulative_value,
            isGroupedByDay: true,
            totalEmissions: newTransfers?.length ? getGroupedByDay(
                cachedData?.isGroupedByDay ? cachedEvents.concat(newTransfers) : cachedEvents.map(cge => ({
                    ...cge,
                    isForcedRep: forcedRepTxHashes.includes(cge.txHash),
                    isAuction: !cge.isSDolaClaim && auctionBuysTxHashes.includes(cge.txHash),
                    isDsaClaim: cge.isSDolaClaim && dsaClaimTxHashes.includes(cge.txHash),
                    utcDate: timestampToUTC(cge.timestamp),
                })).concat(newTransfers)
            ) : cachedEvents,
            rewardRatesHistory: (ratesCache || initialDbrRewardRates),
        };

        await redisSetWithTimestamp(cacheKey, resultData, true);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ status: 'ko' });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ status: 'ko' });
        }
    }
}