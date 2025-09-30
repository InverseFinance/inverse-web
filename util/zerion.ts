import { NETWORKS } from "@app/config/networks";
import { PROTOCOL_IMAGES, PROTOCOL_ZERION_MAPPING } from "@app/variables/images";
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";
import { isAddress } from "ethers/lib/utils";
import { uniqueBy } from "./misc";

const WALLET_ZERION_URL = 'https://api.zerion.io/v1/wallets';

const SOLIDLY_PROTOCOLS = ['AERODROME', 'VELODROME', 'THENA', 'RAMSES', 'SOLIDLIZARD'];

export const fetchZerionTransactionsWithRetry = async (
    wallet = '',
    chainCodeName = 'ethereum',
    maxRetries = 1,
    currentRetry = 0,
): Promise<Response | undefined> => {
    let response;
    const url = `${WALLET_ZERION_URL}/${wallet}/transactions/?currency=usd&page[size]=100&filter[operation_types]=receive&filter[chain_ids]=base&filter[trash]=only_non_trash&filter[chain_ids]=${chainCodeName}`;
    try {
        const bearer = btoa(`${process.env.ZERION_KEY}:`);
        response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${bearer}`,
                'accept': 'application/json',
            },
        });
    } catch (e) {
        console.log(e)
    }

    if (response?.status !== 200 && currentRetry < maxRetries) {
        await new Promise((r) => setTimeout(() => r(true), 1050));
        return await fetchZerionTransactionsWithRetry(wallet, chainCodeName, maxRetries, currentRetry + 1);
    };
    return await response.json();
}

export const fetchZerionWithRetry = async (
    wallet = '',
    chainCodeName = 'ethereum',
    maxRetries = 1,
    currentRetry = 0,
): Promise<Response | undefined> => {
    let response;
    const url = `${WALLET_ZERION_URL}/${wallet}/positions/?filter[positions]=no_filter&currency=usd&filter[chain_ids]=${chainCodeName}&filter[trash]=only_non_trash&sort=value`;
    try {
        const bearer = btoa(`${process.env.ZERION_KEY}:`);
        response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${bearer}`,
                'accept': 'application/json',
            },
        });
    } catch (e) {
        console.log(e)
    }

    if (response?.status !== 200 && currentRetry < maxRetries) {
        await new Promise((r) => setTimeout(() => r(true), 1050));
        return await fetchZerionWithRetry(wallet, chainCodeName, maxRetries, currentRetry + 1);
    };
    return formatZerionWalletResponse(response);
}

export const formatZerionWalletResponse = async (response) => {
    if (response.status !== 200) {
        console.log(response)
        return [];
    }
    const responseData = await response.json();

    // filter out Frontier
    const cleanData = responseData.data.filter(p => p.attributes.name !== 'Inverse Lending');

    const uniqueNonWalletsKeys = [
        ...new Set(
            cleanData
                .filter((position) => position.attributes?.position_type !== 'wallet')
                .map((position) => `${position.attributes.protocol}-${position.attributes.name}`)
        )
    ]

    const nonWalletPositions = uniqueNonWalletsKeys.map(key => {
        const item = cleanData.find((position) => `${position.attributes.protocol}-${position.attributes.name}` === key);
        const totalValue = cleanData.filter(r => `${r.attributes.protocol}-${r.attributes.name}` === key).reduce((prev, curr) => prev + curr.attributes.value, 0);
        const splitData = item.id.split('-');
        const isVeNft = item.attributes.position_type === 'locked' && SOLIDLY_PROTOCOLS.includes(item.attributes.protocol.toUpperCase());
        // let address = splitData[0];
        const chainCodeName = splitData[1].toLowerCase().replace('binance', 'binance-smart-chain');
        const chainTokens = CHAIN_TOKENS[NETWORKS.find(net => (net.zerionId || net.codename) === chainCodeName)?.id] || {};
        const veNftToken = getToken(chainTokens, `ve${item.attributes.fungible_info.symbol.replace('THE', 'THENA')}`);
        const firstToken = getToken(chainTokens, item.attributes.pool_address || item.attributes.fungible_info.symbol);
        const token = isVeNft && veNftToken?.symbol ? veNftToken : {
            decimals: 18,
            name: firstToken?.name || (item.attributes.name === 'Asset' ? item.attributes.fungible_info.name : item.attributes.name),
            symbol: firstToken?.symbol || (item.attributes.name === 'Asset' ? item.attributes.fungible_info.symbol : item.attributes.name),
            image: firstToken?.image,
            protocolImage: firstToken?.protocolImage || PROTOCOL_IMAGES[(PROTOCOL_ZERION_MAPPING[(item.attributes.protocol || '')]||'')],
            isStable: firstToken?.isStable,
            isLP: firstToken?.isLP,
            address: firstToken?.address,
        };
        return {
            balance: totalValue,
            price: 1,
            onlyUsdValue: true,
            allowance: 0,
            token,
            chainCodeName,
        }
    })

    const walletPositions = cleanData
        .filter(r => !uniqueNonWalletsKeys.includes(`${r.attributes.protocol}-${r.attributes.name}`))
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
                protocolImage: PROTOCOL_IMAGES[(PROTOCOL_ZERION_MAPPING[(position.attributes.protocol || '')]||'')],
            }
            return {
                token,
                balance: position.attributes?.quantity?.float || 0,
                price: position.attributes?.price,
                allowance: 0,
                chainCodeName,
            };
        });
    return uniqueBy(
        [...nonWalletPositions, ...walletPositions],
        (a, b) => a.chainCodeName === b.chainCodeName && (a.token.address === b.token.address || (a.token.symbol === b.token.symbol && a.protocolImage === b.protocolImage)),
    );
}