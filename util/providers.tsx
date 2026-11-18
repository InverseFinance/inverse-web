import { InfuraProvider, JsonRpcProvider, FallbackProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { NetworkIds } from '@app/types';
import { getRandomFromStringList } from './misc';
import { Contract } from "ethers";
import { AbiCoder, ConnectionInfo, Logger } from "ethers/lib/utils";

const ALCHEMY_BASE_URLS = {
    [NetworkIds.optimism]: `https://opt-mainnet.g.alchemy.com/v2`,
    [NetworkIds.base]: `https://base-mainnet.g.alchemy.com/v2`,
    [NetworkIds.arbitrum]: `https://arb-mainnet.g.alchemy.com/v2`,
    [NetworkIds.polygon]: `https://polygon-mainnet.g.alchemy.com/v2`,
    [NetworkIds.avalanche]: `https://avax-mainnet.g.alchemy.com/v2`,
    [NetworkIds.bsc]: `https://bnb-mainnet.g.alchemy.com/v2`,
    [NetworkIds.mainnet]: `https://eth-mainnet.g.alchemy.com/v2`,
    [NetworkIds.blast]: `https://blast-mainnet.g.alchemy.com/v2`,
    [NetworkIds.mode]: `https://mode-mainnet.g.alchemy.com/v2`,
}

// dRPC network names of the Alchemy chains, dRPC is the fallback when Alchemy is down or rate limited
const DRPC_NETWORKS = {
    [NetworkIds.optimism]: 'optimism',
    [NetworkIds.base]: 'base',
    [NetworkIds.arbitrum]: 'arbitrum',
    [NetworkIds.polygon]: 'polygon',
    [NetworkIds.avalanche]: 'avalanche',
    [NetworkIds.bsc]: 'bsc',
    [NetworkIds.mainnet]: 'ethereum',
    [NetworkIds.blast]: 'blast',
    [NetworkIds.mode]: 'mode',
}

// time given to Alchemy before using the fallback
const MAIN_RPC_TIMEOUT_MS = 10000;
// time given to dRPC: most api functions run for 60s max, they can still answer (ex: from their cache) when both rpcs fail
const FALLBACK_TIMEOUT_MS = 40000;
// retries of a rate limited request before using the fallback
const RATE_LIMIT_RETRIES = 1;
// once unavailable, an Alchemy url (chain and key) is skipped for this time, its requests going to dRPC directly
const MAIN_RPC_PAUSE_MS = 60000;
// http statuses of an unavailable rpc: bad key, rate limit (after the retries), outage
const UNAVAILABLE_HTTP_STATUSES = [401, 403, 429];
// json-rpc errors worth trying on the fallback (rate limits, internal errors), the others are answers, ex: reverts
const FALLBACK_RPC_ERROR_CODES = [429, -32005, -32603];
// a transaction is never sent to the fallback
const NO_FALLBACK_METHODS = ['eth_sendRawTransaction', 'eth_sendTransaction'];
const FALLBACK_LOG_INTERVAL_MS = 60000;
const lastFallbackLogs: { [chainId: string]: number } = {};
// by Alchemy url, in memory only: the url contains the Alchemy key
const mainRpcPausedUntil: { [url: string]: number } = {};

// the request got no answer from the node: no response, timeout, http error (bad key, rate limit, outage), invalid json,
// json-rpc rate limit or internal error; other errors are answers to the request, ex: a revert or a 400 for a too large getLogs
const isUnavailableError = (error: any) => {
    if (error?.code === Logger.errors.TIMEOUT) {
        return true;
    }
    if (error?.code !== Logger.errors.SERVER_ERROR) {
        return false;
    }
    switch (error.reason) {
        case 'missing response':
        case 'failed response':
            return true;
        case 'bad response':
            return UNAVAILABLE_HTTP_STATUSES.includes(error.status) || error.status >= 500;
        case 'processing response error':
            // invalid json, or a json-rpc error returned by the node
            return (error.error?.code === Logger.errors.SERVER_ERROR && error.error?.reason === 'invalid JSON')
                || FALLBACK_RPC_ERROR_CODES.includes(error.error?.code);
        default:
            return false;
    }
}

// at most one log per minute per chain, without the url: it contains the Alchemy key
const logFallback = (chainId: string, method: string, error: any) => {
    const now = Date.now();
    if (now - (lastFallbackLogs[chainId] || 0) < FALLBACK_LOG_INTERVAL_MS) {
        return;
    }
    lastFallbackLogs[chainId] = now;
    const reason = error.status ? `http ${error.status}` : typeof error.error?.code === 'number' ? `rpc error ${error.error.code}` : error.error?.reason || error.reason || error.code;
    console.warn(`[rpc] Alchemy unavailable on chain ${chainId} (${reason}), using dRPC for ${MAIN_RPC_PAUSE_MS / 1000}s, first request: ${method}`);
}

// json-rpc provider on a fixed network (no eth_chainId requests to detect it), sending a request to a fallback rpc
// when the main rpc does not answer it, the main rpc is then skipped for a while
export class JsonRpcProviderWithFallback extends StaticJsonRpcProvider {
    readonly fallback: JsonRpcProvider;
    readonly chainId: string;

    constructor(chainId: string, connection: ConnectionInfo, fallback: JsonRpcProvider) {
        super(connection, Number(chainId));
        this.chainId = chainId;
        this.fallback = fallback;
    }

    async send(method: string, params: Array<any>): Promise<any> {
        const canUseFallback = !NO_FALLBACK_METHODS.includes(method);
        if (canUseFallback && Date.now() < (mainRpcPausedUntil[this.connection.url] || 0)) {
            return this.fallback.send(method, params);
        }
        try {
            return await super.send(method, params);
        } catch (error: any) {
            if (!canUseFallback || !isUnavailableError(error)) {
                throw error;
            }
            mainRpcPausedUntil[this.connection.url] = Date.now() + MAIN_RPC_PAUSE_MS;
            logFallback(this.chainId, method, error);
            return this.fallback.send(method, params);
        }
    }
}

// Alchemy rpc with dRPC as fallback, only server side: the dRPC key is not public
const getAlchemyProvider = (chainId: string, alchemyKey: string, withFallback = true) => {
    const alchemyUrl = `${ALCHEMY_BASE_URLS[chainId as keyof typeof ALCHEMY_BASE_URLS]}/${alchemyKey}`;
    const drpcNetwork = DRPC_NETWORKS[chainId as keyof typeof DRPC_NETWORKS];
    if (!withFallback || !drpcNetwork || !process.env.DRPC_KEY) {
        return new JsonRpcProvider(alchemyUrl);
    }
    const fallback = new StaticJsonRpcProvider({
        url: `https://lb.drpc.org/ogrpc?network=${drpcNetwork}`,
        // the key in a header rather than in the url: urls end up in error messages
        headers: { 'Drpc-Key': process.env.DRPC_KEY },
        timeout: FALLBACK_TIMEOUT_MS,
    }, Number(chainId));
    return new JsonRpcProviderWithFallback(chainId, {
        url: alchemyUrl,
        timeout: MAIN_RPC_TIMEOUT_MS,
        // a few retries of a rate limited request, then the fallback
        throttleCallback: async (attempt: number) => attempt < RATE_LIMIT_RETRIES,
    }, fallback);
}

export const getProvider = (chainId: string | number, specificAlchemyKey?: string, onlyAlchemy = false): FallbackProvider | JsonRpcProvider => {
    if (chainId === '31337') {
        return new JsonRpcProvider('http://127.0.0.1:8545/');
    }
    else if (chainId === NetworkIds.ftm && !specificAlchemyKey) {
        return new JsonRpcProvider('https://1rpc.io/ftm');
    }
    // else if (chainId === NetworkIds.optimism && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://mainnet.optimism.io');
    // }
    // else if (chainId === NetworkIds.bsc && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://bsc-dataseed3.binance.org');
    // }
    // else if (chainId === NetworkIds.arbitrum && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    // }
    // else if (chainId === NetworkIds.polygon && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://polygon-rpc.com');
    // }
    // else if (chainId === NetworkIds.avalanche && !specificAlchemyKey) {
    //     // return new JsonRpcProvider('https://rpc.ankr.com/avalanche');
    //     return new JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc');
    //     // return new JsonRpcProvider('https://avalanche.drpc.org');
    // }
    // else if (chainId === NetworkIds.base && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://mainnet.base.org');
    // }
    // else if (chainId === NetworkIds.blast && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://rpc.blast.io');
    // }
    // else if (chainId === NetworkIds.mode && !specificAlchemyKey) {
    //     return new JsonRpcProvider('https://mainnet.mode.network');
    // }

    // onlyAlchemy: without the dRPC fallback
    return getAlchemyProvider(String(chainId), specificAlchemyKey || getRandomFromStringList(process.env.ALCHEMY_KEYS!), !onlyAlchemy);
}

export const getPaidProvider = (chainId: string | number) => {
    //if (chainId?.toString() === NetworkIds.mainnet || chainId?.toString() === NetworkIds.sepolia) {
      //return new InfuraProvider(Number(chainId), getRandomFromStringList(process.env.INFURA_KEYS!));
      //}
    return getProvider(chainId);
}

export const getCallForFunction = (contract: Contract, functionName: string, args: any[]) => {
    const functionSignature = contract.interface.getSighash(functionName);
    const functionInputTypes = contract.interface.fragments
        .find(f => f.name === functionName && f.type === 'function')?.inputs.map(i => i.type) || [];
    const callData = (new AbiCoder().encode(functionInputTypes, args)).replace('0x', '');
    return {
        to: contract.address,
        data: functionSignature + callData,
    };
}

/** provider needs to support historical data, example: AlchemyProvider */
export const getHistoricValue = (contract: Contract, block: number, functionName: string, args: any[]) => {
    return contract.provider.call(getCallForFunction(contract, functionName, args), block);
}

export const getHistoricalProvider = (chainId: string) => {
    if(!!ALCHEMY_BASE_URLS[chainId as keyof typeof ALCHEMY_BASE_URLS]){
        return getAlchemyProvider(chainId, process.env.OP_ALCHEMY_KEY!);
    } else {
        return getProvider(chainId);
    }
}
