import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Flex, Stack, Text, useClipboard } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { GOVERNANCE_ABI, INV_ABI } from '@inverse/abis'
import { Avatar } from '@inverse/components/Avatar'
import { NavButtons, SubmitButton } from '@inverse/components/Button'
import { Input, Textarea } from '@inverse/components/Input'
import Link from '@inverse/components/Link'
import { Modal, ModalProps } from '@inverse/components/Modal'
import { GOVERNANCE, INV } from '@inverse/config'
import { useDelegates } from '@inverse/hooks/useDelegates'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { useProposal, useProposals } from '@inverse/hooks/useProposals'
import { useVoters } from '@inverse/hooks/useVoters'
import { Delegate, ProposalVote } from '@inverse/types'
import { smallAddress } from '@inverse/util'
import { useWeb3React } from '@web3-react/core'
import { Contract } from 'ethers'
import { commify, isAddress } from 'ethers/lib/utils'
import { useState } from 'react'

enum VoteType {
  for = 'For',
  against = 'Against',
}

type VoteCountModalProps = ModalProps & {
  id: number
  voteType?: VoteType
}

export const VoteCountModal = ({ isOpen, onClose, id, voteType }: VoteCountModalProps) => {
  const { proposal } = useProposal(id)
  const { voters } = useVoters(id)

  const { forVotes, againstVotes } = proposal

  const votes = voters
    .filter(({ support }: ProposalVote) => (voteType === VoteType.for ? support : !support))
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  const totalVotes = voteType === VoteType.for ? forVotes : againstVotes

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>{`${voteType} Votes: ${commify(totalVotes.toFixed(2))}`}</Text>
        </Stack>
      }
    >
      <Stack m={3} height={400} overflowY="auto">
        {votes.map(({ voter, votes }: ProposalVote) => (
          <Flex
            cursor="pointer"
            justify="space-between"
            p={2}
            borderRadius={8}
            _hover={{ bgColor: 'purple.900' }}
            key={voter}
          >
            <Stack direction="row" align="center">
              <Avatar address={voter} boxSize={7} />
              <Text fontSize="sm" fontWeight="semibold">
                {smallAddress(voter)}
              </Text>
            </Stack>
            <Text fontSize="sm" fontWeight="semibold">
              {commify(votes.toFixed(2))}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Modal>
  )
}

export const ForVotesModal = ({ isOpen, onClose, id }: VoteCountModalProps) => {
  return <VoteCountModal isOpen={isOpen} onClose={onClose} id={id} voteType={VoteType.for} />
}

export const AgainstVotesModal = ({ isOpen, onClose, id }: VoteCountModalProps) => {
  return <VoteCountModal isOpen={isOpen} onClose={onClose} id={id} voteType={VoteType.against} />
}

export const DelegatesModal = ({ isOpen, onClose }: ModalProps) => {
  const { delegates } = useDelegates()

  if (!delegates) {
    return <></>
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>{`${delegates.length} Delegates`}</Text>
        </Stack>
      }
    >
      <Stack m={3} height={400} overflowY="auto">
        {delegates.map(({ address, balance, delegators }: Delegate) => (
          <Flex
            cursor="pointer"
            justify="space-between"
            p={2}
            borderRadius={8}
            _hover={{ bgColor: 'purple.900' }}
            key={address}
          >
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
      </Stack>
    </Modal>
  )
}

export const VoteModal = ({ isOpen, onClose, id }: VoteCountModalProps) => {
  const { library } = useWeb3React<Web3Provider>()
  const [support, setSupport] = useState(true)
  const { proposals } = useProposals()

  if (!proposals || !proposals[id - 1]) {
    return <></>
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>Voting</Text>
        </Stack>
      }
      footer={
        <SubmitButton
          onClick={() => new Contract(GOVERNANCE, GOVERNANCE_ABI, library?.getSigner()).castVote(id, support)}
        >
          {support ? 'Vote For' : 'Vote Against'}
        </SubmitButton>
      }
    >
      <Stack p={4}>
        <NavButtons
          options={['For', 'Against']}
          active={support ? 'For' : 'Against'}
          onClick={(selected: string) => setSupport(selected === 'For')}
        />
      </Stack>
    </Modal>
  )
}

export const ChangeDelegatesModal = ({ isOpen, onClose }: ModalProps) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>()
  const [delegationType, setDelegationType] = useState('Delegate')
  const [delegate, setDelegate] = useState('')
  const [signature, setSignature] = useState('')
  const { data: currentDelegate } = useEtherSWR([INV, 'delegates', account])
  const { hasCopied, onCopy } = useClipboard(signature)

  if (!currentDelegate) {
    return <></>
  }

  const handleSelfDelegate = () => {
    new Contract(INV, INV_ABI, library?.getSigner()).delegate(account)
  }

  const handleDelegate = async () => {
    const invContract = new Contract(INV, INV_ABI, library?.getSigner())

    const domain = { name: 'Inverse DAO', chainId, verifyingContract: INV }

    const types = {
      Delegation: [
        { name: 'delegatee', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
      ],
    }

    const value = {
      delegatee: delegate,
      nonce: (await invContract.nonces(account)).toString(),
      expiry: 10e9,
    }

    const signature = await library?.getSigner()._signTypedData(domain, types, value)

    setSignature(
      JSON.stringify({
        sig: signature,
        nonce: value.nonce,
        expiry: value.expiry,
        chainId,
        signer: account,
      })
    )
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>Change Delegate Type</Text>
        </Stack>
      }
      footer={
        delegationType === 'Self' ? (
          <SubmitButton onClick={handleSelfDelegate} isDisabled={currentDelegate === account}>
            Self-Delegate
          </SubmitButton>
        ) : !signature ? (
          <SubmitButton onClick={handleDelegate} isDisabled={!isAddress(delegate)}>
            Change Delegate
          </SubmitButton>
        ) : (
          <SubmitButton onClick={onCopy}>{hasCopied ? 'Copied' : 'Copy'}</SubmitButton>
        )
      }
    >
      <Stack p={4}>
        <NavButtons options={['Delegate', 'Self']} active={delegationType} onClick={setDelegationType} />
        {delegationType === 'Self' ? (
          <Flex></Flex>
        ) : !signature ? (
          <Stack direction="column" spacing={4}>
            <Stack spacing={1}>
              <Text fontWeight="semibold">Select Delegate</Text>
              <Text fontSize="sm">
                You can delegate your votes to another Ethereum address. By selecting this process, you will not send
                your INV, only your voting rights. This process does not cost any gas.
              </Text>
              <Flex>
                <Link
                  href="https://docs.inverse.finance/governance/delegating-delegates-proposals-and-voting.-what-does-it-all-mean"
                  fontSize="xs"
                  color="purple.200"
                  fontWeight="semibold"
                  isExternal
                >
                  Learn More <ExternalLinkIcon />
                </Link>
              </Flex>
            </Stack>
            <Flex direction="column">
              <Text fontSize="xs" fontWeight="semibold" color="purple.100">
                Delegate Address
              </Text>
              <Input
                value={delegate}
                onChange={(e: React.MouseEvent<HTMLInputElement>) => setDelegate(e.currentTarget.value)}
                placeholder={currentDelegate}
                fontSize="sm"
                p={1.5}
              />
            </Flex>
          </Stack>
        ) : (
          <Stack p={4} pt={2} direction="column" spacing={4}>
            <Stack spacing={1}>
              <Text fontWeight="semibold">Send to Delegate</Text>
              <Text fontSize="sm">
                To finalize your delegation, you need to copy the below data to your delegate. Your votes will not be
                counted unless this is done.
              </Text>
              <Flex>
                <Link
                  href="https://docs.inverse.finance/governance/delegating-delegates-proposals-and-voting.-what-does-it-all-mean"
                  fontSize="xs"
                  color="purple.200"
                  fontWeight="semibold"
                  isExternal
                >
                  Learn More <ExternalLinkIcon />
                </Link>
              </Flex>
            </Stack>
            <Flex direction="column">
              <Textarea value={signature} fontSize="sm" p={1.5} />
            </Flex>
          </Stack>
        )}
      </Stack>
    </Modal>
  )
}
