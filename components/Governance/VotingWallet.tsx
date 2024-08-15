import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { AddressZero } from '@ethersproject/constants'
import { Web3Provider } from '@ethersproject/providers'
import { Avatar } from '@app/components/common/Avatar'
import Container from '@app/components/common/Container'
import { ChangeDelegatesModal } from '@app/components/Governance'
import { getNetworkConfigConstants } from '@app/util/networks'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { namedAddress } from '@app/util'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'
import { SubmitDelegationsModal } from './GovernanceModals'
import Link from '@app/components/common/Link'
import { InfoMessage } from '@app/components/common/Messages'
import { useRouter } from 'next/dist/client/router'
import { useNamedAddress } from '@app/hooks/useNamedAddress'
import { useStakedInFirm } from '@app/hooks/useFirm'
import { BURN_ADDRESS } from '@app/config/constants'
import { FirmGovDelegationModal } from '../F2/GovToken/FirmGovToken'
import { getBnToNumber } from '@app/util/markets'

type VotingWalletFieldProps = {
  label: string
  children: React.ReactNode
}

const VotingWalletField = ({ label, children }: VotingWalletFieldProps) => (
  <Flex justify="space-between">
    <Text fontSize="sm" fontWeight="medium" color="secondaryTextColor">
      {label}
    </Text>
    <Flex fontWeight="medium" fontSize="sm" color="mainTextColor">
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
        <Text color="mainTextColor">Self</Text>
      ) : (
        <Stack direction="row" align="center">
          <Avatar address={delegate} sizePx={20} />
          <Text color="mainTextColor">{namedAddress(delegate, chainId)}</Text>
        </Stack>
      )}
    </VotingWalletField>
  )
}

export const VotingWallet = ({ address, onNewDelegate }: { address?: string, onNewDelegate?: (newDelegate: string) => void }) => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  const { addressName } = useNamedAddress(userAddress, chainId)
  const { INV, XINV } = getNetworkConfigConstants(chainId)
  const { data } = useEtherSWR([
    [INV, 'balanceOf', userAddress],
    [XINV, 'balanceOf', userAddress],
    [XINV, 'exchangeRateStored'],
    [INV, 'getCurrentVotes', userAddress],
    [XINV, 'getCurrentVotes', userAddress],
    [INV, 'delegates', userAddress],
    [XINV, 'delegates', userAddress],
  ])
  const { isOpen: changeDelIsOpen, onOpen: changeDelOnOpen, onClose: changeDelOnClose } = useDisclosure()
  const { isOpen: submitDelIsOpen, onOpen: submitDelOnOpen, onClose: submitDelOnClose } = useDisclosure()
  const { isOpen: isFirmModalOpen, onOpen: firmOnOpen, onClose: firmOnClose } = useDisclosure()

  const { stakedInFirm, delegate: firmDelegate, escrow } = useStakedInFirm(userAddress);
  const firmInvDelegated = firmDelegate?.toLowerCase() === userAddress?.toLowerCase() ? stakedInFirm : 0;

  if (!account || !data || !userAddress) {
    return <></>
  }

  const [invBalance, xinvBalance, exchangeRate, currentVotes, currentVotesX, invDelegate, xinvDelegate] = data

  const votingPower = parseFloat(formatUnits(currentVotes || 0)) + parseFloat(formatUnits(currentVotesX || 0)) * parseFloat(formatUnits(exchangeRate || '1'));

  const needToShowXinvDelegate = parseFloat(formatUnits(xinvBalance)) > 0 && invDelegate !== xinvDelegate
  const hasFirmEscrow = !!escrow && !!escrow.replace(BURN_ADDRESS, '');
  const rtokenSymbol = process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL!;
  const needToShowNonFirmDelegateCta = data ? getBnToNumber(invBalance) >= 1 || getBnToNumber(xinvBalance) >= 1 : false;

  return (
    <Container label="Your Current Voting Power" contentBgColor="gradient3">
      <Stack w="full">
        <Flex w="full" alignItems="center" justify="center">
          <Avatar address={userAddress} sizePx={20} />
          <Link href={`/governance/delegates/${userAddress}`}
            ml="2"
            alignItems="center"
            fontSize="sm"
            fontWeight="medium"
            color="secondaryTextColor"
            textDecoration="underline">
            {addressName}
          </Link>
        </Flex>
        <VotingWalletField label={rtokenSymbol}>
          {(invBalance ? parseFloat(formatUnits(invBalance)) : 0).toFixed(4)}
        </VotingWalletField>
        <VotingWalletField label={`Eligible x${rtokenSymbol}`}>
          {(xinvBalance || firmInvDelegated ? parseFloat(formatUnits(xinvBalance)) * parseFloat(formatUnits(exchangeRate)) + firmInvDelegated : 0).toFixed(4)}
        </VotingWalletField>
        <VotingWalletField label="Voting Power">{votingPower.toFixed(4)}</VotingWalletField>
        <DelegatingTo label={!needToShowXinvDelegate ? 'Delegating To' : `Delegating ${rtokenSymbol} to`}
          delegate={invDelegate} account={userAddress} chainId={chainId?.toString()} />
        {
          needToShowXinvDelegate ?
            <>
              <DelegatingTo label={`Delegating x${rtokenSymbol} to`}
                delegate={xinvDelegate} account={userAddress} chainId={chainId?.toString()} />
              <InfoMessage alertProps={{ fontSize: '12px' }}
                description={`Your x${rtokenSymbol} delegation is out of sync with ${rtokenSymbol}, you can sync them by doing the delegation process`} />
            </>
            : null
        }
        {
          stakedInFirm > 0 && <DelegatingTo label={'FiRM Delegating To'}
            delegate={firmDelegate} account={userAddress} chainId={chainId?.toString()} />
        }
        {
          hasFirmEscrow && <Text mt="2" fontSize="md" fontWeight="semibold" textTransform="uppercase" textAlign="center" textDecoration="underline" _hover={{ color: 'secondary' }} cursor="pointer" onClick={firmOnOpen}>
            Change {needToShowNonFirmDelegateCta ? 'FiRM INV' : 'INV'} Delegate
          </Text>
        }
        <Flex
          w="full"
          justify='space-around'
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
        >
          {
            needToShowNonFirmDelegateCta && <Text textDecoration="underline" _hover={{ color: 'secondary' }} cursor="pointer" onClick={changeDelOnOpen}>
              Change INV Delegate
            </Text>
          }
          <Text textDecoration="underline" _hover={{ color: 'secondary' }} cursor="pointer" onClick={submitDelOnOpen}>
            Submit INV Signatures
          </Text>
        </Flex>
      </Stack>
      {
        stakedInFirm > 0 && <FirmGovDelegationModal
          isOpen={isFirmModalOpen}
          onClose={firmOnClose}
          delegatingTo={firmDelegate}
          suggestedValue={invDelegate?.replace(BURN_ADDRESS, '')}
          escrow={escrow}
        />
      }
      <ChangeDelegatesModal isOpen={changeDelIsOpen} onClose={changeDelOnClose} />
      <SubmitDelegationsModal isOpen={submitDelIsOpen} onClose={submitDelOnClose} onNewDelegate={onNewDelegate} />
    </Container>
  )
}
