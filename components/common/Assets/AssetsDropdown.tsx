import { Stack, PopoverContent, PopoverTrigger, Popover, PopoverBody } from '@chakra-ui/react';

type AssetsDropdownProps = {
    children: React.ReactNode,
    label: React.ReactNode,
    isOpen: boolean,
    onClose: () => void,
    onOpen: () => void,
    noPadding?: boolean,
}

export const AssetsDropdown = ({ children, label, isOpen, onOpen, onClose, noPadding }: AssetsDropdownProps) => {
    return (
        <Popover placement="bottom" isOpen={isOpen} onClose={onClose} closeOnBlur={true} isLazy>
            <PopoverTrigger>
                <Stack
                    direction="row"
                    align="center"
                    onClick={onOpen}
                    borderRadius={8}
                    p={noPadding ? 0 : 2}
                    bgColor="purple.850"
                    cursor="pointer"
                >
                    {label}
                </Stack>
            </PopoverTrigger>
            <PopoverContent _focus={{ outline: 'none' }} borderWidth={0} bgColor="transparent">
                <PopoverBody
                    p={2}
                    mt={-1}
                    bgColor="purple.800"
                    borderColor="purple.850"
                    borderWidth={2}
                    borderRadius={8}
                    boxShadow="rgba(0, 0, 0, 0.75) 0px 5px 15px"
                    _focus={{ outline: 'none' }}
                >
                    {children}
                </PopoverBody>
            </PopoverContent>
        </Popover>
    )
}