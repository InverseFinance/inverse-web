import { Text, Stack, Flex } from '@chakra-ui/react'
import LinkButton, { LinkOutlineButton } from '@app/components/common/Button'
import { CheckIcon } from '@chakra-ui/icons'
import { useMarkets } from '@app/hooks/useMarkets'
import { useDOLA } from '@app/hooks/useDOLA'
import { usePrices } from '@app/hooks/usePrices'
import { useTVL } from '@app/hooks/useTVL'
import { commify } from '@ethersproject/units'
import { chakra } from '@chakra-ui/system'
import { TEST_IDS } from '@app/config/test-ids'
import { useMediaQuery } from '@chakra-ui/react'
import { RTOKEN_CG_ID } from '@app/variables/tokens'

export const AnchorHeader = () => {
  const [isSmallerThan728] = useMediaQuery('(max-width: 728px)')
  const { markets, isLoading } = useMarkets()
  const rewardTokenMarket = markets?.find((v) => v.token === process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN)
  const { totalSupply } = useDOLA()
  const { prices } = usePrices()
  const { data: tvlData } = useTVL()

  if (isLoading || !rewardTokenMarket) {
    return <></>
  }

  const apy = rewardTokenMarket.supplyApy.toFixed(2)

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
            ${commify(tvlData?.anchor?.tvl.toFixed(2) || 0)}
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
            ${prices && prices[RTOKEN_CG_ID] ? commify(prices[RTOKEN_CG_ID]?.usd) : ''}
          </Text>
          <Text color="secondary" fontSize="sm" fontWeight="semibold">
            {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} Price
          </Text>
        </Flex>
      </Stack>
      <Stack spacing={4} p={4}>
        <Stack direction="row" align="center">
          <Text color="#fff" fontSize="2xl" fontWeight="semibold">
            Buy and Stake INV and earn
            <chakra.span pl={2} fontSize="2xl" fontWeight="semibold" color="secondary">
              {apy}% APY
            </chakra.span>
          </Text>
        </Stack>
        <Stack w="full" spacing={1} pl={4}>
          <Text color="secondary">
            <CheckIcon /> High yield Positive Sum Rewards Token
          </Text>
          <Text color="secondary">
            <CheckIcon /> Revenue Sharing Payouts
          </Text>
          <Text color="secondary">
            <CheckIcon /> Usable as collateral
          </Text>
        </Stack>
        <Stack spacing={2} direction="row">
          {
            !!process.env.NEXT_PUBLIC_BUY_RTOKEN_URL
            && <LinkButton href={process.env.NEXT_PUBLIC_BUY_RTOKEN_URL}
              target={process.env.NEXT_PUBLIC_BUY_RTOKEN_URL.startsWith('http') ? '_blank' : '_self'}>
              Buy {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL}
            </LinkButton>
          }
          {
            !!process.env.NEXT_PUBLIC_BUY_DOLA_URL
            && <LinkButton data-testid={TEST_IDS.anchor.buyDola} href={process.env.NEXT_PUBLIC_BUY_DOLA_URL}
              target={process.env.NEXT_PUBLIC_BUY_DOLA_URL.startsWith('http') ? '_blank' : '_self'}>
              Buy DOLA
            </LinkButton>
          }
          {
            !!process.env.NEXT_PUBLIC_LEARN_MORE_URL
            && <LinkOutlineButton
              href={process.env.NEXT_PUBLIC_LEARN_MORE_URL}
              data-testid={TEST_IDS.anchor.learnMore}
              target={process.env.NEXT_PUBLIC_LEARN_MORE_URL.startsWith('http') ? '_blank' : '_self'}>
              {isSmallerThan728 ? 'More' : 'Learn More'}
            </LinkOutlineButton>
          }
        </Stack>
      </Stack>
    </Flex>
  )
}
