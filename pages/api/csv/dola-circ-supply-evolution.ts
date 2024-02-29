import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { DOLA_CIRC_SUPPLY_EVO_CACHE_KEY } from "../dola/circulating-supply-evolution";

// external use in spreadsheet
export default async (req, res) => {
    const cacheDuration = 3600;
    const cacheKey = 'csv-dola-circ-supply-evolution-v1.0.1';
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    try {
        const cachedCircEvoData = (await getCacheFromRedis(DOLA_CIRC_SUPPLY_EVO_CACHE_KEY, false)) || { evolution: [] };        
        
        let csvData = `Date,Total Supply, Circ Supply, Mainnet Excluded, L2 Excluded\n`;
        
        cachedCircEvoData.evolution.forEach((d) => {
            csvData += `${d.utcDate},${d.totalSupply},${d.circSupply},${d.mainnetExcluded},${d.farmersExcluded}\n`;
        });

        redisSetWithTimestamp(cacheKey, { csvData });

        // Set response headers to indicate that you're serving a CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=dola-circ-supply-evolution.csv");

        // Send the CSV data as the response
        res.status(200).send(csvData);
    } catch (e) {
        console.log(e);
        const validCache = await getCacheFromRedis(cacheKey, false);
        const csvData = validCache?.csvData || `\n`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=dola-circ-supply-evolution.csv");
        // Send the CSV data as the response
        res.status(200).send(csvData);
    }
};
