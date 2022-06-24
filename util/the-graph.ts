
export const getFromFrontierGraph = (query) => {
    return theGraphFetch(
        `https://gateway.thegraph.com/api/${process.env.GRAPH_KEY}/subgraphs/id/78kqSQgaXhtfypzCE1uoB6tTCdgynowp5574ADL6RQrS`,
        query,
    )
}

export const theGraphFetch = (apiEndpoint: string, query: string) => {
    return fetch(
        apiEndpoint,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        }
    ).then((response) => response.json())
}

export const getFrontierLiquidations = ({
    offset = 0, 
    size = 100,
    borrower = '',
}) => {
    return getFromFrontierGraph(`
    query {
        liquidationEvents (
            orderBy: blockTime
            orderDirection: desc
            first: ${size}
            skip: ${offset}
            where: { ${ !!borrower && `borrower: ${borrower}`} }
        ) {
            blocktime: blockTime
            borrower
            liquidator
            repaidCtoken: cToken
            seizedCtoken: seizeCToken
            underlyingRepayAmount
            underlyingSeizeAmount
        }
    }
    `
    )
}