import { Contract } from "ethers";
import { getProvider } from "./providers";

const IERC1271Abi = [
    "function isValidSignature(bytes32 _data, bytes _signature) view returns (bytes4)",
];

// If `isValidSignature` returns this, message has been signed.
const UPDATED_MAGIC = "0x1626ba7e";

export const verifyMultisigMessage = async (
    contractAddress: string,
    data: string,
    signature: string,
    chainId = 1,
): Promise<{
    valid: boolean,
    error: boolean,
    message: string,
}> => {
    try {
        const contractWallet = new Contract(
            contractAddress,
            IERC1271Abi,
            getProvider(chainId),
        );
        const result = await contractWallet.isValidSignature(data, signature);
        const valid = result === UPDATED_MAGIC;
        return {
            valid,
            error: false,
            message:
                valid
                    ? "Message has been signed"
                    : "Message has NOT been signed",
        };
    } catch (err: any) {
        return {
            valid: false,
            error: err.reason !== "Hash not approved",
            message: err?.reason,
        };
    }
};