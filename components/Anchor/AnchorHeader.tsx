import { Text, Stack, Flex, SkeletonText, useDisclosure } from '@chakra-ui/react'
import LinkButton, { LinkOutlineButton } from '@app/components/common/Button'
import { CheckIcon } from '@chakra-ui/icons'
import { useMarkets } from '@app/hooks/useMarkets'
import { useDOLA } from '@app/hooks/useDOLA'
import { usePrices } from '@app/hooks/usePrices'
import { useTVL } from '@app/hooks/useTVL'
import { chakra } from '@chakra-ui/system'
import { TEST_IDS } from '@app/config/test-ids'
import { useMediaQuery } from '@chakra-ui/react'
import { RTOKEN_CG_ID } from '@app/variables/tokens'
import { dollarify } from '@app/util/markets'
import { HAS_REWARD_TOKEN } from '@app/config/constants'

const TextOrSkeleton = ({ value, text }: { value: any, text: string }) => {
  return <Flex maxH="36px" overflow="hidden">
    {
      typeof value === 'number' ?
        <Text fontWeight="semibold" fontSize="2xl">
          {text}
        </Text>
        :
        <SkeletonText pt="5" skeletonHeight={3} height={'36px'} width={'180px'} noOfLines={3} />
    }
  </Flex>
}

export const AnchorHeader = () => {
  const [isSmallerThan728] = useMediaQuery('(max-width: 728px)')
  const { markets } = useMarkets()
  const rewardTokenMarket = markets?.find((v) => v.token === process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN)
  const { totalSupply } = useDOLA()
  const { prices } = usePrices()
  const { data: tvlData } = useTVL()
  const { isOpen: isIntroOpen, onOpen: onIntroOpen, onClose: onIntroClose } = useDisclosure();

  const apy = (rewardTokenMarket?.supplyApy || 100)?.toFixed(2);

  return (
    <Flex
      w="full"
      p={4}
      pb="0"
      justify="space-between"
      align={{ base: 'flex-start', md: 'flex-start' }}
      mt={{ base: 0, md: '4' }}
      direction={{ base: 'column', md: 'row' }}
    >
      <Stack w='full' maxW="600px" spacing={8} p={4} alignItems="flex-start">
        <Stack direction={{ base: 'column', lg: 'row' }} >
          <Flex direction="column" width="184px">
            <TextOrSkeleton value={prices && prices[RTOKEN_CG_ID]?.usd} text={`$${(prices[RTOKEN_CG_ID]?.usd || 0).toFixed(2)}`} />
            <Text color="accentTextColor" fontSize="sm" fontWeight="semibold">
              {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} Price
            </Text>
          </Flex>
          <Flex direction="column" justify="center"  width="184px">
            <TextOrSkeleton value={totalSupply} text={dollarify(totalSupply || 0, 0)} />
            <Text color="accentTextColor" fontSize="sm" fontWeight="semibold">
              DOLA Supply
            </Text>
          </Flex>
          <Flex direction="column">
            <TextOrSkeleton value={tvlData?.anchor?.tvl} text={dollarify(tvlData?.anchor?.tvl || 0, 0)} />
            <Text color="accentTextColor" fontSize="sm" fontWeight="semibold">
              Total Value Locked
            </Text>
          </Flex>
        </Stack>
        <Stack w='full' spacing={2} direction="row">
        {
            HAS_REWARD_TOKEN && !!process.env.NEXT_PUBLIC_BUY_RTOKEN_URL
            && <LinkButton maxW="184px" flexProps={{ maxH: '42px' }} fontWeight={{ base: 'normal', sm: 'bold' }} fontSize={{ base: '12px', sm: '18px' }} href={process.env.NEXT_PUBLIC_BUY_RTOKEN_URL}
              target={process.env.NEXT_PUBLIC_BUY_RTOKEN_URL.startsWith('http') ? '_blank' : '_self'}>
              Buy {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL}
            </LinkButton>
          }
          {
            <LinkButton maxW="184px" flexProps={{ maxH: '42px' }} fontWeight={{ base: 'normal', sm: 'bold' }} fontSize={{ base: '12px', sm: '18px' }} data-testid={TEST_IDS.anchor.buyDola} href={'/tokens/dola'}
              target={'_self'}>
              Buy DOLA
            </LinkButton>
          }
          {
            !!process.env.NEXT_PUBLIC_LEARN_MORE_URL
            && <LinkOutlineButton maxW="184px" fontSize={{ base: '12px', sm: '16px' }}
              href={process.env.NEXT_PUBLIC_LEARN_MORE_URL}
              data-testid={TEST_IDS.anchor.learnMore}
              target={process.env.NEXT_PUBLIC_LEARN_MORE_URL.startsWith('http') ? '_blank' : '_self'}>
              {isSmallerThan728 ? 'More' : 'Learn More'}
            </LinkOutlineButton>
          }
        </Stack>
      </Stack>
      <Stack spacing={4} p={4}>
        <Stack direction="row" align="center">
          <Text as="h2" color="mainTextColor" fontSize="2xl" fontWeight="semibold">
            Stake INV on Frontier and Earn
            <chakra.span pl={2} fontSize="2xl" fontWeight="semibold" color="accentTextColor">
              {apy}% APY
            </chakra.span>
          </Text>
        </Stack>
        <Stack w="full" spacing={1} pl={4}>
          <Text color="accentTextColor">
            <CheckIcon /> High-yield Positive Sum Rewards Token
          </Text>
          <Text color="accentTextColor">
            <CheckIcon /> Income Sharing Payouts
          </Text>
          <Text color="accentTextColor">
            <CheckIcon /> Usable as Collateral
          </Text>
        </Stack>
      </Stack>
    </Flex>
  )
}
