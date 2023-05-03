import "source-map-support";
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis';
import { TOKENS, UNDERLYING, getToken } from "@app/variables/tokens";
import { getNetworkConfigConstants } from "@app/util/networks";
import { Contract } from "ethers";
import { DEBT_CONVERTER_ABI, DEBT_REPAYER_ABI } from "@app/config/abis";
import { getProvider } from "@app/util/providers";
import { getBnToNumber } from "@app/util/markets";

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
                    if (!badDebts[underlying.symbol]) {
                        badDebts[underlying.symbol] = {
                            ...underlying,
                            badDebtBalance: 0,
                            frontierBadDebtBalance: 0,
                            converted: 0,
                            sold: 0,
                            soldFor: 0,
                        };
                    }
                    badDebts[underlying.symbol].badDebtBalance += balance;
                    badDebts[underlying.symbol].frontierBadDebtBalance += balance;
                });
            });

        const debtConverter = new Contract(DEBT_CONVERTER, DEBT_CONVERTER_ABI, provider);
        const debtRepayer = new Contract(DEBT_REPAYER, DEBT_REPAYER_ABI, provider);

        const [
            debtConverterRepayments,
            debtConverterConversions,
            debtRepayerRepayments,
        ] = await Promise.all([
            debtConverter.queryFilter(debtConverter.filters.Repayment()),
            debtConverter.queryFilter(debtConverter.filters.Conversion()),
            debtRepayer.queryFilter(debtRepayer.filters.debtRepayment()),
        ]);

        debtConverterRepayments.forEach(event => {
            repayments.iou += getBnToNumber(event.args.dolaAmount);
        });

        debtConverterConversions.forEach(event => {
            const underlying = UNDERLYING[event.args.anToken];
            badDebts[underlying.symbol].converted += getBnToNumber(event.args.underlyingAmount, underlying.decimals);
        });
        
        debtRepayerRepayments.forEach(event => {
            const underlying = getToken(TOKENS, event.args.underlying);
            const symbol = `${underlying.symbol}-v1`.replace('WETH', 'ETH');
            const marketIndex = frontierShortfalls.markets.map(m => UNDERLYING[m]?.address||WETH).indexOf(event.args.underlying);
            badDebts[symbol].sold += getBnToNumber(event.args.paidAmount, underlying.decimals) * frontierShortfalls.exRates[marketIndex];
            badDebts[symbol].soldFor += getBnToNumber(event.args.receiveAmount, underlying.decimals);
        });

        res.status(200).json({
            badDebts,
            repayments,
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
