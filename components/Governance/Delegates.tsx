import { Flex, FlexProps, Stack, Text } from '@chakra-ui/react'
import { Avatar } from '@app/components/common/Avatar'
import Container from '@app/components/common/Container'
import { SkeletonList } from '@app/components/common/Skeleton'
import { useDelegates, useTopDelegates } from '@app/hooks/useDelegates'
import { Delegate, Delegator } from '@app/types'
import { namedAddress } from '@app/util'
import NextLink from 'next/link'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useNamedAddress } from '@app/hooks/useNamedAddress'

const DelegateName = ({address, chainId, ensName}: { address: string, chainId?: number | undefined, ensName?: string }) => {
  const { addressName } = useNamedAddress(address, chainId, ensName)
  return (
    <Text fontSize="sm" fontWeight="semibold" isTruncated>
      {addressName}
    </Text>
  )
}

export const DelegatesPreview = (containerProps: Partial<FlexProps>) => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { delegates, isLoading } = useTopDelegates()

  if (isLoading) {
    return (
      <Container label="Top Delegates" contentBgColor="gradient3" {...containerProps}>
        <SkeletonList />
      </Container>
    )
  }

  return (
    <Container label="Top Delegates" contentBgColor="gradient3" {...containerProps}>
      <Stack w="full">
        {
          delegates.slice(0, 5).map(({ address, ensName, votingPower, delegators, votes }: Delegate) => {
            return (
              <NextLink key={address} href={`/governance/delegates/${address}`} legacyBehavior>
                <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'primary.850' }}>
                  <Stack direction="row" align="center">
                    <Avatar address={address} sizePx={28} />
                    <Flex direction="column" w={40}>
                      <DelegateName address={address} chainId={chainId} ensName={ensName} />
                      <Text fontSize="sm" color="lightAccentTextColor">
                        {`${votes.length} votes`}
                      </Text>
                    </Flex>
                  </Stack>
                  <Flex direction="column" align="flex-end">
                    <Text fontSize="sm" fontWeight="semibold">
                      {votingPower.toFixed(2)}
                    </Text>
                    <Text style={{ whiteSpace: 'nowrap' }} fontSize="sm" color="lightAccentTextColor">
                      {`${delegators.length} delegators`}
                    </Text>
                  </Flex>
                </Flex>
              </NextLink>
            );
          }
          )
        }
        <NextLink href="/governance/delegates" passHref legacyBehavior>
          <Flex
            cursor="pointer"
            w="full"
            p={2}
            justify="center"
            fontSize="xs"
            fontWeight="semibold"
            borderRadius={8}
            textTransform="uppercase"
            color="lightAccentTextColor"
            _hover={{ bgColor: 'primary.850' }}
          >
            View All
          </Flex>
        </NextLink>
      </Stack>
    </Container>
  );
}

export const DelegatorsPreview = ({ address }: { address: string }) => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { delegates, isLoading } = useDelegates()

  if (!isLoading && (!delegates || !delegates[address])) {
    return (
      <Container label="Delegators" contentBgColor="gradient3">
        None yet
      </Container>
    )
  }

  if (isLoading || !delegates || !delegates[address]) {
    return (
      <Container label="Delegators" contentBgColor="gradient3">
        <SkeletonList />
      </Container>
    )
  }

  const { delegators } = delegates[address]

  return (
    <Container label="Delegators" contentBgColor="gradient3">
      <Stack w="full">
        {delegators.slice(0, 5).map((address: Delegator) => (
          <NextLink key={address} href={`/governance/delegates/${address}`} legacyBehavior>
            <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'primary.850' }}>
              <Stack direction="row" align="center">
                <Avatar address={address} sizePx={28} />
                <Flex direction="column">
                  <Text fontSize="sm" fontWeight="semibold" isTruncated>
                    {namedAddress(address, chainId)}
                  </Text>
                </Flex>
              </Stack>
            </Flex>
          </NextLink>
        ))}
        <NextLink href="/governance/delegates" passHref legacyBehavior>
          <Flex
            cursor="pointer"
            w="full"
            p={2}
            justify="center"
            fontSize="xs"
            fontWeight="semibold"
            borderRadius={8}
            textTransform="uppercase"
            color="lightAccentTextColor"
            _hover={{ bgColor: 'primary.850' }}
          >
            View All
          </Flex>
        </NextLink>
      </Stack>
    </Container>
  );
}
