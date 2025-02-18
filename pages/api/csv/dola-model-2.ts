import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { repaymentsCacheKeyV2 } from "../transparency/repayments-v2";
import { NETWORKS_BY_CHAIN_ID } from "@app/config/networks";
import { capitalize } from "@app/util/misc";
import { fetcher30sectimeout } from "@app/util/web3";
import { dolaStakingCacheKey } from "../dola-staking";
import { isAddress } from "ethers/lib/utils";
import { SERVER_BASE_URL } from "@app/config/constants";
import { dbrReplenishmentsCacheKey } from "../f2/dbr-replenishments";
import { Contract } from "ethers";
import { getProvider } from "@app/util/providers";
import { DBR_ABI } from "@app/config/abis";
import { dbrCircSupplyCacheKey } from "../dbr/circulating-supply";
import { NetworkIds } from "@app/types";
import { getBnToNumber } from "@app/util/markets";
import { getNetworkConfigConstants } from "@app/util/networks";
import { getDbrPriceOnCurve } from "@app/util/f2";

const { DBR } = getNetworkConfigConstants();

// external use in spreadsheet
export default async (req, res) => {
    const { include } = req.query;
    const includeList = include ? include.split(',').filter(ad => isAddress(ad)) : [];
    const cacheDuration = 900;
    const cacheKey = `dola-modal-2-v1.0.6${include ? includeList.join(',') : ''}`;

    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    const provider = getProvider(NetworkIds.mainnet);

    const dbrContract = new Contract(
        DBR,
        DBR_ABI,
        provider,
    );

    try {
        const [liquidityData, badDebtData, dolaStakingData, replenishmentsData, dbrCirculatingSupply, dbrTriPoolBalanceBn, dbrPriceData, rateComparatorData] = await Promise.all([
            fetcher30sectimeout(`${SERVER_BASE_URL}/api/transparency/liquidity`),            
            getCacheFromRedis(repaymentsCacheKeyV2, false),
            getCacheFromRedis(dolaStakingCacheKey, false),  
            getCacheFromRedis(dbrReplenishmentsCacheKey, false, 0, true),          
            getCacheFromRedis(dbrCircSupplyCacheKey, false),
            dbrContract.balanceOf('0xC7DE47b9Ca2Fc753D6a2F167D8b3e19c6D18b19a'),
            getDbrPriceOnCurve(provider),
            fetcher30sectimeout(`${SERVER_BASE_URL}/api/dola/rate-comparator`),
        ]);

        // feds + exceptions, dolacrvusd, dolausd+, dola-usdc op aura, dola-usdc uni v3, dola-inv uni v3, dola-3pool
        const exceptions = [
            '0x8272e1a3dbef607c04aa6e5bd3a1a134c8ac063b',
            '0x5a473b418193C6a3967aF0913135534B7b3B23E9',
            '0x8E9154AC849e839d60299E85156bcb589De2693A',
            '0x7c082BF85e01f9bB343dbb460A14e51F67C58cFB',
            '0xbD1F921786e12a80F2184E4d6A5cAcB25dc673c9',
            '0xAA5A67c256e27A5d80712c51971408db3370927D',
        ].concat(includeList).map(ad => ad.toLowerCase());

        const feds = liquidityData.liquidity.filter(d => d.isFed || exceptions.includes(d.address.toLowerCase()));
        const totalBorrowsOnFirm = liquidityData.firmBorrows;
        const currentDolaBadDebt = badDebtData.badDebts.DOLA.badDebtBalance;
        const dbrReplenished = replenishmentsData?.events?.reduce((prev, curr) => prev+curr.deficit, 0);

        const { priceInDola: dbrPrice } = dbrPriceData;
        const { rates } = rateComparatorData;
        const aaveRate = rates.find(rate => rate.key === `Aave-V3-Multiple-USDC`);

        let csvData = `DOLA bad debt:,${currentDolaBadDebt},FiRM borrows:,${totalBorrowsOnFirm},DSA DOLA bal:,${dolaStakingData.dsaTotalSupply},DSA dbrYearlyEarnings:,${dolaStakingData.dsaYearlyDbrEarnings},DBR replenishments:,${dbrReplenished},DBR balance in tripool:,${getBnToNumber(dbrTriPoolBalanceBn).toFixed(0)},DBR circ supply:,${Number(dbrCirculatingSupply).toFixed(0)},DBR price (in dola):,${Number(dbrPrice).toFixed(4)},Aave USDC 7d avg borrow apy:,${Number(aaveRate.avg7).toFixed(2)}\n`;
        csvData += `Liquidity Cache:,~5min,Liquidity timestamp:,${liquidityData.timestamp},Bad debt timestamp:,${badDebtData.timestamp}, DSA timestamp:,${dolaStakingData.timestamp},\n`;
        csvData += `LP,Fed or Project,Fed Supply,RootLP DOLA balance,Pairing Depth ($ or amount),Fed PoL\n`;
        feds.forEach((lp) => {
            const parentLp = liquidityData.liquidity.filter(l => !!l.deduce).find(l => l.deduce.includes(lp.address));
            const balanceSource = parentLp || lp;
            // for sDOLA convert to DOLA and pair amounts
            const hasSDola = /SDOLA/i.test(lp.symbol);
            const isSDolaMain = hasSDola && !/(^DOLA|.*-DOLA.*)/i.test(lp.symbol);                        
            const pairingValue = hasSDola ? (isSDolaMain ? balanceSource?.pairPartBalance : balanceSource?.pairPartBalance * dolaStakingData.sDolaExRate) : balanceSource?.pairingDepth;
            const mainValue = balanceSource?.mainPartBalance * (isSDolaMain ? dolaStakingData.sDolaExRate : 1);
            csvData += `${lp.lpName},${lp.fedName || (capitalize(lp.project)+ ' ' + NETWORKS_BY_CHAIN_ID[lp.chainId].name)},${lp.fedSupply || 0},${mainValue || 0},${pairingValue || 0},${lp.ownedAmount || 0}\n`;
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