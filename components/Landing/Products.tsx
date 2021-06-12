import { Flex, Image, Spacer, Stack, Text } from '@chakra-ui/react'
import LinkButton from '@inverse/components/Button'

type Product = {
  name: string
  description: string
  image: string
  button: React.ReactNode
}

const INVERSE_PRODUCTS: Product[] = [
  {
    name: 'Anchor',
    description:
      'A money-market protocol that facilitates capital efficient L&B via the issuance of synthetic tokens and non-synthetic credit',
    image: '/assets/products/anchor.png',
    button: <LinkButton href="/anchor">Go to Anchor</LinkButton>,
  },
  {
    name: 'DOLA',
    description:
      'A capital-efficient debt-based USD stablecoin that can also be used as collateral within the Anchor protocol',
    image: '/assets/products/dola.png',
    button: <LinkButton href="/stabilizer">Go to Stabilizer</LinkButton>,
  },
  {
    name: 'Vaults',
    description: 'Generate yield on your stablecoins and DCA it into a target token of your choice',
    image: '/assets/products/vaults.png',
    button: <LinkButton href="/vaults">Go to Vaults</LinkButton>,
  },
  {
    name: 'Govern',
    description: 'Become a part of the DAO and help us govern the direction of Inverse products',
    image: '/assets/products/vote.png',
    button: <LinkButton href="/governance">Go to Governance</LinkButton>,
  },
]

const ProductDisplay = ({ product }: { product: Product }) => {
  const { name, description, image, button } = product
  return (
    <Stack h="full" p={8} w={80} align="center" textAlign="center">
      <Image src={image} w={48} h={48} />
      <Text fontWeight="extrabold" fontSize="3xl" lineHeight={1}>
        {name}
      </Text>
      <Text>{description}</Text>
      <Spacer />
      {button}
    </Stack>
  )
}

export const Products = () => (
  <Flex w="full" direction="column" bgImage="/assets/landing/wall.png" bgPosition="center center">
    <Flex w="full" justify="center" bgGradient="linear(to-b, purple.900, transparent,  transparent,  transparent)">
      <Stack
        direction="row"
        spacing={0}
        w={{ base: 'full', md: '120rem' }}
        p={16}
        pt={{ base: 16, md: 40 }}
        justify="space-around"
        wrap="wrap"
        shouldWrapChildren
      >
        {INVERSE_PRODUCTS.map((product) => (
          <ProductDisplay product={product} />
        ))}
      </Stack>
    </Flex>
  </Flex>
)

export default Products
