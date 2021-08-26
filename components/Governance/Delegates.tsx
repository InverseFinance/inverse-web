import { Flex, Stack, Text } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/Avatar'
import Container from '@inverse/components/Container'
import { SkeletonList } from '@inverse/components/Skeleton'
import { useDelegates, useTopDelegates } from '@inverse/hooks/useDelegates'
import { Delegate, Delegator } from '@inverse/types'
import { namedAddress } from '@inverse/util'
import NextLink from 'next/link'

export const DelegatesPreview = () => {
  const { delegates, isLoading } = useTopDelegates()

  if (isLoading) {
    return (
      <Container label="Top Delegates">
        <SkeletonList />
      </Container>
    )
  }

  return (
    <Container label="Top Delegates">
      <Stack w="full">
        {delegates.slice(0, 5).map(({ address, ensName, votingPower, delegators, votes }: Delegate) => (
          <NextLink key={address} href={`/governance/delegates/${address}`}>
            <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'purple.900' }}>
              <Stack direction="row" align="center">
                <Avatar address={address} boxSize={7} />
                <Flex direction="column" w={40}>
                  <Text fontSize="sm" fontWeight="semibold" isTruncated>
                    {namedAddress(address, ensName)}
                  </Text>
                  <Text fontSize="sm" color="purple.100">
                    {`${votes.length} votes`}
                  </Text>
                </Flex>
              </Stack>
              <Flex direction="column" align="flex-end">
                <Text fontSize="sm" fontWeight="semibold">
                  {votingPower.toFixed(2)}
                </Text>
                <Text fontSize="sm" color="purple.100">
                  {`${delegators.length} delegators`}
                </Text>
              </Flex>
            </Flex>
          </NextLink>
        ))}
        <NextLink href="/governance/delegates" passHref>
          <Flex
            cursor="pointer"
            w="full"
            p={2}
            justify="center"
            fontSize="xs"
            fontWeight="semibold"
            borderRadius={8}
            textTransform="uppercase"
            color="purple.100"
            _hover={{ bgColor: 'purple.900' }}
          >
            View All
          </Flex>
        </NextLink>
      </Stack>
    </Container>
  )
}

export const DelegatorsPreview = ({ address }: { address: string }) => {
  const { delegates, isLoading } = useDelegates()

  if (isLoading || !delegates || !delegates[address]) {
    return (
      <Container label="Delegators">
        <SkeletonList />
      </Container>
    )
  }

  const { delegators } = delegates[address]

  return (
    <Container label="Delegators">
      <Stack w="full">
        {delegators.slice(0, 5).map((address: Delegator) => (
          <NextLink key={address} href={`/governance/delegates/${address}`}>
            <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'purple.900' }}>
              <Stack direction="row" align="center">
                <Avatar address={address} boxSize={7} />
                <Flex direction="column">
                  <Text fontSize="sm" fontWeight="semibold" isTruncated>
                    {namedAddress(address)}
                  </Text>
                </Flex>
              </Stack>
            </Flex>
          </NextLink>
        ))}
        <NextLink href="/governance/delegates" passHref>
          <Flex
            cursor="pointer"
            w="full"
            p={2}
            justify="center"
            fontSize="xs"
            fontWeight="semibold"
            borderRadius={8}
            textTransform="uppercase"
            color="purple.100"
            _hover={{ bgColor: 'purple.900' }}
          >
            View All
          </Flex>
        </NextLink>
      </Stack>
    </Container>
  )
}
