import { useState } from 'react';
import { Flex, useDisclosure } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { SubmitButton } from '@app/components/common/Button'
import { VoteModal } from '@app/components/Governance/GovernanceModals'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { ProposalStatus, Proposal, NetworkIds, GovEra } from '@app/types'
import { getGovernanceAddress } from '@app/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { commify, formatUnits } from 'ethers/lib/utils'
import { InfoMessage, SuccessMessage } from '@app/components/common/Messages'
import { getNetworkConfigConstants } from '@app/util/networks';
import { useRouter } from 'next/dist/client/router';
import { executeProposal, queueProposal } from '@app/util/governance';
import { handleTx } from '@app/util/transactions';
import { showToast } from '@app/util/notify';
import { useEffect } from 'react';
import { preciseCommify } from '@app/util/misc';
import { getBnToNumber } from '@app/util/markets';
import { TOKENS_VIEWER } from '@app/config/constants';

const { INV, XINV, GOVERNANCE } = getNetworkConfigConstants(NetworkIds.mainnet)

const proposalCompletionMethods: any = {
  [ProposalStatus.succeeded]: queueProposal,
  [ProposalStatus.queued]: executeProposal,
}

export const VoteButton = ({ proposal }: { proposal: Proposal }) => {
  const { isActive, account, chainId, provider } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const govAddress = getGovernanceAddress(proposal.era, chainId);
  const { data } = useEtherSWR([govAddress, 'getReceipt', proposal?.id, userAddress]);
  const [liveStatus, setLiveStatus] = useState<ProposalStatus>(proposal.status)

  useEffect(() => {
    if (!proposal.status) { return }
    setLiveStatus(proposal.status)
  }, [proposal.status])

  const { data: snapshotVotingPowerData } = useEtherSWR(
    [TOKENS_VIEWER, 'getAccountVotesAtProposalStart', userAddress, proposal?.id],
  )

  if (!isActive || !account || !data || !proposal?.id || !snapshotVotingPowerData || !userAddress) {
    return <></>
  }

  const snapshotVotingPower = snapshotVotingPowerData ? getBnToNumber(snapshotVotingPowerData) : 0;

  const hasVoted = data[0]
  const nbVotes = hasVoted ? parseFloat(formatUnits(data[2])) : 0
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
    const tx = await proposalCompletionMethods[liveStatus](provider?.getSigner(), proposal.era, proposal.id);
    return handleTx(tx, { onSuccess: () => handleCompletionSuccess() })
  }

  const isNextStepDisabled = liveStatus === ProposalStatus.queued && (Date.now() < proposal.etaTimestamp)

  return (
    <Flex w="full" m={6} mt={9} mb={0} flexDirection="column">
      {
        liveStatus === ProposalStatus.active && !hasVoted ?
          <>
            <SubmitButton disabled={snapshotVotingPower === 0} onClick={onOpen}>
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
                <SubmitButton isDisabled={isNextStepDisabled} onClick={handleCompletion}>
                  {liveStatus === ProposalStatus.succeeded ? 'Queue Proposal' : 'Execute Proposal'}
                </SubmitButton>
                :
                null
            }
            {
              hasVoted ? <SuccessMessage
                alertProps={{ w: 'full', mt: "2", fontSize: '12px', fontWeight: 'bold' }}
                description={
                  `You voted ${support ? '"For"' : '"Against"'} with ${preciseCommify(nbVotes, nbVotes >= 1000 ? 0 : 2)} voting power`
                }
              /> :
                <InfoMessage
                  alertProps={{ w: 'full', mt: "2", fontSize: '12px', fontWeight: 'bold' }}
                  description={
                    'You did not vote for this proposal'
                  }
                />
            }
          </>
      }
      <VoteModal isOpen={isOpen} onClose={onClose} proposal={proposal} />
    </Flex>
  )
}
