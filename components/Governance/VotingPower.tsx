import { Flex, Text } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { INV, XINV } from '@inverse/config'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { smallAddress } from '@inverse/util'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'
import { Avatar } from '../Avatar'
import Container from '../Container'

export const VotingPower = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data } = useEtherSWR([
    [INV, 'balanceOf', account],
    [XINV, 'balanceOf', account],
    [XINV, 'exchangeRateStored'],
    [INV, 'getCurrentVotes', account],
  ])

  if (!account || !data) {
    return <></>
  }

  const [invBalance, xinvBalance, exchangeRate, votingPower] = data

  return (
    <Container
      label={(votingPower ? parseFloat(formatUnits(votingPower)) : 0).toFixed(4)}
      description="Your Voting Power"
    >
      <Flex w="full" justify="space-around" align="flex-end">
        <Flex direction="column" align="center">
          <Avatar address={account} boxSize={5} />
          <Text mt={1} fontSize="sm" color="purple.100">
            {smallAddress(account)}
          </Text>
        </Flex>
        <Flex direction="column" textAlign="center">
          <Text fontWeight="semibold">{(invBalance ? parseFloat(formatUnits(invBalance)) : 0).toFixed(4)}</Text>
          <Text fontSize="sm" color="purple.100">
            INV
          </Text>
        </Flex>
        <Flex direction="column" textAlign="center">
          <Text fontWeight="semibold">
            {(xinvBalance ? parseFloat(formatUnits(xinvBalance)) * parseFloat(formatUnits(exchangeRate)) : 0).toFixed(
              4
            )}
          </Text>
          <Text fontSize="sm" color="purple.100">
            xINV
          </Text>
        </Flex>
      </Flex>
    </Container>
  )
}
