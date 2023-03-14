const BASE_URL = 'https://api.livecoinwatch.com';

export const getTokenData = async (symbol: string, meta = false) => {
    try {
        const res = await fetch(`${BASE_URL}/coins/single`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': process.env.LCW_KEY,
            },
            body: JSON.stringify({
                "currency": "USD",
                "code": symbol,
                "meta": false
            }),
        });
        return await res.json();         
    } catch (e) {
        console.log(e);
        return { error: e };
    }
}