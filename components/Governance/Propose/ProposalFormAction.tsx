import { ProposalFormActionFields, AutocompleteItem } from '@app/types';
import { FormControl, FormLabel, Text, Box, Flex, Divider, SlideFade, ScaleFade, useDisclosure, Input, Textarea, Stack } from '@chakra-ui/react';
import { CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { ProposalInput } from './ProposalInput';
import { isAddress, FunctionFragment, id } from 'ethers/lib/utils';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { Autocomplete } from '@app/components/common/Input/Autocomplete';
import { getRemoteAbi } from '@app/util/etherscan';
import { useEffect, useState } from 'react';
import ScannerLink from '@app/components/common/ScannerLink';
import { ProposalFormFuncArg } from './ProposalFormFuncArg';
import { AddressAutocomplete } from '@app/components/common/Input/AddressAutocomplete';
import { getFunctionFromProposalAction, getArgs, getCallData } from '@app/util/governance';
import { ProposalActionPreview } from '../ProposalActionPreview';
import { WarningMessage } from '@app/components/common/Messages';
import { Modal } from '@app/components/common/Modal';
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton';

export const ProposalFormAction = ({
    action,
    index,
    onChange,
    onDelete,
    onDuplicate,
    onFuncChange,
    onRawApply,
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
    onRawApply: (partialAction: Partial<ProposalFormActionFields>) => void,
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
    const { isOpen: isRawOpen, onOpen: onRawOpen, onClose: onRawClose } = useDisclosure();
    const [rawSignature, setRawSignature] = useState('');
    const [rawCallData, setRawCallData] = useState('');
    const [rawValue, setRawValue] = useState('');
    const [rawError, setRawError] = useState('');

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

    const handleRawOpen = () => {
        setRawSignature(func || '');
        setRawValue(value || '');
        setRawError('');
        let prefillCallData = '';
        try {
            if (action.fragment && action.args?.length) {
                prefillCallData = getCallData(action);
            }
        } catch (e) { }
        setRawCallData(prefillCallData);
        onRawOpen();
    }

    const handleRawApply = () => {
        try {
            setRawError('');
            const fragment = FunctionFragment.from(rawSignature.trim());
            let callDataHex = rawCallData.trim();
            if (callDataHex) {
                if (!callDataHex.startsWith('0x')) {
                    callDataHex = '0x' + callDataHex;
                }
                // Strip the 4-byte function selector if present
                const selector = id(fragment.format('sighash')).slice(0, 10);
                if (callDataHex.toLowerCase().startsWith(selector.toLowerCase())) {
                    callDataHex = '0x' + callDataHex.slice(10);
                }
            }
            const parsedArgs = callDataHex
                ? getArgs(fragment, callDataHex)
                : fragment.inputs.map(v => ({ type: v.type, value: '', name: v.name }));
            onRawApply({ func: fragment.format('sighash'), fragment, args: parsedArgs, value: rawValue });
            onRawClose();
            setHideBody(true);
        } catch (e: any) {
            setRawError(e.message || 'Invalid signature or call data');
        }
    }

    let previewFunc = null
    try {
        previewFunc = getFunctionFromProposalAction(action)
    } catch (e) {
        console.log(e)
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
                    <Text
                        ml="2"
                        cursor="pointer"
                        color="purple.300"
                        fontSize="12"
                        fontWeight="bold"
                        onClick={handleRawOpen}
                        _hover={{ color: 'purple.200' }}
                        userSelect="none"
                    >
                        RAW
                    </Text>
                    {
                        notInAbiWarning ?
                            <WarningMessage
                                description="Function to call not found in contract ABI fetched from Etherscan !"
                                alertProps={{ p: "1", position: "absolute", right: "8", fontSize: "12px" }} />
                            : ''
                    }
                    <DeleteIcon position="absolute" right="0" ml="2" cursor="pointer" color="red.400" onClick={handleDelete} />
                </Flex>

                <Modal
                    isOpen={isRawOpen}
                    onClose={onRawClose}
                    header="Raw Action Input"
                    footer={
                        <RSubmitButton onClick={handleRawApply}>
                            Apply
                        </RSubmitButton>
                    }
                >
                    <Stack p="4" spacing="4">
                        <FormControl>
                            <FormLabel fontSize="sm">Function Signature</FormLabel>
                            <Input
                                fontSize="12"
                                placeholder="transfer(address,uint256)"
                                value={rawSignature}
                                onChange={(e) => setRawSignature(e.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Raw Call Data</FormLabel>
                            <Textarea
                                fontSize="12"
                                placeholder="Data with or without the 4-byte function selector prepended and with or without the 0x prefix."
                                value={rawCallData}
                                onChange={(e) => setRawCallData(e.target.value)}
                                rows={4}
                                fontFamily="mono"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Value <Text as="span" fontWeight="normal" fontSize="xs" color="gray.400">(in WEI, optional)</Text></FormLabel>
                            <Input
                                fontSize="12"
                                placeholder="0"
                                value={rawValue}
                                onChange={(e) => setRawValue(e.target.value)}
                            />
                        </FormControl>
                        {rawError && (
                            <WarningMessage alertProps={{ fontSize: '12px', p: '2' }} description={rawError} />
                        )}
                    </Stack>
                </Modal>
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