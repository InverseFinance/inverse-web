const baseUrl = `https://api.covalenthq.com/v1`

export const getTokenHolders = async (tokenAddress: string, pageSize = 1000, pageNumber = 0, chainId = process.env.NEXT_PUBLIC_CHAIN_ID) => {
    const path = `/${chainId}/tokens/${tokenAddress}/token_holders/?quote-currency=USD&page-number=${pageNumber}&page-size=${pageSize}&format=JSON&key=${process.env.COVALENT_API_KEY}`
    const res = await fetch(`${baseUrl}${path}`);

    return res.json();
}