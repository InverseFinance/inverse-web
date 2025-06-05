import { useAppTheme } from '@app/hooks/useAppTheme';
import { Image, ImageProps } from '@chakra-ui/react'

const firmImages = {
  'dark': 'firm-final-logo-white.png',
  'light': 'firm-final-logo.png',
}

export const FirmLogo = ({  
  theme = '',
  ...props
}: {
  theme?: 'dark' | 'light' | ''
} & ImageProps) => {
  const { themeName } = useAppTheme();
  return <Image transform="translateY(6px)" src={`/assets/firm/${firmImages[theme || themeName]}`} w='110px' h="50px"  {...props} />;
}

export default FirmLogo
