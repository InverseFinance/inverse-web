import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { AddressZero } from '@ethersproject/constants'
import { Web3Provider } from '@ethersproject/providers'
import { Avatar } from '@inverse/components/common/Avatar'
import Container from '@inverse/components/common/Container'
import { ChangeDelegatesModal } from '@inverse/components/Governance'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { namedAddress } from '@inverse/util'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'
import { SubmitDelegationsModal } from './GovernanceModals'
import Link from '@inverse/components/common/Link'

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

const DelegatingTo = ({ label, delegate, account, chainId }: { label: string, delegate: string, chainId?: string, account?: string }) => {
  return (
    <VotingWalletField label={label}>
      {delegate === AddressZero ? (
        <Text color="error">Nobody</Text>
      ) : delegate === account ? (
        <Text>Self</Text>
      ) : (
        <Stack direction="row" align="center">
          <Avatar address={delegate} boxSize={5} />
          <Text>{namedAddress(delegate, chainId)}</Text>
        </Stack>
      )}
    </VotingWalletField>
  )
}

export const VotingWallet = ({ address, onNewDelegate }: { address?: string, onNewDelegate?: (newDelegate: string) => void }) => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { INV, XINV } = getNetworkConfigConstants(chainId)
  const { data } = useEtherSWR([
    [INV, 'balanceOf', account],
    [XINV, 'balanceOf', account],
    [XINV, 'exchangeRateStored'],
    [INV, 'getCurrentVotes', account],
    [XINV, 'getCurrentVotes', account],
    [INV, 'delegates', account],
    [XINV, 'delegates', account],
  ])
  const { isOpen: changeDelIsOpen, onOpen: changeDelOnOpen, onClose: changeDelOnClose } = useDisclosure()
  const { isOpen: submitDelIsOpen, onOpen: submitDelOnOpen, onClose: submitDelOnClose } = useDisclosure()

  if (!account || !data) {
    return <></>
  }

  const [invBalance, xinvBalance, exchangeRate, currentVotes, currentVotesX, invDelegate, xinvDelegate] = data

  const votingPower = parseFloat(formatUnits(currentVotes || 0)) + parseFloat(formatUnits(currentVotesX || 0)) * parseFloat(formatUnits(exchangeRate || '1'));

  return (
    <Container label="Your Voting Power">
      <Stack w="full">
        <Flex w="full" alignItems="center" justify="center">
          <Avatar address={account} boxSize={5} />
          <Link href={`/governance/delegates/${account}`}
            ml="2"
            alignItems="center"
            fontSize="sm"
            fontWeight="medium"
            color="purple.100"
            textDecoration="underline">
            {namedAddress(account, chainId)}
          </Link>
        </Flex>
        <VotingWalletField label="INV">
          {(invBalance ? parseFloat(formatUnits(invBalance)) : 0).toFixed(4)}
        </VotingWalletField>
        <VotingWalletField label="xINV">
          {(xinvBalance ? parseFloat(formatUnits(xinvBalance)) * parseFloat(formatUnits(exchangeRate)) : 0).toFixed(4)}
        </VotingWalletField>
        <VotingWalletField label="Voting Power">{votingPower.toFixed(4)}</VotingWalletField>
        <DelegatingTo label={invDelegate === xinvDelegate ? 'Delegating To' : 'Delegating INV to'}
          delegate={invDelegate} account={account} chainId={chainId?.toString()} />
        {
          invDelegate !== xinvDelegate ?
            <DelegatingTo label={'Delegating xINV to'}
              delegate={xinvDelegate} account={account} chainId={chainId?.toString()} />
            : null
        }
        <Flex
          w="full"
          pt="4"
          justify='space-around'
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
        >
          <Text _hover={{ color: 'secondary' }} cursor="pointer" onClick={changeDelOnOpen}>
            Change Delegate
          </Text>
          <Text _hover={{ color: 'secondary' }} cursor="pointer" onClick={submitDelOnOpen}>
            Submit Signatures
          </Text>
        </Flex>
      </Stack>
      <ChangeDelegatesModal isOpen={changeDelIsOpen} onClose={changeDelOnClose} />
      <SubmitDelegationsModal isOpen={submitDelIsOpen} onClose={submitDelOnClose} onNewDelegate={onNewDelegate} />
    </Container>
  )
}
