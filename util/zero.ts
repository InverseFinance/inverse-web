const ZEROX_API_KEY = '83650ab8-607c-4eb5-97cb-ec9012df53d9';

export const get0xSellQuote = async (buyAd: string, sellAd: string, sellAmount: string, slippagePerc = '1', getPriceOnly = false) => {
    const method = getPriceOnly ? 'price' : 'quote';
    const slippage = parseFloat(slippagePerc) / 100;
    const url = `https://api.0x.org/swap/v1/${method}?buyToken=${buyAd.toLowerCase()}&sellToken=${sellAd.toLowerCase()}&sellAmount=${sellAmount}&slippagePercentage=${slippage}`;
    const response = await fetch(url, {
        headers: {
            '0x-api-key': ZEROX_API_KEY,
        },
    });
    return response.json();
}

export const get0xBuyQuote = async (buyAd: string, sellAd: string, buyAmount: string, slippagePerc = '1', getPriceOnly = false) => {
    const method = getPriceOnly ? 'price' : 'quote';
    const slippage = parseFloat(slippagePerc) / 100;
    const url = `https://api.0x.org/swap/v1/${method}?buyToken=${buyAd.toLowerCase()}&sellToken=${sellAd.toLowerCase()}&buyAmount=${buyAmount}&slippagePercentage=${slippage}`;
    const response = await fetch(url, {
        headers: {
            '0x-api-key': ZEROX_API_KEY,
        },
    });
    return response.json();
}