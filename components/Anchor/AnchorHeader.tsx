import { Text, Stack, Image, Flex } from '@chakra-ui/react'
import LinkButton, { LinkOutlineButton } from '@inverse/components/common/Button'
import { CheckIcon } from '@chakra-ui/icons'
import { useMarkets } from '@inverse/hooks/useMarkets'
import { useDOLA } from '@inverse/hooks/useDOLA'
import { usePrices } from '@inverse/hooks/usePrices'
import { useTVL } from '@inverse/hooks/useTVL'
import { commify } from '@ethersproject/units'
import { chakra } from '@chakra-ui/system'
import { TEST_IDS } from '@inverse/config/test-ids'

export const AnchorHeader = () => {
  const { markets, isLoading } = useMarkets()
  const DOLA = markets?.find((v) => v.underlying.name === 'Dola')
  const { totalSupply } = useDOLA()
  const { prices } = usePrices()
  const { tvl } = useTVL()

  if (isLoading || !DOLA) {
    return <></>
  }

  const apy = DOLA.supplyApy.toFixed(2)

  return (
    <Flex
      w="full"
      p={4}
      justify="space-between"
      align={{ base: 'flex-start', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
    >
      <Stack spacing={4} p={4}>
        <Flex direction="column">
          <Text fontWeight="semibold" fontSize="2xl">
            ${commify(tvl?.toFixed(2) || 0)}
          </Text>
          <Text color="secondary" fontSize="sm" fontWeight="semibold">
            Total Value Locked
          </Text>
        </Flex>
        <Flex direction="column">
          <Text fontWeight="semibold" fontSize="2xl">
            ${commify(totalSupply?.toFixed(2) || 0)}
          </Text>
          <Text color="secondary" fontSize="sm" fontWeight="semibold">
            DOLA Supply
          </Text>
        </Flex>
        <Flex direction="column">
          <Text fontWeight="semibold" fontSize="2xl">
            ${commify(prices['inverse-finance']?.usd)}
          </Text>
          <Text color="secondary" fontSize="sm" fontWeight="semibold">
            INV Price
          </Text>
        </Flex>
      </Stack>
      <Stack spacing={4} p={4}>
        <Stack direction="row" align="center">
          <Text color="#fff" fontSize="2xl" fontWeight="semibold">
            Supply DOLA and earn
            <chakra.span pl={2} fontSize="2xl" fontWeight="semibold" color="secondary">
              {apy}% APY
            </chakra.span>
          </Text>
        </Stack>
        <Stack w="full" spacing={1} pl={4}>
          <Text color="secondary">
            <CheckIcon /> High stablecoin yield
          </Text>
          <Text color="secondary">
            <CheckIcon /> Sustainable APY
          </Text>
          <Text color="secondary">
            <CheckIcon /> Usable as collateral
          </Text>
        </Stack>
        <Stack spacing={2} direction="row">
          <LinkButton data-testid={TEST_IDS.anchor.buyDola} href="https://crv.to" target="_blank">
            Buy DOLA
          </LinkButton>
          <LinkOutlineButton data-testid={TEST_IDS.anchor.learnMore} href="https://docs.inverse.finance/anchor-and-dola-overview" target="_blank">
            Learn More
          </LinkOutlineButton>
        </Stack>
      </Stack>
    </Flex>
  )
}
