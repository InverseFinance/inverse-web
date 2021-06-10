import { Image } from '@chakra-ui/react'

export const Logo = ({ boxSize }) => (
  <Image src="/assets/inverse.png" w={boxSize} h={boxSize} filter="brightness(0) invert(1)" />
)

export default Logo
