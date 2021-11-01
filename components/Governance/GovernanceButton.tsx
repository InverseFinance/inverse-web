import { Flex, useDisclosure } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { SubmitButton } from '@inverse/components/Button'
import { VoteModal } from '@inverse/components/Governance/GovernanceModals'
import { GOVERNANCE } from '@inverse/config/constants'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { useProposals } from '@inverse/hooks/useProposals'
import { ProposalStatus } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'

export const VoteButton = ({ id }: { id: number }) => {
  const { active, account } = useWeb3React<Web3Provider>()
  const { proposals } = useProposals()
  const { data } = useEtherSWR([GOVERNANCE, 'getReceipt', id, account])
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!proposals || !proposals[id - 1] || !active || !data) {
    return <></>
  }

  const { status } = proposals[id - 1]

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
      <VoteModal isOpen={isOpen} onClose={onClose} id={id} />
    </Flex>
  )
}
