const baseUrl = `https://api.covalenthq.com/v1`

export const getTokenHolders = async (tokenAddress: string, pageSize = 1000, pageNumber = 0, chainId = process.env.NEXT_PUBLIC_CHAIN_ID) => {
    const path = `/${chainId}/tokens/${tokenAddress}/token_holders/?quote-currency=USD&page-number=${pageNumber}&page-size=${pageSize}&format=JSON&key=${process.env.COVALENT_API_KEY}`
    const res = await fetch(`${baseUrl}${path}`);

    return res.json();
}

export const getTransfers = async (contractAd: string, from: string, pageSize = 1000, pageNumber = 0, chainId: string) => {
    const path = `/${chainId}/address/${from}/transfers_v2/?quote-currency=USD&page-number=${pageNumber}&page-size=${pageSize}&format=JSON&contract-address=${contractAd}&key=${process.env.COVALENT_API_KEY}`
    const res = await fetch(`${baseUrl}${path}`);

    return res.json();
}

export const getLast100TxsOf = async (ad: string, chainId = process.env.NEXT_PUBLIC_CHAIN_ID) => {
    const _chainId = chainId === '31337' ? '1' : chainId
    const path = `/${_chainId}/address/${ad}/transactions_v3/?quote-currency=USD&page-number=0&format=JSON&key=${process.env.COVALENT_API_KEY}`
    const res = await fetch(`${baseUrl}${path}`);

    return res.json();
}

export const getTx = async (txHash: string, chainId = process.env.NEXT_PUBLIC_CHAIN_ID) => {
    const _chainId = chainId === '31337' ? '1' : chainId
    const path = `/${_chainId}/transaction_v2/${txHash}/?quote-currency=USD&format=JSON&key=${process.env.COVALENT_API_KEY}`
    const res = await fetch(`${baseUrl}${path}`);

    return res.json();
}