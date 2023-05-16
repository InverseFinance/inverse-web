import "source-map-support";
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { TOKENS, UNDERLYING, getToken } from "@app/variables/tokens";
import { getNetworkConfigConstants } from "@app/util/networks";
import { Contract } from "ethers";
import { COMPTROLLER_ABI, CTOKEN_ABI, DEBT_CONVERTER_ABI, DEBT_REPAYER_ABI, DWF_PURCHASER_ABI } from "@app/config/abis";
import { getHistoricValue, getProvider } from "@app/util/providers";
import { getBnToNumber } from "@app/util/markets";
import { DWF_PURCHASER } from "@app/config/constants";
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { fedOverviewCacheKey } from "./fed-overview";
import { dolaFrontierDebts } from "@app/fixtures/frontier-dola";
import { throttledPromises } from "@app/util/misc";

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const TWG = '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B';
const TREASURY = '0x926dF14a23BE491164dCF93f4c468A50ef659D5B';
const RWG = '0xE3eD95e130ad9E15643f5A5f232a3daE980784cd';

const frontierBadDebtEvoCacheKey = 'dola-frontier-evo-v1.0.2';

const { DEBT_CONVERTER, DEBT_REPAYER } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    // defaults to mainnet data if unsupported network
    const cacheKey = `repayments-v1.0.8`;
    const frontierShortfallsKey = `1-positions-v1.1.0`;

    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', 1800);        
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
        // non-frontier bad debt
        const anDolaB1 = new Contract('0xC1Fb01415f08Fbd71623aded6Ac8ec74F974Fdc1', CTOKEN_ABI, provider);
        const anDolaFuse6 = new Contract('0xf65155C9595F99BFC193CaFF0AAb6e2a98cf68aE', CTOKEN_ABI, provider);
        const anDolaBadger = new Contract('0x5117D9453cC9Be8c3fBFbA4aE3B858D18fe45903', CTOKEN_ABI, provider);

        const [
            debtConverterRepaymentsEvents,
            debtConverterConversionsEvents,
            debtRepayerRepaymentsEvents,
            dwfOtcBuy,
            wbtcRepayEvents,
            ethRepayEvents,
            yfiRepayEvents,
            dolaFrontierRepayEvents,
            dolaB1RepayEvents,
            dolaFuse6RepayEvents,
            dolaBadgerRepayEvents,
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
            anDolaB1.queryFilter(anDola.filters.RepayBorrow(), 14886483),
            anDolaFuse6.queryFilter(anDola.filters.RepayBorrow(), 14886483),
            anDolaBadger.queryFilter(anDola.filters.RepayBorrow(), 14886483),
            getCacheFromRedis(fedOverviewCacheKey, false),
        ]);
        // res.json({
        //     dolaB1RepayEvents: dolaB1RepayEvents.filter(event => [TREASURY, TWG, RWG].includes(event.args.payer)),
        //     dolaFuse6RepayEvents: dolaFuse6RepayEvents.filter(event => [TREASURY, TWG, RWG].includes(event.args.payer)),
        //     dolaBadgerRepayEvents: dolaBadgerRepayEvents.filter(event => [TREASURY, TWG, RWG].includes(event.args.payer)),
        // });
        // return

        const fedOverviews = fedsOverviewData?.fedOverviews || [];
        const nonFrontierDolaBadDebt = fedOverviews
            .filter(({ name }) => ['Badger Fed', '0xb1 Fed', 'AuraEuler Fed'].includes(name))
            .reduce((acc, { supply }) => acc + supply, 0);

        badDebts['DOLA'].badDebtBalance += nonFrontierDolaBadDebt;
        badDebts['DOLA'].nonFrontierBadDebtBalance = nonFrontierDolaBadDebt;

        const dolaRepaymentsBlocks = dolaFrontierRepayEvents.map(e => e.blockNumber); 
        const dolaFrontierDebts = await getBadDebtEvolution(dolaRepaymentsBlocks);

        const blocksNeedingTs =
            [wbtcRepayEvents, ethRepayEvents, yfiRepayEvents, dolaFrontierRepayEvents, dolaB1RepayEvents, dolaFuse6RepayEvents, dolaBadgerRepayEvents].map((arr, i) => {
                return arr.filter(event => {
                    return [TREASURY, TWG, RWG].includes(event.args.payer);
                }).map(event => event.blockNumber);
            })
                .flat()
                .concat(dolaFrontierDebts.blocks);

        await addBlockTimestamps(blocksNeedingTs, '1');
        const timestamps = await getCachedBlockTimestamps();

        const [wbtcRepayedByDAO, ethRepayedByDAO, yfiRepayedByDAO, dolaFrontierRepayedByDAO, dolaB1RepayedByDAO, dolaFuse6RepayedByDAO, dolaBadgerRepayedByDAO] =
            [wbtcRepayEvents, ethRepayEvents, yfiRepayEvents, dolaFrontierRepayEvents, dolaB1RepayEvents, dolaFuse6RepayEvents, dolaBadgerRepayEvents].map((arr, i) => {
                return arr.filter(event => {
                    return [TREASURY, TWG, RWG].includes(event.args.payer);
                }).map(event => {
                    return {
                        blocknumber: event.blockNumber,
                        amount: getBnToNumber(event.args.repayAmount, i === 0 ? 8 : 18),
                        timestamp: timestamps['1'][event.blockNumber] * 1000,
                        txHash: event.transactionHash,
                    }
                });
            });

        const nonFrontierDolaRepayedByDAO = dolaB1RepayedByDAO.concat(dolaFuse6RepayedByDAO).concat(dolaBadgerRepayedByDAO).sort((a, b) => a.timestamp - b.timestamp);
        const totalDolaRepayedByDAO = dolaFrontierRepayedByDAO.concat(nonFrontierDolaRepayedByDAO).sort((a, b) => a.timestamp - b.timestamp);

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
            return { symbol, converted, convertedFor }
        });

        const debtConverterRepayments = debtRepayerRepaymentsEvents.map(event => {
            const underlying = getToken(TOKENS, event.args.underlying);
            const symbol = underlying.symbol.replace('WETH', 'ETH').replace('-v1', '');
            const marketIndex = frontierShortfalls.markets.map(m => UNDERLYING[m]?.address || WETH).indexOf(event.args.underlying);
            const sold = getBnToNumber(event.args.paidAmount, underlying.decimals) * frontierShortfalls.exRates[marketIndex];
            const soldFor = getBnToNumber(event.args.receiveAmount, underlying.decimals);
            badDebts[symbol].sold += sold;
            badDebts[symbol].soldFor += soldFor;
            return { sold, soldFor, symbol };
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
            ...nonFrontierDolaRepayedByDAO.map(({ blocknumber, timestamp, amount }, i) => {
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

        const resultData = {
            dolaBadDebtEvolution,
            wbtcRepayedByDAO,
            ethRepayedByDAO,
            yfiRepayedByDAO,
            dolaFrontierRepayedByDAO,
            nonFrontierDolaRepayedByDAO,
            dolaB1RepayedByDAO,
            dolaFuse6RepayedByDAO,
            dolaBadgerRepayedByDAO,
            totalDolaRepayedByDAO,
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

const getBadDebtEvolution = async (repaymentBlocks: number[]) => {
    const provider = getProvider('1', '', true);

    const currentBlock = await provider.getBlockNumber();
    const anDola = new Contract('0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670', CTOKEN_ABI, provider);
    const comptroller = new Contract('0x4dCf7407AE5C07f8681e1659f626E114A7667339', COMPTROLLER_ABI, provider);

    const mainBadDebtAddresses = [
      '0xeA0c959BBb7476DDD6cD4204bDee82b790AA1562',
      '0xf508c58ce37ce40a40997C715075172691F92e2D',
      '0xe2e4f2a725e42d0f0ef6291f46c430f963482001',
      '0x86426c098e1ad3d96a62cc267d55c5258ddf686a',
      '0x1991059f78026D50739100d5Eeda2723f8d9DD52',
      '0xE69A81190F3A3a388E2b9e1C1075664252A8Ea7C',
      '0x0e81F7af4698Cfe49cF5099A7D1e3E4421D5d1AF',
      '0x6B92686c40747C85809a6772D0eda8e22a77C60c',
    ];

    const pastData = await getCacheFromRedis(frontierBadDebtEvoCacheKey, false, 3600) || dolaFrontierDebts;
    // return pastData;
    const newBlocks = [...repaymentBlocks, currentBlock].filter(block => block > pastData.blocks[pastData.blocks.length - 1]);
    const blocks = [...new Set(newBlocks)].sort((a, b) => a - b);

    if(!blocks.length) {
        return pastData;
    };

    const newDebtsBn =
      await throttledPromises(
        (address: string) => {
          return Promise.all(
            blocks.map(block => {
              return getHistoricValue(anDola, block, 'borrowBalanceStored', [address]);
            })
          )
        },
        mainBadDebtAddresses,
        5,
        100,
      );

    const dolaDebts = newDebtsBn.map((userDebts, i) => {
      return userDebts.map((d, i) => {
        return getBnToNumber(anDola.interface.decodeFunctionResult('borrowBalanceStored', d)[0]);
      })
    });

    const accountLiqs =
      await throttledPromises(
        (address: string) => {
          return Promise.all(
            blocks.map(block => {
              return getHistoricValue(comptroller, block, 'getAccountLiquidity', [address]);
            })
          )
        },
        mainBadDebtAddresses,
        5,
        100,
      );

    const shortfalls = accountLiqs.map((accountLiq, i) => {
      return accountLiq.map((d, i) => {
        return getBnToNumber(comptroller.interface.decodeFunctionResult('getAccountLiquidity', d)[2]);
      })
    });

    const userBadDebts = dolaDebts.map((userDebts, i) => {
      return userDebts.map((debt, j) => {
        return shortfalls[i][j] > 0 ? debt : 0;
      });
    });

    const newTotals = blocks.map((a, i) => mainBadDebtAddresses.reduce((prev, curr) => prev + userBadDebts[mainBadDebtAddresses.indexOf(curr)][i], 0));

    const resultData = {
      totals: pastData?.totals.concat(newTotals),
      old: pastData?.shortfalls,
      new: shortfalls,
      shortfalls: pastData?.shortfalls.map((d,i) => d.concat(shortfalls[i])),
      dolaDebts: pastData?.dolaDebts.map((d,i) => d.concat(dolaDebts[i])),
      userBadDebts: pastData?.userBadDebts.map((d,i) => d.concat(userBadDebts[i])),
      blocks: pastData?.blocks.concat(blocks),
      timestamp: +(new Date()),
    }
    await redisSetWithTimestamp(frontierBadDebtEvoCacheKey, resultData);
    return resultData;
}