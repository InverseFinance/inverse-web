const baseUrl = 'https://api.zapper.xyz'

export const getZapperApps = async (account: string) => {
    const path = `/v2/balances/apps?addresses%5B%5D=${account}&networks%5B%5D=ethereum`
    const res = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
            'accept': "*/*",
            'Authorization': `Basic ${Buffer.from(`${process.env.ZAPPER_KEY}:`, "binary").toString("base64")}`,            
        },
    });

    return await res.json();
}

const pointsUrl = 'https://api.zapper.xyz/v1/api-clients/points';