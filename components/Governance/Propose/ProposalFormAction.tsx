import { ProposalFormActionFields, AutocompleteItem } from '@app/types';
import { FormControl, FormLabel, Text, Box, Flex, Divider, SlideFade, ScaleFade } from '@chakra-ui/react';
import { CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { ProposalInput } from './ProposalInput';
import { isAddress, FunctionFragment } from 'ethers/lib/utils';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { Autocomplete } from '@app/components/common/Input/Autocomplete';
import { getRemoteAbi } from '@app/util/etherscan';
import { useEffect, useState } from 'react';
import ScannerLink from '@app/components/common/ScannerLink';
import { ProposalFormFuncArg } from './ProposalFormFuncArg';
import { AddressAutocomplete } from '@app/components/common/Input/AddressAutocomplete';
import { getFunctionFromProposalAction } from '@app/util/governance';
import { ProposalActionPreview } from '../ProposalActionPreview';
import { WarningMessage } from '@app/components/common/Messages';

export const ProposalFormAction = ({
    action,
    index,
    onChange,
    onDelete,
    onDuplicate,
    onFuncChange,
    isDraggable = false,
    isDragging = false,
    isDragOver = false,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
}: {
    action: ProposalFormActionFields,
    index: number,
    onChange: (field: string, e: any) => void,
    onDelete: () => void,
    onDuplicate: () => void,
    onFuncChange: (e: any) => void,
    isDraggable?: boolean,
    isDragging?: boolean,
    isDragOver?: boolean,
    onDragStart?: () => void,
    onDragOver?: (e: React.DragEvent) => void,
    onDragLeave?: () => void,
    onDrop?: (e: React.DragEvent) => void,
    onDragEnd?: () => void,
}) => {
    const { contractAddress, func, args, value, collapsed } = action
    const [hideBody, setHideBody] = useState(collapsed)
    const [abi, setAbi] = useState('')
    const [contractFunctions, setContractFunctions] = useState([])
    const [scaledInEffect, setScaledInEffect] = useState(true);
    const [notInAbiWarning, setNotInAbiWarning] = useState(false)

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
        const funcIsInAbi = contractFunctions
            .find((f: AutocompleteItem) => toSimpleSig(f.value) === toSimpleSig(func))
        setNotInAbiWarning(!funcIsInAbi && !!func && !!contractFunctions.length)
    }, [func, contractFunctions])

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

    const toSimpleSig = (sigWithNames: string) => {
        if (!sigWithNames) { return '' }
        try {
            return FunctionFragment.fromString(sigWithNames).format();
        } catch (e) { }
        return '';
    }

    const handleArgChange = (eventOrValue: any, i: number) => {
        const newArgs = [...args];
        newArgs[i] = { ...newArgs[i], value: eventOrValue?.currentTarget?.value || eventOrValue };
        onChange('args', newArgs);
    }

    const argInputs = args?.map((arg, i) => {
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
            <Box 
                bg="gradient2" 
                borderRadius="5" 
                px="4" 
                pt="2" 
                pb="3"
                draggable={isDraggable}
                onDragStart={isDraggable ? onDragStart : undefined}
                onDragOver={isDraggable ? onDragOver : undefined}
                onDragLeave={isDraggable ? onDragLeave : undefined}
                onDrop={isDraggable ? onDrop : undefined}
                onDragEnd={isDraggable ? onDragEnd : undefined}
                opacity={isDragging ? 0.5 : 1}
                border={isDragOver ? "2px solid" : "2px solid transparent"}
                borderColor={isDragOver ? "blue.400" : "transparent"}
                transition="all 0.2s"
                cursor={isDraggable ? "move" : "default"}
            >
                <Flex alignItems="center" position="relative">
                    {/* {isDraggable && (
                        <Box 
                            mr="2" 
                            cursor="grab" 
                            _active={{ cursor: "grabbing" }}
                            display="flex"
                            flexDirection="column"
                            gap="2px"
                            color="gray.400"
                            _hover={{ color: "gray.500" }}
                        >
                            <Box w="12px" h="2px" bg="currentColor" borderRadius="1px" />
                            <Box w="12px" h="2px" bg="currentColor" borderRadius="1px" />
                            <Box w="12px" h="2px" bg="currentColor" borderRadius="1px" />
                        </Box>
                    )} */}
                    <Text fontWeight="bold" cursor="pointer" fontSize="18" onClick={() => setHideBody(!hideBody)}>
                        Action #{index + 1}
                    </Text>
                    <CopyIcon ml="2" cursor="pointer" color="blue.400" onClick={onDuplicate} />
                    {
                        notInAbiWarning ?
                            <WarningMessage
                                description="Function to call not found in contract ABI fetched from Etherscan !"
                                alertProps={{ p: "1", position: "absolute", right: "8", fontSize: "12px" }} />
                            : ''
                    }
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
                                callData={previewFunc.callData}
                                value={previewFunc.value}
                            />
                            :
                            <Box textAlign="left" pt="3">
                                <WarningMessage
                                    alertProps={{ fontSize: '12px', p: '1' }}
                                    description="Incomplete or Invalid action details" />
                            </Box>
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
                            title={`"Write" Functions found in the Contracts's Abi :`}
                            onItemSelect={(item) => onFuncChange(item?.value)}
                            defaultValue={func}
                            InputComp={(p) => <ProposalInput {...p} />}
                            list={contractFunctions}
                            highlightBeforeChar="("
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
                        <ProposalFormFuncArg index={0} name="Optional Eth Value" type="uint" placeholder="In WEI" defaultValue={value} onChange={(e: any) => onChange('value', e.currentTarget.value)} />
                    </FormControl>
                </ScaleFade>
            </Box>
        </SlideFade>
    )
}