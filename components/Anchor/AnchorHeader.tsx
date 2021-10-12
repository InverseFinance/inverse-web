import { Text, Stack, Image } from '@chakra-ui/react';
import LinkButton, { LinkOutlineButton } from '@inverse/components/Button'
import { CheckIcon } from '@chakra-ui/icons'
import { useMarkets } from '@inverse/hooks/useMarkets'

export const AnchorHeader = () => {
  const { markets, isLoading } = useMarkets()


  if(!isLoading) {
    const DOLA = markets.find(v => v.underlying.name === "Dola")
    const apy = DOLA.supplyApy.toFixed(2);
    
    return (
      <Stack p={8} m={4} spacing={6} direction="row" w="full" borderRadius={16} borderWidth="1px" borderColor="#211e36">
      <Image boxSize="200px" src="/assets/products/anchor.png" alt="DOLA" />
      <Stack spacing={6} w="full">
        <Text fontSize="4xl">
          Supply DOLA and earn <strong>{apy}%</strong> APY
        </Text>
        <Stack w="full">
          <Text color="green" w={{ base: 56, lg: 64 }} h={4} fontSize="lg" fontWeight="medium">
            <CheckIcon/> High stablecoin yield
          </Text>
          <Text color="green" w={{ base: 56, lg: 64 }} h={4} fontSize="lg" fontWeight="medium">
            <CheckIcon/> Sustainable APY
          </Text>
          <Text color="green" w={{ base: 56, lg: 64 }} h={4} fontSize="lg" fontWeight="medium">
            <CheckIcon/> Usable as collateral
          </Text>
        </Stack>
        <Stack w={80} spacing={2} direction="row" pt={4}>
          <LinkButton href="https://crv.to" target="_blank">Buy DOLA</LinkButton>
          <LinkOutlineButton href="https://docs.inverse.finance/anchor-and-dola-overview" target="_blank">Learn More</LinkOutlineButton>
        </Stack>
      </Stack>
      </Stack>
    ) 
  } else {
    return null
  }
}