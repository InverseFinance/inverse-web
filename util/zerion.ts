import { NETWORKS } from "@app/config/networks";
import { PROTOCOL_IMAGES, TOKEN_IMAGES } from "@app/variables/images";
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";
import { isAddress } from "ethers/lib/utils";

const WALLET_ZERION_URL = 'https://api.zerion.io/v1/wallets';

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
    const cleanData = responseData.filter(p => p.attributes.name !== 'Inverse Lending');

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
        return {
            balance: totalValue,
            price: 1,
            onlyUsdValue: true,
            allowance: 0,
            token: {
                decimals: 18,
                name: item.attributes.name,
                symbol: item.attributes.name,
                image: TOKEN_IMAGES.DOLA,
                protocolImage: PROTOCOL_IMAGES[(item.attributes.protocol || '').toUpperCase()],
            }
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
            const chainTokens = CHAIN_TOKENS[NETWORKS.find(net => net.codename === chainCodeName)?.id] || {};
            const listedToken = getToken(chainTokens, address);
            const token = listedToken?.symbol ? listedToken : {         
                address,
                decimals: position.attributes.quantity?.decimals || 18,
                name: position.attributes.fungible_info.name || position.attributes.name,
                symbol: position.attributes.fungible_info.symbol || position.attributes.name,
                image: position.attributes.fungible_info?.icon?.url || TOKEN_IMAGES.DOLA,
                protocolImage: PROTOCOL_IMAGES[(position.attributes.protocol || '').toUpperCase()],
            }                        
            return {
                token,                
                balance: position.attributes?.quantity?.float || 0,
                price: position.attributes?.price,
                allowance: 0,
            };
        });    
    return [...walletPositions, ...nonWalletPositions];
}