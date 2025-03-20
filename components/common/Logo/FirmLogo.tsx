import { useAppTheme } from '@app/hooks/useAppTheme';
import { Image, ImageProps } from '@chakra-ui/react'

const firmImages = {
  'dark': 'firm-final-logo-white.png',
  'light': 'firm-final-logo.png',
}

export const FirmLogo = ({  
  ...props
}: {
 
} & ImageProps) => {
  const { themeName } = useAppTheme();
  return <Image transform="translateY(6px)" src={`/assets/firm/${firmImages[themeName]}`} w='110px' h="50px"  {...props} />;
}

export default FirmLogo
