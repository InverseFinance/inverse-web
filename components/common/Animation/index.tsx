import { Box, BoxProps } from '@chakra-ui/react';
import sigLottie from '@app/public/assets/lotties/signature.json';
import infoBubbleLottie from '@app/public/assets/lotties/info-bubble.json';
import errorLottie from '@app/public/assets/lotties/error.json';
import successLottie from '@app/public/assets/lotties/success.json';
import warningLottie from '@app/public/assets/lotties/warning.json';
import inverseLottie from '@app/public/assets/lotties/inverse.json';
import Lottie from 'react-lottie';

export type AnimProps = {
    animData: Object,
    height?: number,
    width?: number,
    loop?: boolean,
    autoplay?: boolean,
    isStopped?: boolean,
}

// some react-lottie features don't work with React 17
export const Animation = ({ animData, height = 30, width = 30, loop = false, autoplay = true, isStopped }: AnimProps) => {
    return (
        <Lottie
            options={{
                loop,
                autoplay,
                animationData: animData,
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid slice'
                },
            }}
            height={height}
            width={width}
            isStopped={isStopped ?? !autoplay}
        />
    )
}

export type AnimIconProps = Partial<AnimProps> & { boxProps?: BoxProps }

export const AnimIcon = ({ animData = infoBubbleLottie, height = 20, width = 20, loop = false, autoplay = true, isStopped, boxProps }: AnimIconProps) => {
    return <Box display="inline-block" w={`${width}px`} h={`${height}px`} {...boxProps} alignItems="center" justifyContent="center">
        <Animation animData={animData} height={height} width={width} loop={loop} autoplay={autoplay} isStopped={isStopped} />
    </Box>;
}

export const SignatureAnim = (props: AnimIconProps) => <AnimIcon {...props} animData={sigLottie} />
export const ErrorAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={errorLottie} />
export const WarningAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={warningLottie} />
export const InfoAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={infoBubbleLottie} />
export const SuccessAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={successLottie} />
export const InverseAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={inverseLottie} />