import { ProposalFormActionFields, NetworkIds, AutocompleteItem } from '@inverse/types';
import { useState } from 'react'
import { FormControl, FormLabel, Text, Box, Flex, Divider } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { ProposalInput } from './ProposalInput';
import { isAddress, FunctionFragment } from 'ethers/lib/utils';
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip';
import { Autocomplete } from '@inverse/components/common/Input/Autocomplete';
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { getRemoteAbi } from '@inverse/util/etherscan';
import { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import ScannerLink from '@inverse/components/common/ScannerLink';

export const ProposalFormAction = ({
    action,
    index,
    onChange,
    onDelete,
    onFuncChange,
}: {
    action: ProposalFormActionFields,
    index: number,
    onChange: (field: string, e: any) => void,
    onDelete: () => void,
    onFuncChange: (e: any) => void,
}) => {
    const { library } = useWeb3React<Web3Provider>()
    const { contractAddress, func, args, value } = action
    const [hideBody, setHideBody] = useState(false)
    const [abi, setAbi] = useState('')
    const [contractFunctions, setContractFunctions] = useState([])

    useEffect(() => {
        const parsedAbi = abi ? JSON.parse(abi) : [];
        const writeFunctions = parsedAbi
            .filter((abiItem: FunctionFragment) => abiItem.type === 'function' && abiItem.stateMutability !== 'view')
            .map((abiItem: FunctionFragment) => {
                const fields = abiItem.inputs.map((input) => `${input.internalType} ${input.name}`.trim()).join(',')
                const signature = `${abiItem.name}(${fields})`
                return { label: signature, value: signature }
            })
        setContractFunctions(writeFunctions)
    }, [abi])

    const { PROPOSAL_AUTOCOMPLETE_ADDRESSES } = getNetworkConfigConstants(NetworkIds.mainnet)

    const knownAddresses = Object.entries(PROPOSAL_AUTOCOMPLETE_ADDRESSES)
        .map(([ad, name]) => ({ value: ad, label: name }))
        .sort((a, b) => a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1)

    const handleArgChange = (e: any, i: number) => {
        const newArgs = [...args];
        newArgs[i] = { ...newArgs[i], value: e.currentTarget.value };
        onChange('args', newArgs);
    }

    const argInputs = args.map((arg, i) => {
        const inputType = arg.type.includes('int') ? 'number' : 'string';
        const min = arg.type.includes('uint') ? '0' : undefined;
        const name = arg.name || `Argument #${i + 1}`
        return (
            <FormControl key={i} mt="2">
                <FormLabel fontSize="12">{name} ({arg.type})</FormLabel>
                <ProposalInput
                    pt="1"
                    pb="1"
                    type={inputType}
                    min={min}
                    value={arg.value || ''}
                    placeholder="Argument data"
                    onChange={(e: any) => handleArgChange(e, i)} />
            </FormControl>
        )
    })

    const onAutoCompleteChange = async (item?: AutocompleteItem) => {
        onChange('contractAddress', item?.value || '');
        if (item?.value && isAddress(item?.value)) {
            setAbi(await getRemoteAbi(item.value));
        }
    }

    return (
        <Box bgColor="purple.700" borderRadius="5" p="4">
            <Flex alignItems="center">
                <Text fontWeight="bold" cursor="pointer" fontSize="20" onClick={() => setHideBody(!hideBody)}>
                    Action #{index + 1}
                </Text>
                <DeleteIcon ml="2" cursor="pointer" color="red.400" onClick={onDelete} />
            </Flex>
            {
                hideBody ? null :
                    <>
                        <Divider mt="2" mb="2" />
                        <FormControl>
                            <FormLabel>
                                Contract Address
                                {contractAddress ? <> (<ScannerLink value={contractAddress} label={contractAddress} />)</> : ''}
                            </FormLabel>
                            <Autocomplete
                                onItemSelect={onAutoCompleteChange}
                                InputComp={(p) => <ProposalInput isInvalid={!!contractAddress && !isAddress(contractAddress)} {...p} />}
                                list={knownAddresses}
                                title="Well-Known Contract / Wallet Names :"
                                placeholder="0x... Or a Known Contract / Wallet Name, eg: Comptroller, DAI, DOLA"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel mt="2">
                                Amount of Eth to send
                                <AnimatedInfoTooltip iconProps={{ ml: '1', fontSize: '12px' }} message="Directly in normal Eth units not in wei" />
                            </FormLabel>
                            <ProposalInput type="number" placeholder="Eg : 0.1, 0 by default" value={value} onChange={(e: any) => onChange('value', e.currentTarget.value)} />
                        </FormControl>
                        <FormControl>
                            <FormLabel mt="2">Contract Function</FormLabel>
                            <Autocomplete
                                onItemSelect={(item) => onFuncChange(item?.value)}
                                InputComp={(p) => <ProposalInput {...p} />}
                                list={contractFunctions}
                                title="Write functions found in the Contract Abi :"
                                placeholder="transfer(address,uint)"
                            />
                        </FormControl>
                        {
                            args?.length ?
                                <FormControl pl="5" mt="2">
                                    {argInputs}
                                </FormControl>
                                : null
                        }
                    </>
            }
        </Box>
    )
}