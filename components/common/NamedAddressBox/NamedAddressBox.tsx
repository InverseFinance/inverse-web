import { Box, BoxProps } from '@chakra-ui/react';
import { useNamedAddress } from '@app/hooks/useNamedAddress';

export const NamedAddressBox = ({ children, ...props }: BoxProps) => {
    const { addressName } = useNamedAddress(children as string);
    return <Box {...props}>{addressName}</Box>
}