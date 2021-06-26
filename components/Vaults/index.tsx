import { ArrowRightIcon, ChevronDownIcon } from '@chakra-ui/icons'
import {
  Flex,
  Image,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { DAI, TOKENS, VAULTS } from '@inverse/config'
import { useAccountBalances } from '@inverse/hooks/useBalances'
import { Token } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'
import { useState } from 'react'
import { NavButtons, SubmitButton } from '../Button'
import Container from '../Container'
import { BalanceInput } from '../Input'

enum VaultOperations {
  deposit = 'Deposit',
  withdraw = 'Withdraw',
  claim = 'Claim',
}

const AssetsDropdown = ({ children, asset, isOpen, onOpen, onClose, noPadding }: any) => {
  return (
    <Popover isOpen={isOpen} onClose={onClose} closeOnBlur={true}>
      <PopoverTrigger>
        <Stack
          direction="row"
          align="center"
          onClick={onOpen}
          borderRadius={8}
          p={noPadding ? 0 : 2}
          bgColor="purple.900"
        >
          <Flex w={5}>
            <Image w={5} h={5} src={asset.image} />
          </Flex>
          <Flex fontSize="lg" fontWeight="semibold" color="purple.100" align="center">
            {asset.symbol} <ChevronDownIcon boxSize={6} mt={0.5} />
          </Flex>
        </Stack>
      </PopoverTrigger>
      <PopoverContent _focus={{ outline: 'none' }} borderWidth={0} bgColor="transparent">
        <PopoverBody
          p={2}
          mt={-1}
          bgColor="#211e36"
          borderColor="purple.700"
          borderWidth={2}
          borderRadius={8}
          boxShadow="rgba(0, 0, 0, 0.75) 0px 5px 15px"
          _focus={{ outline: 'none' }}
        >
          {children}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

const FromAssetDropdown = ({ isOpen, onClose, onOpen, asset, options, handleChange }: any) => {
  const { balances } = useAccountBalances()

  return (
    <AssetsDropdown isOpen={isOpen} onClose={onClose} onOpen={onOpen} asset={asset} noPadding>
      {options.map((from: string) => {
        const fromToken = TOKENS[from]
        const toToken = TOKENS[Object.keys(VAULTS[from])[0]]

        return (
          <Flex
            p={2}
            justify="space-between"
            borderRadius={8}
            _hover={{ bgColor: 'purple.900' }}
            onClick={() => handleChange(fromToken, toToken)}
            cursor="pointer"
          >
            <Stack direction="row" align="center">
              <Flex w={5}>
                <Image w={5} h={5} src={fromToken.image} />
              </Flex>
              <Flex fontWeight="semibold" align="center" color="purple.100">
                {fromToken.symbol}
              </Flex>
            </Stack>
            <Text fontWeight="semibold" color="purple.100">
              {balances ? parseFloat(formatUnits(balances[asset.address])).toFixed(2) : '0.00'}
            </Text>
          </Flex>
        )
      })}
    </AssetsDropdown>
  )
}

const ToAssetDropdown = ({ isOpen, onClose, onOpen, asset, options, handleChange }: any) => (
  <AssetsDropdown isOpen={isOpen} onClose={onClose} onOpen={onOpen} asset={asset}>
    {options.map((to: string) => {
      const toToken = TOKENS[to]

      return (
        <Flex
          p={2}
          justify="space-between"
          borderRadius={8}
          _hover={{ bgColor: 'purple.900' }}
          onClick={() => handleChange(toToken)}
          cursor="pointer"
        >
          <Stack direction="row" align="center">
            <Flex w={5}>
              <Image w={5} h={5} src={toToken.image} />
            </Flex>
            <Flex fontWeight="semibold" align="center" color="purple.100">
              {toToken.symbol}
            </Flex>
          </Stack>
          <Text fontWeight="semibold" color="purple.100">
            7.62% APY
          </Text>
        </Flex>
      )
    })}
  </AssetsDropdown>
)

export const VaultsView = () => {
  const { active } = useWeb3React<Web3Provider>()
  const [operation, setOperation] = useState<string>(VaultOperations.deposit)
  const [amount, setAmount] = useState<string>('')
  const [fromAsset, setFromAsset] = useState(TOKENS[DAI])
  const [toAsset, setToAsset] = useState(TOKENS.ETH)
  const { isOpen: fromIsOpen, onOpen: fromOnOpen, onClose: fromOnClose } = useDisclosure()
  const { isOpen: toIsOpen, onOpen: toOnOpen, onClose: toOnClose } = useDisclosure()
  const { balances } = useAccountBalances()

  const max = () => (balances ? parseFloat(formatUnits(balances[fromAsset.address])) : 0)

  return (
    <Container label="Vaults" description="Earn X on your Y" href="https://docs.inverse.finance/vaults">
      <Stack w="full" spacing={4}>
        <NavButtons
          options={[VaultOperations.deposit, VaultOperations.withdraw, VaultOperations.claim]}
          active={operation}
          onClick={setOperation}
        />
        <Stack spacing={1} pt={2} pb={2}>
          {balances && (
            <Stack direction="row" align="flex-end" justify="flex-end" spacing={1}>
              <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                Wallet:
              </Text>
              <Text fontSize="13px" fontWeight="semibold">
                {`${max().toFixed(2)} ${fromAsset.symbol}`}
              </Text>
            </Stack>
          )}
          <BalanceInput
            value={amount}
            onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value)}
            onMaxClick={() => setAmount((Math.floor(max() * 1e8) / 1e8).toString())}
            label={
              <Stack direction="row" align="center" p={2} spacing={4} cursor="pointer">
                <Flex w={0.5} h={8}>
                  <Flex w="full" h="full" bgColor="purple.500" borderRadius={8} />
                </Flex>
                <FromAssetDropdown
                  isOpen={fromIsOpen}
                  onClose={fromOnClose}
                  onOpen={() => {
                    fromOnOpen()
                    toOnClose()
                  }}
                  asset={fromAsset}
                  options={Object.keys(VAULTS)}
                  handleChange={(fromToken: Token, toToken: Token) => {
                    setFromAsset(fromToken)
                    setToAsset(toToken)
                    fromOnClose()
                  }}
                />
              </Stack>
            }
          />
        </Stack>
        <Stack direction="row" align="center" fontSize="lg" fontWeight="medium" justify="flex-end">
          <Text color="purple.100">Earn</Text>
          <Text fontWeight="semibold">7.62% APY</Text>
          <Text color="purple.100">with</Text>
          <ToAssetDropdown
            isOpen={toIsOpen}
            onClose={toOnClose}
            onOpen={() => {
              toOnOpen()
              fromOnClose()
            }}
            asset={toAsset}
            options={Object.keys(VAULTS[fromAsset.address])}
            handleChange={(toToken: Token) => {
              setToAsset(toToken)
              toOnClose()
            }}
          />
        </Stack>
        <SubmitButton
          isDisabled={!active || !amount || !balances || isNaN(amount as any) || parseFloat(amount) > max()}
        >
          Deposit
        </SubmitButton>
      </Stack>
    </Container>
  )
}
