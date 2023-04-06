const baseUrl = 'https://api.zapper.xyz'

export const getZapperApps = async (accounts: string[]) => {
    const path = `/v2/balances/apps?addresses%5B%5D=${accounts.join(',')}&networks%5B%5D=ethereum`
    const res = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
            'accept': "*/*",
            'Authorization': `Basic ${Buffer.from(`${process.env.ZAPPER_KEY}:`, "binary").toString("base64")}`,            
        },
    });

    return await res.json();
}

export const formatAndFilterZapperData = (data, APP_GROUPS) => {
    let appGroupPositions = [];
    return data
      .forEach(app => {
        app.products.filter(
          product => !!product.assets
            .find(a => APP_GROUPS.includes(`${app.appId}+${a.groupId}`))
        ).forEach(
          product => {
            appGroupPositions = appGroupPositions.concat(
              product.assets.filter(a => APP_GROUPS.includes(`${app.appId}+${a.groupId}`))
                .map(a => {
                  return {
                    updatedAt: app.updatedAt,
                    timestamp: +(new Date(app.updatedAt)),
                    appGroup: `${app.appId}+${a.groupId}`,
                    tokens: a.tokens,
                    balanceUSD: a.balanceUSD,
                    address: a.address,
                  }
                })
            )
          })
      })
}

const pointsUrl = 'https://api.zapper.xyz/v1/api-clients/points';