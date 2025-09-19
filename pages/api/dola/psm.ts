
import 'source-map-support'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { ascendingEventsSorter, estimateBlocksTimestamps } from '@app/util/misc';
import { PSM_ADDRESS } from '@app/config/constants';
import { Contract } from 'ethers';
import { DOLA_ABI, PSM_ABI } from '@app/config/abis';
import { getBnToNumber } from '@app/util/markets';
import { getMulticallOutput } from '@app/util/multicall';
import { getNetworkConfigConstants } from '@app/util/networks';

const { DOLA } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { cacheFirst } = req.query;
    
    const cacheKey = 'psm-activity-v1.0.2';

    try {            
        const { data: cachedData, isValid: isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (!!cachedData && isValid) {
            res.status(200).send(cachedData);
            return
        }

        const eventsProvider = getPaidProvider(1);
        const provider = getProvider(1);

        const psmEventsContract = new Contract(PSM_ADDRESS, PSM_ABI, eventsProvider);
        const psmContract = new Contract(PSM_ADDRESS, PSM_ABI, provider);
        const dolaContract = new Contract(DOLA, DOLA_ABI, provider);

        const archived = cachedData || { events: [], lastCheckedBlock: 0, totalProfit: 0, totalRealisedProfit: 0, totalDolaBought: 0, totalDolaSold: 0, totalColBought: 0, totalColSold: 0 };
        let pastTotalEvents = archived?.events || [];

        const newStartingBlock = archived?.lastCheckedBlock + 1;

        const currentBlockObject = await eventsProvider.getBlock('latest');
        const now = currentBlockObject.timestamp * 1000;
        const currentBlock = currentBlockObject.number;

        const [
            unclaimedProfitBn,
            minTotalSupplyBn,
            supplyBn,
            totalReservesBn,
            buyFeeBps,
            sellFeeBps,
            dolaBalanceBn,
        ] = await getMulticallOutput(
            [
                { contract: psmContract, functionName: 'getProfit' },
                { contract: psmContract, functionName: 'minTotalSupply' },
                { contract: psmContract, functionName: 'supply' },
                { contract: psmContract, functionName: 'getTotalReserves' },
                { contract: psmContract, functionName: 'buyFeeBps' },
                { contract: psmContract, functionName: 'sellFeeBps' },
                { contract: dolaContract, functionName: 'balanceOf', params: [PSM_ADDRESS] },
            ],
            1,
            currentBlock,
            provider,
        );
            
        const unclaimedProfit = getBnToNumber(unclaimedProfitBn, 18);
        const minTotalSupply = getBnToNumber(minTotalSupplyBn, 18);
        const supply = getBnToNumber(supplyBn, 18);
        const totalReserves = getBnToNumber(totalReservesBn, 18);
        const buyFeePerc = getBnToNumber(buyFeeBps, 2);
        const sellFeePerc = getBnToNumber(sellFeeBps, 2);
        const dolaLiquidity = getBnToNumber(dolaBalanceBn, 18);

        const [
            buysData, sellsData, profitTakenData,
        ] = await Promise.all([
            psmEventsContract.queryFilter(
                psmEventsContract.filters.Buy(),
                newStartingBlock,
                currentBlock,
            ),
            psmEventsContract.queryFilter(
                psmEventsContract.filters.Sell(),
                newStartingBlock,
            ),
            psmEventsContract.queryFilter(
                psmEventsContract.filters.ProfitTaken(),
                newStartingBlock,
            ),
        ]);

        const eventsData = buysData
            .concat(sellsData)
            .concat(profitTakenData);

        const sortedEvents = eventsData.sort(ascendingEventsSorter);

        const blocks = sortedEvents.map(e => e.blockNumber);

        const timestamps = estimateBlocksTimestamps(blocks, now, currentBlock);

        const newEvents = sortedEvents.map((e,i) => ({
            blockNumber: e.blockNumber,
            txHash: e.transactionHash,
            name: e.event,
            account: e.args?.user,
            dolaAmount: getBnToNumber(e.args?.dolaAmount, 18),
            colAmount: getBnToNumber(e.args?.colAmount, 18),
            profitAmount: getBnToNumber(e.args?.colAmount, 18),
            timestamp: timestamps[i],
        }));

        const totalEvents = pastTotalEvents.concat(newEvents);

        const newBuys = newEvents.filter(e => e.name === 'Buy');
        const newSells = newEvents.filter(e => e.name === 'Sell');
        const newProfits = newEvents.filter(e => e.name === 'ProfitTaken');

        const totalRealisedProfit = archived.totalRealisedProfit + newProfits.reduce((acc, curr) => acc + curr.profitAmount, 0);

        const resultData = {
            timestamp: now,
            lastCheckedBlock: currentBlock,
            unclaimedProfit,
            totalRealisedProfit,
            totalProfit: totalRealisedProfit + unclaimedProfit,
            minTotalSupply,
            supply,
            totalReserves,
            dolaLiquidity,
            buyFeePerc,
            sellFeePerc,
            collateralLiquidity: supply - (supply*sellFeePerc/100),
            totalDolaBought: archived.totalDolaBought + newBuys.reduce((acc, curr) => acc + curr.dolaAmount, 0),
            totalDolaSold: archived.totalDolaSold + newSells.reduce((acc, curr) => acc + curr.dolaAmount, 0),
            totalColBought: archived.totalColBought + newSells.reduce((acc, curr) => acc + curr.colAmount, 0),
            totalColSold: archived.totalColSold + newBuys.reduce((acc, curr) => acc + curr.colAmount, 0),
            events: totalEvents,
        };

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false, 0);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).send(cache);
            } else {
                res.status(500).send({})
            }
        } catch (e) {
            console.error(e);
            res.status(500).send({})
        }
    }
}