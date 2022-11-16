import { Text, Stack, Flex, SkeletonText, useDisclosure } from '@chakra-ui/react'
import LinkButton from '@app/components/common/Button'
import { useDOLA } from '@app/hooks/useDOLA'
import { usePrices } from '@app/hooks/usePrices'
import { RTOKEN_CG_ID } from '@app/variables/tokens'
import { dollarify, shortenNumber } from '@app/util/markets'
import { AnchorBigButton } from '../Anchor/AnchorBigButton'
import { useAccountDBR, useDBRPrice } from '@app/hooks/useDBR'
import { getDBRBuyLink } from '@app/util/f2'
import { useRouter } from 'next/router'
// import { useAccount } from '@app/hooks/misc'
import { IntroModalCheck } from './Infos/IntroModalCheck'
import { useAccount } from '@app/hooks/misc'
import { RSubmitButton } from '../common/Button/RSubmitButton'

const Btn = (props) => <RSubmitButton 
  maxW="184px"
  w='100%'
  fontWeight={{ base: 'normal', sm: 'bold' }}
  fontSize={{ base: '12px', sm: '18px' }}
  px="8"    
   {...props} />

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

export const F2Header = ({
  autoOpenIntroModal = false
}) => {
  const router = useRouter();
  const { isOpen: isIntroOpen, onOpen: onIntroOpen, onClose: onIntroClose } = useDisclosure();
  // const { markets } = useMarkets()
  // const rewardTokenMarket = markets?.find((v) => v.token === process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN)
  const { totalSupply } = useDOLA()
  const { prices } = usePrices()
  const { price: dbrPrice } = useDBRPrice();
  const account = useAccount();
  const { debt } = useAccountDBR(account);

  const getStarted = () => {
    router.push(debt > 0 ? 'firm/WETH DBRv2' : 'firm/WETH DBRv2#step1')
  }

  // const apy = (rewardTokenMarket?.supplyApy || 100)?.toFixed(2);

  return (
    <Flex
      w="full"
      p={'10px'}
      pb="0"
      justify="space-between"
      align={{ base: 'flex-start', md: 'flex-start' }}
      mt={{ base: 0, md: '4' }}
      direction={{ base: 'column', md: 'row' }}
    >
      <IntroModalCheck autoOpenIntroModal={autoOpenIntroModal} isIntroOpen={isIntroOpen} onIntroOpen={onIntroOpen} onIntroClose={onIntroClose} />
      <Stack w='full' spacing={8} p={4} alignItems="flex-start">
        <Stack direction={{ base: 'column', lg: 'row' }} >
          <Flex direction="column" width="184px">
            <TextOrSkeleton value={prices && prices[RTOKEN_CG_ID]?.usd} text={`$${(prices[RTOKEN_CG_ID]?.usd || 0).toFixed(2)}`} />
            <Text color="accentTextColor" fontSize="sm" fontWeight="semibold">
              {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} Price
            </Text>
          </Flex>
          <Flex direction="column" justify="center" width="184px">
            <TextOrSkeleton value={totalSupply} text={dollarify(totalSupply || 0, 0)} />
            <Text color="accentTextColor" fontSize="sm" fontWeight="semibold">
              DOLA Supply
            </Text>
          </Flex>
          <Flex direction="column" width="184px">
            <TextOrSkeleton value={dbrPrice} text={`$${(dbrPrice || 0).toFixed(3)}`} />
            <Text color="accentTextColor" fontSize="sm" fontWeight="semibold">
              DBR Price
            </Text>
          </Flex>
        </Stack>
        <Stack w='full' spacing={2} direction="row">
          <Btn
            href={'https://app.1inch.io/#/1/swap/DAI/INV'}
            target="_blank">
            Buy {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL}
          </Btn>
          <Btn
            target={'_self'}
            href={'/swap/DAI/DOLA'}
          >
            Buy DOLA
          </Btn>
          <Btn
            href={getDBRBuyLink()}
            target="_blank">
            Buy DBR
          </Btn>
        </Stack>
      </Stack>
      <Stack spacing={4} p={4} w='full'>
        {/* <Stack direction="row" align="center">
          <Text as="h2" color="mainTextColor" fontSize="2xl" fontWeight="semibold">
            Discover our Tokens
          </Text>
        </Stack> */}
        <Stack justifyContent="flex-start" alignItems="flex-start" spacing={4} w='full' >
          <Stack direction={{ base: 'column', lg: 'row' }} spacing="6" w='100%' alignItems="center" justify="flex-end">
            {/* <AnchorBigButton
              onClick={() => router.push('frontier?marketType=supply&market=inv')}
              bg="url('/assets/stake-inv.png')"
              title="Stake INV"
              subtitle={`${apy}% APY`}
            /> */}
            <AnchorBigButton
              // onClick={() => router.push('https://docs.google.com/document/d/1xDsuhhXTHqNLIZmlwjzCf-P7bjDvQEI72dS0Z0GGM38/edit')}
              onClick={() => onIntroOpen()}
              bg="url('/assets/stake-inv.png')"
              title="FiRM & DBR"
              subtitle={`Learn More`}
            />
            <AnchorBigButton
              onClick={getStarted}
              bg="url('/assets/v2/dola.png')"
              title="Borrow DOLA"
              subtitle={`${shortenNumber(dbrPrice * 100, 2)}% Fixed-Rate`}
            />
          </Stack>
        </Stack>
        {/* <Stack fontSize="18px" w="full" spacing={1} pl={4}>
          <HStack>
            <Image src="/assets/inv-square-dark.jpeg" />
            <Text color="secondary">
              <b>INV</b> is our Governance Token with a <b>{apy}%</b> staking APY
            </Text>
          </HStack>
          <Text color="secondary">
            <b>DOLA</b> is a debt-backed decentralized stablecoin
          </Text>
          <Text color="secondary">
            <b>DBR</b> allows to borrow DOLA at a fixed rate
          </Text>
        </Stack> */}
      </Stack>
    </Flex>
  )
}
