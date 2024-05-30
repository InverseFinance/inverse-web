export const getSiloRates = async () => {
    const res = await fetch("https://gateway-arbitrum.network.thegraph.com/api/41d8e9d9c63d206f22b98602980156de/deployments/id/QmeDLbKHYypURMRigRxSspUm8w5zrDfXc3Skw2PiDxqCFu", {
        "headers": {
            "accept": "*/*",
            "content-type": "application/json",
        },
        "body": "{\"query\":\"    query QueryMarketInterestRates($siloAddress: String = \\\"0xfccc27aabd0ab7a0b2ad2b7760037b1eab61616b\\\") {      silo(id: $siloAddress, block: { number_gte: 19981874 }) {        id        name        rates {          side          token {            id            symbol          }          interestRateDaily(first: 1, orderBy: day, orderDirection: desc) {            rateAvg            day          }        }      }    }  \",\"operationName\":\"QueryMarketInterestRates\"}",
        "method": "POST",
    });
    const { data } = await res.json();
    return { borrowRate: data.silo.rates.find(r => r.side === 'BORROWER' && r.token.symbol === 'USDC').interestRateDaily[0].rateAvg }
}