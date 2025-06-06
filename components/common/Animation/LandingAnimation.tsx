import { AnimIcon, AnimIconProps } from '.';
import landingLottie from '@app/public/assets/landing/animation.json';
import landingMobileLottie from '@app/public/assets/landing/mobile-animation.json';

export const LandingAnimation = (props: AnimIconProps) => <AnimIcon {...props} renderer="svg" animData={landingLottie} />
export const LandingMobileAnimation = (props: AnimIconProps) => <AnimIcon {...props} renderer="svg" animData={landingMobileLottie} />