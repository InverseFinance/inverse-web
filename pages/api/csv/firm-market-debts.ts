import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { getProvider } from "@app/util/providers";
import { NetworkIds } from "@app/types";
import { getNetworkConfigConstants } from "@app/util/networks";
import { getChainlinkDolaUsdPrice, getDbrPriceOnCurve, getDolaUsdPriceOnCurve } from "@app/util/f2";
import { inverseViewer } from "@app/util/viewer";

const { F2_MARKETS } = getNetworkConfigConstants();

// external use in spreadsheet
export default async (req, res) => {
    const cacheDuration = 900;
    const cacheKey = `csv-firm-market-debts-v1.0.0`;

    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    const provider = getProvider(NetworkIds.mainnet);
    const ifvr = inverseViewer(provider);

    try {
        const [
            marketData,
            dbrPriceData,
            dolaUsdPriceData,
        ] = await Promise.all([
            ifvr.firm.getMarketListData(F2_MARKETS.map(m => m.address)),
            getDbrPriceOnCurve(provider),
            getDolaUsdPriceOnCurve(provider),
        ]);

        const { priceInDola: dbrPrice } = dbrPriceData;
        const { price: dolaUsdPrice } = dolaUsdPriceData;
        const dbrPriceUsd = dbrPrice * dolaUsdPrice;
        const now = Date.now();

        let csvData = `Timestamp:,${now},DBR price (in dola):,${Number(dbrPrice).toFixed(6)},DBR price (in USD):,${Number(dbrPriceUsd).toFixed(6)}\n`;
        csvData += `Market,DOLA debt\n`;

        marketData.forEach((market, i) => {
            csvData += `${F2_MARKETS[i].name},${market.totalDebt}\n`;
        });

        redisSetWithTimestamp(cacheKey, { csvData });

        // Set response headers to indicate that you're serving a CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=firm-market-debts.csv");

        // Send the CSV data as the response
        res.status(200).send(csvData);
    } catch (e) {
        console.log(e);
        const validCache = await getCacheFromRedis(cacheKey, false);
        const csvData = validCache?.csvData || `An error occured\n`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=firm-market-debts.csv");
        // Send the CSV data as the response
        res.status(200).send(csvData);
    }
};