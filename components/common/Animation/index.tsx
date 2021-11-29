import { Box, BoxProps } from '@chakra-ui/react';
import sigLottie from '@inverse/public/assets/lotties/signature.json';
import infoBubbleLottie from '@inverse/public/assets/lotties/info-bubble.json';
import errorLottie from '@inverse/public/assets/lotties/error.json';
import successLottie from '@inverse/public/assets/lotties/success.json';
import warningLottie from '@inverse/public/assets/lotties/warning.json';
import Lottie from 'react-lottie';

export type AnimProps = {
    animData: Object,
    height?: number,
    width?: number,
    loop?: boolean,
}

export const Animation = ({ animData, height = 30, width = 30, loop = false }: AnimProps) => {
    return (
        <Lottie
            options={{
                loop: loop,
                animationData: animData,
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid slice'
                },
            }}
            height={height}
            width={width}
        />
    )
}

type AnimIconProps = Partial<AnimProps> & { boxProps?: BoxProps }

export const AnimIcon = ({ animData = infoBubbleLottie, height = 20, width = 20, loop = false, boxProps }: AnimIconProps) => {
    return <Box display="inline-block" w={`${width}px`} h={`${height}px`} {...boxProps} alignItems="center" justifyContent="center">
        <Animation animData={animData} height={height} width={width} loop={loop} />
    </Box>;
}

export const SignatureAnim = (props: AnimIconProps) => <AnimIcon {...props} animData={sigLottie} />
export const ErrorAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={errorLottie} />
export const WarningAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={warningLottie} />
export const InfoAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={infoBubbleLottie} />
export const SuccessAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={successLottie} />