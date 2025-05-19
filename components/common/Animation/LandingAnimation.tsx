import { AnimIcon, AnimIconProps } from '.';
import landingLottie from '@app/public/assets/landing/animation.json';
import landingLottie2 from '@app/public/assets/landing/animation2.json';

export const LandingAnimation = (props: AnimIconProps) => <AnimIcon {...props} animData={landingLottie} />
export const LandingAnimation2 = (props: AnimIconProps) => <AnimIcon {...props} animData={landingLottie2} />