import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import { formatUnits } from 'ethers/lib/utils'
import { useState } from 'react'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { ModalButton } from '../Button'
import { Input } from '../Input'
import { Modal } from '../Modal'
import { SupplyDetails, BorrowLimit, BorrowDetails, BorrowLimitRemaining } from './ModalStats'
import { useWeb3React } from '@web3-react/core'
import { useAccountLiquidity, useExchangeRates } from '@inverse/hooks/useAccountLiquidity'
import { usePrices } from '@inverse/hooks/usePrices'

const MaxButton = (props: any) => (
  <Flex
    cursor="pointer"
    position="absolute"
    left={0}
    fontWeight="extrabold"
    fontSize="sm"
    ml={10}
    color="purple.100"
    zIndex="docked"
    _hover={{ color: '#fff' }}
    {...props}
  />
)

const Option = ({ isActive, onClick, children }: any) => (
  <Flex
    w="full"
    justify="center"
    borderBottomColor="#fff"
    borderBottomWidth={isActive ? 3 : 0}
    color={isActive ? '#fff' : 'purple.100'}
    pb={2}
    fontSize="13px"
    fontWeight="bold"
    textTransform="uppercase"
    onClick={onClick}
  >
    {children}
  </Flex>
)

export const AnchorModal = ({ isOpen, onClose, asset, tabs }: any) => {
  const [tab, setTab] = useState(tabs[0])
  const [amount, setAmount] = useState<string>('')
  const { active } = useWeb3React()
  const { balances } = useAccountBalances()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { exchangeRates } = useExchangeRates()
  const { prices } = usePrices()
  const { usdBorrowable } = useAccountLiquidity()

  const getMax = (type: any) => {
    switch (type) {
      case 'wallet':
        return balances ? formatUnits(balances[asset.underlying.address || 'ETH'], asset.underlying.decimals) : 0
      case 'supplied':
        return supplyBalances && exchangeRates
          ? parseFloat(formatUnits(supplyBalances[asset.token])) * parseFloat(formatUnits(exchangeRates[asset.token]))
          : 0
      case 'borrowable':
        return prices && usdBorrowable ? usdBorrowable / prices[asset.underlying.coingeckoId].usd : 0
      case 'borrowed':
        return borrowBalances && borrowBalances[asset.token]
          ? parseFloat(formatUnits(borrowBalances[asset.token], asset.underlying.decimals))
          : 0
    }

    return 0
  }

  const handleMax = () => {
    setAmount(tab.maxAmount(getMax).toString().substr(0, 14))
  }

  const handleClose = () => {
    setAmount('')
    onClose()
  }

  const Stats = tab.stats

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Image src={asset.underlying.image} w={8} h={8} />
          <Text>{asset.underlying.name}</Text>
        </Stack>
      }
      footer={
        <ModalButton isDisabled={!active || !amount} onClick={tab.onSubmit}>
          {tab.label}
        </ModalButton>
      }
    >
      <Stack>
        <Stack align="center" p={6} spacing={1}>
          <Flex w="full" justify="flex-end" align="flex-end">
            <Stack direction="row" align="flex-end" spacing={1}>
              <Text fontSize="13px" fontWeight="semibold" color="purple.100">
                {`${tab.maxLabel}:`}
              </Text>
              <Text fontSize="13px" fontWeight="semibold">
                {`${tab.maxAmount(getMax)} ${asset.underlying.symbol}`}
              </Text>
            </Stack>
          </Flex>
          <Flex w="full" align="center">
            <MaxButton onClick={handleMax}>MAX</MaxButton>
            <Input value={amount} onChange={(e: any) => setAmount(e.target.value)} />
            <Flex fontSize="lg" fontWeight="semibold" ml={2} color="purple.100">
              {asset.underlying.symbol}
            </Flex>
          </Flex>
        </Stack>
        <Flex w="full" cursor="pointer" borderBottomColor="purple.900" borderBottomWidth={2}>
          {tabs.map((t: any) => (
            <Option key={t.label} isActive={tab.label === t.label} onClick={() => setTab(t)}>
              {t.label}
            </Option>
          ))}
        </Flex>
        <Stats asset={asset} amount={amount} />
      </Stack>
    </Modal>
  )
}

export const AnchorSupplyModal = ({ isOpen, onClose, asset }: any) => {
  if (!asset) {
    return <></>
  }

  return (
    <AnchorModal
      isOpen={isOpen}
      onClose={onClose}
      asset={asset}
      tabs={[
        {
          label: 'Supply',
          stats: ({ asset, amount }: any) => (
            <>
              <SupplyDetails asset={asset} />
              <BorrowLimit asset={asset} amount={amount && !isNaN(amount) ? parseFloat(amount) : 0} />
            </>
          ),
          onSubmit: () => console.log('supplying'),
          maxLabel: 'Wallet',
          maxAmount: (getMax: any) => getMax('wallet'),
        },
        {
          label: 'Withdraw',
          stats: ({ asset, amount }: any) => (
            <>
              <SupplyDetails asset={asset} />
              <BorrowLimit asset={asset} amount={amount && !isNaN(amount) ? -1 * parseFloat(amount) : 0} />
            </>
          ),
          onSubmit: () => console.log('withdrawing'),
          maxLabel: 'Supplied',
          maxAmount: (getMax: any) => getMax('supplied'),
        },
      ]}
    />
  )
}

export const AnchorBorrowModal = ({ isOpen, onClose, asset }: any) => {
  if (!asset) {
    return <></>
  }

  return (
    <AnchorModal
      isOpen={isOpen}
      onClose={onClose}
      asset={asset}
      tabs={[
        {
          label: 'Borrow',
          stats: ({ asset, amount }: any) => (
            <>
              <BorrowDetails asset={asset} />
              <BorrowLimitRemaining asset={asset} amount={amount && !isNaN(amount) ? -1 * parseFloat(amount) : 0} />
            </>
          ),
          onSubmit: () => console.log('borrowing'),
          maxLabel: 'Limit',
          maxAmount: (getMax: any) => getMax('borrowable'),
        },
        {
          label: 'Repay',
          stats: ({ asset, amount }: any) => (
            <>
              <BorrowDetails asset={asset} />
              <BorrowLimitRemaining asset={asset} amount={amount && !isNaN(amount) ? parseFloat(amount) : 0} />
            </>
          ),
          onSubmit: () => console.log('repaying'),
          maxLabel: 'Borrowed',
          maxAmount: (getMax: any) => getMax('borrowed'),
        },
      ]}
    />
  )
}
