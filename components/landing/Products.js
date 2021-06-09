import { Flex, Image, Spacer, Stack, Text } from '@chakra-ui/react'
import Button from '@inverse/components/landing/Button'

const INVERSE_PRODUCTS = [
  {
    name: 'Anchor',
    description:
      'A money-market protocol that facilitates capital efficient L&B via the issuance of synthetic tokens and non-synthetic credit',
    logo: '/assets/products/anchor.png',
    buttonLabel: 'Go to Anchor',
  },
  {
    name: 'DOLA',
    description:
      'A capital-efficient debt-based USD stablecoin that can also be used as collateral within the Anchor protocol',
    logo: '/assets/products/dola.png',
    buttonLabel: 'Go to Stabilizer',
  },
  {
    name: 'Vaults',
    description: 'Generate yield on your stablecoins and DCA it into a target token of your choice',
    logo: '/assets/products/vaults.png',
    buttonLabel: 'Go to Vaults',
  },
  {
    name: 'Govern',
    description: 'Become a part of the DAO and help us govern the direction of Inverse products',
    logo: '/assets/products/vote.png',
    buttonLabel: 'Go to Govern',
  },
]

const Product = ({ product }) => {
  const { name, description, logo, buttonLabel } = product
  return (
    <Stack width={64} align="center" textAlign="center">
      <Image src={logo} height={48} width={48} />
      <Text fontWeight={800} fontSize="3xl" lineHeight={1}>
        {name}
      </Text>
      <Text>{description}</Text>
      <Spacer />
      <Button>{buttonLabel}</Button>
    </Stack>
  )
}

export const Products = () => (
  <Flex
    direction="column"
    bgImage="/assets/home/main3.png"
    bgPosition="center center"
    width="full"
    align="center"
    justify="center">
    <Flex
      width="full"
      justify="space-around"
      p={32}
      pt={48}
      fontSize="md"
      color="white"
      bgGradient="linear(to-b, darkestSlateBlue, transparent,  transparent,  transparent,  transparent)">
      {INVERSE_PRODUCTS.map((product) => (
        <Product product={product} />
      ))}
    </Flex>
  </Flex>
)

export default Products
