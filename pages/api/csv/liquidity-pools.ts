
import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { fetcher30sectimeout } from "@app/util/web3";
import { dolaStakingCacheKey } from "../dola-staking";
import { NETWORKS_BY_CHAIN_ID } from "@app/config/networks";
import { SERVER_BASE_URL } from "@app/config/constants";

// external use in spreadsheet
export default async (req, res) => {
    const cacheDuration = 900;
    const cacheKey = 'csv-liquidity-pools-v1.0.9';
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    try {
        const [liquidityData, dolaStakingData] = await Promise.all([
            fetcher30sectimeout(`${SERVER_BASE_URL}/api/transparency/liquidity?cacheFirst=true`),
            getCacheFromRedis(dolaStakingCacheKey, false),       
        ]);

        let csvData = `Last update:,${liquidityData.timestamp},Note: sDOLA pairingDepth is in DOLA amount not USD\n`;
        csvData += `Pool,Protocol,Chain,Has Fed,TVL,Pairing depth,DOLA balance (not $),DOLA weight,APY,Pool dom,Pol,$/day,Is stable\n`;
        liquidityData.liquidity.sort((a,b) => b.tvl - a.tvl);
        liquidityData.liquidity.forEach((lp) => {
            // for sDOLA convert to DOLA and pair amounts
            const hasSDola = /SDOLA/i.test(lp.symbol);
            const isSDolaMain = hasSDola && !/(^DOLA|.*-DOLA.*)/i.test(lp.symbol);      
            const pairingValue = hasSDola ? (isSDolaMain ? lp?.pairPartBalance : lp?.pairPartBalance * dolaStakingData.sDolaExRate) : lp?.pairingDepth;
            const mainValue = lp?.mainPartBalance * (isSDolaMain ? dolaStakingData.sDolaExRate : 1);

            csvData += `${lp.lpName},${lp.project.toLowerCase()},${NETWORKS_BY_CHAIN_ID[lp.chainId].name},${lp.isFed},${lp.tvl},${pairingValue},${mainValue},${lp.dolaWeight},${lp.apy||''},${lp.perc},${lp.ownedAmount},${lp.rewardDay},${lp.isStable||false}\n`;
        });

        redisSetWithTimestamp(cacheKey, { csvData });

        // Set response headers to indicate that you're serving a CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=liquidity-pools-v1.0.7.csv");

        // Send the CSV data as the response
        res.status(200).send(csvData);
    } catch (e) {
        console.log(e);
        const validCache = await getCacheFromRedis(cacheKey, false);
        const csvData = validCache?.csvData || `DOLA bad debt:,0,FiRM borrows:,0,Cache:,~5min,Liquidity timestamp:,0,Bad debt timestamp:,0,An error occured\n`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=liquidity-pools-v1.0.7.csv");
        // Send the CSV data as the response
        res.status(200).send(csvData);
    }
};
