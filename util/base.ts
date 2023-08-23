import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk'
import { fetcher } from "./web3";
import { AbiCoder, FunctionFragment } from "ethers/lib/utils";
import { getBnToNumber } from "./markets";
import { getPublicRpcProvider } from "@app/hooks/useSpecificChainBalance";
import { NetworkIds } from "@app/types";
import { ERC20_ABI } from "@app/config/abis";

const bridgeABI = [{ "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "stateMutability": "payable", "type": "fallback" }, { "inputs": [], "name": "getImplementation", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getOwner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "_code", "type": "bytes" }], "name": "setCode", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "name": "setOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "_key", "type": "bytes32" }, { "internalType": "bytes32", "name": "_value", "type": "bytes32" }], "name": "setStorage", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }];
const l2bridgeABI = [{ "inputs": [{ "internalType": "addresspayable", "name": "_otherBridge", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "l1Token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "l2Token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "DepositFinalized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "localToken", "type": "address" }, { "indexed": true, "internalType": "address", "name": "remoteToken", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "ERC20BridgeFinalized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "localToken", "type": "address" }, { "indexed": true, "internalType": "address", "name": "remoteToken", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "ERC20BridgeInitiated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "ETHBridgeFinalized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "ETHBridgeInitiated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "l1Token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "l2Token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "WithdrawalInitiated", "type": "event" }, { "inputs": [], "name": "MESSENGER", "outputs": [{ "internalType": "contractCrossDomainMessenger", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "OTHER_BRIDGE", "outputs": [{ "internalType": "contractStandardBridge", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_localToken", "type": "address" }, { "internalType": "address", "name": "_remoteToken", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "bridgeERC20", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_localToken", "type": "address" }, { "internalType": "address", "name": "_remoteToken", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "bridgeERC20To", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "bridgeETH", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "bridgeETHTo", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }], "name": "deposits", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_localToken", "type": "address" }, { "internalType": "address", "name": "_remoteToken", "type": "address" }, { "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "finalizeBridgeERC20", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "finalizeBridgeETH", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_l1Token", "type": "address" }, { "internalType": "address", "name": "_l2Token", "type": "address" }, { "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "finalizeDeposit", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "l1TokenBridge", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "messenger", "outputs": [{ "internalType": "contractCrossDomainMessenger", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_l2Token", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "withdraw", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_l2Token", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "withdrawTo", "outputs": [], "stateMutability": "payable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }];

export const L1_BASE_BRIDGE = '0x49048044D57e1C92A77f79988d21Fa8fAF74E97e';
export const BASE_L1_ERC20_BRIDGE = '0x3154Cf16ccdb4C6d922629664174b904d80F2C35';
export const BASE_L2_ERC20_BRIDGE = '0x4200000000000000000000000000000000000010';
export const DOLA_BASE = '0x4621b7A9c75199271F773Ebd9A499dbd165c3191';
// export const DOLA_BASE = '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA';

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

export const bridgeDolaToBase = async (amount: BigNumber, signer: JsonRpcSigner, to?: string) => {
    const contract = new Contract(BASE_L1_ERC20_BRIDGE, bridgeABI, signer);
    const _to = to || await signer.getAddress();
    return contract.bridgeERC20To(
        '0x865377367054516e17014CcdED1e7d814EDC9ce4',
        DOLA_BASE,
        _to,
        amount,
        '100000',
        '0x01',
    );
}

export const withdrawDolaFromBase = async (amount: BigNumber, signer: JsonRpcSigner, to?: string) => {
    const contract = new Contract(BASE_L2_ERC20_BRIDGE, l2bridgeABI, signer);
    const _to = to || await signer.getAddress();
    return contract.withdrawTo(
        DOLA_BASE,
        _to,
        amount,
        '100000',
        '0x01',
    );
}

export const getBaseAddressWithrawals = async (ethProvider: Web3Provider, address: string) => {
    const path = `https://api.basescan.org/api?address=${address}&action=txlist&module=account`;
    try {
        const res = await fetcher(path);
        const list = res?.status === "1" ? res?.result : [];

        const now = Date.now();
        const filteredList = list.filter(d => d.from.toLowerCase() === address.toLowerCase()
            && d.isError === '0'
            && d.to.toLowerCase() === BASE_L2_ERC20_BRIDGE.toLowerCase()
            // && d.input.includes(DOLA_BASE.replace(/^0x/, '').toLowerCase())
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

        const baseProvider = getPublicRpcProvider(NetworkIds.base)!;
        const l2tokens = [...new Set(filteredList.map(r => r.args._l2Token))];
        // TODO: use Base multicall      
        const [
            decimals,
            symbols,
            statuses,
        ] = await Promise.all([
            Promise.all(
                l2tokens.map((l2token) => {
                    return (new Contract(l2token, ERC20_ABI, baseProvider)).decimals();
                }),
            ),
            Promise.all(
                l2tokens.map((l2token) => {
                    return (new Contract(l2token, ERC20_ABI, baseProvider)).symbol();
                }),
            ),
            getTransactionsStatuses(
                filteredList.map(r => r.hash),
                // filteredList.map(r => r.canBeVerified),
                ethProvider,
            ),
        ]);

        const results = filteredList.map((d, i) => {
            return {
                ...d,
                token: d.args._l2Token,
                amount: getBnToNumber(d.args._amount, decimals[i]),
                symbol: symbols[i],
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
            return 'Message is an L2 to L1 message and no state root has been published yet'
        case MessageStatus.READY_TO_PROVE:
            return '1/3 - Ready to prove'
        case MessageStatus.IN_CHALLENGE_PERIOD:
            return '2/3 - Wait period'
        case MessageStatus.READY_FOR_RELAY:
            return '3/3 - Ready to be relayed'
        case MessageStatus.RELAYED:
            return 'Relayed'
        default:
            return 'Unknown status'
    }
}

export const getMessenger = (provider: any) => {
    return new CrossChainMessenger({
        l1SignerOrProvider: provider?.getSigner(), // replace with your L1 provider or signer
        l2SignerOrProvider: getPublicRpcProvider(NetworkIds.base), // replace with your L2 provider or signer
        l1ChainId: parseInt(NetworkIds.mainnet), // replace with your L1 chain ID
        l2ChainId: parseInt(NetworkIds.base), // replace with your L2 chain ID
        bedrock: true,
    });
}

export const getTransactionsStatuses = async (txHashes: string[], provider: Web3Provider): Promise<MsgStatusItem[][]> => {
    const messenger = getMessenger(provider);
    
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