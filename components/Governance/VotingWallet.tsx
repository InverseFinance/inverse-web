import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { AddressZero } from '@ethersproject/constants'
import { Web3Provider } from '@ethersproject/providers'
import { Avatar } from '@inverse/components/Avatar'
import Container from '@inverse/components/Container'
import { ChangeDelegatesModal } from '@inverse/components/Governance'
import { INV, XINV } from '@inverse/config'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { namedAddress } from '@inverse/util'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'

type VotingWalletFieldProps = {
  label: string
  children: React.ReactNode
}

const VotingWalletField = ({ label, children }: VotingWalletFieldProps) => (
  <Flex justify="space-between">
    <Text fontSize="sm" fontWeight="medium" color="purple.100">
      {label}
    </Text>
    <Flex fontWeight="medium" fontSize="sm">
      {children}
    </Flex>
  </Flex>
)

export const VotingWallet = ({ address }: { address?: string }) => {
  const { account } = useWeb3React<Web3Provider>()
  const { data } = useEtherSWR([
    [INV, 'balanceOf', account],
    [XINV, 'balanceOf', account],
    [XINV, 'exchangeRateStored'],
    [INV, 'getCurrentVotes', account],
    [INV, 'delegates', account],
  ])
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!account || !data) {
    return <></>
  }

  const [invBalance, xinvBalance, exchangeRate, currentVotes, delegate] = data

  const votingPower = currentVotes ? parseFloat(formatUnits(currentVotes)) : 0

  return (
    <Container label="Your Voting Wallet">
      <Stack w="full">
        <Stack w="full" direction="row" justify="center" align="center">
          <Avatar address={account} boxSize={5} />
          <Text mt={1} fontSize="sm" fontWeight="medium" color="purple.100">
            {namedAddress(account)}
          </Text>
        </Stack>
        <VotingWalletField label="INV">
          {(invBalance ? parseFloat(formatUnits(invBalance)) : 0).toFixed(4)}
        </VotingWalletField>
        <VotingWalletField label="xINV">
          {(xinvBalance ? parseFloat(formatUnits(xinvBalance)) * parseFloat(formatUnits(exchangeRate)) : 0).toFixed(4)}
        </VotingWalletField>
        <VotingWalletField label="Voting Power">{votingPower.toFixed(4)}</VotingWalletField>
        <VotingWalletField label="Delegating To">
          {delegate === AddressZero ? (
            <Text color="fail">Nobody</Text>
          ) : delegate === account ? (
            <Text>Self</Text>
          ) : (
            <Stack direction="row" align="center">
              <Avatar address={delegate} boxSize={5} />
              <Text>{namedAddress(delegate)}</Text>
            </Stack>
          )}
        </VotingWalletField>
        <Flex
          cursor="pointer"
          w="full"
          p={2}
          justify="center"
          fontSize="xs"
          fontWeight="semibold"
          borderRadius={8}
          textTransform="uppercase"
          bgColor={delegate === address ? 'purple.850' : ''}
          color="purple.100"
          onClick={delegate !== address ? onOpen : () => {}}
          _hover={{ bgColor: delegate !== address ? 'purple.850' : '' }}
        >
          {address
            ? address === delegate
              ? `Already delegated to ${namedAddress(address)}`
              : `Delegate to ${namedAddress(address)}`
            : 'Change Delegate'}
        </Flex>
      </Stack>
      <ChangeDelegatesModal isOpen={isOpen} onClose={onClose} address={address} />
    </Container>
  )
}
