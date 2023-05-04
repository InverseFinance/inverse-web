import "source-map-support";
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis';
import { TOKENS, UNDERLYING, getToken } from "@app/variables/tokens";
import { getNetworkConfigConstants } from "@app/util/networks";
import { Contract } from "ethers";
import { DEBT_CONVERTER_ABI, DEBT_REPAYER_ABI, DWF_PURCHASER_ABI } from "@app/config/abis";
import { getProvider } from "@app/util/providers";
import { getBnToNumber } from "@app/util/markets";
import { DWF_PURCHASER } from "@app/config/constants";

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const { DEBT_CONVERTER, DEBT_REPAYER } = getNetworkConfigConstants();

export default async function handler(req, res) {
    // defaults to mainnet data if unsupported network
    const cacheKey = `repayments-v1.0.0`;
    const frontierShortfallsKey = `1-positions-v1.1.0`;

    try {
        const frontierShortfalls = await getCacheFromRedis(frontierShortfallsKey, false, 99999);

        const badDebts = {};
        const repayments = { iou: 0 };

        const provider = getProvider(1);

        frontierShortfalls.positions
            .filter(({ usdShortfall, usdBorrowed }) => usdShortfall > 0 && usdBorrowed > 0)
            .forEach(position => {
                // console.log(position.borrowed)
                position.borrowed.forEach(({ marketIndex, balance }) => {
                    const marketAddress = frontierShortfalls.markets[marketIndex];
                    const underlying = UNDERLYING[marketAddress];
                    const symbol = underlying.symbol.replace('-v1', '');
                    if (!badDebts[symbol]) {
                        badDebts[symbol] = {
                            ...underlying,
                            symbol,
                            badDebtBalance: 0,
                            frontierBadDebtBalance: 0,
                            converted: 0,
                            sold: 0,
                            soldFor: 0,
                        };
                    }
                    badDebts[symbol].badDebtBalance += balance;
                    badDebts[symbol].frontierBadDebtBalance += balance;
                });
            });

        const debtConverter = new Contract(DEBT_CONVERTER, DEBT_CONVERTER_ABI, provider);
        const debtRepayer = new Contract(DEBT_REPAYER, DEBT_REPAYER_ABI, provider);
        const dwfOtc = new Contract(DWF_PURCHASER, DWF_PURCHASER_ABI, provider);

        const [
            debtConverterRepaymentsEvents,
            debtConverterConversionsEvents,
            debtRepayerRepaymentsEvents,
            dwfOtcBuy,
        ] = await Promise.all([
            debtConverter.queryFilter(debtConverter.filters.Repayment()),
            debtConverter.queryFilter(debtConverter.filters.Conversion()),
            debtRepayer.queryFilter(debtRepayer.filters.debtRepayment()),
            dwfOtc.lifetimeBuy(),
        ]);

        // USDC decimals
        repayments.dwf = getBnToNumber(dwfOtcBuy, 6);

        debtConverterRepaymentsEvents.forEach(event => {
            repayments.iou += getBnToNumber(event.args.dolaAmount);
        });

        const debtConverterConversions = debtConverterConversionsEvents.map(event => {
            const underlying = UNDERLYING[event.args.anToken];
            const symbol = underlying.symbol.replace('WETH', 'ETH').replace('-v1', '');
            const converted = getBnToNumber(event.args.underlyingAmount, underlying.decimals);
            const convertedFor = getBnToNumber(event.args.dolaAmount);
            badDebts[symbol].converted += converted;
            badDebts[symbol].convertedFor += convertedFor;
            return { ...event, symbol, converted, convertedFor }
        });
        
        const debtConverterRepayments = debtRepayerRepaymentsEvents.map(event => {
            const underlying = getToken(TOKENS, event.args.underlying);
            const symbol = underlying.symbol.replace('WETH', 'ETH').replace('-v1', '');
            const marketIndex = frontierShortfalls.markets.map(m => UNDERLYING[m]?.address||WETH).indexOf(event.args.underlying);
            const sold = getBnToNumber(event.args.paidAmount, underlying.decimals) * frontierShortfalls.exRates[marketIndex];
            const soldFor = getBnToNumber(event.args.receiveAmount, underlying.decimals);
            badDebts[symbol].sold += sold;
            badDebts[symbol].soldFor += soldFor;            
            return { event, sold, soldFor, symbol };
        });

        badDebts['DOLA'].repaidViaDwf = repayments.dwf;

        res.status(200).json({
            badDebts,
            repayments,
            debtConverterConversions,
            debtConverterRepayments,
        });
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(200).json({ error: true });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: true });
        }
    }
};
