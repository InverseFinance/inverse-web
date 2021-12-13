import { ProposalFormActionFields, AutocompleteItem } from '@inverse/types';
import { useState } from 'react'
import { FormControl, FormLabel, Text, Box, Flex, Divider, SlideFade, ScaleFade } from '@chakra-ui/react';
import { CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { ProposalInput } from './ProposalInput';
import { isAddress, FunctionFragment } from 'ethers/lib/utils';
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip';
import { Autocomplete } from '@inverse/components/common/Input/Autocomplete';
import { getRemoteAbi } from '@inverse/util/etherscan';
import { useEffect } from 'react';
import ScannerLink from '@inverse/components/common/ScannerLink';
import { ProposalFormFuncArg } from './ProposalFormFuncArg';
import { AddressAutocomplete } from '@inverse/components/common/Input/AddressAutocomplete';
import { getFunctionFromProposalAction } from '@inverse/util/governance';
import { ProposalActionPreview } from '../ProposalActionPreview';

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
    const [scaledInEffect, setScaledInEffect] = useState(true);

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
                const fields = abiItem.inputs.map((input) => `${input.type} ${input.name}`.trim()).join(',')
                const signature = `${abiItem.name}(${fields})`
                return { label: signature, value: signature }
            })
        setContractFunctions(writeFunctions)
    }, [abi])


    const handleArgChange = (eventOrValue: any, i: number) => {
        const newArgs = [...args];
        newArgs[i] = { ...newArgs[i], value: eventOrValue?.currentTarget?.value || eventOrValue };
        onChange('args', newArgs);
    }

    const argInputs = args.map((arg, i) => {
        return <ProposalFormFuncArg
            key={i}
            type={arg.type}
            name={arg.name}
            defaultValue={arg.value}
            index={i}
            onChange={(e) => handleArgChange(e, i)}
        />
    })

    const onContractChange = async (item?: AutocompleteItem) => {
        onChange('contractAddress', item?.value || '');
        setAbi('[]')
        if (item?.value && isAddress(item?.value)) {
            setAbi(await getRemoteAbi(item.value));
        }
    }

    const handleDelete = () => {
        setScaledInEffect(false)
        setTimeout(() => {
            onDelete()
        }, 200)
    }

    let previewFunc = null
    try {
        previewFunc = getFunctionFromProposalAction(action)
    } catch (e) {

    }

    return (
        <SlideFade offsetY={'100px'} in={scaledInEffect}>
            <Box bgColor="purple.750" borderRadius="5" p="4">
                <Flex alignItems="center" position="relative">
                    <Text fontWeight="bold" cursor="pointer" fontSize="20" onClick={() => setHideBody(!hideBody)}>
                        Action #{index + 1}
                    </Text>
                    <CopyIcon ml="2" cursor="pointer" color="blue.400" onClick={onDuplicate} />
                    <DeleteIcon position="absolute" right="0" ml="2" cursor="pointer" color="red.400" onClick={handleDelete} />
                </Flex>
                <Divider mt="2" mb="2" />

                <ScaleFade initialScale={0.1} unmountOnExit={true} in={hideBody} reverse={false}>
                    {
                        previewFunc?.signature && previewFunc?.callData && previewFunc?.target ?
                            <ProposalActionPreview
                                pt="1"
                                target={previewFunc.target}
                                signature={previewFunc.signature}
                                callData={previewFunc.callData} />
                            :
                            <Text textAlign="left">
                                Incomplete or Invalid action details
                            </Text>
                    }
                </ScaleFade>

                <ScaleFade initialScale={0.1} unmountOnExit={true} in={!hideBody} reverse={true}>
                    <FormControl>
                        <FormLabel>
                            Contract Address
                            {contractAddress && isAddress(contractAddress) ? <> (<ScannerLink value={contractAddress} label={contractAddress} />)</> : ''}
                        </FormLabel>
                        <AddressAutocomplete
                            onItemSelect={onContractChange}
                            defaultValue={contractAddress}
                            InputComp={(p) => <ProposalInput {...p} />}
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
                </ScaleFade>
            </Box>
        </SlideFade>
    )
}