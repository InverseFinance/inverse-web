import { Flex, Image, Spacer, Stack, Text } from '@chakra-ui/react'
import Button from '@inverse/components/landing/Button'

const background = {
  bgImage: '/assets/landing/wall.png',
  bgPosition: 'center center',
}

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
    <Stack h="full" p={8} w={80} align="center" textAlign="center">
      <Image src={logo} w={48} h={48} />
      <Text fontWeight="extrabold" fontSize="3xl" lineHeight={1}>
        {name}
      </Text>
      <Text>{description}</Text>
      <Spacer />
      <Button>{buttonLabel}</Button>
    </Stack>
  )
}

export const Products = () => (
  <Flex w="full" direction="column" {...background}>
    <Stack
      direction="row"
      spacing={0}
      w="full"
      p={16}
      pt={{ base: 16, md: 40 }}
      justify="space-around"
      bgGradient="linear(to-b, purple.900, transparent,  transparent,  transparent)"
      wrap="wrap"
      shouldWrapChildren>
      {INVERSE_PRODUCTS.map((product) => (
        <Product product={product} />
      ))}
    </Stack>
  </Flex>
)

export default Products
