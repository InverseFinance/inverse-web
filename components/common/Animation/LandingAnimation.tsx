import { AnimIcon, AnimIconProps } from '.';
import landingLottie from '@app/public/assets/landing/animation.json';

export const LandingAnimation = (props: AnimIconProps) => <AnimIcon {...props} animData={landingLottie} />