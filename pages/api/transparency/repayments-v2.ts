import "source-map-support";
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis';
import { TOKENS, UNDERLYING, getToken } from "@app/variables/tokens";
import { getNetworkConfigConstants } from "@app/util/networks";
import { Contract } from "ethers";
import { CTOKEN_ABI, DEBT_CONVERTER_ABI, DEBT_REPAYER_ABI } from "@app/config/abis";
import { getHistoricValue, getPaidProvider } from "@app/util/providers";
import { getBnToNumber } from "@app/util/markets";
import { ONE_DAY_SECS } from "@app/config/constants";
import { addBlockTimestamps } from '@app/util/timestamps';
import { DOLA_FRONTIER_DEBT_V2 } from "@app/fixtures/frontier-dola";
import { throttledPromises, timestampToUTC, utcDateToDDMMYYYY } from "@app/util/misc";
import { getTokenHolders } from "@app/util/covalent";
import { parseUnits } from "@ethersproject/units";
import { getHistoricalFrontierPositionsDetails } from "@app/util/positions-v2";
import { REPAYMENTS_V5_ARCHIVE } from "@app/fixtures/fixture-repayments-v5";

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const TWG = '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B';
const TREASURY = '0x926dF14a23BE491164dCF93f4c468A50ef659D5B';
const RWG = '0xE3eD95e130ad9E15643f5A5f232a3daE980784cd';
const DBR_AUCTION_REPAYMENT_HANDLERS = ['0xB4497A7351e4915182b3E577B3A2f411FA66b27f', '0x4f4A31C1c11Bdd438Cf0c7668D6aFa2b5825932e'];

const frontierBadDebtEvoCacheKey = 'dola-frontier-evo-v6.0.x';
export const repaymentsCacheKeyV2Archive = `repayments-v5.0.0`;
export const repaymentsCacheKeyV2 = `repayments-v6.0.0`;

const { DEBT_CONVERTER, DEBT_REPAYER } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const { cacheFirst, ignoreCache } = req.query;
    const frontierShortfallsKey = `frontier-positions-v2`;

    try {
        res.setHeader('Cache-Control', `public, max-age=${60}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(repaymentsCacheKeyV2, cacheFirst !== 'true', ONE_DAY_SECS);
        if (cachedData && isValid && !ignoreCache) {
            res.status(200).json(cachedData);
            return
        }

        const archivedData = cachedData || REPAYMENTS_V5_ARCHIVE;

        const frontierShortfalls = await getCacheFromRedis(frontierShortfallsKey, false, 99999);
        const badDebts = {};
        // dwf is archived
        const repayments = { iou: 0, dwf: 409700 };

        const provider = getPaidProvider(1);

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

        const anWbtc = new Contract('0x17786f3813E6bA35343211bd8Fe18EC4de14F28b', CTOKEN_ABI, provider);
        const anEth = new Contract('0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8', CTOKEN_ABI, provider);
        const anYfi = new Contract('0xde2af899040536884e062D3a334F2dD36F34b4a4', CTOKEN_ABI, provider);
        const anDola = new Contract('0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670', CTOKEN_ABI, provider);
        // non-frontier DOLA bad debt, resolved, archived 
        // const anDolaB1 = new Contract('0xC1Fb01415f08Fbd71623aded6Ac8ec74F974Fdc1', CTOKEN_ABI, provider);
        // const anDolaFuse6 = new Contract('0xf65155C9595F99BFC193CaFF0AAb6e2a98cf68aE', CTOKEN_ABI, provider);
        // const anDolaBadger = new Contract('0x5117D9453cC9Be8c3fBFbA4aE3B858D18fe45903', CTOKEN_ABI, provider);  

        const currentBlock = await provider.getBlockNumber();
        const currentTotalDolaFrontierBorrows = getBnToNumber(await anDola.callStatic.totalBorrowsCurrent({ blockTag: currentBlock }));
        const postArchiveV5Block = (archivedData.lastBlock || 22867534) + 1;

        const [
            debtConverterRepaymentsEvents,
            debtConverterConversionsEvents,
            iousExRateMantissa,
            iouCumDolaDebt,
            iouDolaRepaid,
            debtRepayerRepaymentsEvents,
            wbtcRepayEvents,
            ethRepayEvents,
            yfiRepayEvents,
            dolaFrontierRepayEvents,
            // dolaB1RepayEvents,
            // dolaFuse6RepayEvents,
            // dolaBadgerRepayEvents,            
            // fedsOverviewData,
            iouHoldersData,
        ] = await Promise.all([
            debtConverter.queryFilter(debtConverter.filters.Repayment()),
            debtConverter.queryFilter(debtConverter.filters.Conversion()),
            debtConverter.exchangeRateMantissa(),
            debtConverter.cumDebt(),
            debtConverter.cumDolaRepaid(),
            debtRepayer.queryFilter(debtRepayer.filters.debtRepayment()),
            anWbtc.queryFilter(anWbtc.filters.RepayBorrow(), postArchiveV5Block, currentBlock),
            anEth.queryFilter(anEth.filters.RepayBorrow(), postArchiveV5Block, currentBlock),
            anYfi.queryFilter(anYfi.filters.RepayBorrow(), postArchiveV5Block, currentBlock),
            anDola.queryFilter(anDola.filters.RepayBorrow(), postArchiveV5Block, currentBlock),
            // anDolaB1.queryFilter(anDolaB1.filters.RepayBorrow(), 14886483),
            // anDolaFuse6.queryFilter(anDolaFuse6.filters.RepayBorrow(), 14886483),
            // anDolaBadger.queryFilter(anDolaBadger.filters.RepayBorrow(), 14886483),            
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

        // non-standard "repayment" via contraction, archived
        // dolaB1RepayEvents.push({
        //     transactionHash: '0x1fdb790234dce1f430da820c2c00b84fad92d6286c909e403778ee658bcfb242',
        //     blockNumber: 20412936,
        //     args: {
        //         payer: TWG,
        //         repayAmount: parseUnits('165779523966637727284013', 0),
        //         accountBorrows: BigNumber.from('0'),
        //         totalBorrows: BigNumber.from('0'),
        //         logIndex: 273,
        //     }
        // });

        const dolaRepaymentsBlocks = dolaFrontierRepayEvents.map(e => e.blockNumber);

        // const dolaFrontierDebts = await getBadDebtEvolution(dolaRepaymentsBlocks, currentBlock);

        const blocksNeedingTs =
            [
                wbtcRepayEvents,
                ethRepayEvents,
                yfiRepayEvents,
                dolaFrontierRepayEvents,
                // dolaB1RepayEvents,
                // dolaFuse6RepayEvents,
                // dolaBadgerRepayEvents,
            ].map((arr, i) => {
                return arr.filter(event => {
                    return [TREASURY, TWG, RWG, ...DBR_AUCTION_REPAYMENT_HANDLERS].includes(event.args.payer);
                }).map(event => event.blockNumber);
            })
                .flat()
                .concat(debtConverterRepaymentsEvents.map(e => e.blockNumber))
                .concat(debtRepayerRepaymentsEvents.map(e => e.blockNumber))
                .concat([...dolaRepaymentsBlocks, currentBlock]);

        const timestamps = await addBlockTimestamps(blocksNeedingTs, '1');

        const [
            wbtcRepaidByDAO, ethRepaidByDAO, yfiRepaidByDAO, dolaFrontierRepaidByDAO,
            //  dolaB1RepaidByDAO, dolaFuse6RepaidByDAO, dolaBadgerRepaidByDAO
        ] =
            [
                wbtcRepayEvents, ethRepayEvents, yfiRepayEvents, dolaFrontierRepayEvents,
                //  dolaB1RepayEvents, dolaFuse6RepayEvents, dolaBadgerRepayEvents
            ].map((arr, i) => {
                return arr.filter(event => {
                    return [TREASURY, TWG, RWG, ...DBR_AUCTION_REPAYMENT_HANDLERS].includes(event.args.payer);
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
        // archived
        // const dolaEulerRepaidByDAO = [
        //     {
        //         blocknumber: 17636172,
        //         timestamp: 1688663111000,// 6th July 2023
        //         amount: 854752.437712229,
        //         txHash: '0xd402c7521272ea2ff718a8706a79aedf4c916208a6f3e8172aae4ffb54338e2f',
        //         logIndex: 0,
        //     },
        // ];

        const iouRepaymentsBlocks = [...new Set(debtConverterRepaymentsEvents.map(e => e.blockNumber))];
        const histoIouExRates = await getHistoIouExRate(debtConverter, iouRepaymentsBlocks);

        const dolaForIOUsRepaidByDAO = debtConverterRepaymentsEvents.map((event, i) => {
            const amount = getBnToNumber(event.args.dolaAmount);
            repayments.iou += amount;
            const timestamp = timestamps['1'][event.blockNumber] * 1000;
            const iouExRate = histoIouExRates[i];
            return { blocknumber: event.blockNumber, logIndex: event.logIndex, amount, iouExRate, iouAmount: amount / iouExRate, timestamp, date: timestampToUTC(timestamp), txHash: event.transactionHash }
        });

        // const nonFrontierDolaRepaidByDAO = dolaB1RepaidByDAO.concat(dolaFuse6RepaidByDAO).concat(dolaBadgerRepaidByDAO).concat(dolaEulerRepaidByDAO).sort((a, b) => a.timestamp - b.timestamp);
        const firmDolaRepaidByDAO = [
            // {
            //     "blocknumber": 23590296,
            //     "amount": 110310,
            //     "timestamp": 1760604167000,
            //     "date": "2025-10-16",
            //     "txHash": "0x3fbe1d8acd10627e490eae0b5b1ca3abed6b22a7ed764f99292f1836838f0240",
            //     "logIndex": 74
            // }
        ];
        const totalDolaRepaidByDAO = archivedData
            .totalDolaRepaidByDAO
            .concat(dolaFrontierRepaidByDAO)
            .concat(firmDolaRepaidByDAO)
            // .concat(nonFrontierDolaRepaidByDAO)
            .sort((a, b) => a.timestamp - b.timestamp);

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
        const histoPrices = archivedData.histoPrices;

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

        debtRepayerRepayments.forEach(d => {
            d.price = histoPrices[d.cgId][d.date];
        });

        // archived
        badDebts['DOLA'].repaidViaDwf = repayments.dwf;

        // archived
        // const badDebtEvents = [
        //     {
        //         timestamp: 1646092800000, // march 1st 2022
        //         nonFrontierDelta: 0,
        //         frontierDelta: 0,
        //         frontierBadDebt: 0,
        //         badDebt: 0,
        //     },
        //     {
        //         timestamp: 1648912863001, // april 2th
        //         nonFrontierDelta: 0,
        //         // already naturally accounted for
        //         frontierDelta: 0,
        //         eventPointLabel: 'Frontier',
        //     },
        //     {
        //         timestamp: 1651276800000, // april 30th
        //         nonFrontierDelta: 522830,
        //         frontierDelta: 0,
        //         eventPointLabel: 'Fuse',
        //     },
        //     {
        //         timestamp: 1655381899001, // June 16th
        //         nonFrontierDelta: 0,
        //         // already naturally accounted for
        //         frontierDelta: 0,
        //         eventPointLabel: 'Frontier',
        //     },
        //     {
        //         // sep repayment by mev bot (not by dao), dao repaid 303k
        //         timestamp: 1663632000000, // 20 sep
        //         nonFrontierDelta: -50850,
        //         frontierDelta: 0,
        //     },
        //     {
        //         timestamp: 1678665600000,// 13 mars 2023
        //         nonFrontierDelta: 863157,
        //         frontierDelta: 0,
        //         eventPointLabel: 'Euler',
        //     },
        //     ...nonFrontierDolaRepaidByDAO.map(({ blocknumber, timestamp, amount }, i) => {
        //         return { timestamp, nonFrontierDelta: -amount, frontierDelta: 0 }
        //     })
        // ];
        // badDebtEvents.sort((a, b) => a.timestamp - b.timestamp);

        // const newFrontierDolaEvolution = dolaFrontierDebts.totals.map((badDebt, i) => {
        //     const borrows = dolaFrontierDebts.borrowed[i];
        //     const delta = badDebt - dolaFrontierDebts.totals[i - 1];
        //     const deltaBorrowed = borrows - dolaFrontierDebts.borrowed[i - 1];
        //     return {
        //         timestamp: timestamps["1"][dolaFrontierDebts.blocks[i]] * 1000,
        //         frontierBadDebt: badDebt,
        //         frontierBorrowed: borrows,
        //         frontierDelta: delta || 0,
        //         frontierBorrowedDelta: deltaBorrowed || 0,
        //         nonFrontierDelta: 0,
        //         block: dolaFrontierDebts.blocks[i],
        //     };
        // }).filter((item, i) => dolaFrontierDebts.blocks[i] >= postArchiveV5Block);

        // can be simplified now, just current forntier totalBorrows
        const archivedEvo = archivedData.dolaBadDebtEvolution;
        const newFrontierDolaEvolution = [
            {
                timestamp: timestamps["1"][currentBlock] * 1000,
                frontierBadDebt: currentTotalDolaFrontierBorrows,
                frontierBorrowed: currentTotalDolaFrontierBorrows,
                frontierDelta: archivedEvo[archivedEvo.length - 1].frontierBadDebt - currentTotalDolaFrontierBorrows,
                frontierBorrowedDelta: archivedEvo[archivedEvo.length - 1].frontierBorrowed - currentTotalDolaFrontierBorrows,
                nonFrontierDelta: 0,
                block: currentBlock,
            }
        ]

        const dolaBadDebtEvolution = archivedData.dolaBadDebtEvolution.concat(newFrontierDolaEvolution).sort((a, b) => a.timestamp - b.timestamp);

        dolaBadDebtEvolution.forEach((ev, i) => {
            // post-archive
            if (!dolaBadDebtEvolution[i].badDebt) {
                dolaBadDebtEvolution[i].badDebt = ev.frontierBorrowed;
            }
            // if (i > 0) {
            //     const last = dolaBadDebtEvolution[i - 1];
            //     // after 20nov 2023, we use borrowed delta
            //     const delta = ev.timestamp >= 1700438400000 ? (ev.frontierBorrowedDelta || ev.nonFrontierDelta || 0) : (ev.frontierDelta || ev.nonFrontierDelta || 0);
            //     dolaBadDebtEvolution[i].badDebt = last.badDebt + delta;
            // } else {
            //     dolaBadDebtEvolution[i].badDebt = dolaBadDebtEvolution[i].frontierBadDebt;
            // }
        });

        const formattedFirmPositionsRes = await fetch('https://inverse.finance/api/f2/formatted-firm-positions');
        const firmPositionsData = await formattedFirmPositionsRes.json();
        const firmBadDebt = firmPositionsData.formattedPositions.filter(i => i.debtInMarket > i.depositsWorth).reduce((prev, curr) => prev + curr.debtInMarket, 0);
        // TODO: handle FiRM bad debt logic
        badDebts.DOLA.nonFrontierBadDebtBalance = firmBadDebt;
        badDebts.DOLA.frontierBadDebtBalance = dolaBadDebtEvolution[dolaBadDebtEvolution.length - 1].badDebt;//dolaBadDebtEvolution[dolaBadDebtEvolution.length - 1].frontierBadDebt;
        dolaBadDebtEvolution[dolaBadDebtEvolution.length - 1].badDebt = dolaBadDebtEvolution[dolaBadDebtEvolution.length - 1].badDebt + badDebts.DOLA.nonFrontierBadDebtBalance;
        badDebts.DOLA.badDebtBalance = dolaBadDebtEvolution[dolaBadDebtEvolution.length - 1].badDebt;

        const iousHeld = iouHoldersData?.data?.items?.map(d => d.balance)
            .reduce((prev, curr) => prev + getBnToNumber(parseUnits(curr, 0)), 0) || 0;
        const iouExRate = getBnToNumber(iousExRateMantissa);
        const iousDolaAmount = iousHeld * iouExRate;

        const resultData = {
            timestamp: Date.now(),
            lastBlock: currentBlock,
            iouExRate,
            iouCumDolaDebt: getBnToNumber(iouCumDolaDebt),
            iouDolaRepaid: getBnToNumber(iouDolaRepaid),
            histoPrices,
            iousHeld,
            iousDolaAmount,
            dolaBadDebtEvolution,
            wbtcRepaidByDAO: archivedData.wbtcRepaidByDAO.concat(wbtcRepaidByDAO),
            ethRepaidByDAO: archivedData.ethRepaidByDAO.concat(ethRepaidByDAO),
            yfiRepaidByDAO: archivedData.yfiRepaidByDAO.concat(yfiRepaidByDAO),
            dolaFrontierRepaidByDAO: archivedData.dolaFrontierRepaidByDAO.concat(dolaFrontierRepaidByDAO),
            nonFrontierDolaRepaidByDAO: archivedData.nonFrontierDolaRepaidByDAO,
            dolaEulerRepaidByDAO: archivedData.dolaEulerRepaidByDAO,
            dolaB1RepaidByDAO: archivedData.dolaB1RepaidByDAO,
            dolaFuse6RepaidByDAO: archivedData.dolaFuse6RepaidByDAO,
            dolaBadgerRepaidByDAO: archivedData.dolaBadgerRepaidByDAO,
            totalDolaRepaidByDAO,
            dolaForIOUsRepaidByDAO,
            badDebts,
            repayments,
            debtConverterConversions,
            debtRepayerRepayments,
        };

        await redisSetWithTimestamp(repaymentsCacheKeyV2, resultData);
        res.status(200).json(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(repaymentsCacheKeyV2, false);
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

// const getBadDebtEvolution = async (repaymentBlocks: number[], currentBlock: number) => {
//     const pastData = await getCacheFromRedis(frontierBadDebtEvoCacheKey, false, 3600) || DOLA_FRONTIER_DEBT_V2;
//     const newBlocks = [...repaymentBlocks, currentBlock].filter(block => block > pastData.blocks[pastData.blocks.length - 1]);
//     const blocks = [...new Set(newBlocks)].sort((a, b) => a - b);

//     if (!blocks.length) {
//         return pastData;
//     };

//     const results = await throttledPromises(
//         (block: number) => {
//             return getHistoricalFrontierPositionsDetails({
//                 pageOffset: 0,
//                 pageSize: 2000,
//                 blockNumber: block,
//                 useDolaShortlist: true,
//             });
//         },
//         blocks,
//         5,
//         1000,
//         'allSettled',
//     );

//     const newData = blocks.map((block, i) => {
//         const hasData = results[i]?.status === 'fulfilled';
//         return {
//             dolaBadDebt: hasData ? results[i]?.value.positionDetails.reduce((acc, pos) => acc + pos.dolaBadDebt, 0) : null,
//             // sum of main positions
//             dolaBorrowedSum: hasData ? results[i]?.value.positionDetails.reduce((acc, pos) => acc + pos.dolaBorrowed, 0) : null,
//             // totalBorrows in anDola
//             dolaBorrowed: hasData ? results[i]?.value.meta.dolaTotalBorrows : null,
//             dolaBadDebtClassic: hasData ? results[i]?.value.positionDetails.reduce((acc, pos) => acc + pos.dolaBadDebtClassic, 0) : null,
//             block,
//         };
//     }).filter(d => d.dolaBadDebt !== null);

//     const resultData = {
//         totals: pastData?.totals.concat(newData.map(d => d.dolaBadDebt)),
//         borrowed: pastData?.totals.concat(newData.map(d => d.dolaBorrowed)),
//         borrowedSum: pastData?.totals.concat(newData.map(d => d.dolaBorrowedSum)),
//         blocks: pastData?.blocks.concat(newData.map(d => d.block)),
//         timestamp: Date.now(),
//     }
//     await redisSetWithTimestamp(frontierBadDebtEvoCacheKey, resultData);
//     return resultData;
// }

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