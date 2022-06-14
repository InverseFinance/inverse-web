import { Image } from '@chakra-ui/react'

export const Logo = ({ boxSize }: { boxSize: number }) => (
  <Image ignoreFallback={true} alt="Logo" src="/assets/logo.png" w={boxSize} h={boxSize} filter="brightness(0) invert(1)" />
)

export default Logo
