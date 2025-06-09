import { SvgAnimIcon, AnimIconProps } from '.';
import landingLottie from '@app/public/assets/landing/animation.json';
import landingMobileLottie from '@app/public/assets/landing/mobile-animation.json';

export const LandingAnimation = (props: AnimIconProps) => <SvgAnimIcon {...props} animData={landingLottie} />
export const LandingMobileAnimation = (props: AnimIconProps) => <SvgAnimIcon {...props} animData={landingMobileLottie} />