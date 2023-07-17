export const saveTosSig = async (account: string, sig: string) => {
    return fetch(`/api/tos?address=${account}`, {
        method: 'POST',
        body: JSON.stringify({ sig }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
}

export const checkTosSig = async (account: string) => {
    const res = await fetch(`/api/tos?address=${account}`);
    return res.json();
}