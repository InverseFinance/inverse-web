import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { SVAULT_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { throttledPromises, timestampToUTC, utcDateStringToTimestamp } from '@app/util/misc';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { parseEther } from '@ethersproject/units';
import { BURN_ADDRESS } from '@app/config/constants';

export const stableReservesCacheKey = `stable-reserves-history-v1.0.0`;

const getChainStableBalances = async (archivedTimeData, chainId, snapshotsStart, snapshotsEnd, ad1, ad2?: string) => {
    const blockValues = Object.entries(archivedTimeData[chainId]).map(([date, block]) => {
        return { date, block: parseInt(block), timestamp: utcDateStringToTimestamp(date) };
    }).filter(d => d.date >= snapshotsStart && d.date <= snapshotsEnd);

    const blocks = blockValues.map(d => d.block);

    const stables = Object.values(CHAIN_TOKENS[chainId]).filter(t => t.isStable && !t.isLP);

    const results = await throttledPromises(
        (block: number) => {
            return getGroupedMulticallOutputs([
                stables.map(token => {
                    const contract = new Contract(token.address, SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: 'balanceOf',
                        params: [ad1 || BURN_ADDRESS],
                        forceFallback: !ad1 || ad1 === BURN_ADDRESS,
                        fallbackValue: BigNumber.from('0'),
                    }
                }),
                stables.map(token => {
                    const contract = new Contract(token.address, SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: 'balanceOf',
                        params: [ad2 || BURN_ADDRESS],
                        forceFallback: !ad2 || ad2 === BURN_ADDRESS,
                        fallbackValue: BigNumber.from('0'),
                    }
                }),
                // handle ERC4626 stable vaults by converting to assets
                stables.map(token => {
                    const contract = new Contract(token.address, SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: 'convertToAssets',
                        params: [parseEther('1')],
                        forceFallback: chainId !== NetworkIds.mainnet,
                        fallbackValue: parseEther('1'),
                    }
                }),
                stables.map(token => {
                    const contract = new Contract(token.address, SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: 'asset',
                        forceFallback: chainId !== NetworkIds.mainnet,
                        fallbackValue: BURN_ADDRESS,
                    }
                }),
            ],
                Number(chainId),
                block,
                undefined,
                true,
            );
        },
        blocks,
        5,
        100,
    );

    const stableBalances = results.map((d, i) => {
        const exRatesToStableAssetsRaw = d[2].map((bal, i) => bal);
        const underlyingStableAssetAddresses = d[3].map((asset, i) => asset);
        const underlyings = underlyingStableAssetAddresses.map(ad => getToken(CHAIN_TOKENS[1], ad));
        const exRatesToStableAssets = exRatesToStableAssetsRaw.map((balRaw, i) => getBnToNumber(balRaw, underlyings[i]?.decimals || 18));

        const treasuryBalances = d[0].map((bal, i) => getBnToNumber(bal, stables[i].decimals) * exRatesToStableAssets[i]);
        const twgBalances = d[1].map((bal, i) => getBnToNumber(bal, stables[i].decimals) * exRatesToStableAssets[i]);
        const combinedBalances = treasuryBalances.map((bal, i) => bal + twgBalances[i]);

        const namedBalances = {};
        const namedBalancesT1 = {};
        const namedBalancesT2 = {};

        treasuryBalances.forEach((bal, i) => {
            if (bal > 0) {
                namedBalancesT1[stables[i].symbol] = bal;
            }
        });
        twgBalances.forEach((bal, i) => {
            if (bal > 0) {
                namedBalancesT2[stables[i].symbol] = bal;
            }
        });
        combinedBalances.forEach((bal, i) => {
            if (bal > 0) {
                namedBalances[stables[i].symbol] = bal;
            }
        });

        const sum = combinedBalances.reduce((prev, curr) => prev + curr, 0);
        return {
            utcDate: timestampToUTC(blockValues[i].timestamp),
            timestamp: blockValues[i].timestamp,
            sum,
            namedBalances,
            namedBalancesT1,
            namedBalancesT2,
        }
    });
    return stableBalances;
}

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const { TREASURY, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
    try {
        const archived = (
            {
                "timestamp": 1758196772728,
                "snapshotsStart": "2025-06-15",
                "snapshotsEnd": "2025-09-18",
                "totalEvolution": [
                    {
                        "timestamp": 1749948846732,
                        "utcDate": "2025-06-15",
                        "totalReserves": 857850.640128249,
                        "lpReserves": 397597.437987326,
                        "nonLpReserves": 460253.202140923
                    },
                    {
                        "timestamp": 1750035051594,
                        "utcDate": "2025-06-16",
                        "totalReserves": 851578.672291548,
                        "lpReserves": 397538.624635708,
                        "nonLpReserves": 454040.047655839
                    },
                    {
                        "timestamp": 1750121284483,
                        "utcDate": "2025-06-17",
                        "totalReserves": 908135.713812155,
                        "lpReserves": 397518.93165746,
                        "nonLpReserves": 510616.782154695
                    },
                    {
                        "timestamp": 1750207712156,
                        "utcDate": "2025-06-18",
                        "totalReserves": 898988.927792991,
                        "lpReserves": 397625.714151953,
                        "nonLpReserves": 501363.213641038
                    },
                    {
                        "timestamp": 1750294112072,
                        "utcDate": "2025-06-19",
                        "totalReserves": 858144.856500583,
                        "lpReserves": 397558.52261794,
                        "nonLpReserves": 460586.333882643
                    },
                    {
                        "timestamp": 1750380493272,
                        "utcDate": "2025-06-20",
                        "totalReserves": 857888.863462097,
                        "lpReserves": 397557.613373243,
                        "nonLpReserves": 460331.250088854
                    },
                    {
                        "timestamp": 1750466816381,
                        "utcDate": "2025-06-21",
                        "totalReserves": 915433.660590637,
                        "lpReserves": 397505.05162994,
                        "nonLpReserves": 517928.608960697
                    },
                    {
                        "timestamp": 1750553632728,
                        "utcDate": "2025-06-22",
                        "totalReserves": 913259.676396031,
                        "lpReserves": 397524.31238994,
                        "nonLpReserves": 515735.364006091
                    },
                    {
                        "timestamp": 1750639976594,
                        "utcDate": "2025-06-23",
                        "totalReserves": 899908.049118537,
                        "lpReserves": 397583.517184911,
                        "nonLpReserves": 502324.531933626
                    },
                    {
                        "timestamp": 1750726146087,
                        "utcDate": "2025-06-24",
                        "totalReserves": 943079.053048742,
                        "lpReserves": 397608.190301687,
                        "nonLpReserves": 545470.862747055
                    },
                    {
                        "timestamp": 1750812580340,
                        "utcDate": "2025-06-25",
                        "totalReserves": 888437.053184493,
                        "lpReserves": 397546.895536343,
                        "nonLpReserves": 490890.15764815
                    },
                    {
                        "timestamp": 1750898909443,
                        "utcDate": "2025-06-26",
                        "totalReserves": 833345.341591458,
                        "lpReserves": 397656.211935976,
                        "nonLpReserves": 435689.129655482
                    },
                    {
                        "timestamp": 1750985385308,
                        "utcDate": "2025-06-27",
                        "totalReserves": 831761.966965328,
                        "lpReserves": 396692.062659226,
                        "nonLpReserves": 435069.904306102
                    },
                    {
                        "timestamp": 1751071601669,
                        "utcDate": "2025-06-28",
                        "totalReserves": 815779.306447705,
                        "lpReserves": 396634.188836926,
                        "nonLpReserves": 419145.117610779
                    },
                    {
                        "timestamp": 1751158513224,
                        "utcDate": "2025-06-29",
                        "totalReserves": 813509.74555903,
                        "lpReserves": 396876.699220653,
                        "nonLpReserves": 416633.046338377
                    },
                    {
                        "timestamp": 1751244768976,
                        "utcDate": "2025-06-30",
                        "totalReserves": 813758.272549411,
                        "lpReserves": 397063.652590165,
                        "nonLpReserves": 416694.619959246
                    },
                    {
                        "timestamp": 1751331335106,
                        "utcDate": "2025-07-01",
                        "totalReserves": 889479.667312231,
                        "lpReserves": 397309.923368068,
                        "nonLpReserves": 492169.743944163
                    },
                    {
                        "timestamp": 1751417347532,
                        "utcDate": "2025-07-02",
                        "totalReserves": 894877.459040196,
                        "lpReserves": 397340.92361581,
                        "nonLpReserves": 497536.535424385
                    },
                    {
                        "timestamp": 1751503733908,
                        "utcDate": "2025-07-03",
                        "totalReserves": 861535.04405153,
                        "lpReserves": 397684.596904194,
                        "nonLpReserves": 463850.447147335
                    },
                    {
                        "timestamp": 1751676325470,
                        "utcDate": "2025-07-05",
                        "totalReserves": 858393.341523978,
                        "lpReserves": 397285.00308938,
                        "nonLpReserves": 461108.338434598
                    },
                    {
                        "timestamp": 1751763266709,
                        "utcDate": "2025-07-06",
                        "totalReserves": 858530.982272598,
                        "lpReserves": 397375.038443961,
                        "nonLpReserves": 461155.943828637
                    },
                    {
                        "timestamp": 1751845409724,
                        "utcDate": "2025-07-06",
                        "totalReserves": 858564.641304346,
                        "lpReserves": 397408.697475709,
                        "nonLpReserves": 461155.943828637
                    },
                    {
                        "timestamp": 1751935720665,
                        "utcDate": "2025-07-08",
                        "totalReserves": 931901.053595864,
                        "lpReserves": 397019.98004497,
                        "nonLpReserves": 534881.073550895
                    },
                    {
                        "timestamp": 1752022228256,
                        "utcDate": "2025-07-09",
                        "totalReserves": 809932.211702984,
                        "lpReserves": 397015.394311477,
                        "nonLpReserves": 412916.817391507
                    },
                    {
                        "timestamp": 1752108585057,
                        "utcDate": "2025-07-10",
                        "totalReserves": 756482.5394182,
                        "lpReserves": 397415.755771831,
                        "nonLpReserves": 359066.783646369
                    },
                    {
                        "timestamp": 1752281524905,
                        "utcDate": "2025-07-12",
                        "totalReserves": 750910.58651866,
                        "lpReserves": 397336.627953914,
                        "nonLpReserves": 353573.958564746
                    },
                    {
                        "timestamp": 1752454422095,
                        "utcDate": "2025-07-14",
                        "totalReserves": 745111.856606972,
                        "lpReserves": 397181.301786778,
                        "nonLpReserves": 347930.554820194
                    },
                    {
                        "timestamp": 1752540762288,
                        "utcDate": "2025-07-15",
                        "totalReserves": 741660.643052163,
                        "lpReserves": 397131.686689038,
                        "nonLpReserves": 344528.956363125
                    },
                    {
                        "timestamp": 1752627090998,
                        "utcDate": "2025-07-16",
                        "totalReserves": 742228.957648747,
                        "lpReserves": 397641.234558072,
                        "nonLpReserves": 344587.723090675
                    },
                    {
                        "timestamp": 1752713517222,
                        "utcDate": "2025-07-17",
                        "totalReserves": 763932.146388858,
                        "lpReserves": 397758.137267781,
                        "nonLpReserves": 366174.009121077
                    },
                    {
                        "timestamp": 1752799879639,
                        "utcDate": "2025-07-18",
                        "totalReserves": 763840.03578352,
                        "lpReserves": 398446.480621787,
                        "nonLpReserves": 365393.555161733
                    },
                    {
                        "timestamp": 1752886221914,
                        "utcDate": "2025-07-19",
                        "totalReserves": 769059.060072941,
                        "lpReserves": 398311.684706599,
                        "nonLpReserves": 370747.375366342
                    },
                    {
                        "timestamp": 1752973029185,
                        "utcDate": "2025-07-20",
                        "totalReserves": 759300.234329161,
                        "lpReserves": 398464.743943544,
                        "nonLpReserves": 360835.490385617
                    },
                    {
                        "timestamp": 1753059335006,
                        "utcDate": "2025-07-21",
                        "totalReserves": 756591.95809856,
                        "lpReserves": 398471.081849913,
                        "nonLpReserves": 358120.876248647
                    },
                    {
                        "timestamp": 1753145527653,
                        "utcDate": "2025-07-22",
                        "totalReserves": 965899.705174063,
                        "lpReserves": 398351.982608572,
                        "nonLpReserves": 567547.722565492
                    },
                    {
                        "timestamp": 1753231953423,
                        "utcDate": "2025-07-23",
                        "totalReserves": 729251.701862707,
                        "lpReserves": 196421.497227222,
                        "nonLpReserves": 532830.204635485
                    },
                    {
                        "timestamp": 1753318327999,
                        "utcDate": "2025-07-24",
                        "totalReserves": 649266.864357855,
                        "lpReserves": 196472.932795471,
                        "nonLpReserves": 452793.931562385
                    },
                    {
                        "timestamp": 1753404730223,
                        "utcDate": "2025-07-25",
                        "totalReserves": 694733.344892269,
                        "lpReserves": 196469.275631703,
                        "nonLpReserves": 498264.069260566
                    },
                    {
                        "timestamp": 1753491013644,
                        "utcDate": "2025-07-26",
                        "totalReserves": 675150.49532007,
                        "lpReserves": 196443.635982887,
                        "nonLpReserves": 478706.859337183
                    },
                    {
                        "timestamp": 1753577838603,
                        "utcDate": "2025-07-27",
                        "totalReserves": 667342.427623417,
                        "lpReserves": 196482.855053108,
                        "nonLpReserves": 470859.572570308
                    },
                    {
                        "timestamp": 1753664155021,
                        "utcDate": "2025-07-28",
                        "totalReserves": 662294.57183054,
                        "lpReserves": 196425.448243658,
                        "nonLpReserves": 465869.123586882
                    },
                    {
                        "timestamp": 1753750645731,
                        "utcDate": "2025-07-29",
                        "totalReserves": 646224.374030142,
                        "lpReserves": 196390.196015941,
                        "nonLpReserves": 449834.178014201
                    },
                    {
                        "timestamp": 1753836783833,
                        "utcDate": "2025-07-30",
                        "totalReserves": 643688.098813016,
                        "lpReserves": 196400.602923751,
                        "nonLpReserves": 447287.495889265
                    },
                    {
                        "timestamp": 1753923165148,
                        "utcDate": "2025-07-31",
                        "totalReserves": 642804.687346097,
                        "lpReserves": 196422.935648966,
                        "nonLpReserves": 446381.751697132
                    },
                    {
                        "timestamp": 1754009932003,
                        "utcDate": "2025-08-01",
                        "totalReserves": 909038.880888117,
                        "lpReserves": 196263.629913642,
                        "nonLpReserves": 712775.250974475
                    },
                    {
                        "timestamp": 1754095822934,
                        "utcDate": "2025-08-02",
                        "totalReserves": 858931.673781231,
                        "lpReserves": 196262.75612312,
                        "nonLpReserves": 662668.917658111
                    },
                    {
                        "timestamp": 1754182690143,
                        "utcDate": "2025-08-03",
                        "totalReserves": 826396.074292923,
                        "lpReserves": 196240.718925214,
                        "nonLpReserves": 630155.355367709
                    },
                    {
                        "timestamp": 1754269059381,
                        "utcDate": "2025-08-04",
                        "totalReserves": 784195.453509374,
                        "lpReserves": 196389.588700689,
                        "nonLpReserves": 587805.864808685
                    },
                    {
                        "timestamp": 1754355263301,
                        "utcDate": "2025-08-05",
                        "totalReserves": 1005255.20953171,
                        "lpReserves": 196386.433890882,
                        "nonLpReserves": 808868.775640832
                    },
                    {
                        "timestamp": 1754441616969,
                        "utcDate": "2025-08-06",
                        "totalReserves": 949429.589273553,
                        "lpReserves": 196310.245283375,
                        "nonLpReserves": 753119.343990178
                    },
                    {
                        "timestamp": 1754528044817,
                        "utcDate": "2025-08-07",
                        "totalReserves": 852844.509989779,
                        "lpReserves": 196365.096907271,
                        "nonLpReserves": 656479.413082507
                    },
                    {
                        "timestamp": 1754614421872,
                        "utcDate": "2025-08-08",
                        "totalReserves": 842626.790822841,
                        "lpReserves": 196408.941507922,
                        "nonLpReserves": 646217.849314919
                    },
                    {
                        "timestamp": 1754700468032,
                        "utcDate": "2025-08-09",
                        "totalReserves": 869028.618713704,
                        "lpReserves": 196335.113081329,
                        "nonLpReserves": 672693.505632376
                    },
                    {
                        "timestamp": 1754787379664,
                        "utcDate": "2025-08-10",
                        "totalReserves": 869175.387231588,
                        "lpReserves": 196390.866802622,
                        "nonLpReserves": 672784.520428966
                    },
                    {
                        "timestamp": 1754873673770,
                        "utcDate": "2025-08-11",
                        "totalReserves": 825599.77170798,
                        "lpReserves": 196401.045082727,
                        "nonLpReserves": 629198.726625252
                    },
                    {
                        "timestamp": 1754959669987,
                        "utcDate": "2025-08-12",
                        "totalReserves": 789894.256271549,
                        "lpReserves": 196204.224644838,
                        "nonLpReserves": 593690.031626711
                    },
                    {
                        "timestamp": 1755046188278,
                        "utcDate": "2025-08-13",
                        "totalReserves": 789550.257818368,
                        "lpReserves": 196268.490775309,
                        "nonLpReserves": 593281.767043059
                    },
                    {
                        "timestamp": 1755132605380,
                        "utcDate": "2025-08-14",
                        "totalReserves": 781143.43839192,
                        "lpReserves": 196310.855726186,
                        "nonLpReserves": 584832.582665735
                    },
                    {
                        "timestamp": 1755219016708,
                        "utcDate": "2025-08-15",
                        "totalReserves": 824470.996191788,
                        "lpReserves": 196252.975084473,
                        "nonLpReserves": 628218.021107315
                    },
                    {
                        "timestamp": 1755305151733,
                        "utcDate": "2025-08-16",
                        "totalReserves": 821807.213908102,
                        "lpReserves": 196239.357491404,
                        "nonLpReserves": 625567.856416697
                    },
                    {
                        "timestamp": 1755392003096,
                        "utcDate": "2025-08-17",
                        "totalReserves": 815151.046627246,
                        "lpReserves": 196245.229556582,
                        "nonLpReserves": 618905.817070664
                    },
                    {
                        "timestamp": 1755478416098,
                        "utcDate": "2025-08-18",
                        "totalReserves": 812868.997945711,
                        "lpReserves": 196234.816266415,
                        "nonLpReserves": 616634.181679296
                    },
                    {
                        "timestamp": 1755564420482,
                        "utcDate": "2025-08-19",
                        "totalReserves": 1074843.06971209,
                        "lpReserves": 196288.550720087,
                        "nonLpReserves": 878554.518992004
                    },
                    {
                        "timestamp": 1755650676470,
                        "utcDate": "2025-08-20",
                        "totalReserves": 1074504.35585323,
                        "lpReserves": 196265.327303385,
                        "nonLpReserves": 878239.028549842
                    },
                    {
                        "timestamp": 1755737040026,
                        "utcDate": "2025-08-21",
                        "totalReserves": 1025246.78802056,
                        "lpReserves": 196301.459660094,
                        "nonLpReserves": 828945.328360462
                    },
                    {
                        "timestamp": 1755823498851,
                        "utcDate": "2025-08-22",
                        "totalReserves": 1066562.34197733,
                        "lpReserves": 196189.062630351,
                        "nonLpReserves": 870373.279346979
                    },
                    {
                        "timestamp": 1755909606447,
                        "utcDate": "2025-08-23",
                        "totalReserves": 1066296.93149187,
                        "lpReserves": 196273.159860041,
                        "nonLpReserves": 870023.771631833
                    },
                    {
                        "timestamp": 1756082872056,
                        "utcDate": "2025-08-25",
                        "totalReserves": 1058483.30586121,
                        "lpReserves": 196204.494400437,
                        "nonLpReserves": 862278.81146077
                    },
                    {
                        "timestamp": 1756169104816,
                        "utcDate": "2025-08-26",
                        "totalReserves": 1049357.76402139,
                        "lpReserves": 196149.925394537,
                        "nonLpReserves": 853207.83862685
                    },
                    {
                        "timestamp": 1756255460655,
                        "utcDate": "2025-08-27",
                        "totalReserves": 1048194.2615605,
                        "lpReserves": 196057.350928804,
                        "nonLpReserves": 852136.910631699
                    },
                    {
                        "timestamp": 1756341815294,
                        "utcDate": "2025-08-28",
                        "totalReserves": 1048248.68797172,
                        "lpReserves": 196022.058420812,
                        "nonLpReserves": 852226.629550907
                    },
                    {
                        "timestamp": 1756428250734,
                        "utcDate": "2025-08-29",
                        "totalReserves": 1115680.00145889,
                        "lpReserves": 196103.085640281,
                        "nonLpReserves": 919576.915818612
                    },
                    {
                        "timestamp": 1756514503401,
                        "utcDate": "2025-08-30",
                        "totalReserves": 1115327.37502481,
                        "lpReserves": 195982.846505896,
                        "nonLpReserves": 919344.528518914
                    },
                    {
                        "timestamp": 1756601300364,
                        "utcDate": "2025-08-31",
                        "totalReserves": 1108010.91872688,
                        "lpReserves": 195851.433682841,
                        "nonLpReserves": 912159.485044034
                    },
                    {
                        "timestamp": 1756688094515,
                        "utcDate": "2025-09-01",
                        "totalReserves": 1107637.88952815,
                        "lpReserves": 195791.487800342,
                        "nonLpReserves": 911846.401727811
                    },
                    {
                        "timestamp": 1756773889632,
                        "utcDate": "2025-09-02",
                        "totalReserves": 1148020.12729501,
                        "lpReserves": 195782.839064396,
                        "nonLpReserves": 952237.288230612
                    },
                    {
                        "timestamp": 1756946547265,
                        "utcDate": "2025-09-04",
                        "totalReserves": 1135593.02660063,
                        "lpReserves": 195850.809696692,
                        "nonLpReserves": 939742.216903936
                    },
                    {
                        "timestamp": 1757032992472,
                        "utcDate": "2025-09-05",
                        "totalReserves": 1135755.21091444,
                        "lpReserves": 195897.671959527,
                        "nonLpReserves": 939857.538954916
                    },
                    {
                        "timestamp": 1757119291298,
                        "utcDate": "2025-09-06",
                        "totalReserves": 1169896.62214796,
                        "lpReserves": 394452.583382267,
                        "nonLpReserves": 775444.03876569
                    },
                    {
                        "timestamp": 1757206085360,
                        "utcDate": "2025-09-07",
                        "totalReserves": 1164872.35063691,
                        "lpReserves": 391828.449747569,
                        "nonLpReserves": 773043.90088934
                    },
                    {
                        "timestamp": 1757292358804,
                        "utcDate": "2025-09-08",
                        "totalReserves": 1163707.32288851,
                        "lpReserves": 391495.171189922,
                        "nonLpReserves": 772212.151698583
                    },
                    {
                        "timestamp": 1757378602654,
                        "utcDate": "2025-09-09",
                        "totalReserves": 1151451.66177569,
                        "lpReserves": 390964.70996479,
                        "nonLpReserves": 760486.951810898
                    },
                    {
                        "timestamp": 1757551397998,
                        "utcDate": "2025-09-11",
                        "totalReserves": 1145437.00456196,
                        "lpReserves": 391191.556768159,
                        "nonLpReserves": 754245.447793796
                    },
                    {
                        "timestamp": 1757637715136,
                        "utcDate": "2025-09-12",
                        "totalReserves": 1172964.95988625,
                        "lpReserves": 390170.053011518,
                        "nonLpReserves": 782794.906874735
                    },
                    {
                        "timestamp": 1757723996020,
                        "utcDate": "2025-09-13",
                        "totalReserves": 1167565.83201101,
                        "lpReserves": 392113.146808005,
                        "nonLpReserves": 775452.685203001
                    },
                    {
                        "timestamp": 1757810767545,
                        "utcDate": "2025-09-14",
                        "totalReserves": 1165480.99441276,
                        "lpReserves": 392381.997235921,
                        "nonLpReserves": 773098.997176837
                    },
                    {
                        "timestamp": 1757896994183,
                        "utcDate": "2025-09-15",
                        "totalReserves": 1162322.87724786,
                        "lpReserves": 392374.315057172,
                        "nonLpReserves": 769948.562190687
                    },
                    {
                        "timestamp": 1757983318414,
                        "utcDate": "2025-09-16",
                        "totalReserves": 1199472.54196423,
                        "lpReserves": 392893.817502319,
                        "nonLpReserves": 806578.724461914
                    },
                    {
                        "timestamp": 1758069724721,
                        "utcDate": "2025-09-17",
                        "totalReserves": 1196593.49676518,
                        "lpReserves": 392939.793479853,
                        "nonLpReserves": 803653.703285329
                    },
                    {
                        "timestamp": 1758156096087,
                        "utcDate": "2025-09-18",
                        "totalReserves": 1112288.36461436,
                        "lpReserves": 392475.895624432,
                        "nonLpReserves": 719812.468989933
                    }
                ]
            }
        )
        const part2 = [{"timestamp":1741566916092,"utcDate":"2025-03-10","totalReserves":208912.189036581,"lpReserves":0,"nonLpReserves":208912.189036581},{"timestamp":1741653697661,"utcDate":"2025-03-11","totalReserves":207162.337438408,"lpReserves":0,"nonLpReserves":207162.337438408},{"timestamp":1741740076210,"utcDate":"2025-03-12","totalReserves":206793.844287723,"lpReserves":0,"nonLpReserves":206793.844287723},{"timestamp":1741826519573,"utcDate":"2025-03-13","totalReserves":501045.448443378,"lpReserves":0,"nonLpReserves":501045.448443378},{"timestamp":1741912858379,"utcDate":"2025-03-14","totalReserves":577239.689972767,"lpReserves":0,"nonLpReserves":577239.689972767},{"timestamp":1741999255217,"utcDate":"2025-03-15","totalReserves":655051.120367896,"lpReserves":0,"nonLpReserves":655051.120367896},{"timestamp":1742085917348,"utcDate":"2025-03-16","totalReserves":655051.120367896,"lpReserves":0,"nonLpReserves":655051.120367896},{"timestamp":1742172209798,"utcDate":"2025-03-17","totalReserves":653870.846395294,"lpReserves":0,"nonLpReserves":653870.846395294},{"timestamp":1742258499125,"utcDate":"2025-03-18","totalReserves":929520.314107377,"lpReserves":0,"nonLpReserves":929520.314107377},{"timestamp":1742344929323,"utcDate":"2025-03-19","totalReserves":854739.578266273,"lpReserves":0,"nonLpReserves":854739.578266273},{"timestamp":1742431277851,"utcDate":"2025-03-20","totalReserves":844989.196987734,"lpReserves":0,"nonLpReserves":844989.196987734},{"timestamp":1742517752647,"utcDate":"2025-03-21","totalReserves":839607.345389561,"lpReserves":0,"nonLpReserves":839607.345389561},{"timestamp":1742604067825,"utcDate":"2025-03-22","totalReserves":827865.091096557,"lpReserves":0,"nonLpReserves":827865.091096557},{"timestamp":1742690747455,"utcDate":"2025-03-23","totalReserves":810205.415173466,"lpReserves":0,"nonLpReserves":810205.415173466},{"timestamp":1742777046978,"utcDate":"2025-03-24","totalReserves":806887.123137714,"lpReserves":0,"nonLpReserves":806887.123137714},{"timestamp":1742863372035,"utcDate":"2025-03-25","totalReserves":823904.411885664,"lpReserves":0,"nonLpReserves":823904.411885664},{"timestamp":1742949737797,"utcDate":"2025-03-26","totalReserves":779473.058243023,"lpReserves":0,"nonLpReserves":779473.058243023},{"timestamp":1743036134560,"utcDate":"2025-03-27","totalReserves":776200.976051242,"lpReserves":0,"nonLpReserves":776200.976051242},{"timestamp":1743122539942,"utcDate":"2025-03-28","totalReserves":776200.976051242,"lpReserves":0,"nonLpReserves":776200.976051242},{"timestamp":1743208922053,"utcDate":"2025-03-29","totalReserves":778305.076306172,"lpReserves":0,"nonLpReserves":778305.076306172},{"timestamp":1743295624477,"utcDate":"2025-03-30","totalReserves":774906.565092338,"lpReserves":0,"nonLpReserves":774906.565092338},{"timestamp":1743381940701,"utcDate":"2025-03-31","totalReserves":773006.428106036,"lpReserves":0,"nonLpReserves":773006.428106036},{"timestamp":1743468611052,"utcDate":"2025-04-01","totalReserves":881707.035090782,"lpReserves":0,"nonLpReserves":881707.035090782},{"timestamp":1743554595538,"utcDate":"2025-04-02","totalReserves":905481.292172572,"lpReserves":195467.779104286,"nonLpReserves":710013.513068286},{"timestamp":1743640948926,"utcDate":"2025-04-03","totalReserves":849630.269711655,"lpReserves":196442.741142448,"nonLpReserves":653187.528569207},{"timestamp":1743727351533,"utcDate":"2025-04-04","totalReserves":777092.782498905,"lpReserves":196410.899919508,"nonLpReserves":580681.882579397},{"timestamp":1743813712137,"utcDate":"2025-04-05","totalReserves":773132.171235091,"lpReserves":196401.853959097,"nonLpReserves":576730.317275994},{"timestamp":1743900390420,"utcDate":"2025-04-06","totalReserves":772538.49510397,"lpReserves":196521.218923866,"nonLpReserves":576017.276180103},{"timestamp":1743986675637,"utcDate":"2025-04-07","totalReserves":772193.225196466,"lpReserves":196572.113399924,"nonLpReserves":575621.111796542},{"timestamp":1744072949546,"utcDate":"2025-04-08","totalReserves":751019.650009495,"lpReserves":196528.91732019,"nonLpReserves":554490.732689304},{"timestamp":1744159374832,"utcDate":"2025-04-09","totalReserves":749765.086463643,"lpReserves":196461.309663188,"nonLpReserves":553303.776800455},{"timestamp":1744245772550,"utcDate":"2025-04-10","totalReserves":747684.388271206,"lpReserves":196520.724691885,"nonLpReserves":551163.663579321},{"timestamp":1744332208865,"utcDate":"2025-04-11","totalReserves":742099.724240145,"lpReserves":196513.42460864,"nonLpReserves":545586.299631505},{"timestamp":1744637064693,"utcDate":"2025-04-14","totalReserves":736537.092789022,"lpReserves":196461.790874412,"nonLpReserves":540075.30191461},{"timestamp":1744637064693,"utcDate":"2025-04-14","totalReserves":736537.092789022,"lpReserves":196461.790874412,"nonLpReserves":540075.30191461},{"timestamp":1744850639446,"utcDate":"2025-04-17","totalReserves":547578.266734576,"lpReserves":196360.805917435,"nonLpReserves":351217.460817141},{"timestamp":1744937011844,"utcDate":"2025-04-18","totalReserves":545539.689677933,"lpReserves":196405.108860792,"nonLpReserves":349134.580817141},{"timestamp":1745023314997,"utcDate":"2025-04-19","totalReserves":541455.412228216,"lpReserves":196392.881639386,"nonLpReserves":345062.530588831},{"timestamp":1745110141057,"utcDate":"2025-04-20","totalReserves":538634.451916786,"lpReserves":196432.460140741,"nonLpReserves":342201.991776045},{"timestamp":1745196430363,"utcDate":"2025-04-21","totalReserves":535844.643839789,"lpReserves":196418.049324018,"nonLpReserves":339426.594515771},{"timestamp":1745282668700,"utcDate":"2025-04-22","totalReserves":428265.18846829,"lpReserves":196431.306281286,"nonLpReserves":231833.882187004},{"timestamp":1745369055212,"utcDate":"2025-04-23","totalReserves":479620.640413072,"lpReserves":245923.448561301,"nonLpReserves":233697.191851771},{"timestamp":1745455461752,"utcDate":"2025-04-24","totalReserves":430142.624296676,"lpReserves":196445.432444906,"nonLpReserves":233697.191851771},{"timestamp":1745541874115,"utcDate":"2025-04-25","totalReserves":414627.463256025,"lpReserves":196478.011130282,"nonLpReserves":218149.452125743},{"timestamp":1745628205775,"utcDate":"2025-04-26","totalReserves":408078.827207282,"lpReserves":196500.623939987,"nonLpReserves":211578.203267296},{"timestamp":1745714927917,"utcDate":"2025-04-27","totalReserves":407730.013534494,"lpReserves":196485.234924732,"nonLpReserves":211244.778609762},{"timestamp":1745801223662,"utcDate":"2025-04-28","totalReserves":407718.910959013,"lpReserves":196474.132349252,"nonLpReserves":211244.778609762},{"timestamp":1745887474673,"utcDate":"2025-04-29","totalReserves":525893.623906064,"lpReserves":196484.380179409,"nonLpReserves":329409.243726655},{"timestamp":1745973909853,"utcDate":"2025-04-30","totalReserves":521906.278960583,"lpReserves":196478.449973156,"nonLpReserves":325427.828987427},{"timestamp":1746060723653,"utcDate":"2025-05-01","totalReserves":469286.703695987,"lpReserves":196527.740999329,"nonLpReserves":272758.962696658},{"timestamp":1746146708424,"utcDate":"2025-05-02","totalReserves":460666.766193937,"lpReserves":196541.469905248,"nonLpReserves":264125.296288689},{"timestamp":1746233043958,"utcDate":"2025-05-03","totalReserves":439567.606828845,"lpReserves":196570.268213899,"nonLpReserves":242997.338614946},{"timestamp":1746319889288,"utcDate":"2025-05-04","totalReserves":419593.385339074,"lpReserves":196593.890801427,"nonLpReserves":222999.494537647},{"timestamp":1746406153596,"utcDate":"2025-05-05","totalReserves":396170.814695947,"lpReserves":196523.892578162,"nonLpReserves":199646.922117785},{"timestamp":1746492329336,"utcDate":"2025-05-06","totalReserves":375032.584453003,"lpReserves":196608.69543865,"nonLpReserves":178423.889014353},{"timestamp":1746578733931,"utcDate":"2025-05-07","totalReserves":369433.704057155,"lpReserves":196603.621665684,"nonLpReserves":172830.082391471},{"timestamp":1746751557653,"utcDate":"2025-05-09","totalReserves":367176.812261876,"lpReserves":196609.238612522,"nonLpReserves":170567.573649354},{"timestamp":1746837810907,"utcDate":"2025-05-10","totalReserves":359268.404761929,"lpReserves":196569.630199333,"nonLpReserves":162698.774562596},{"timestamp":1746924611468,"utcDate":"2025-05-11","totalReserves":358871.631699773,"lpReserves":196629.185904301,"nonLpReserves":162242.445795473},{"timestamp":1747010986210,"utcDate":"2025-05-12","totalReserves":348008.613897564,"lpReserves":196577.460339534,"nonLpReserves":151431.15355803},{"timestamp":1747097188157,"utcDate":"2025-05-13","totalReserves":454218.488822309,"lpReserves":196506.966128046,"nonLpReserves":257711.522694263},{"timestamp":1747183540793,"utcDate":"2025-05-14","totalReserves":327544.875074307,"lpReserves":196547.033216011,"nonLpReserves":130997.841858296},{"timestamp":1747269921448,"utcDate":"2025-05-15","totalReserves":681862.263392743,"lpReserves":398241.254113928,"nonLpReserves":283621.009278815},{"timestamp":1747356409475,"utcDate":"2025-05-16","totalReserves":681855.522814443,"lpReserves":398205.969478018,"nonLpReserves":283649.553336425},{"timestamp":1747442685995,"utcDate":"2025-05-17","totalReserves":694901.527179463,"lpReserves":412041.069518096,"nonLpReserves":282860.457661367},{"timestamp":1747529478462,"utcDate":"2025-05-18","totalReserves":681154.654648802,"lpReserves":398579.574521253,"nonLpReserves":282575.080127549},{"timestamp":1747615799681,"utcDate":"2025-05-19","totalReserves":674062.649287959,"lpReserves":398312.301153322,"nonLpReserves":275750.348134637},{"timestamp":1747702085160,"utcDate":"2025-05-20","totalReserves":695792.901064592,"lpReserves":398279.526843155,"nonLpReserves":297513.374221438},{"timestamp":1747788416808,"utcDate":"2025-05-21","totalReserves":695640.923291775,"lpReserves":398100.692331916,"nonLpReserves":297540.230959858},{"timestamp":1747874756608,"utcDate":"2025-05-22","totalReserves":683207.383432147,"lpReserves":398320.006441149,"nonLpReserves":284887.376990998},{"timestamp":1747961172562,"utcDate":"2025-05-23","totalReserves":682811.1027666,"lpReserves":398295.760386244,"nonLpReserves":284515.342380356},{"timestamp":1748134344163,"utcDate":"2025-05-25","totalReserves":667630.65337901,"lpReserves":398141.680527644,"nonLpReserves":269488.972851366},{"timestamp":1748306718346,"utcDate":"2025-05-27","totalReserves":805222.755627518,"lpReserves":397944.919839691,"nonLpReserves":407277.835787827},{"timestamp":1748393203311,"utcDate":"2025-05-28","totalReserves":779787.249866686,"lpReserves":397521.074204177,"nonLpReserves":382266.175662509},{"timestamp":1748479627016,"utcDate":"2025-05-29","totalReserves":762851.241202054,"lpReserves":397799.596897753,"nonLpReserves":365051.644304301},{"timestamp":1748565995716,"utcDate":"2025-05-30","totalReserves":752835.979058711,"lpReserves":397452.69490485,"nonLpReserves":355383.28415386},{"timestamp":1748652298216,"utcDate":"2025-05-31","totalReserves":683268.308871601,"lpReserves":397461.746385193,"nonLpReserves":285806.562486408},{"timestamp":1748739520352,"utcDate":"2025-06-01","totalReserves":681902.650720319,"lpReserves":397562.46325311,"nonLpReserves":284340.187467209},{"timestamp":1748825441379,"utcDate":"2025-06-02","totalReserves":678815.876940603,"lpReserves":397708.92755265,"nonLpReserves":281106.949387953},{"timestamp":1748911701558,"utcDate":"2025-06-03","totalReserves":713410.402716284,"lpReserves":397683.877989825,"nonLpReserves":315726.524726459},{"timestamp":1748998089634,"utcDate":"2025-06-04","totalReserves":707020.771724262,"lpReserves":397766.631853645,"nonLpReserves":309254.139870617},{"timestamp":1749084421524,"utcDate":"2025-06-05","totalReserves":706628.815228484,"lpReserves":397847.230247191,"nonLpReserves":308781.584981293},{"timestamp":1749170806892,"utcDate":"2025-06-06","totalReserves":698803.030143279,"lpReserves":397812.701008181,"nonLpReserves":300990.329135098},{"timestamp":1749257195576,"utcDate":"2025-06-07","totalReserves":698878.104964234,"lpReserves":397858.713634599,"nonLpReserves":301019.391329634},{"timestamp":1749344019831,"utcDate":"2025-06-08","totalReserves":698984.324130408,"lpReserves":397935.69868642,"nonLpReserves":301048.625443988},{"timestamp":1749430303403,"utcDate":"2025-06-09","totalReserves":695451.051253526,"lpReserves":397904.790893092,"nonLpReserves":297546.260360434},{"timestamp":1749516450290,"utcDate":"2025-06-10","totalReserves":776166.177643033,"lpReserves":397849.950176313,"nonLpReserves":378316.227466719},{"timestamp":1749602891223,"utcDate":"2025-06-11","totalReserves":698948.722161723,"lpReserves":397744.454794476,"nonLpReserves":301204.267367246},{"timestamp":1749689266727,"utcDate":"2025-06-12","totalReserves":876613.613621132,"lpReserves":397941.554953637,"nonLpReserves":478672.058667495},{"timestamp":1749775664259,"utcDate":"2025-06-13","totalReserves":872836.152272691,"lpReserves":397493.578778228,"nonLpReserves":475342.573494463}]
        return res.status(200).json({
            "timestamp": 1758196772728,
            "snapshotsStart": "2025-06-15",
            "snapshotsEnd": "2025-09-18",
            "totalEvolution": [
                ...part2,
                ...archived.totalEvolution,
            ]
        });
        const cacheDuration = 180;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        // const { data: cachedData, isValid } = await getCacheFromRedisAsObj(stableReservesCacheKey, cacheFirst !== 'true', cacheDuration);
        // if (isValid && cachedData) {
        //     res.status(200).json(cachedData);
        //     return
        // }

        const twgs = MULTISIGS
            .filter(m => m.shortName.includes('TWG'))
            .reduce((prev, curr) => ({ ...prev, [curr.chainId]: curr.address }), {});

        // lp liquidity snapshots
        const lpRes = await fetch('https://www.inverse.finance/api/transparency/liquidity-snapshots?cacheFirst=true');
        const lpData = await lpRes.json();

        const lpHistory = lpData.entries.map((d, i) => {
            const nonFedLps = d.liquidity.filter(lp => lp.isStable && !lp.isFed);
            const ownedStableLpsTvl = nonFedLps.reduce((prev, curr) => prev + curr.ownedAmount, 0);
            const byChainId = nonFedLps.reduce((prev, curr) => ({ ...prev, [curr.chainId]: (prev[curr.chainId] || 0) + curr.ownedAmount }), {});
            return {
                timestamp: d.timestamp,
                utcDate: timestampToUTC(d.timestamp),
                ownedStableLpsTvl,
                byChainId,
            }
        })
            .filter(d => d.utcDate < archived.snapshotsStart)
            .slice(-90);

        const snapshotsStart = lpHistory[0].utcDate;
        const snapshotsEnd = lpHistory[lpHistory.length - 1].utcDate;

        console.log(snapshotsStart, snapshotsEnd);

        const { data: archivedTimeData } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS };

        const arbMultisigs = MULTISIGS.filter(m => m.chainId === NetworkIds.arbitrum).map(m => m.address);

        const chainIds = [
            NetworkIds.mainnet,
             NetworkIds.base, NetworkIds.optimism, NetworkIds.polygon, NetworkIds.arbitrum
            ];

        const chainStableBalancesResults = await Promise.all([
            getChainStableBalances(archivedTimeData, NetworkIds.mainnet, snapshotsStart, snapshotsEnd, TREASURY, twgs[NetworkIds.mainnet]),
            getChainStableBalances(archivedTimeData, NetworkIds.base, snapshotsStart, snapshotsEnd, twgs[NetworkIds.base]),
            getChainStableBalances(archivedTimeData, NetworkIds.optimism, snapshotsStart, snapshotsEnd, twgs[NetworkIds.optimism]),
            getChainStableBalances(archivedTimeData, NetworkIds.polygon, snapshotsStart, snapshotsEnd, twgs[NetworkIds.polygon]),
            getChainStableBalances(archivedTimeData, NetworkIds.arbitrum, snapshotsStart, snapshotsEnd, arbMultisigs[0], arbMultisigs[1]),
        ]);

        const flatChainStableBalancesResults = chainStableBalancesResults.flat();

        const resultData = {
            timestamp: Date.now(),
            snapshotsStart,
            snapshotsEnd,
            totalEvolution: lpHistory.map((d, i) => {
                const dayChainStableBalances = flatChainStableBalancesResults.filter(sb => sb.utcDate === d.utcDate);
                const nonLpReserves = dayChainStableBalances.reduce((prev, curr) => prev + curr.sum, 0);
                const stablesByChainId = chainStableBalancesResults.reduce((prev, curr, chainIdIndex) => ({ ...prev, [chainIds[chainIdIndex]]: curr }), {});
                return {
                    timestamp: d.timestamp,
                    utcDate: d.utcDate,
                    totalReserves: d.ownedStableLpsTvl + nonLpReserves,
                    lpReserves: d.ownedStableLpsTvl,
                    nonLpReserves,
                    stablesByChainId,
                    lpsByChainId: d.byChainId,
                }
            }),
        }

        // await redisSetWithTimestamp(stableReservesCacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(stableReservesCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
            return res.status(500);
        }
    }
}