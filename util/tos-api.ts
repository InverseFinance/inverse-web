export const saveTosSig = async (account: string, sig: string) => {
    const res = await fetch(`/api/tos?address=${account}`, {
        method: 'POST',
        body: JSON.stringify({ sig }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
    if(res.status === 200) {
        localStorage.setItem(`tos-sign-${account}`, JSON.stringify(await res.json()));
    }
    return res;
}

export const checkTosSig = async (account: string) => {
    const localCacheFirst = localStorage.getItem(`tos-sign-${account}`);
    if(localCacheFirst) {
        return JSON.parse(localCacheFirst);
    }
    const res = await fetch(`/api/tos?address=${account}`);
    return res.json();
}