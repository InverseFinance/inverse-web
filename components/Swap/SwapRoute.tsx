import { Badge, Box } from '@chakra-ui/react';

export const SwapRoute = ({ label, isBestRoute }: { label: string, isBestRoute: boolean }) => {
    return (
        <Box position="relative" px="3" py="3" fontSize={{ base: '10px', sm: '12px' }}>
            Via {label}
            {isBestRoute ?
                <Badge
                    bgColor="secondary"
                    textTransform="none"
                    fontSize="10px"
                    color="primary"
                    position="absolute"
                    top="-1"
                    right="-1"
                >
                    Best Rate
                </Badge> : null
            }
        </Box>
    )
}