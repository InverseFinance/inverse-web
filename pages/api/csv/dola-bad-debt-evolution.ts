import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { repaymentsCacheKeyV2 } from "../transparency/repayments-v2";
import { fillMissingDailyDatesWithMostRecentData, timestampToUTC, uniqueBy } from "@app/util/misc";

// external use in spreadsheet
export default async (req, res) => {
    const cacheDuration = 3600;
    const cacheKey = 'csv-dola-bad-debt-evolution-v1.0.0';
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    try {
        const repaymentsData = (await getCacheFromRedis(repaymentsCacheKeyV2, false)) || { dolaBadDebtEvolution: [] };

        const oneDayBeforeExploitDate = '2022-04-01';
        const evolutionWithUtcDate = repaymentsData.dolaBadDebtEvolution
            .map((d) => ({ ...d, utcDate: timestampToUTC(d.timestamp) }))
            .filter(d => d.utcDate >= oneDayBeforeExploitDate);

        const evolutionWithDailyUtcDates = fillMissingDailyDatesWithMostRecentData(evolutionWithUtcDate, 1);
        const evolutionWithUniqueDailyUtcDates = uniqueBy(evolutionWithDailyUtcDates, (o1, o2) => o1.utcDate === o2.utcDate);

        let csvData = `Date,DOLA bad debt\n`;
        evolutionWithUniqueDailyUtcDates.forEach((d) => {
            csvData += `${d.utcDate},${d.badDebt}\n`;
        });

        redisSetWithTimestamp(cacheKey, { csvData });

        // Set response headers to indicate that you're serving a CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=dola-bad-debt-evolution.csv");

        // Send the CSV data as the response
        res.status(200).send(csvData);
    } catch (e) {
        console.log(e);
        const validCache = await getCacheFromRedis(cacheKey, false);
        const csvData = validCache?.csvData || `\n`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=dola-bad-debt-evolution.csv");
        // Send the CSV data as the response
        res.status(200).send(csvData);
    }
};
