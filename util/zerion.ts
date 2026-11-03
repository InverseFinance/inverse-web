import { NETWORKS } from "@app/config/networks";
import { PROTOCOL_IMAGES, PROTOCOL_ZERION_MAPPING, TOKEN_IMAGES } from "@app/variables/images";
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";
import { isAddress } from "ethers/lib/utils";
import { uniqueBy } from "./misc";
import { getNetwork } from "./networks";
import { getCacheFromRedisAsObj, getRedisClient, redisSetWithTimestamp } from "./redis";

const WALLET_ZERION_URL = 'https://api.zerion.io/v1/wallets';

// zerion plan: 3 requests per second and 2000 per day
// a single caller at a time sends requests (redis lock), started 500ms apart
const ZERION_LOCK_KEY = 'zerion-requests-lock';
const ZERION_REQUESTS_INTERVAL_MS = 500;
const ZERION_REQUEST_TIMEOUT_MS = 10000;
// a wallet is fetched at most every 30 minutes: ~20 wallets => less than 1000 requests per day
const ZERION_WALLET_REFRESH_MS = 1800000;
// no requests for a while when rate limited
const ZERION_COOLDOWN_MS = 300000;

const SOLIDLY_PROTOCOLS = ['AERODROME', 'VELODROME', 'THENA', 'RAMSES', 'SOLIDLIZARD'];

// usd prices of tokens zerion does not price yet, by lowercased address
type FallbackPrices = { [address: string]: number };

const ZERION_FALLBACK_PRICES: FallbackPrices = {
    // SwanUSD, minted 1:1 against USDS
    '0x9bf2b2f57a2968a0e81546ed50cbbbb7c9d6e05e': 1,
};

// fallback price when zerion has no price for the position's token
const getFallbackPrice = (position: any, fallbackPrices: FallbackPrices, address: string = position.id.split('-')[0]) => {
    return !position.attributes?.price ? fallbackPrices[address?.toLowerCase()] : undefined;
}

const getPositionValue = (position: any, fallbackPrices: FallbackPrices) => {
    const fallbackPrice = getFallbackPrice(position, fallbackPrices);
    return fallbackPrice ? (position.attributes.quantity?.float || 0) * fallbackPrice : position.attributes.value;
}

type ZerionWallet = { address: string, chainId: string | number };

const getWalletCacheKey = (wallet: ZerionWallet) => `zerion-positions-v1.0.0-${wallet.chainId}-${wallet.address.toLowerCase()}`;

// a single caller at a time sends zerion requests, the lock expires by itself
const acquireZerionLock = async (durationMs: number) => {
    try {
        return (await getRedisClient().set(ZERION_LOCK_KEY, 'refreshing', ['PX', durationMs], 'NX')) === 'OK';
    } catch (e) {
        console.log(e);
        return false;
    }
}

const setZerionCooldown = async () => {
    try {
        await getRedisClient().set(ZERION_LOCK_KEY, 'cooldown', ['PX', ZERION_COOLDOWN_MS]);
    } catch (e) {
        console.log(e);
    }
}

// positions is undefined if the request failed
const fetchZerionPositions = async (wallet: ZerionWallet): Promise<{ status: number, positions?: any[] }> => {
    const network = getNetwork(wallet.chainId);
    const url = `${WALLET_ZERION_URL}/${wallet.address}/positions/?filter[positions]=no_filter&currency=usd&filter[chain_ids]=${network.zerionId || network.codename}&filter[trash]=only_non_trash&sort=value`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ZERION_REQUEST_TIMEOUT_MS);
    try {
        const bearer = btoa(`${process.env.ZERION_KEY}:`);
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${bearer}`,
                'accept': 'application/json',
            },
            signal: controller.signal,
        });
        if (response.status !== 200) {
            console.log(`zerion error ${response.status} for ${wallet.address} on ${network.codename}`);
            return { status: response.status };
        }
        const { data } = await response.json();
        return { status: response.status, positions: Array.isArray(data) ? data : undefined };
    } catch (e) {
        console.log(e);
        return { status: 0 };
    } finally {
        clearTimeout(timeout);
    }
}

// undefined when zerion's data has an unexpected format
const tryFormatZerionPositions = (positions: any[], fallbackPrices: FallbackPrices) => {
    try {
        return formatZerionPositions(positions, fallbackPrices);
    } catch (e) {
        console.log(e);
        return undefined;
    }
}

// formatted positions of the wallets, from the last successful zerion response of each wallet
// the outdated wallets are refreshed within refreshTimeLimitMs if no other caller is refreshing (0: cache only)
export const getZerionWalletsFunds = async (
    wallets: ZerionWallet[],
    // added to ZERION_FALLBACK_PRICES, ex: prices computed onchain by the caller
    fallbackPrices: FallbackPrices = {},
    refreshTimeLimitMs = 0,
) => {
    const start = Date.now();
    const caches = await Promise.all(wallets.map(wallet => getCacheFromRedisAsObj(getWalletCacheKey(wallet), false)));
    // set for the wallets refreshed successfully
    const refreshedFunds: (any[] | undefined)[] = wallets.map(() => undefined);
    const outdatedIndexes = wallets.map((wallet, i) => i)
        .filter(i => !caches[i].timestamp || start - caches[i].timestamp > ZERION_WALLET_REFRESH_MS)
        // least recently fetched first
        .sort((a, b) => (caches[a].timestamp || 0) - (caches[b].timestamp || 0));

    if (refreshTimeLimitMs > 0 && !!process.env.ZERION_KEY && outdatedIndexes.length > 0 && await acquireZerionLock(refreshTimeLimitMs + ZERION_REQUEST_TIMEOUT_MS)) {
        let isBlocked = false;
        const requests: Promise<void>[] = [];
        for (const i of outdatedIndexes) {
            if (requests.length > 0) {
                await new Promise((r) => setTimeout(r, ZERION_REQUESTS_INTERVAL_MS));
            }
            if (isBlocked || Date.now() - start > refreshTimeLimitMs) {
                break;
            }
            const cacheKey = getWalletCacheKey(wallets[i]);
            requests.push(fetchZerionPositions(wallets[i]).then(async (result) => {
                // positions that cannot be formatted are a failure too
                const walletFunds = !!result.positions ? tryFormatZerionPositions(result.positions, fallbackPrices) : undefined;
                if (!!walletFunds) {
                    refreshedFunds[i] = walletFunds;
                    await redisSetWithTimestamp(cacheKey, { positions: result.positions, lastSuccess: Date.now() });
                } else if ([401, 403, 429].includes(result.status)) {
                    // rate limited or invalid key: stop, the wallet stays outdated
                    // the cooldown is shared by the environments using this redis, an invalid key only concerns its own
                    isBlocked = true;
                    if (result.status === 429) {
                        await setZerionCooldown();
                    }
                } else {
                    // the last successful positions are kept, the wallet is retried after the refresh interval
                    await redisSetWithTimestamp(cacheKey, { ...caches[i].data });
                }
            }));
        }
        await Promise.all(requests);
    }
    return refreshedFunds.map((walletFunds, i): any[] => walletFunds || tryFormatZerionPositions(caches[i].data?.positions || [], fallbackPrices) || []);
}

const isMorphoBlueLending = (position: any) => !!position && position.attributes.protocol === 'Morpho Blue' && position.attributes.name === 'Morpho Lending';

// the morpho blue positions of the market of the position
const getMorphoMarketPositions = (position: any, index: number, positions: any[]) => {
    // zerion's group_id connects the deposit and the loan of a market
    if (!!position.attributes.group_id) {
        return positions.filter(p => isMorphoBlueLending(p) && p.attributes.group_id === position.attributes.group_id);
    }
    // without group_id the loan is expected right after its collateral
    const isDeposit = position.attributes.position_type === 'deposit';
    const otherLeg = positions[isDeposit ? index + 1 : index - 1];
    const isOtherLeg = isMorphoBlueLending(otherLeg) && !otherLeg.attributes.group_id && otherLeg.attributes.position_type === (isDeposit ? 'loan' : 'deposit');
    return isOtherLeg ? [position, otherLeg] : [position];
}

// ex: sDOLA/FRAX for a borrower, DOLA supply for a lender
const getMorphoMarketLabel = (position: any, index: number, positions: any[]) => {
    const market = getMorphoMarketPositions(position, index, positions);
    const symbolsOf = (positionType: string) => [...new Set(market.filter(p => p.attributes.position_type === positionType).map(p => p.attributes.fungible_info.symbol))].join('+');
    const [collaterals, loans] = [symbolsOf('deposit'), symbolsOf('loan')];
    return !!collaterals && !!loans ? `${collaterals}/${loans}` : !!collaterals ? `${collaterals} supply` : !!loans ? `${loans} loan` : '';
}

// handle morpho non-unique protocol-name combination for pools, index is the position's index in positions
const getKeyName = (position: any, index: number, positions: any[]) => {
    try {
        if (isMorphoBlueLending(position)) {
            const marketLabel = getMorphoMarketLabel(position, index, positions);
            if (!!marketLabel) {
                return `${position.attributes.protocol}-${marketLabel}`.replace('FRAX', 'frxUSD');
            }
        }
    } catch (e) { }
    return `${position.attributes.protocol}-${position.attributes.name}`;
}

export const formatZerionPositions = (positions: any[], fallbackPrices: FallbackPrices = {}) => {
    const _fallbackPrices = { ...ZERION_FALLBACK_PRICES, ...fallbackPrices };

    // filter out Frontier
    const cleanData = positions.filter(p => p.attributes.name !== 'Inverse Lending');
    // with the index in cleanData: the morpho keys depend on the other positions
    const keys = cleanData.map((position, index) => getKeyName(position, index, cleanData));

    const uniqueNonWalletsKeys = [
        ...new Set(
            keys.filter((key, index) => cleanData[index].attributes?.position_type !== 'wallet')
        )
    ]

    const nonWalletPositions = uniqueNonWalletsKeys.map(key => {
        const keyPositions = cleanData.filter((r, index) => keys[index] === key);
        // a morpho market is described by its collateral, whatever the order
        const item = keyPositions.find(p => isMorphoBlueLending(p) && p.attributes.position_type === 'deposit') || keyPositions[0];
        const totalValue = keyPositions
            .reduce((prev, curr) => prev + (curr.attributes.position_type === 'loan' ? -getPositionValue(curr, _fallbackPrices) : getPositionValue(curr, _fallbackPrices)), 0);
        const splitData = item.id.split('-');
        const isVeNft = item.attributes.position_type === 'locked' && SOLIDLY_PROTOCOLS.includes(item.attributes.protocol.toUpperCase());
        // let address = splitData[0];
        const isMorphoCase = item.attributes.name === 'Morpho Lending';
        // ex: sDOLA/frxUSD, the symbols can contain dashes (pendle PTs)
        const morphoMarket = isMorphoCase ? key.slice(`${item.attributes.protocol}-`.length) : '';
        const morphoFirstSymbol = morphoMarket.replace(/ (supply|loan)$/, '').split(/[/+]/)[0];
        const chainCodeName = splitData[1].toLowerCase().replace('binance', 'binance-smart-chain');
        const chainTokens = CHAIN_TOKENS[NETWORKS.find(net => (net.zerionId || net.codename) === chainCodeName)?.id] || {};
        const veNftToken = getToken(chainTokens, `ve${item.attributes.fungible_info.symbol.replace('THE', 'THENA')}`);
        const exactToken = getToken(chainTokens, item.attributes.pool_address) || {};
        const firstToken = getToken(chainTokens, isMorphoCase ? morphoFirstSymbol : item.attributes.pool_address || item.attributes.fungible_info.symbol) || {};
        const symbolToken = getToken(chainTokens, item.attributes.fungible_info.symbol);

        const isStable = item.attributes.protocol?.toLowerCase()?.includes('llamalend') ? true : !!exactToken?.symbol ? exactToken.isStable :
            !!firstToken?.isStable
            || key.includes('sDOLA') || key.includes('invUSD')
            || (!!symbolToken?.isStable && symbolToken.symbol === 'DOLA' && !/(INV|DBR|ETH)/g.test(item.attributes.name) && Math.abs(1 - item.attributes.price) <= 0.005)
            || ((key.includes('DOLA') || key.includes('USDC')) && Math.abs(1 - item.attributes.price) <= 0.01)
        const token = isVeNft && veNftToken?.symbol ? veNftToken : {
            decimals: 18,
            name: isMorphoCase ? morphoMarket : exactToken?.name || (item.attributes.name === 'Asset' ? item.attributes.fungible_info.name : item.attributes.name),
            symbol: isMorphoCase ? morphoMarket : exactToken?.symbol || (item.attributes.name === 'Asset' ? item.attributes.fungible_info.symbol : item.attributes.name),
            image: firstToken?.image,
            protocolImage: firstToken?.protocolImage || PROTOCOL_IMAGES[(PROTOCOL_ZERION_MAPPING[(item.attributes.protocol || '')] || '')],
            isStable: isStable,
            isLP: exactToken?.isLP,
            address: isMorphoCase ? null : item.attributes.pool_address,
            _price: item.attributes.price,
            // locked in a listed veNft contract not covered by isVeNft (ex: sAERO), a veNftId puts the fund in the veNFTs category
            veNftId: item.attributes.position_type === 'locked' ? (exactToken?.veNftId || exactToken?.veNftIds?.join(', ')) : undefined,
        };
        if(!token.image){
            if(token.name.toLowerCase().includes('sdola')) token.image = TOKEN_IMAGES.SDOLA;
            else if(token.name.toLowerCase().includes('dola')) token.image = TOKEN_IMAGES.DOLA;
            else if(token.name.toLowerCase().includes('invusd')) token.image = TOKEN_IMAGES.invUSD;
            else if(token.name.toLowerCase().includes('usdc')) token.image = TOKEN_IMAGES.USDC;
        }
        // for uniswap pools for example
        const nftId = token.symbol.match(/#(\d+)/)?.[1];
        return {
            balance: totalValue,
            price: 1,
            onlyUsdValue: true,
            allowance: 0,
            token,
            chainCodeName,
            key,
            nftId,
        }
    })

    const walletPositions = cleanData
        .filter((r, index) => !uniqueNonWalletsKeys.includes(keys[index]))
        .map((position) => {
            const splitData = position.id.split('-');
            let address = splitData[0];
            const chainCodeName = splitData[1].toLowerCase();
            if (!isAddress(address)) {
                address = position.attributes.fungible_info?.implementations.find(imp => imp.chain_id === chainCodeName)?.address;
            }
            const chainTokens = CHAIN_TOKENS[NETWORKS.find(net => (net.zerionId || net.codename) === chainCodeName)?.id] || {};
            const listedToken = getToken(chainTokens, address);

            const token = listedToken?.symbol ? listedToken : {
                address,
                decimals: position.attributes.quantity?.decimals || 18,
                name: position.attributes.name === 'Asset' ? position.attributes.fungible_info.name : position.attributes.name,
                symbol: position.attributes.name === 'Asset' ? position.attributes.fungible_info.symbol : position.attributes.name,
                image: position.attributes.fungible_info?.icon?.url,
                protocolImage: PROTOCOL_IMAGES[(PROTOCOL_ZERION_MAPPING[(position.attributes.protocol || '')] || '')],
            }

            return {
                token,
                balance: position.attributes?.quantity?.float || 0,
                price: getFallbackPrice(position, _fallbackPrices, address) || position.attributes?.price,
                allowance: 0,
                chainCodeName,
            };
        });

    return uniqueBy(
        [...nonWalletPositions, ...walletPositions],
        // Note: uniswap v4 lps have the same "pool" address (the NFT address), need to check nftId too
        (a, b) => a.chainCodeName === b.chainCodeName
            && (
                (!!a.token.address && !!b.token.address && a.token.address.toLowerCase() === b.token.address.toLowerCase() && a.nftId === b.nftId)
                ||
                (a.token.symbol === b.token.symbol && a.protocolImage === b.protocolImage)
            ),
    );
}
