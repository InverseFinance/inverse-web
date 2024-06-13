import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { NETWORKS_BY_CHAIN_ID } from "@app/config/networks";
import { fetcher30sectimeout } from "@app/util/web3";
import { SERVER_BASE_URL } from "@app/config/constants";
import { getNetworkConfigConstants } from "@app/util/networks";

const { F2_MARKETS } = getNetworkConfigConstants();

// external use in spreadsheet
export default async (req, res) => {
    const cacheDuration = 60;
    const cacheKey = 'csv-liquidations-v1.0.0';
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    try {
        const [data] = await Promise.all([
            fetcher30sectimeout(`${SERVER_BASE_URL}/api/transparency/firm-liquidations`),
        ]);

        let csvData = `Last update:,${data.timestamp}\n`;
        csvData += `index,txHash,timestamp,borrower,repaidDebt,liquidatorReward,liquidator,market\n`;
        data.liquidations.sort((a ,b) => a.timestamp - b.timestamp);
        data.liquidations.forEach((l, i) => {
            const market = F2_MARKETS.find(m => m.address.toLowerCase() === l.marketAddress.toLowerCase());
            csvData += `${i+1},${l.txHash},${l.timestamp},${l.borrower},${l.repaidDebt},${l.liquidatorReward},${l.liquidator},${market.name}\n`;
        });

        redisSetWithTimestamp(cacheKey, { csvData });

        // Set response headers to indicate that you're serving a CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=firm-liquidations.csv");

        // Send the CSV data as the response
        res.status(200).send(csvData);
    } catch (e) {
        console.log(e);
        const validCache = await getCacheFromRedis(cacheKey, false);
        const csvData = validCache?.csvData || `txHash,timestamp,borrower,repaidDebt,liquidatorReward,liquidator,market\n\n`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=firm-liquidations.csv");
        // Send the CSV data as the response
        res.status(200).send(csvData);
    }
};
