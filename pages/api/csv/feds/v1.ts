import { getCacheFromRedis } from "@app/util/redis";
import { liquidityCacheKey } from "../../transparency/liquidity";
import { repaymentsCacheKey } from "../../transparency/repayments";

export default async (req, res) => {
    const cacheDuration = 300;
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

        const feds = liquidityData.liquidity.filter(d => d.isFed);
        const totalBorrowsOnFirm = liquidityData.firmBorrows;
        const currentDolaBadDebt = badDebtData.badDebts.DOLA.badDebtBalance;

        let csvData = `DOLA bad debt:,${currentDolaBadDebt},FiRM borrows:,${totalBorrowsOnFirm},Cache:,~5min\n`;
        csvData += `Fed,Supply,DOLA balance,Pairing Depth\n`;
        feds.forEach((d) => {
            csvData += `${d.fedName},${d.fedSupply},${d.dolaBalance},${d.pairingDepth}\n`;
        });

        // Set response headers to indicate that you're serving a CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=inverse-feds.csv");

        // Send the CSV data as the response
        res.status(200).send(csvData);
    } catch (e) {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=inverse-feds.csv");
        // Send the CSV data as the response
        res.status(200).send(`DOLA bad debt:,0,FiRM borrows:,0,An error occurred\n`);
    }
};
