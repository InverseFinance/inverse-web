import { AnimIcon, AnimIconProps } from '.';
// import landingLottie from '@app/public/assets/landing/animation.json';
import landingLottie from '@app/public/assets/lotties/plus.json';

export const LandingAnimation = (props: AnimIconProps) => <AnimIcon {...props} renderer="svg" animData={landingLottie} />