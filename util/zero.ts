const PRICE_IMPACT_PROTECTION = 0.05;// 5%

export const get0xSellQuote = async (
    buyAd: string,
    sellAd: string,
    sellAmount: string,
    slippagePerc = '1',
    getPriceOnly = false,
    applyFees = true,
) => {
    const method = getPriceOnly ? 'price' : 'quote';    
    const slippage = parseFloat(slippagePerc) / 100;
    let url = `/api/f2/zerox-proxy?method=${method}&buyToken=${buyAd.toLowerCase()}&sellToken=${sellAd.toLowerCase()}&sellAmount=${sellAmount}&slippagePercentage=${slippage}&priceImpactProtectionPercentage=${PRICE_IMPACT_PROTECTION}`;
    const response = await fetch(url);
    return response.json();
}

export const get0xBuyQuote = async (buyAd: string, sellAd: string, buyAmount: string, slippagePerc = '1', getPriceOnly = false) => {
    const method = getPriceOnly ? 'price' : 'quote';
    const slippage = parseFloat(slippagePerc) / 100;
    const url = `/api/f2/zerox-proxy?method=${method}&buyToken=${buyAd.toLowerCase()}&sellToken=${sellAd.toLowerCase()}&buyAmount=${buyAmount}&slippagePercentage=${slippage}&priceImpactProtectionPercentage=${PRICE_IMPACT_PROTECTION}`;
    const response = await fetch(url);
    return response.json();
}