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
    if(response.status !== 200) {
        console.log(response)
        return [];
    }
    const responseData = await response.json();    
    const data = responseData.data.map((position) => {
        const splitData = position.id.split('-');   
        let address = splitData[0];
        const chainCodeName = splitData[1].toLowerCase();
        if(!isAddress(address)) {
            address = position.attributes.fungible_info?.implementations.find(imp => imp.chain_id === chainCodeName)?.address;
        }        
        const chainTokens = CHAIN_TOKENS[NETWORKS.find(net => net.codename === chainCodeName)?.id] || {};
        const listedToken = getToken(chainTokens, address);
        const token = listedToken?.symbol ? listedToken : {
            address,
            decimals: position.attributes.quantity?.decimals||18,
            name: position.attributes.name,
            symbol: position.attributes.name,
            image: TOKEN_IMAGES.DOLA,
            protocolImage: PROTOCOL_IMAGES[(position.attributes.protocol||'').toUpperCase()],
        }
        return {
            token,
            balance: position.attributes?.quantity?.float||0,
            price: position.attributes?.price,
            allowance: 0,
        };
    });
    return data;
}