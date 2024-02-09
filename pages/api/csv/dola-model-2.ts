import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { repaymentsCacheKey } from "../transparency/repayments";
import { NETWORKS_BY_CHAIN_ID } from "@app/config/networks";
import { capitalize } from "@app/util/misc";
import { fetcher30sectimeout } from "@app/util/web3";
import { dolaStakingCacheKey } from "../dola-staking";

export default async (req, res) => {
    const cacheDuration = 1;    
    const cacheKey = 'dola-modal-2-v1.0.0';
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    try {
        const [liquidityData, badDebtData, dolaStakingData] = await Promise.all([
            fetcher30sectimeout('https://www.inverse.finance/api/transparency/liquidity'),            
            getCacheFromRedis(repaymentsCacheKey, false),
            getCacheFromRedis(dolaStakingCacheKey, false),            
        ]);

        // feds + exceptions, dolacrvusd, dolausd+, dola-usdc op aura, dola-usdc uni v3, dola-inv uni v3, dola-3pool
        const exceptions = [
            '0x8272e1a3dbef607c04aa6e5bd3a1a134c8ac063b',
            '0x5a473b418193C6a3967aF0913135534B7b3B23E9',
            '0x8E9154AC849e839d60299E85156bcb589De2693A',
            '0x7c082BF85e01f9bB343dbb460A14e51F67C58cFB',
            '0xbD1F921786e12a80F2184E4d6A5cAcB25dc673c9',
            '0xAA5A67c256e27A5d80712c51971408db3370927D',
        ].map(ad => ad.toLowerCase());
        const feds = liquidityData.liquidity.filter(d => d.isFed || exceptions.includes(d.address.toLowerCase()));
        const totalBorrowsOnFirm = liquidityData.firmBorrows;
        const currentDolaBadDebt = badDebtData.badDebts.DOLA.badDebtBalance;

        let csvData = `DOLA bad debt:,${currentDolaBadDebt},FiRM borrows:,${totalBorrowsOnFirm},DSA DOLA bal:,${dolaStakingData.dsaTotalSupply},DSA dbrYearlyEarnings:,${dolaStakingData.dsaYearlyDbrEarnings}\n`;
        csvData += `Liquidity Cache:,~5min,Liquidity timestamp:,${liquidityData.timestamp},Bad debt timestamp:,${badDebtData.timestamp}\n`;
        csvData += `LP,Fed or Project,Fed Supply,RootLP DOLA balance,Pairing Depth $,Fed PoL\n`;
        feds.forEach((lp) => {
            const parentLp = liquidityData.liquidity.filter(l => !!l.deduce).find(l => l.deduce.includes(lp.address));
            const balanceSource = parentLp || lp;
            csvData += `${lp.lpName},${lp.fedName || (capitalize(lp.project)+ ' ' + NETWORKS_BY_CHAIN_ID[lp.chainId].name)},${lp.fedSupply || 0},${balanceSource?.mainPartBalance || 0},${balanceSource?.pairingDepth || 0},${lp.ownedAmount || 0}\n`;
        });

        redisSetWithTimestamp(cacheKey, { csvData });

        // Set response headers to indicate that you're serving a CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=dola-model-2.csv");

        // Send the CSV data as the response
        res.status(200).send(csvData);
    } catch (e) {
        console.log(e);
        const validCache = await getCacheFromRedis(cacheKey, false);
        const csvData = validCache?.csvData || `DOLA bad debt:,0,FiRM borrows:,0,Cache:,~5min,Liquidity timestamp:,0,Bad debt timestamp:,0,An error occured\n`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=dola-model-2.csv");
        // Send the CSV data as the response
        res.status(200).send(csvData);
    }
};
