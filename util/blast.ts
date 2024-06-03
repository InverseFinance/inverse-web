import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { CrossChainMessenger, MessageStatus, SignerOrProviderLike } from '@eth-optimism/sdk'
import { fetcher } from "./web3";
import { AbiCoder, FunctionFragment } from "ethers/lib/utils";
import { getBnToNumber } from "./markets";
import { getPublicRpcProvider } from "@app/hooks/useSpecificChainBalance";
import { NetworkIds } from "@app/types";
import { ERC20_ABI } from "@app/config/abis";
import { BURN_ADDRESS } from "@app/config/constants";

export const L2_TOKEN_ABI = [{ "inputs": [{ "internalType": "address", "name": "_bridge", "type": "address" }, { "internalType": "address", "name": "_remoteToken", "type": "address" }, { "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_symbol", "type": "string" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Burn", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Mint", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [], "name": "BRIDGE", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "REMOTE_TOKEN", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "bridge", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "l1Token", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "l2Bridge", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "remoteToken", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes4", "name": "_interfaceId", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "pure", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }];

export const BLAST_L1_ERC20_BRIDGE = '0x697402166Fbf2F22E970df8a6486Ef171dbfc524';
export const BLAST_L2_ERC20_BRIDGE = '0x4200000000000000000000000000000000000010';
export const L2_ETH_TOKEN = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000';

export const OFFICIALLY_SUPPORTED_L2_TOKENS: { [key: string]: boolean } = {
    
}

export type MsgStatusItem = {
    status: MessageStatus,
    index: number,
    description: string,
    shortDescription: string,
}

export type WithdrawalItem = {
    token: string
    symbol: string
    amount: number
    hash: string
    shortDescription: string
    timestamp: number
    canVerifyAfter: number
    canBeVerified: boolean
    args: any[]
    statuses: MsgStatusItem[]
}

export const getBlastProvider = () => getPublicRpcProvider(NetworkIds.blast);
export const getEthProvider = () => getPublicRpcProvider(NetworkIds.mainnet);

export const bridgeToBlast = async (
    l1token: string,
    l2token: string,
    amount: BigNumber,
    l1Signer: JsonRpcSigner,
    to?: string,
) => {
    if (!l1token || !l2token || l1token === BURN_ADDRESS || l2token === BURN_ADDRESS || to === BURN_ADDRESS) {
        return;
    }
    const messenger = getMessenger(l1Signer, getBlastProvider()!);
    return messenger.depositERC20(l1token, l2token, amount, !!to ? { recipient: to } : undefined);
}

export const bridgeEthToBlast = async (
    amount: BigNumber,
    l1Signer: JsonRpcSigner,
    to?: string,
) => {
    if (!l1Signer || to === BURN_ADDRESS) {
        return;
    }
    const messenger = getMessenger(l1Signer, getBlastProvider()!);
    return messenger.depositETH(amount, !!to ? { recipient: to } : undefined);
}

export const withdrawFromBlast = async (
    l1token: string,
    l2token: string,
    amount: BigNumber,
    l2Signer: JsonRpcSigner,
    to?: string,
) => {
    if (!l2token || l2token === BURN_ADDRESS || to === BURN_ADDRESS) {
        return;
    }
    const messenger = getMessenger(getEthProvider()!, l2Signer);
    // force withdrawTo if unofficial token to avoid crashing the official l2 Transactions UI
    const forceWithdrawTo = !OFFICIALLY_SUPPORTED_L2_TOKENS[l2token.toLowerCase()];
    const _to = to || (forceWithdrawTo ? await l2Signer.getAddress() : undefined);
    return messenger.withdrawERC20(l1token, l2token, amount, { recipient: _to })
}

export const withdrawEthFromBlast = async (
    amount: BigNumber,
    l2Signer: JsonRpcSigner,
    to?: string,
) => {
    if (!l2Signer || to === BURN_ADDRESS) {
        return;
    }
    const messenger = getMessenger(getEthProvider()!, l2Signer);
    return messenger.withdrawETH(amount, !!to ? { recipient: to } : undefined);
}

export const executeMessage = async (txHash: string, statuses: MsgStatusItem[], signer: JsonRpcSigner) => {
    if (!signer || !txHash) return
    const messenger = getMessenger(signer, getBlastProvider()!);
    for (const { status, index } of statuses) {
        if (status === MessageStatus.READY_TO_PROVE) {
            return messenger.proveMessage(txHash, undefined, index)
        } else if (status === MessageStatus.READY_FOR_RELAY) {
            return messenger.finalizeMessage(txHash, undefined, index)
        }
    }
    return
}

export const getBlastAddressWithrawals = async (
    ethProvider: Web3Provider,
    address: string,
) => {
    const path = `https://api.blastscan.io/api?address=${address}&action=txlist&module=account`;
    try {
        const res = await fetcher(path);
        const list = res?.status === "1" ? res?.result : [];

        const now = Date.now();
        const filteredList = list.filter(d => d.from.toLowerCase() === address.toLowerCase()
            && d.isError === '0'
            && d.to.toLowerCase() === BLAST_L2_ERC20_BRIDGE.toLowerCase()
            // && d.input.includes(l2token.replace(/^0x/, '').toLowerCase())
            && /^withdraw/.test(d.functionName)
        ).map(d => {
            const args = new AbiCoder().decode(FunctionFragment.from(d.functionName).inputs, '0x' + d.input.replace(d.methodId, ''));
            const timestamp = parseInt(d.timeStamp) * 1000;
            return {
                ...d,
                args,
                timestamp,
                canVerifyAfter: timestamp + 3600000,
                canBeVerified: (now - timestamp) >= 3600000,
            }
        });

        const l2Provider = getBlastProvider()!;
        const l2tokens = [...new Set(filteredList.map(r => r.args._l2Token))];
        // TODO: use l2 multicall      
        const [
            decimals,
            symbols,
            statuses,
        ] = await Promise.all([
            Promise.all(
                l2tokens.map((l2token) => {
                    return l2token.toLowerCase() === L2_ETH_TOKEN.toLowerCase() ?
                        Promise.resolve(18)
                        : (new Contract(l2token, ERC20_ABI, l2Provider)).decimals();
                }),
            ),
            Promise.all(
                l2tokens.map((l2token) => {
                    return l2token.toLowerCase() === L2_ETH_TOKEN.toLowerCase() ?
                        Promise.resolve('ETH')
                        : (new Contract(l2token, ERC20_ABI, l2Provider)).symbol();
                }),
            ),
            getTransactionsStatuses(
                filteredList.map(r => r.hash),
                ethProvider.getSigner(),
            ),
        ]);

        const results = filteredList.map((d, i) => {
            const l2tokenIndex = l2tokens.indexOf(d.args._l2Token);
            return {
                ...d,
                token: d.args._l2Token,
                amount: getBnToNumber(d.args._amount, decimals[l2tokenIndex]),
                symbol: symbols[l2tokenIndex],
                statuses: statuses[i],
                shortDescription: statuses[i][0].shortDescription,
            }
        });

        return { hasError: false, results }
    } catch (error) {
        console.log(error)
        return { hasError: true, results: [], error }
    }
}

export const getStatusDescription = (status: MessageStatus) => {
    switch (status) {
        case MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE:
            return 'Message is an L1 to L2 message and has not been processed by the L2'
        case MessageStatus.FAILED_L1_TO_L2_MESSAGE:
            return 'Message is an L1 to L2 message and the transaction to execute the message failed'
        case MessageStatus.STATE_ROOT_NOT_PUBLISHED:
            return 'Message is an L2 to L1 message and no state root has been published yet'
        case MessageStatus.READY_TO_PROVE:
            return 'Message is ready to be proved'
        case MessageStatus.IN_CHALLENGE_PERIOD:
            return 'Message is a proved L2 to L1 message and is undergoing the challenge period'
        case MessageStatus.READY_FOR_RELAY:
            return 'Message is ready to be relayed'
        case MessageStatus.RELAYED:
            return 'Message has been relayed'
        default:
            return 'Unknown status'
    }
}

export const getStatusShortDescription = (status: MessageStatus) => {
    switch (status) {
        case MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE:
            return 'Message is an L1 to L2 message and has not been processed by the L2'
        case MessageStatus.FAILED_L1_TO_L2_MESSAGE:
            return 'Message is an L1 to L2 message and the transaction to execute the message failed'
        case MessageStatus.STATE_ROOT_NOT_PUBLISHED:
            return '1/5 - 1h wait period'
        case MessageStatus.READY_TO_PROVE:
            return '2/5 - Ready to prove'
        case MessageStatus.IN_CHALLENGE_PERIOD:
            return '3/5 - 7 days challenge period'
        case MessageStatus.READY_FOR_RELAY:
            return '4/5 - Ready to be relayed'
        case MessageStatus.RELAYED:
            return '5/5 - Relayed'
        default:
            return 'Unknown status'
    }
}

export const getMessenger = (l1SignerOrProvider: SignerOrProviderLike, l2SignerOrProvider: SignerOrProviderLike) => {
    return new CrossChainMessenger({
        l1SignerOrProvider, // replace with your L1 provider or signer
        l2SignerOrProvider, // replace with your L2 provider or signer
        l1ChainId: parseInt(NetworkIds.mainnet), // replace with your L1 chain ID
        l2ChainId: parseInt(NetworkIds.blast), // replace with your L2 chain ID
        bedrock: true,
        contracts: {
            l1: {
                AddressManager: BURN_ADDRESS,
                L1StandardBridge: '0x697402166Fbf2F22E970df8a6486Ef171dbfc524',
                L1CrossDomainMessenger: '0x5D4472f31Bd9385709ec61305AFc749F0fA8e9d0',                
                OptimismPortal: '0x0Ec68c5B10F21EFFb74f2A5C61DFe6b08C0Db6Cb',
                L2OutputOracle: '0x826D1B0D4111Ad9146Eb8941D7Ca2B6a44215c76',

                StateCommitmentChain: BURN_ADDRESS,
                CanonicalTransactionChain: BURN_ADDRESS,
                BondManager: BURN_ADDRESS,
            },            
        }
    });
}

export const getTransactionsStatuses = async (txHashes: string[], signer: JsonRpcSigner): Promise<MsgStatusItem[][]> => {
    const messenger = getMessenger(signer, getPublicRpcProvider(NetworkIds.blast)!);

    const messagesLists = await Promise.all(
        txHashes.map(async (txHash) => {
            return messenger.getMessagesByTransaction(txHash)
        })
    );

    const statusesLists = await Promise.all(
        txHashes.map((txHash, txIndex) => {
            return Promise.all(
                messagesLists[txIndex].map((message, txMsgIndex) => messenger.getMessageStatus(txHash, txMsgIndex))
            )
        }),
    );

    return statusesLists.map(statuses =>
        statuses.map((status, index) => ({
            status,
            index,
            description: getStatusDescription(status),
            shortDescription: getStatusShortDescription(status),
        }))
    );
}