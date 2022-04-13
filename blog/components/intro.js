import { Flex } from '@chakra-ui/react'
import LangsSelector from './langs-selector'

export default function Intro() {
  return (
    <Flex alignItems="center" justifyContent="space-between" my="10">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight md:pr-8">
        Inverse Finance Blog
      </h1>
      <LangsSelector />
    </Flex>
  )
}
