import { Flex } from '@chakra-ui/react'
import { AgainstVotes, ForVotes, ProposalActions, ProposalDetails } from '@inverse/components/Governance'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { useRouter } from 'next/dist/client/router'

export const Governance = () => {
  const { query } = useRouter()

  const id = parseInt(query.id as string, 10)

  return (
    <Layout>
      <AppNav active="Governance" />
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
            <ForVotes id={id} />
          </Flex>
          <Flex w="full" justify="center">
            <AgainstVotes id={id} />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Governance
