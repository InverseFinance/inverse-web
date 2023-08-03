export const savePoaSig = async (account: string, sig: string) => {
    const res = await fetch(`/api/poa?address=${account}`, {
        method: 'POST',
        body: JSON.stringify({ sig }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
    if(res.status === 200) {
        localStorage.setItem(`poa-sign-${account}`, JSON.stringify(await res.json()));
    }
    return res;
}

export const checkPoaSig = async (account: string) => {
    const localCacheFirst = localStorage.getItem(`poa-sign-${account}`);
    if(localCacheFirst) {
        return JSON.parse(localCacheFirst);
    }
    const res = await fetch(`/api/poa?address=${account}`);
    return res.json();
}