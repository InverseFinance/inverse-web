import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { NETWORKS_BY_CHAIN_ID } from "@app/config/networks";
import { fetcher30sectimeout } from "@app/util/web3";
import { dolaStakingCacheKey } from "../dola-staking";

// external use in spreadsheet
export default async (req, res) => {
    const cacheDuration = 900;
    const cacheKey = 'csv-liquidity-pools-v1.0.7';
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    try {
        const [liquidityData, dolaStakingData] = await Promise.all([
            fetcher30sectimeout('https://www.inverse.finance/api/transparency/liquidity'),
            getCacheFromRedis(dolaStakingCacheKey, false),       
        ]);

        let csvData = `Last update:,${liquidityData.timestamp},Note: sDOLA pairingDepth is in DOLA amount not USD\n`;
        csvData += `Pool,Protocol,Chain,Has Fed,TVL,Pairing depth,DOLA balance (not $),DOLA weight,APY,Pool dom,Pol,$/day,Is stable\n`;
        liquidityData.liquidity.sort((a,b) => b.tvl - a.tvl);
        liquidityData.liquidity.forEach((lp) => {
            const isSDolaPairingDepth = /(SDOLA-DOLA|DOLA-SDOLA)/.test(lp.symbol);
            // if pairing is sDOLA, use dola amount
            const pairingDepth = isSDolaPairingDepth ? lp.pairPartBalance * dolaStakingData.sDolaExRate : lp.pairingDepth;                        
            csvData += `${lp.lpName},${lp.project.toLowerCase()},${NETWORKS_BY_CHAIN_ID[lp.chainId].name},${lp.isFed},${lp.tvl},${pairingDepth},${lp.mainPartBalance},${lp.dolaWeight},${lp.apy||''},${lp.perc},${lp.ownedAmount},${lp.rewardDay},${lp.isStable||false}\n`;
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
