import { useAppTheme } from '@app/hooks/useAppTheme';
import { Image } from '@chakra-ui/react'

export const Logo = ({ boxSize, noFilter }: { boxSize: number, noFilter: boolean }) => {
  const { themeName } = useAppTheme();
  return <Image ignoreFallback={true} alt="Logo" src="/assets/logo.png" w={boxSize} h={boxSize}
    filter={
      noFilter ? undefined : themeName === 'dark' ? 'brightness(0) invert(1)' : 'grayscale(1)'
    }
     />
}

export default Logo
