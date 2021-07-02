import { Flex, Stack, Text } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/Avatar'
import Container from '@inverse/components/Container'
import { SkeletonList } from '@inverse/components/Skeleton'
import { useTopDelegates } from '@inverse/hooks/useDelegates'
import { Delegate } from '@inverse/types'
import { smallAddress } from '@inverse/util'
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
        {delegates.slice(0, 5).map(({ address, votingPower, delegators, votes }: Delegate) => (
          <NextLink href={`/governance/delegates/${address}`}>
            <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'purple.900' }}>
              <Stack direction="row" align="center">
                <Avatar address={address} boxSize={7} />
                <Flex direction="column">
                  <Text fontSize="sm" fontWeight="semibold">
                    {smallAddress(address)}
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
