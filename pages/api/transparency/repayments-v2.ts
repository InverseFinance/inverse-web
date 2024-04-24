import "source-map-support";
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { TOKENS, UNDERLYING, getToken } from "@app/variables/tokens";
import { getNetworkConfigConstants } from "@app/util/networks";
import { Contract } from "ethers";
import { CTOKEN_ABI, DEBT_CONVERTER_ABI, DEBT_REPAYER_ABI, DWF_PURCHASER_ABI } from "@app/config/abis";
import { getHistoricValue, getProvider } from "@app/util/providers";
import { getBnToNumber } from "@app/util/markets";
import { DWF_PURCHASER, ONE_DAY_SECS } from "@app/config/constants";
import { addBlockTimestamps } from '@app/util/timestamps';
import { DOLA_FRONTIER_DEBT_V2 } from "@app/fixtures/frontier-dola";
import { throttledPromises, timestampToUTC, utcDateToDDMMYYYY } from "@app/util/misc";
import { getTokenHolders } from "@app/util/covalent";
import { parseUnits } from "@ethersproject/units";
import { HISTO_PRICES } from "@app/fixtures/histo-prices";
import { getHistoricalFrontierPositionsDetails } from "@app/util/positions-v2";

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const TWG = '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B';
const TREASURY = '0x926dF14a23BE491164dCF93f4c468A50ef659D5B';
const RWG = '0xE3eD95e130ad9E15643f5A5f232a3daE980784cd';
const DBR_AUCTION_REPAYMENT_HANDLER = '0xB4497A7351e4915182b3E577B3A2f411FA66b27f';

const frontierBadDebtEvoCacheKey = 'dola-frontier-evo-v1.0.x';
const frontierBadDebtEvoCacheKeyNext = 'dola-frontier-evo-v1.1.x';
export const repaymentsCacheKey = `repayments-v1.0.97`;

const { DEBT_CONVERTER, DEBT_REPAYER } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const { cacheFirst, ignoreCache } = req.query;
    // defaults to mainnet data if unsupported network    
    const frontierShortfallsKey = `1-positions-v1.2.0`;
    const histoPricesCacheKey = `historic-prices-v1.0.4`;

    try {
        res.setHeader('Cache-Control', `public, max-age=${60}`);        
        const validCache = await getCacheFromRedis(repaymentsCacheKey, cacheFirst !== 'true', ONE_DAY_SECS);        
        const frontierShortfalls = await getCacheFromRedis(frontierShortfallsKey, false, 99999, true);
        if (validCache && !ignoreCache) {
            res.status(200).json(UNDERLYING);
            return
        }
        
        // const frontierShortfalls = await getCacheFromRedis(frontierShortfallsKey, false, 99999, true);        
        const badDebts = {};
        const repayments = { iou: 0 };

        const provider = getProvider(1);        
        frontierShortfalls.positions
            .filter(({ liquidShortfall, usdBorrowed }) => liquidShortfall > 0 && usdBorrowed > 0)
            .forEach(position => {
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
        // non-frontier bad debt
        const anDolaB1 = new Contract('0xC1Fb01415f08Fbd71623aded6Ac8ec74F974Fdc1', CTOKEN_ABI, provider);
        const anDolaFuse6 = new Contract('0xf65155C9595F99BFC193CaFF0AAb6e2a98cf68aE', CTOKEN_ABI, provider);
        const anDolaBadger = new Contract('0x5117D9453cC9Be8c3fBFbA4aE3B858D18fe45903', CTOKEN_ABI, provider);        
        
        const [
            debtConverterRepaymentsEvents,
            debtConverterConversionsEvents,
            iousExRateMantissa,
            iouCumDolaDebt,
            iouDolaRepaid,
            debtRepayerRepaymentsEvents,
            dwfOtcBuy,
            wbtcRepayEvents,
            ethRepayEvents,
            yfiRepayEvents,
            dolaFrontierRepayEvents,
            dolaB1RepayEvents,
            dolaFuse6RepayEvents,
            dolaBadgerRepayEvents,            
            // fedsOverviewData,
            iouHoldersData,
        ] = await Promise.all([
            debtConverter.queryFilter(debtConverter.filters.Repayment()),
            debtConverter.queryFilter(debtConverter.filters.Conversion()),
            debtConverter.exchangeRateMantissa(),
            debtConverter.cumDebt(),
            debtConverter.cumDolaRepaid(),
            debtRepayer.queryFilter(debtRepayer.filters.debtRepayment()),
            dwfOtc.lifetimeBuy(),
            anWbtc.queryFilter(anWbtc.filters.RepayBorrow(), 14886483),
            anEth.queryFilter(anEth.filters.RepayBorrow(), 14886483),
            anYfi.queryFilter(anYfi.filters.RepayBorrow(), 14886483),
            anDola.queryFilter(anDola.filters.RepayBorrow(), 14886483),
            anDolaB1.queryFilter(anDolaB1.filters.RepayBorrow(), 14886483),
            anDolaFuse6.queryFilter(anDolaFuse6.filters.RepayBorrow(), 14886483),
            anDolaBadger.queryFilter(anDolaBadger.filters.RepayBorrow(), 14886483),            
            // getCacheFromRedis(fedOverviewCacheKey, false),
            // iou holders
            getTokenHolders(DEBT_CONVERTER, 100, 0, '1'),
        ]);            
        // const fedOverviews = fedsOverviewData?.fedOverviews || [];
        // const nonFrontierDolaBadDebt = fedOverviews
        //     .filter(({ name }) => ['Badger Fed', '0xb1 Fed', 'AuraEuler Fed'].includes(name))
        //     .reduce((acc, { supply }) => acc + supply, 0);

        // badDebts['DOLA'].badDebtBalance += nonFrontierDolaBadDebt;
        // badDebts['DOLA'].nonFrontierBadDebtBalance = nonFrontierDolaBadDebt;
        
        const dolaRepaymentsBlocks = dolaFrontierRepayEvents.map(e => e.blockNumber);        
        const dolaFrontierDebts = await getBadDebtEvolution(dolaRepaymentsBlocks);
        
        const blocksNeedingTs =
            [wbtcRepayEvents, ethRepayEvents, yfiRepayEvents, dolaFrontierRepayEvents, dolaB1RepayEvents, dolaFuse6RepayEvents, dolaBadgerRepayEvents].map((arr, i) => {
                return arr.filter(event => {
                    return [TREASURY, TWG, RWG, DBR_AUCTION_REPAYMENT_HANDLER].includes(event.args.payer);
                }).map(event => event.blockNumber);
            })
                .flat()
                .concat(debtConverterRepaymentsEvents.map(e => e.blockNumber))
                .concat(debtRepayerRepaymentsEvents.map(e => e.blockNumber))                
                .concat(dolaFrontierDebts.blocks);
                
        const timestamps = await addBlockTimestamps(blocksNeedingTs, '1');
        
        const [wbtcRepaidByDAO, ethRepaidByDAO, yfiRepaidByDAO, dolaFrontierRepaidByDAO, dolaB1RepaidByDAO, dolaFuse6RepaidByDAO, dolaBadgerRepaidByDAO] =
            [wbtcRepayEvents, ethRepayEvents, yfiRepayEvents, dolaFrontierRepayEvents, dolaB1RepayEvents, dolaFuse6RepayEvents, dolaBadgerRepayEvents].map((arr, i) => {
                return arr.filter(event => {
                    return [TREASURY, TWG, RWG, DBR_AUCTION_REPAYMENT_HANDLER].includes(event.args.payer);
                }).map(event => {
                    const timestamp = timestamps['1'][event.blockNumber] * 1000;
                    return {
                        blocknumber: event.blockNumber,
                        amount: getBnToNumber(event.args.repayAmount, i === 0 ? 8 : 18),
                        timestamp,
                        date: timestampToUTC(timestamp),
                        txHash: event.transactionHash,
                        accountBorrows: getBnToNumber(event.args.accountBorrows, i === 0 ? 8 : 18),
                        totalBorrows: getBnToNumber(event.args.totalBorrows, i === 0 ? 8 : 18),
                        logIndex: event.logIndex,
                    }
                });
            });                  
        const dolaEulerRepaidByDAO = [
            {
                blocknumber: 17636172,
                timestamp: 1688663111000,// 6th July 2023
                amount: 854752.437712229,
                txHash: '0xd402c7521272ea2ff718a8706a79aedf4c916208a6f3e8172aae4ffb54338e2f',
                logIndex: 0,
            },
        ];

        const iouRepaymentsBlocks = [...new Set(debtConverterRepaymentsEvents.map(e => e.blockNumber))];
        const histoIouExRates = await getHistoIouExRate(debtConverter, iouRepaymentsBlocks);

        const dolaForIOUsRepaidByDAO = debtConverterRepaymentsEvents.map((event, i) => {
            const amount = getBnToNumber(event.args.dolaAmount);
            repayments.iou += amount;
            const timestamp = timestamps['1'][event.blockNumber] * 1000;
            const iouExRate = histoIouExRates[i];
            return { blocknumber: event.blockNumber, logIndex: event.logIndex, amount, iouExRate, iouAmount: amount / iouExRate, timestamp, date: timestampToUTC(timestamp), txHash: event.transactionHash }
        });

        const nonFrontierDolaRepaidByDAO = dolaB1RepaidByDAO.concat(dolaFuse6RepaidByDAO).concat(dolaBadgerRepaidByDAO).concat(dolaEulerRepaidByDAO).sort((a, b) => a.timestamp - b.timestamp);
        const totalDolaRepaidByDAO = dolaFrontierRepaidByDAO.concat(nonFrontierDolaRepaidByDAO).sort((a, b) => a.timestamp - b.timestamp);

        // USDC decimals
        repayments.dwf = getBnToNumber(dwfOtcBuy, 6);

        const debtConverterConversions = debtConverterConversionsEvents.map((event, i) => {
            const underlying = UNDERLYING[event.args.anToken];
            const symbol = underlying.symbol.replace('WETH', 'ETH').replace('-v1', '');
            const converted = getBnToNumber(event.args.underlyingAmount, underlying.decimals);
            const convertedFor = getBnToNumber(event.args.dolaAmount);
            badDebts[symbol].converted += converted;
            badDebts[symbol].convertedFor += convertedFor;
            return { symbol, converted, convertedFor }
        });

        const debtRepayerRepayments = debtRepayerRepaymentsEvents.map((event, i) => {
            const underlying = getToken(TOKENS, event.args.underlying);
            const symbol = underlying.symbol.replace('WETH', 'ETH').replace('-v1', '');
            const marketIndex = frontierShortfalls.markets.map(m => UNDERLYING[m]?.address || WETH).indexOf(event.args.underlying);
            const sold = getBnToNumber(event.args.paidAmount, underlying.decimals) * frontierShortfalls.exRates[marketIndex];
            const soldFor = getBnToNumber(event.args.receiveAmount, underlying.decimals);
            badDebts[symbol].sold += sold;
            badDebts[symbol].soldFor += soldFor;
            const timestamp = timestamps['1'][event.blockNumber] * 1000;
            const date = timestampToUTC(timestamp);
            return { sold, soldFor, symbol, cgId: underlying.coingeckoId?.replace('weth', 'ethereum'), timestamp, date };
        });
        
        // get and save histo prices
        const histoPrices = await getCacheFromRedis(histoPricesCacheKey, false) || HISTO_PRICES;        
        
        const [dolaPrices, wbtcPrices, ethPrices, yfiPrices] = await Promise.all([
            getHistoPrices('dola-usd', totalDolaRepaidByDAO.concat(dolaForIOUsRepaidByDAO).map(d => d.timestamp), histoPrices),
            getHistoPrices('wrapped-bitcoin', wbtcRepaidByDAO.map(d => d.timestamp), histoPrices),
            getHistoPrices('ethereum', ethRepaidByDAO.map(d => d.timestamp), histoPrices),
            getHistoPrices('yearn-finance', yfiRepaidByDAO.map(d => d.timestamp), histoPrices),
        ]);
        
        histoPrices['dola-usd'] = { ...histoPrices['dola-usd'], ...dolaPrices };
        histoPrices['wrapped-bitcoin'] = { ...histoPrices['wrapped-bitcoin'], ...wbtcPrices };
        histoPrices['ethereum'] = { ...histoPrices['ethereum'], ...ethPrices };
        histoPrices['yearn-finance'] = { ...histoPrices['yearn-finance'], ...yfiPrices };

        if (Object.keys(dolaPrices)?.length > 0 || Object.keys(wbtcPrices)?.length > 0 || Object.keys(ethPrices)?.length > 0 || Object.keys(yfiPrices)?.length > 0) {
            await redisSetWithTimestamp(histoPricesCacheKey, histoPrices);
        }

        debtRepayerRepayments.forEach(d => {
            d.price = histoPrices[d.cgId][d.date];
        });

        badDebts['DOLA'].repaidViaDwf = repayments.dwf;

        const badDebtEvents = [
            {
                timestamp: 1646092800000, // march 1st 2022
                nonFrontierDelta: 0,
                frontierDelta: 0,
                frontierBadDebt: 0,
                badDebt: 0,
            },
            {
                timestamp: 1648912863001, // april 2th
                nonFrontierDelta: 0,
                // already naturally accounted for
                frontierDelta: 0,
                eventPointLabel: 'Frontier',
            },
            {
                timestamp: 1651276800000, // april 30th
                nonFrontierDelta: 522830,
                frontierDelta: 0,
                eventPointLabel: 'Fuse',
            },
            {
                timestamp: 1655381899001, // June 16th
                nonFrontierDelta: 0,
                // already naturally accounted for
                frontierDelta: 0,
                eventPointLabel: 'Frontier',
            },
            {
                // sep repayment by mev bot (not by dao), dao repaid 303k
                timestamp: 1663632000000, // 20 sep
                nonFrontierDelta: -50850,
                frontierDelta: 0,
            },
            {
                timestamp: 1678665600000,// 13 mars 2023
                nonFrontierDelta: 863157,
                frontierDelta: 0,
                eventPointLabel: 'Euler',
            },
            ...nonFrontierDolaRepaidByDAO.map(({ blocknumber, timestamp, amount }, i) => {
                return { timestamp, nonFrontierDelta: -amount, frontierDelta: 0 }
            })
        ];
        badDebtEvents.sort((a, b) => a.timestamp - b.timestamp);

        const frontierDolaEvolution = dolaFrontierDebts.totals.map((badDebt, i) => {
            const delta = badDebt - dolaFrontierDebts.totals[i - 1];
            return {
                timestamp: timestamps["1"][dolaFrontierDebts.blocks[i]] * 1000,
                frontierBadDebt: badDebt,
                frontierDelta: delta || 0,
                nonFrontierDelta: 0,
            };
        });

        const dolaBadDebtEvolution = frontierDolaEvolution.concat(badDebtEvents).sort((a, b) => a.timestamp - b.timestamp);

        dolaBadDebtEvolution.forEach((ev, i) => {
            if (i > 0) {
                const last = dolaBadDebtEvolution[i - 1];
                dolaBadDebtEvolution[i].badDebt = last.badDebt + (ev.frontierDelta || ev.nonFrontierDelta || 0);
            } else {
                dolaBadDebtEvolution[i].badDebt = dolaBadDebtEvolution[i].frontierBadDebt;
            }
        });

        // use same data ref instead of frontier shortfall api (update daily)
        badDebts.DOLA.badDebtBalance = dolaBadDebtEvolution[dolaBadDebtEvolution.length - 1].badDebt;
        badDebts.DOLA.nonFrontierBadDebtBalance = badDebts.DOLA.badDebtBalance - dolaBadDebtEvolution[dolaBadDebtEvolution.length - 1].frontierBadDebt;
        badDebts.DOLA.frontierBadDebtBalance = dolaBadDebtEvolution[dolaBadDebtEvolution.length - 1].frontierBadDebt;

        const iousHeld = iouHoldersData?.data?.items?.map(d => d.balance)
            .reduce((prev, curr) => prev + getBnToNumber(parseUnits(curr, 0)), 0) || 0;
        const iouExRate = getBnToNumber(iousExRateMantissa);
        const iousDolaAmount = iousHeld * iouExRate;

        const resultData = {
            timestamp: +(new Date()),
            iouExRate,
            iouCumDolaDebt: getBnToNumber(iouCumDolaDebt),
            iouDolaRepaid: getBnToNumber(iouDolaRepaid),
            histoPrices,
            iousHeld,
            iousDolaAmount,
            dolaBadDebtEvolution,
            wbtcRepaidByDAO,
            ethRepaidByDAO,
            yfiRepaidByDAO,
            dolaFrontierRepaidByDAO,
            nonFrontierDolaRepaidByDAO,
            dolaEulerRepaidByDAO,
            dolaB1RepaidByDAO,
            dolaFuse6RepaidByDAO,
            dolaBadgerRepaidByDAO,
            totalDolaRepaidByDAO,
            dolaForIOUsRepaidByDAO,
            badDebts,
            repayments,
            debtConverterConversions,
            debtRepayerRepayments,
        };

        await redisSetWithTimestamp(repaymentsCacheKey, resultData);
        res.status(200).json(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(repaymentsCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ error: true });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: true });
        }
    }
};

const getHistoIouExRate = async (debtConverter: Contract, blocks: number[]) => {
    const iouExRatesBn =
        await throttledPromises(
            (block: number) => {
                return getHistoricValue(debtConverter, block, 'exchangeRateMantissa', []);
            },
            blocks,
            5,
            100,
        );

    const iouExRates = iouExRatesBn.map((d, i) => {
        return getBnToNumber(debtConverter.interface.decodeFunctionResult('exchangeRateMantissa', d)[0]);
    });
    return iouExRates;
}

const getBadDebtEvolution = async (repaymentBlocks: number[]) => {
    const provider = getProvider('1', '', true);

    const currentBlock = await provider.getBlockNumber();

    const pastData = await getCacheFromRedis(frontierBadDebtEvoCacheKeyNext, false, 3600) || DOLA_FRONTIER_DEBT_V2;
    const newBlocks = [...repaymentBlocks, currentBlock].filter(block => block > pastData.blocks[pastData.blocks.length - 1]);
    const blocks = [...new Set(newBlocks)].sort((a, b) => a - b);

    if (!blocks.length) {
        return pastData;
    };

    const results = await throttledPromises(
        (block: number) => {
            return getHistoricalFrontierPositionsDetails({
                pageOffset: 0,
                pageSize: 2000,
                blockNumber: block,
            });
        },
        blocks,
        5,
        1000,
        'allSettled',
    );

    const summary = blocks.map((block, i) => {
        const hasData = results[i]?.status === 'fulfilled';
        return {
            dolaBadDebt: hasData ? results[i]?.value.positionDetails.reduce((acc, pos) => acc + pos.dolaBadDebt, 0) : null,
            dolaBorrowed: hasData ? results[i]?.value.positionDetails.reduce((acc, pos) => acc + pos.dolaBorrowed, 0) : null,
            dolaBadDebtClassic: hasData ? results[i]?.value.positionDetails.reduce((acc, pos) => acc + pos.dolaBadDebtClassic, 0) : null,
            block,
        };
    }).filter(d => d.dolaBadDebt !== null);

    const resultData = {
        totals: pastData?.totals.concat(newTotals),                
        blocks: pastData?.blocks.concat(blocks),
        timestamp: Date.now(),
    }
    await redisSetWithTimestamp(frontierBadDebtEvoCacheKeyNext, resultData);
    return resultData;
}

const getHistoPrices = async (cgId: string, timestamps: number[], histoPrices: any) => {
    const dates = timestamps.map(ts => timestampToUTC(ts));
    const uniqueDates = [...new Set(dates)]
        .filter(d => !histoPrices[cgId][d]);

    const pricesRes = await throttledPromises(
        (date: string) => {
            const histoPriceUrl = `https://api.coingecko.com/api/v3/coins/${cgId}/history?date=${utcDateToDDMMYYYY(date)}&localization=false`;
            return fetch(histoPriceUrl);
        },
        uniqueDates,
        5,
        100,
        'allSettled',
    );

    const prices = await Promise.all(pricesRes.map(p => p.status === 'fulfilled' ? p.value.json() : new Promise((res) => res(undefined))));

    const pricesObj = prices
        .reduce((prev, curr, i) => {
            return {
                ...prev,
                [uniqueDates[i]]: curr?.market_data ? curr.market_data.current_price.usd : undefined,
            };
        }, {});

    // const missedDates = pricesRes.map((p, i) => p.status === 'rejected' ? uniqueDates[i] : undefined).filter(d => !!d);

    return pricesObj;
}