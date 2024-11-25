import { Box, BoxProps } from '@chakra-ui/react';
import sigLottie from '@app/public/assets/lotties/signature.json';
import infoBubbleLottie from '@app/public/assets/lotties/info-bubble.json';
import errorLottie from '@app/public/assets/lotties/error.json';
import successLottie from '@app/public/assets/lotties/success.json';
import warningLottie from '@app/public/assets/lotties/warning.json';
import inverseLottie from '@app/public/assets/lotties/inverse.json';
import launchLottie from '@app/public/assets/lotties/launch.json';
import confettiLottie from '@app/public/assets/lotties/confetti.json';
import dynamic from 'next/dynamic';
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import { useEffect, useState } from 'react';

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
    const [inited, setInited] = useState(false);
    useEffect(() => {
        setInited(true);
    }, []);
    return (
        <Box height={`${height}px`} width={`${width}px`}>
            {
                inited && <Lottie
                    loop={loop}
                    autoplay={autoplay}
                    animationData={animData}
                    rendererSettings={{
                        preserveAspectRatio: 'xMidYMid slice'
                    }}
                />
            }
        </Box>
    )
}

export type AnimIconProps = Partial<AnimProps> & { boxProps?: BoxProps, canClick?: boolean }

export const AnimIcon = ({ animData = infoBubbleLottie, height = 20, width = 20, loop = false, autoplay = true, isStopped, boxProps, canClick = false }: AnimIconProps) => {
    return <Box className={!canClick ? 'app-anim-box-no-pointer' : undefined} display="inline-block" w={`${width}px`} h={`${height}px`} {...boxProps} alignItems="center" justifyContent="center">
        <Animation animData={animData} height={height} width={width} loop={loop} autoplay={autoplay} isStopped={isStopped} />
    </Box>;
}

export const SignatureAnim = (props: AnimIconProps) => <AnimIcon {...props} animData={sigLottie} />
export const ErrorAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={errorLottie} />
export const WarningAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={warningLottie} />
export const InfoAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={infoBubbleLottie} />
export const SuccessAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={successLottie} />
export const InverseAnimIcon = (props: AnimIconProps) => <AnimIcon {...props} animData={inverseLottie} canClick={true} />
export const LaunchAnim = (props: AnimIconProps) => <AnimIcon {...props} animData={launchLottie} />
export const ConfettiAnim = (props: AnimIconProps) => <AnimIcon {...props} animData={confettiLottie} />