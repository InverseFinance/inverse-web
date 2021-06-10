import { Image } from '@chakra-ui/react'

type LogoProps = {
  boxSize: number
}

export const Logo = ({ boxSize }: LogoProps) => (
  <Image src="/assets/inverse.png" w={boxSize} h={boxSize} filter="brightness(0) invert(1)" />
)

export default Logo
