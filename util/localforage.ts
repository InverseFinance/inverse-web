// localforage checks the global localStorage as soon as it is loaded, which Node 25+ warns about on the server
// ("localStorage is not available because --localstorage-file was not provided"):
// it is only loaded in the browser, on first use. Server side there is no storage, reads give null and writes do nothing.
type LocalForageInstance = typeof import('localforage');

let localforageInstance: Promise<LocalForageInstance | null> | undefined;

const getLocalforage = () => {
    if (!localforageInstance) {
        localforageInstance = typeof window === 'undefined' ?
            Promise.resolve(null)
            : import('localforage').then(m => m.default);
    }
    return localforageInstance;
}

export const localforage = {
    getItem: async <T>(key: string): Promise<T | null> => {
        const storage = await getLocalforage();
        return storage ? storage.getItem<T>(key) : null;
    },
    setItem: async <T>(key: string, value: T): Promise<T | undefined> => {
        const storage = await getLocalforage();
        return storage ? storage.setItem<T>(key, value) : undefined;
    },
    removeItem: async (key: string): Promise<void> => {
        const storage = await getLocalforage();
        if (storage) {
            await storage.removeItem(key);
        }
    },
}
