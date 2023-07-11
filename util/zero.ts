const ZEROX_API_KEY = '83650ab8-607c-4eb5-97cb-ec9012df53d9';

export const get0xQuote = async (buyAd: string, sellAd: string, sellAmount: string, slippage = 0.04) => {
    const url = `https://api.0x.org/swap/v1/quote?buyToken=${buyAd.toLowerCase()}&sellToken=${sellAd.toLowerCase()}&sellAmount=${sellAmount}&slippagePercentage=${slippage}`;
    const response = await fetch(url, {
        headers: {
            '0x-api-key': ZEROX_API_KEY,
        },
    });
    return response.json();
}