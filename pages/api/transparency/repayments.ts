import "source-map-support";
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis';
import { TOKENS, UNDERLYING, getToken } from "@app/variables/tokens";
import { getNetworkConfigConstants } from "@app/util/networks";
import { Contract } from "ethers";
import { CTOKEN_ABI, DEBT_CONVERTER_ABI, DEBT_REPAYER_ABI, DWF_PURCHASER_ABI } from "@app/config/abis";
import { getProvider } from "@app/util/providers";
import { getBnToNumber } from "@app/util/markets";
import { DWF_PURCHASER } from "@app/config/constants";
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { fedOverviewCacheKey } from "./fed-overview";

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const TWG = '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B';
const RWG = '0xE3eD95e130ad9E15643f5A5f232a3daE980784cd';

const { DEBT_CONVERTER, DEBT_REPAYER, TREASURY } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    // defaults to mainnet data if unsupported network
    const cacheKey = `repayments-v1.0.0`;
    const frontierShortfallsKey = `1-positions-v1.1.0`;

    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', 9990);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }
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

        const anWbtc = new Contract('0x17786f3813E6bA35343211bd8Fe18EC4de14F28b', CTOKEN_ABI, provider);
        const anEth = new Contract('0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8', CTOKEN_ABI, provider);
        const anYfi = new Contract('0xde2af899040536884e062D3a334F2dD36F34b4a4', CTOKEN_ABI, provider);
        const anDola = new Contract('0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670', CTOKEN_ABI, provider);

        const [
            debtConverterRepaymentsEvents,
            debtConverterConversionsEvents,
            debtRepayerRepaymentsEvents,
            dwfOtcBuy,
            wbtcRepayEvents,
            ethRepayEvents,
            yfiRepayEvents,
            dolaRepayEvents,
            fedsOverviewData,
        ] = await Promise.all([
            debtConverter.queryFilter(debtConverter.filters.Repayment()),
            debtConverter.queryFilter(debtConverter.filters.Conversion()),
            debtRepayer.queryFilter(debtRepayer.filters.debtRepayment()),
            dwfOtc.lifetimeBuy(),
            anWbtc.queryFilter(anWbtc.filters.RepayBorrow(), 14886483),
            anEth.queryFilter(anEth.filters.RepayBorrow(), 14886483),
            anYfi.queryFilter(anYfi.filters.RepayBorrow(), 14886483),
            anDola.queryFilter(anDola.filters.RepayBorrow(), 14886483),
            getCacheFromRedis(fedOverviewCacheKey, false),
        ]);

        const fedOverviews = fedsOverviewData?.fedOverviews || [];
        const nonFrontierDolaBadDebt = fedOverviews
            .filter(({ name }) => ['Badger Fed', '0xb1 Fed'].includes(name))
            .reduce((acc, { supply }) => acc + supply, 0);
            
        badDebts['DOLA'].badDebtBalance += nonFrontierDolaBadDebt;

        const blocksNeedingTs =
            [wbtcRepayEvents, ethRepayEvents, yfiRepayEvents, dolaRepayEvents].map((arr, i) => {
                return arr.filter(event => {
                    return [TREASURY, TWG, RWG].includes(event.args.payer);
                }).map(event => event.blockNumber);
            }).flat();

        await addBlockTimestamps(blocksNeedingTs, '1');
        const timestamps = await getCachedBlockTimestamps();

        const [wbtcRepayedByDAO, ethRepayedByDAO, yfiRepayedByDAO, dolaRepayedByDAO] =
            [wbtcRepayEvents, ethRepayEvents, yfiRepayEvents, dolaRepayEvents].map((arr, i) => {
                return arr.filter(event => {
                    return [TREASURY, TWG].includes(event.args.payer);
                }).map(event => {
                    return {
                        blocknumber: event.blockNumber,
                        amount: getBnToNumber(event.args.repayAmount, i === 0 ? 8 : 18),
                        timestamp: timestamps['1'][event.blockNumber] * 1000,
                        txHash: event.transactionHash,
                    }
                });
            });

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
            const marketIndex = frontierShortfalls.markets.map(m => UNDERLYING[m]?.address || WETH).indexOf(event.args.underlying);
            const sold = getBnToNumber(event.args.paidAmount, underlying.decimals) * frontierShortfalls.exRates[marketIndex];
            const soldFor = getBnToNumber(event.args.receiveAmount, underlying.decimals);
            badDebts[symbol].sold += sold;
            badDebts[symbol].soldFor += soldFor;
            return { event, sold, soldFor, symbol };
        });

        badDebts['DOLA'].repaidViaDwf = repayments.dwf;

        const resultData = {
            wbtcRepayedByDAO,
            ethRepayedByDAO,
            yfiRepayedByDAO,
            dolaRepayedByDAO,
            badDebts,
            repayments,
            debtConverterConversions,
            debtConverterRepayments,
        };

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData);
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
