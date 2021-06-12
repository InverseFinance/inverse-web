import { Flex, Stack, Text } from '@chakra-ui/react'
import { BorrowTable, SupplyTable } from '@inverse/components/Anchor'
import Container from '@inverse/components/Container'
import Layout from '@inverse/components/Layout'
import Logo from '@inverse/components/Logo'
import { AppNav } from '@inverse/components/Navbar'
import { Token, TOKENS } from '@inverse/constants'

export const Anchor = () => (
  <Layout>
    <AppNav activeNav="Anchor" />
    <Flex w="full" justify="center" direction="row" spacing={0} p={4}>
      <Container
        w="2xl"
        label="Supply"
        description="Earn interest on your deposits"
        href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/lending"
      >
        <SupplyTable />
      </Container>
      <Container
        w="2xl"
        label="Borrow"
        description="Borrow against your supplied collateral"
        href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/borrowing"
      >
        <BorrowTable />
      </Container>
    </Flex>
  </Layout>
)

export default Anchor
