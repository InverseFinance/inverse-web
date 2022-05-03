import { Flex } from '@chakra-ui/react'

export default function Intro() {
  return (
    <Flex alignItems="center" justifyContent="space-between" mb="10" mt={{ base: '5', sm: '0' }}>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight md:pr-8">
        Inverse Finance Blog
      </h1>
    </Flex>
  )
}
