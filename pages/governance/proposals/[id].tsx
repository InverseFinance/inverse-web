import { Flex, useDisclosure } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/Breadcrumbs'
import {
  AgainstVotes,
  AgainstVotesModal,
  ForVotes,
  ForVotesModal,
  ProposalActions,
  ProposalDetails,
} from '@inverse/components/Governance'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { useRouter } from 'next/dist/client/router'
import Link from 'next/link'

export const Governance = () => {
  const { query } = useRouter()
  const { isOpen: forIsOpen, onOpen: forOnOpen, onClose: forOnClose } = useDisclosure()
  const { isOpen: againstIsOpen, onOpen: againstOnOpen, onClose: againstOnClose } = useDisclosure()

  const id = parseInt(query.id as string, 10)

  return (
    <Layout>
      <AppNav active="Governance" />
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Proposals', href: '/governance/proposals' },
          { label: `Proposal #${id}`, href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <Flex w="full" justify="center">
            <ProposalDetails id={id} />
          </Flex>
          <Flex w="full" justify="center">
            <ProposalActions id={id} />
          </Flex>
        </Flex>
        <Flex direction="column">
          <Flex w="full" justify="center">
            <ForVotes id={id} onViewAll={forOnOpen} />
          </Flex>
          <Flex w="full" justify="center">
            <AgainstVotes id={id} onViewAll={againstOnOpen} />
          </Flex>
        </Flex>
      </Flex>
      <ForVotesModal isOpen={forIsOpen} onClose={forOnClose} id={id} />
      <AgainstVotesModal isOpen={againstIsOpen} onClose={againstOnClose} id={id} />
    </Layout>
  )
}

export default Governance
