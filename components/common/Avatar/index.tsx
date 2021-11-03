import { Flex, Image } from '@chakra-ui/react'
import makeBlockie from 'ethereum-blockies-base64'

export const Avatar = ({ address, boxSize }: { address: string; boxSize: number }) => (
  <Flex h={boxSize} w={boxSize}>
    <Image borderRadius={64} src={makeBlockie(address)} />
  </Flex>
)
