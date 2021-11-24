import successLottie from '@inverse/public/assets/lotties/success.json';
import { Animation, AnimProps } from '.';
import { Box, BoxProps } from '@chakra-ui/react';

export const SuccessAnimIcon = ({ height = 20, width = 20, loop = false, boxProps }: Partial<AnimProps> & { boxProps?: BoxProps }) => {
    return <Box display="inline-block" w={`${width}px`} h={`${height}px`} {...boxProps}>
        <Animation animData={successLottie} height={height} width={width} loop={loop} />
    </Box>;
}