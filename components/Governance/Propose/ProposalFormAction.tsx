import { ProposalFormActionFields, NetworkIds, AutocompleteItem } from '@inverse/types';
import { useState } from 'react'
import { FormControl, FormLabel, Text, Box, Flex, Divider } from '@chakra-ui/react';
import { CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { ProposalInput } from './ProposalInput';
import { isAddress, FunctionFragment } from 'ethers/lib/utils';
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip';
import { Autocomplete } from '@inverse/components/common/Input/Autocomplete';
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { getRemoteAbi } from '@inverse/util/etherscan';
import { useEffect } from 'react';
import ScannerLink from '@inverse/components/common/ScannerLink';

export const ProposalFormAction = ({
    action,
    index,
    onChange,
    onDelete,
    onDuplicate,
    onFuncChange,
}: {
    action: ProposalFormActionFields,
    index: number,
    onChange: (field: string, e: any) => void,
    onDelete: () => void,
    onDuplicate: () => void,
    onFuncChange: (e: any) => void,
}) => {
    const { contractAddress, func, args, value } = action
    const [hideBody, setHideBody] = useState(false)
    const [abi, setAbi] = useState('')
    const [contractFunctions, setContractFunctions] = useState([])

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (action.contractAddress) {
                if (action.contractAddress && isAddress(action.contractAddress)) {
                    const result = await getRemoteAbi(action.contractAddress)
                    if (!isMounted) { return }
                    setAbi(result);
                }
            }
        }
        init()
        return () => { isMounted = false }
    }, [])

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

    const onContractChange = async (item?: AutocompleteItem) => {
        onChange('contractAddress', item?.value || '');
        setAbi('[]')
        if (item?.value && isAddress(item?.value)) {
            setAbi(await getRemoteAbi(item.value));
        }
    }

    return (
        <Box bgColor="purple.750" borderRadius="5" p="4">
            <Flex alignItems="center" position="relative">
                <Text fontWeight="bold" cursor="pointer" fontSize="20" onClick={() => setHideBody(!hideBody)}>
                    Action #{index + 1}
                </Text>
                <CopyIcon ml="2" cursor="pointer" color="blue.400" onClick={onDuplicate} />
                <DeleteIcon position="absolute" right="0" ml="2" cursor="pointer" color="red.400" onClick={onDelete} />
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
                                onItemSelect={onContractChange}
                                defaultValue={contractAddress}
                                InputComp={(p) => <ProposalInput isInvalid={!!contractAddress && !isAddress(contractAddress)} {...p} />}
                                list={knownAddresses}
                                title="Well-Known Contract / Wallet Names :"
                                placeholder="0x... Or a Known Contract / Wallet Name, eg: Comptroller, DAI, DOLA"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel mt="2">Contract Function to Call</FormLabel>
                            <Autocomplete
                                onItemSelect={(item) => onFuncChange(item?.value)}
                                defaultValue={func}
                                InputComp={(p) => <ProposalInput {...p} />}
                                list={contractFunctions}
                                title={`"Write" Functions found in the Contracts's Abi :`}
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
                        <FormControl>
                            <FormLabel mt="2">
                                Amount of Eth to send
                                <AnimatedInfoTooltip iconProps={{ ml: '1', fontSize: '12px' }} message="Directly in normal Eth units not in wei" />
                            </FormLabel>
                            <ProposalInput type="number" placeholder="Eg : 0.1, 0 by default" value={value} onChange={(e: any) => onChange('value', e.currentTarget.value)} />
                        </FormControl>
                    </>
            }
        </Box>
    )
}