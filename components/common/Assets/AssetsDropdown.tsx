import { Stack, PopoverContent, PopoverTrigger, Popover, PopoverBody, Input, VStack } from '@chakra-ui/react';

type AssetsDropdownProps = {
    children: React.ReactNode,
    label: React.ReactNode,
    isOpen: boolean,
    onClose: () => void,
    onOpen: () => void,
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    noPadding?: boolean,
    withSearch?: boolean,
}

export const AssetsDropdown = ({ children, label, isOpen, onOpen, onClose, withSearch = false, noPadding, onSearchChange }: AssetsDropdownProps) => {
    return (
        <Popover placement="bottom" isOpen={isOpen} onClose={onClose} closeOnBlur={true} isLazy>
            <PopoverTrigger>
                <Stack
                    direction="row"
                    align="center"
                    onClick={onOpen}
                    borderRadius={8}
                    p={noPadding ? 0 : 2}
                    bgColor="primary.850"
                    cursor="pointer"
                >
                    {label}
                </Stack>
            </PopoverTrigger>
            <PopoverContent _focus={{ outline: 'none' }} borderWidth={0} bgColor="transparent">
                <PopoverBody
                    p={2}
                    mt={-1}
                    bgColor="primary.800"
                    borderColor="primary.850"
                    borderWidth={2}
                    borderRadius={8}
                    boxShadow="rgba(0, 0, 0, 0.75) 0px 5px 15px"
                    _focus={{ outline: 'none' }}
                    maxH="300px"
                    overflow="auto"
                >
                    <VStack w='full' spacing={2} alignItems='flex-start'>
                        {withSearch && !!onSearchChange && <Input placeholder="Search" onChange={onSearchChange} />}
                        <VStack w='full' spacing={0} alignItems='flex-start'>
                            {children}
                        </VStack>
                    </VStack>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    )
}