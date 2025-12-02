import { MULTISIG_ABI } from "@app/config/abis";
import { getNetworkConfigConstants } from "@app/util/networks";
import { useWeb3React } from "@app/util/wallet";
import { GnosisSafe } from "@web3-react/gnosis-safe";
import { Contract } from "ethers";
import useSWR from "swr";
import useEtherSWR from "./useEtherSWR";
import { useAccount } from "./misc";

const { F2_CONTROLLER } = getNetworkConfigConstants();

export const useMultisig = (borrowController?: string): {
    isSafeMultisigConnector: boolean,
    isMultisig: boolean,
    isWhitelisted: boolean,
    // hasCode = can be a smart account
    hasCode: boolean,
    isProbablySmartAccount: boolean,
} => {
    const account = useAccount();
    const { connector, provider } = useWeb3React();
    const { data, error } = useSWR(`is-multisig-${account}`, async () => {
        if(!account || !provider) return undefined;
        const contract = new Contract(account, MULTISIG_ABI, provider.getSigner());
        const owners = await contract.getOwners();
        return Array.isArray(owners);
    }, {
        shouldRetryOnError: false,
    });
    const { data: hasCodeData, error: hasCodeError } = useSWR(`has-code-${account}`, async () => {
        if(!account || !provider) return undefined;
        const code = await provider.getCode(account);
        return code !== '0x';
    }, {
        shouldRetryOnError: false,
    });
    const hasCode = hasCodeData && !hasCodeError;
    const { data: isWhitelisted } = useEtherSWR([borrowController||F2_CONTROLLER, 'contractAllowlist', account]);
    if(!account || !connector) return { isSafeMultisigConnector: false, isMultisig: false, isWhitelisted: false, hasCode, isProbablySmartAccount: hasCode };
    const isSafeConnector =  !!connector && connector instanceof GnosisSafe;
    if(isSafeConnector) return { isSafeMultisigConnector: true, isMultisig: true, isWhitelisted, hasCode, isProbablySmartAccount: false };
    return { isSafeMultisigConnector: false, isMultisig: !error && !!data, isWhitelisted, hasCode, isProbablySmartAccount: hasCode && !(!error && !!data)  }
}