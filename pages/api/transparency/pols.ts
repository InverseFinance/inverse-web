import { Contract } from 'ethers'
import 'source-map-support'
import { ERC20_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Multisig, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { fedOverviewCacheKey } from './fed-overview';

export default async function handler(req, res) {

    const { TREASURY, MULTISIGS, OP_BOND_MANAGER } = getNetworkConfigConstants(NetworkIds.mainnet);
    const cacheKey = `pols-v1.0.0`;

    try {

        const validCache = await getCacheFromRedis(cacheKey, true, 300);
        // if (validCache) {
        //     res.status(200).json(validCache);
        //     return
        // }
        
        const fedsOverviewCache = await getCacheFromRedis(fedOverviewCacheKey, false);

        const multisigsToShow = MULTISIGS;
        // POL
        const lps = [
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.mainnet]).filter(({ isLP }) => isLP)
                .map(({ address }) => ({ address, chainId: NetworkIds.mainnet })),
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.ftm]).filter(({ isLP }) => isLP)
                .map(({ address }) => ({ address, chainId: NetworkIds.ftm })),
        ]

        const chainTWG: { [key: string]: Multisig } = {
            [NetworkIds.mainnet]: multisigsToShow.find(m => m.shortName === 'TWG')!,
            [NetworkIds.ftm]: multisigsToShow.find(m => m.shortName === 'TWG on FTM')!,
            [NetworkIds.optimism]: multisigsToShow.find(m => m.shortName === 'TWG on OP')!,
            [NetworkIds.bsc]: multisigsToShow.find(m => m.shortName === 'TWG on BSC')!,
        }

        const fedPols = fedsOverviewCache?.fedOverviews || [];

        const getPol = async (lp: { address: string, chainId: string }) => {            
            const fedPol = fedPols.find(f => {                
                return f?.strategy?.pools?.[0]?.address === lp.address
            });
            if (fedPol) {
                const totalSupply = fedPol.subBalances.reduce((prev, curr) => prev+curr.balance, 0);
                const dolaPart = fedPol.subBalances.find(d => d.symbol === 'DOLA');
                return {
                    ...lp,
                    totalSupply,
                    ownedAmount: fedPol.supply,
                    perc: fedPol.supply / totalSupply,
                    dolaBalance: dolaPart.balance,
                    dolaWeight: dolaPart.perc,
                }
            }
            const provider = getProvider(lp.chainId);
            const contract = new Contract(lp.address, ERC20_ABI, provider);
            const totalSupply = getBnToNumber(await contract.totalSupply());

            const owned: { [key: string]: number } = {};
            owned.twg = getBnToNumber(await contract.balanceOf(chainTWG[lp.chainId].address));
            if (lp.chainId === NetworkIds.mainnet) {
                owned.bondsManager = getBnToNumber(await contract.balanceOf(OP_BOND_MANAGER));
                owned.treasuryContract = getBnToNumber(await contract.balanceOf(TREASURY));
            }
            const ownedAmount: number = Object.values(owned).reduce((prev, curr) => prev + curr, 0);
            const perc = ownedAmount / totalSupply * 100;
            return { totalSupply, ownedAmount, perc, ...lp, owned };
        }

        const pols = (await Promise.all([
            ...lps.map(lp => getPol(lp))
        ]))        

        const resultData = {
            timestamp: +(new Date()),
            pols,
        }
        // await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
        }
    }
}