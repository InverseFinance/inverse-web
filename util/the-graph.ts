import { GovEra } from "@app/types"

export const getFromFrontierGraph = (query) => {
    return theGraphFetch(
        `https://gateway.thegraph.com/api/${process.env.GRAPH_KEY}/subgraphs/id/78kqSQgaXhtfypzCE1uoB6tTCdgynowp5574ADL6RQrS`,
        query,
    )
}

export const getFromGovernanceGraph = (query) => {
    return theGraphFetch(        
        `https://gateway.thegraph.com/api/${process.env.GRAPH_KEY}/deployments/id/QmV39tQSf3W6gd9TM3M1jWvqLcYoTz2tUi4ZVAsUpq7uYd`,
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
            where: { ${!!borrower ? `borrower: "${borrower}"` : ''} }
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
    afterProposalId,
}: { offset?: number, size: number, afterProposalId?: number }) => {
    return getFromGovernanceGraph(`
    query {        
        proposals(
            first: ${size}            
            skip: ${offset}
            where: { ${!!afterProposalId ? `proposalId_gt: "${afterProposalId}"` : ''} }
            ) {
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
                id
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

export const getFirmLiquidations = ({
    offset = 0,
    size = 100,
    borrower = '',
}) => {
    return getFromGovernanceGraph(`
    query {        
        liquidates (
            orderBy: timestamp
            orderDirection: desc
            first: ${size}
            skip: ${offset}
            where: { ${!!borrower ? `borrower: "${borrower}"` : ''} }
        ) {
            transaction {
              id
            }
            timestamp
            account {
              id
            }
            repaidDebt
            liquidatorReward
            liquidator {
              id
            }
            market {
              id
            }
        }
    }
    `
    )
}
