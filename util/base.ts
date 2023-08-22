import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { fetcher } from "./web3";
import { AbiCoder, FunctionFragment } from "ethers/lib/utils";
import { getBnToNumber } from "./markets";
import { getTransactions } from "./etherscan";

const bridgeABI = [{ "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "stateMutability": "payable", "type": "fallback" }, { "inputs": [], "name": "getImplementation", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getOwner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes", "name": "_code", "type": "bytes" }], "name": "setCode", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "name": "setOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "_key", "type": "bytes32" }, { "internalType": "bytes32", "name": "_value", "type": "bytes32" }], "name": "setStorage", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }];
const l2bridgeABI = [{ "inputs": [{ "internalType": "addresspayable", "name": "_otherBridge", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "l1Token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "l2Token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "DepositFinalized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "localToken", "type": "address" }, { "indexed": true, "internalType": "address", "name": "remoteToken", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "ERC20BridgeFinalized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "localToken", "type": "address" }, { "indexed": true, "internalType": "address", "name": "remoteToken", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "ERC20BridgeInitiated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "ETHBridgeFinalized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "ETHBridgeInitiated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "l1Token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "l2Token", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "bytes", "name": "extraData", "type": "bytes" }], "name": "WithdrawalInitiated", "type": "event" }, { "inputs": [], "name": "MESSENGER", "outputs": [{ "internalType": "contractCrossDomainMessenger", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "OTHER_BRIDGE", "outputs": [{ "internalType": "contractStandardBridge", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_localToken", "type": "address" }, { "internalType": "address", "name": "_remoteToken", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "bridgeERC20", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_localToken", "type": "address" }, { "internalType": "address", "name": "_remoteToken", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "bridgeERC20To", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "bridgeETH", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "bridgeETHTo", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }], "name": "deposits", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_localToken", "type": "address" }, { "internalType": "address", "name": "_remoteToken", "type": "address" }, { "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "finalizeBridgeERC20", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "finalizeBridgeETH", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_l1Token", "type": "address" }, { "internalType": "address", "name": "_l2Token", "type": "address" }, { "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "finalizeDeposit", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "l1TokenBridge", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "messenger", "outputs": [{ "internalType": "contractCrossDomainMessenger", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_l2Token", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "withdraw", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_l2Token", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint32", "name": "_minGasLimit", "type": "uint32" }, { "internalType": "bytes", "name": "_extraData", "type": "bytes" }], "name": "withdrawTo", "outputs": [], "stateMutability": "payable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }];

export const L1_BASE_BRIDGE = '0x49048044D57e1C92A77f79988d21Fa8fAF74E97e';
export const BASE_L1_ERC20_BRIDGE = '0x3154Cf16ccdb4C6d922629664174b904d80F2C35';
export const BASE_L2_ERC20_BRIDGE = '0x4200000000000000000000000000000000000010';
export const DOLA_BASE = '0x4621b7A9c75199271F773Ebd9A499dbd165c3191';

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

export const getBaseAddressInfo = async (address: string) => {
    const path = `https://api.basescan.org/api?address=${address}&action=txlist&module=account`;
    try {
        const res = await fetcher(path);
        const list = res?.status === "1" ? res?.result : [];

        const now = Date.now();

        const results = list.filter(d => d.from.toLowerCase() === address.toLowerCase()
            && d.isError === '0'
            && d.to.toLowerCase() === BASE_L2_ERC20_BRIDGE.toLowerCase()
            && d.input.includes(DOLA_BASE.replace(/^0x/, '').toLowerCase())            
            && /^withdraw/.test(d.functionName)
        ).map(d => {
            const args = new AbiCoder().decode(FunctionFragment.from(d.functionName).inputs, '0x' + d.input.replace(d.methodId, ''));
            const timestamp = parseInt(d.timeStamp) * 1000;
            return {
                ...d,
                args,
                amount: getBnToNumber(args._amount),
                timestamp,
                // 1 hour after withdrawal init
                canBeVerified: (now - timestamp) >= 3600000,
            }
        })
        return { hasError: false, results }
    } catch (error) {
        return { hasError: true, results: [], error }
    }
}

export const getEhereumBaseRelatedTransactions = async (address: string) => {    
    try {
        const list = await getTransactions(address, 17884135);        
        const now = Date.now();

        const results = list.filter(d => d.from.toLowerCase() === address.toLowerCase()
            && d.isError === '0'
            && d.to.toLowerCase() === L1_BASE_BRIDGE.toLowerCase()
            // && d.input.includes(DOLA_BASE.replace(/^0x/, '').toLowerCase())
            // && d.input.includes('0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA'.replace(/^0x/, '').toLowerCase())
            && d.methodId === "0x4870496f"
        ).map(d => {
            const args = new AbiCoder().decode(FunctionFragment.from(d.functionName).inputs, '0x' + d.input.replace(d.methodId, ''));
            const timestamp = parseInt(d.timeStamp) * 1000;
            return {
                ...d,
                args,
                // amount: getBnToNumber(args._amount),
                timestamp,
                // 1 hour after withdrawal init
                // canBeVerified: (now - timestamp) >= 3600000,
            }
        })
        return { hasError: false, results }
    } catch (error) {
        console.log(error)
        return { hasError: true, results: [], error }
    }
}