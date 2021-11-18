import { Flex, useDisclosure } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { SubmitButton } from '@inverse/components/common/Button'
import { VoteModal } from '@inverse/components/Governance/GovernanceModals'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { ProposalStatus, Proposal } from '@inverse/types'
import { getGovernanceAddress } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'

export const VoteButton = ({ proposal }: { proposal: Proposal }) => {
  const { active, account, chainId } = useWeb3React<Web3Provider>()
  const { isOpen, onOpen, onClose } = useDisclosure();
  const govAddress = getGovernanceAddress(proposal.era, chainId);
  const { data } = useEtherSWR([govAddress, 'getReceipt', proposal?.id, account]);

  if (!active || !account || !data || !proposal?.id) {
    return <></>
  }

  const { status } = proposal;

  const hasVoted = data[0]
  const votes = hasVoted ? parseFloat(formatUnits(data[2])).toFixed(2) : 0
  const support = hasVoted && data[1]

  return (
    <Flex w="full" m={6} mt={9} mb={0}>
      {status !== ProposalStatus.active ? (
        <SubmitButton color="#fff" isDisabled={true}>
          {hasVoted ? `Voted ${support ? 'for' : 'against'} with ${votes} INV` : 'Did not vote'}
        </SubmitButton>
      ) : (
        <SubmitButton color="#fff" onClick={onOpen}>
          Cast Vote
        </SubmitButton>
      )}
      <VoteModal isOpen={isOpen} onClose={onClose} proposal={proposal} />
    </Flex>
  )
}
