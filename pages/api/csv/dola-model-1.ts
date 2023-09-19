import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { liquidityCacheKey } from "../transparency/liquidity";
import { repaymentsCacheKey } from "../transparency/repayments";

export default async (req, res) => {
    const cacheDuration = 600;
    const cacheKey = 'dola-modal-v1';
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    try {
        // trigger
        Promise.all([
            fetch('https://www.inverse.finance/api/transparency/liquidity'),
        ]);

        const [liquidityData, badDebtData] = await Promise.all([
            getCacheFromRedis(liquidityCacheKey, false),
            getCacheFromRedis(repaymentsCacheKey, false),
        ]);

        const feds = liquidityData.liquidity.filter(d => d.isFed || d.address === '0x8272e1a3dbef607c04aa6e5bd3a1a134c8ac063b');
        const totalBorrowsOnFirm = liquidityData.firmBorrows;
        const currentDolaBadDebt = badDebtData.badDebts.DOLA.badDebtBalance;

        let csvData = `DOLA bad debt:,${currentDolaBadDebt},FiRM borrows:,${totalBorrowsOnFirm},Liquidity Cache:,~5min,Liquidity timestamp:,${liquidityData.timestamp},Bad debt timestamp:,${badDebtData.timestamp}\n`;
        csvData += `LP,Fed,Fed Supply,DOLA balance,Pairing Depth\n`;
        feds.forEach((lp) => {
            const parentLp = liquidityData.liquidity.filter(l => !!l.deduce).find(l => l.deduce.includes(lp.address));
            const balanceSource = parentLp || lp;
            csvData += `${lp.lpName},${lp.fedName||'n/a'},${lp.fedSupply||0},${balanceSource?.dolaBalance||0},${balanceSource?.pairingDepth||0}\n`;
        });

        redisSetWithTimestamp(cacheKey, { csvData });

        // Set response headers to indicate that you're serving a CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=dola-model-1.csv");

        // Send the CSV data as the response
        res.status(200).send(csvData);
    } catch (e) {
        console.log(e);
        const validCache = await getCacheFromRedis(cacheKey, false);
        const csvData = validCache?.csvData || `DOLA bad debt:,0,FiRM borrows:,0,Cache:,~5min,Liquidity timestamp:,0,Bad debt timestamp:,0,An error occured\n`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=dola-model-1.csv");
        // Send the CSV data as the response
        res.status(200).send(csvData);
    }
};
