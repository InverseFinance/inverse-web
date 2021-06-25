import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/Avatar'
import Container from '@inverse/components/Container'
import { DelegatesModal } from '@inverse/components/Governance/GovernanceModals'
import { SkeletonList } from '@inverse/components/Skeleton'
import { useDelegates } from '@inverse/hooks/useDelegates'
import { Delegate } from '@inverse/types'
import { smallAddress } from '@inverse/util'

export const DelegatesPreview = () => {
  const { delegates } = useDelegates()
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!delegates) {
    return (
      <Container label="Top Delegates">
        <SkeletonList />
      </Container>
    )
  }

  return (
    <Container label="Top Delegates">
      <Stack w="full">
        {delegates.slice(0, 5).map(({ address, balance, delegators, votes }: Delegate) => (
          <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'purple.900' }}>
            <Stack direction="row" align="center">
              <Avatar address={address} boxSize={7} />
              <Flex direction="column">
                <Text fontSize="sm" fontWeight="semibold">
                  {smallAddress(address)}
                </Text>
              </Flex>
            </Stack>
            <Flex direction="column" align="flex-end">
              <Text fontSize="sm" fontWeight="semibold">
                {balance.toFixed(2)}
              </Text>
              <Text fontSize="sm" color="purple.100">
                {`${delegators.length} delegators`}
              </Text>
            </Flex>
          </Flex>
        ))}
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
          onClick={onOpen}
          _hover={{ bgColor: 'purple.900' }}
        >
          View All
        </Flex>
      </Stack>
      <DelegatesModal isOpen={isOpen} onClose={onClose} />
    </Container>
  )
}
