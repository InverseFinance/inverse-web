const ZEROX_API_KEY = '83650ab8-607c-4eb5-97cb-ec9012df53d9';

export const get0xQuote = async (buyAd: string, sellAd: string, sellAmount: string) => {
    const url = `https://api.0x.org/swap/v1/quote?buyToken=${buyAd}&sellToken=${sellAd}&sellAmount=${sellAmount}`;
    const response = await fetch(url, {
        headers: {
            '0x-api-key': ZEROX_API_KEY,
        },
    });
    return response.json();
}