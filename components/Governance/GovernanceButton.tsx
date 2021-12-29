import { useState } from 'react';
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
import { executeProposal, queueProposal } from '@inverse/util/governance';
import { handleTx } from '@inverse/util/transactions';
import { showToast } from '@inverse/util/notify';
import { useEffect } from 'react';

const { INV, XINV, GOVERNANCE } = getNetworkConfigConstants(NetworkIds.mainnet)

const proposalCompletionMethods: any = {
  [ProposalStatus.succeeded]: queueProposal,
  [ProposalStatus.queued]: executeProposal,
}

export const VoteButton = ({ proposal }: { proposal: Proposal }) => {
  const { active, account, chainId, library } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const govAddress = getGovernanceAddress(proposal.era, chainId);
  const { data } = useEtherSWR([govAddress, 'getReceipt', proposal?.id, userAddress]);
  const [liveStatus, setLiveStatus] = useState<ProposalStatus>(proposal.status)

  useEffect(() => {
    if(!proposal.status) { return }
    setLiveStatus(proposal.status)
  }, [proposal.status])

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

  const hasVoted = data[0]
  const votes = hasVoted ? parseFloat(formatUnits(data[2])).toFixed(2) : 0
  const support = hasVoted && data[1]

  const handleCompletionSuccess = () => {
    if (liveStatus === ProposalStatus.succeeded) { setLiveStatus(ProposalStatus.queued) }
    else if (liveStatus === ProposalStatus.queued) { setLiveStatus(ProposalStatus.executed) }
    // proposal data is updated by cron job every 15min
    showToast({
      status: 'info',
      duration: 15000,
      title: 'Data updating...',
      description: 'It can take up to 15min for governance data to update on the site',
    })
  }

  const handleCompletion = async () => {
    const tx = await proposalCompletionMethods[liveStatus](library?.getSigner(), proposal.era, proposal.id);
    return handleTx(tx, { onSuccess: () => handleCompletionSuccess })
  }

  const isExecuteDisabled = liveStatus !== ProposalStatus.queued || (Date.now() < proposal.etaTimestamp)

  return (
    <Flex w="full" m={6} mt={9} mb={0} flexDirection="column">
      {
        liveStatus === ProposalStatus.active && !hasVoted ?
          <>
            <SubmitButton disabled={snapshotVotingPower === 0} color="#fff" onClick={onOpen}>
              Cast Vote
            </SubmitButton>
            <InfoMessage alertProps={{ w: 'full', mt: "2", fontSize: '12px' }}
              description={`Your Voting Power for this proposal : ${(snapshotVotingPower || 0)?.toFixed(2)}`}
            />
          </>
          :
          <>
            {
              liveStatus === ProposalStatus.succeeded || liveStatus === ProposalStatus.queued ?
                <SubmitButton isDisabled={isExecuteDisabled} color="#fff" onClick={handleCompletion}>
                  {liveStatus === ProposalStatus.succeeded ? 'Queue Proposal' : 'Execute Proposal'}
                </SubmitButton>
                :
                null
            }
            <InfoMessage
              alertProps={{ w: 'full', mt: "2", fontSize: '12px' }}
              description={
                hasVoted ?
                  `You voted ${support ? '"For"' : '"Against"'} with ${votes} voting power`
                  :
                  'You did not vote for this proposal'
              }
            />
          </>
      }
      <VoteModal isOpen={isOpen} onClose={onClose} proposal={proposal} />
    </Flex>
  )
}
