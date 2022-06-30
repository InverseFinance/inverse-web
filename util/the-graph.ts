
export const getFromFrontierGraph = (query) => {
    return theGraphFetch(
        `https://gateway.thegraph.com/api/${process.env.GRAPH_KEY}/subgraphs/id/78kqSQgaXhtfypzCE1uoB6tTCdgynowp5574ADL6RQrS`,
        query,
    )
}

export const getFromGovernanceGraph = (query) => {
    return theGraphFetch(
        `https://gateway.thegraph.com/api/${process.env.GRAPH_KEY}/subgraphs/id/EDN34txo8wRceZvye8PkGANsSuf3XUQseG1eWrQiirma`,
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
            where: { ${ !!borrower ? `borrower: "${borrower}"` : '' } }
        ) {
            id
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

export const getGovProposals = ({
    offset = 0,
    size = 200,
}) => {
    return getFromGovernanceGraph(`
    query {        
        proposals {
            id
            proposalId
            description
            executed
            proposer {
                id
            }
            startBlock
            endBlock
            eta
            canceled
            queued
            calls {
                target {
                    id
                }
                value
                signature
                calldata
            }
            receipts {
                voter {
                    id
                }
                support {
                    support
                }
                weight
            }
            proposalCreated {
                timestamp
            }
            proposalExecuted {
                timestamp
            }
        }
        
    }
    `
    )
}
