import { Flex, useDisclosure } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { SubmitButton } from '@inverse/components/common/Button'
import { VoteModal } from '@inverse/components/Governance/GovernanceModals'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { ProposalStatus, Proposal, NetworkIds, GovEra } from '@inverse/types'
import { getGovernanceAddress } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'
import { InfoMessage } from '@inverse/components/common/Messages'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { useRouter } from 'next/dist/client/router';

const { INV, XINV, GOVERNANCE } = getNetworkConfigConstants(NetworkIds.mainnet)

export const VoteButton = ({ proposal }: { proposal: Proposal }) => {
  const { active, account, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.simAddress as string) || account;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const govAddress = getGovernanceAddress(proposal.era, chainId);
  const { data } = useEtherSWR([govAddress, 'getReceipt', proposal?.id, userAddress]);

  const { data: snapshotVotingPowerData } = useEtherSWR([
    // xinvExchangeRates exists in gov contract starting from mills only
    [proposal.era === GovEra.alpha ? GOVERNANCE : govAddress, 'xinvExchangeRates', proposal?.id],
    [INV, 'getPriorVotes', userAddress, proposal?.startBlock],
    [XINV, 'getPriorVotes', userAddress, proposal?.startBlock],
  ])

  if (!active || !account || !data || !proposal?.id || !snapshotVotingPowerData || !userAddress) {
    return <></>
  }

  const [exchangeRate, currentVotes, currentVotesX] = snapshotVotingPowerData || [1, 0, 0];
  const snapshotVotingPower = parseFloat(formatUnits(currentVotes || 0))
    + parseFloat(formatUnits(currentVotesX || 0)) * parseFloat(formatUnits(exchangeRate || '1'));

  const { status } = proposal;

  const hasVoted = data[0]
  const votes = hasVoted ? parseFloat(formatUnits(data[2])).toFixed(2) : 0
  const support = hasVoted && data[1]

  return (
    <Flex w="full" m={6} mt={9} mb={0} flexDirection="column">
      {
        status === ProposalStatus.active && !hasVoted ?
          <>
            <SubmitButton disabled={snapshotVotingPower === 0} color="#fff" onClick={onOpen}>
              Cast Vote
            </SubmitButton>
            <InfoMessage alertProps={{ w: 'full', mt: "2", fontSize: '12px' }}
              description={`Your Voting Power for this proposal : ${(snapshotVotingPower||0)?.toFixed(2)}`}
            />
          </>
          :
          <InfoMessage
            alertProps={{ w: 'full', mt: "2", fontSize: '12px' }}
            description={
              hasVoted ?
                `You voted ${support ? '"For"' : '"Against"'} with ${votes} voting power`
                :
                'You did not vote for this proposal'
            }
          />
      }
      <VoteModal isOpen={isOpen} onClose={onClose} proposal={proposal} />
    </Flex>
  )
}
