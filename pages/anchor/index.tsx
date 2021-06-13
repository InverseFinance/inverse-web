import { Flex } from '@chakra-ui/react'
import { BorrowTable, SupplyTable } from '@inverse/components/Anchor'
import Container from '@inverse/components/Container'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { baseURL } from '@inverse/util/coingecko'
import { useEffect, useState } from 'react'

export const Anchor = () => {
  const [markets, setMarkets] = useState([])

  useEffect(() => {
    const init = async () => {
      const { markets } = await (await fetch(`${baseURL}/api/anchor/markets`)).json()

      setMarkets(markets)
    }
    init()
  }, [])

  return (
    <Layout>
      <AppNav active="Anchor" />
      <Flex w="full" justify="center" direction="row" spacing={0} p={4}>
        <Container
          w="2xl"
          label="Supply"
          description="Earn interest on your deposits"
          href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/lending"
        >
          <SupplyTable markets={markets} />
        </Container>
        <Container
          w="2xl"
          label="Borrow"
          description="Borrow against your supplied collateral"
          href="https://docs.inverse.finance/user-guides/anchor-lending-and-borrowing/borrowing"
        >
          <BorrowTable markets={markets} />
        </Container>
      </Flex>
    </Layout>
  )
}

export default Anchor
