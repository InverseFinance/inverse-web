import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";

const bridgeABI = [{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"stateMutability":"payable","type":"fallback"},{"inputs":[],"name":"getImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"_code","type":"bytes"}],"name":"setCode","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"setOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"},{"internalType":"bytes32","name":"_value","type":"bytes32"}],"name":"setStorage","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
export const BASE_L1_ERC20_BRIDGE = '0x3154Cf16ccdb4C6d922629664174b904d80F2C35';
export const BASE_L2_ERC20_BRIDGE = '0x4200000000000000000000000000000000000010';

export const bridgeDolaToBase = async (amount: BigNumber, signer: JsonRpcSigner, to?: string) => {
    const contract = new Contract(BASE_L1_ERC20_BRIDGE, bridgeABI ,signer);
    const _to = to || await signer.getAddress();
    return contract.bridgeERC20To(
        '0x865377367054516e17014CcdED1e7d814EDC9ce4',
        '0x4621b7A9c75199271F773Ebd9A499dbd165c3191',
        _to,
        amount,
        '100000',
        '0x01',
    );
}

export const withdrawDolaFromBase = async (amount: BigNumber, signer: JsonRpcSigner, to?: string) => {
    const contract = new Contract(BASE_L2_ERC20_BRIDGE, bridgeABI ,signer);
    const _to = to || await signer.getAddress();
    return contract.bridgeERC20To(
        '0x4621b7A9c75199271F773Ebd9A499dbd165c3191',
        '0x865377367054516e17014CcdED1e7d814EDC9ce4',
        _to,
        amount,
        '100000',
        '0x01',
    );
}