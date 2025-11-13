import { DeleteIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { Flex, Stack, Text, Box, Input as ChakraInput, InputGroup, InputRightElement, VStack } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { Avatar } from '@app/components/common/Avatar'
import { NavButtons, SubmitButton } from '@app/components/common/Button'
import Link from '@app/components/common/Link'
import { Modal, ModalProps } from '@app/components/common/Modal'
import { getNetworkConfigConstants } from '@app/util/networks'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { ProposalVote, Proposal, AutocompleteItem } from '@app/types'
import { namedAddress } from '@app/util'
import { getGovernanceContract } from '@app/util/contracts'
import { useWeb3React } from '@app/util/wallet'
import { commify, isAddress } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { InfoMessage } from '@app/components/common/Messages'
import { clearStoredDelegationsCollected, getStoredDelegationsCollected, isValidSignature, storeDelegationsCollected, submitMultiDelegation } from '@app/util/governance'
import { handleTx } from '@app/util/transactions'
import { TopDelegatesAutocomplete } from '../common/Input/TopDelegatesAutocomplete'
import { TEST_IDS } from '@app/config/test-ids'
import { Voter } from './Votes'

enum VoteType {
  for = 'For',
  against = 'Against',
}

type VoteCountModalProps = ModalProps & {
  proposal: Proposal,
  voteType?: VoteType,
}

export const VoteCountModal = ({ isOpen, onClose, proposal, voteType }: VoteCountModalProps) => {
  const { chainId } = useWeb3React<Web3Provider>()

  if (!proposal?.id) {
    return <></>
  }

  const { forVotes, againstVotes, voters } = proposal

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
          <Voter key={voter} voter={voter} votes={votes} />
        ))}
      </Stack>
    </Modal>
  )
}

export const ForVotesModal = ({ isOpen, onClose, proposal }: VoteCountModalProps) => {
  return <VoteCountModal isOpen={isOpen} onClose={onClose} proposal={proposal} voteType={VoteType.for} />
}

export const AgainstVotesModal = ({ isOpen, onClose, proposal }: VoteCountModalProps) => {
  return <VoteCountModal isOpen={isOpen} onClose={onClose} proposal={proposal} voteType={VoteType.against} />
}

export const VoteModal = ({ isOpen, onClose, proposal }: VoteCountModalProps) => {
  const { provider } = useWeb3React<Web3Provider>()
  const [support, setSupport] = useState(true)

  if (!proposal?.id) {
    return <></>
  }

  const { era, id } = proposal;

  const handleVote = async () => {
    const tx = await getGovernanceContract(provider?.getSigner(), era).castVote(id, support);
    return handleTx(tx, {
      onSuccess: () => {
        onClose()
        setTimeout(() => window.location.reload(), 1500)
      }
    })
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
        <SubmitButton refreshOnSuccess={true} onClick={handleVote}>
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

export const ChangeDelegatesModal = ({ isOpen, onClose, address }: ModalProps & { address?: string }) => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const [delegationType, setDelegationType] = useState('Delegate')
  const [delegate, setDelegate] = useState(address || '')
  const { INV } = getNetworkConfigConstants(chainId)
  const { data: currentDelegate } = useEtherSWR([INV, 'delegates', account])

  if (!currentDelegate) {
    return <></>
  }

  return (
    <Modal
      scrollBehavior={'outside'}
      onClose={() => {
        onClose()
        setDelegate(address || '')
      }}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>Change Delegate Type</Text>
        </Stack>
      }
      footer={
        !isAddress(delegate) && delegationType === 'Delegate' ?
          null :
          <Box w="full" alignItems="center" textAlign="center">
            <Box display="inline-block" onClick={onClose}>
              {
                delegationType === 'Self' ?
                  <NextLink href={`/governance/delegates/${account}`}>Self-Delegate</NextLink>
                  :
                  <NextLink href={`/governance/delegates/${delegate}`}>Change Delegate</NextLink>
              }
            </Box>
          </Box>
      }
    >
      <Stack p={4}>
        <NavButtons options={['Delegate', 'Self']} active={delegationType} onClick={setDelegationType} />
        {delegationType === 'Self' ? (
          null
        ) :
          <Stack direction="column" spacing={4}>
            <Stack spacing={1}>
              <Text fontWeight="semibold">Select Delegate</Text>
              <Text fontSize="sm">
                You can delegate your votes to another Ethereum address. By selecting this process, you will not send
                your INV, only your voting rights. This process does not cost any gas.
              </Text>
              <Flex>
                <Link
                  href="https://docs.inverse.finance/inverse-finance/inverse-finance/introduction/governance/delegates-and-delegating"
                  fontSize="xs"
                  color="secondaryTextColor"
                  fontWeight="semibold"
                  isExternal
                >
                  Learn More <ExternalLinkIcon />
                </Link>
              </Flex>
            </Stack>
            <Flex direction="column">
              <Text fontSize="xs" fontWeight="semibold" color="lightAccentTextColor" mb="2">
                Delegate Address :
              </Text>
              {
                isOpen && <TopDelegatesAutocomplete
                  placeholder={currentDelegate}
                  onItemSelect={(item?: AutocompleteItem) => setDelegate(item?.value || '')}
                />
              }
            </Flex>
          </Stack>}
      </Stack>
    </Modal>
  )
}

const DelegationSignatureInput = ({ sig, onChange, onDelete }: { sig: string, onChange: (e: any) => void, onDelete: () => void }) => {
  return <InputGroup>
    <ChakraInput
      p="2"
      pr="10"
      textAlign="left"
      placeholder='Delegation signature'
      value={sig}
      fontSize="small"
      isInvalid={sig !== '' && !isValidSignature(sig)}
      onChange={onChange} />
    <InputRightElement
      children={!sig ? null : <DeleteIcon cursor="pointer" onClick={onDelete} color="red.400" />}
    />
  </InputGroup>
}

export const SubmitDelegationsModal = ({ isOpen, onClose, onNewDelegate }: ModalProps & { address?: string, onNewDelegate?: (newDelegate: string) => void }) => {
  const { provider } = useWeb3React<Web3Provider>()
  const [signatures, setSignatures] = useState<string[]>([])
  const [isInited, setIsInited] = useState(false)
  const [hasInvalidSignature, setHasInvalidSignature] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!signatures?.length) {
        setSignatures(await getStoredDelegationsCollected() || []);
      }
      setIsInited(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!isInited) { return }
    const validSignatures = signatures.filter(isValidSignature);
    setHasInvalidSignature(validSignatures.length !== signatures.length);
    storeDelegationsCollected(validSignatures)
  }, [signatures]);

  const handleChange = (e: any, i: number) => {
    const newSignatures = [...signatures];
    if (!newSignatures[i]) {
      newSignatures.push(e.currentTarget.value)
    } else {
      newSignatures[i] = e.currentTarget.value;
    }
    setSignatures(newSignatures.filter(sig => !!sig));
  }

  const deleteSignature = (indexToRemove: number) => {
    const newSignatures = [...signatures];
    newSignatures.splice(indexToRemove, 1);
    setSignatures(newSignatures);
  }

  const signatureInputs = signatures.concat(['']).map((sig, i) => {
    return <DelegationSignatureInput key={i} sig={sig} onChange={(e) => handleChange(e, i)} onDelete={() => deleteSignature(i)} />
  })

  const handleSuccess = async () => {
    onClose();
    clearStoredDelegationsCollected();
    setSignatures([]);
    if (onNewDelegate) {
      onNewDelegate(await provider?.getSigner()?.getAddress()!);
    }
  }

  const handleSubmit = async () => {
    if (!provider?.getSigner()) { return new Promise((res, reject) => reject("Signer required")) };
    const tx = await submitMultiDelegation(provider?.getSigner(), signatures);
    return handleTx(tx, { onSuccess: handleSuccess });
  }

  return (
    <Modal
      onClose={() => {
        onClose()
      }}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>Submit Delegation Signatures</Text>
        </Stack>
      }
      footer={
        <SubmitButton data-testid={TEST_IDS.governance.submitSignatures} disabled={!signatures.length || hasInvalidSignature} onClick={handleSubmit}>
          {
            hasInvalidSignature ?
              'There is an invalid signature'
              :
              `Submit ${signatures.length || ' '} Signature${signatures.length > 1 ? 's' : ''}`
          }
        </SubmitButton>
      }
    >
      <Stack p={4}>
        <InfoMessage alertProps={{ w: 'full' }} description={<VStack alignItems="flex-start">
          <Text>Note: this is for the delegation by signature case.</Text>
          <Text>Paste signed delegations sent by your supporters below and submit them on-chain in 1 transaction.</Text>
        </VStack>} />
        <Stack maxHeight={'50vh'} overflow='auto'>
          {signatureInputs}
        </Stack>
      </Stack>
    </Modal>
  )
}
