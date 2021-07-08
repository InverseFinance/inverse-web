import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, Stack } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { AnchorOperations } from '@inverse/components/Anchor/AnchorModals'
import { SubmitButton } from '@inverse/components/Button'
import { ANCHOR_ETH, XINV } from '@inverse/config'
import { useApprovals } from '@inverse/hooks/useApprovals'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useEscrow } from '@inverse/hooks/useEscrow'
import { Market } from '@inverse/types'
import { getAnchorContract, getCEtherContract, getERC20Contract, getEscrowContract } from '@inverse/util/contracts'
import { timeUntil } from '@inverse/util/time'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, constants } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import moment from 'moment'

type AnchorButtonProps = {
  operation: AnchorOperations
  asset: Market
  amount: BigNumber
  isDisabled: boolean
}

const XINVEscrowAlert = ({ showDescription }: any) => (
  <Alert borderRadius={8} flexDirection="column" color="purple.600" bgColor="purple.200" p={3}>
    <Flex w="full" align="center">
      <AlertIcon color="purple.600" />
      <AlertTitle ml={-1} fontSize="sm">
        xINV withdrawals are subject to a 14-day escrow
      </AlertTitle>
    </Flex>
    {showDescription && (
      <AlertDescription fontWeight="medium" fontSize="sm">
        During this duration, the withdrawn amount will not earn INV rewards and cannot be used as collateral. New
        withdrawals will reset the current escrow period.
      </AlertDescription>
    )}
  </Alert>
)

export const AnchorButton = ({ operation, asset, amount, isDisabled }: AnchorButtonProps) => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { approvals } = useApprovals()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { withdrawalTime, withdrawalAmount } = useEscrow()
  console.log(withdrawalTime, withdrawalAmount)

  const contract =
    asset.token === ANCHOR_ETH
      ? getCEtherContract(asset.token, library?.getSigner())
      : getAnchorContract(asset.token, library?.getSigner())

  switch (operation) {
    case AnchorOperations.supply:
      return (
        <Stack w="full" spacing={4}>
          {asset.token === XINV && <XINVEscrowAlert />}
          {asset.token !== ANCHOR_ETH && (!approvals || !parseFloat(formatUnits(approvals[asset.token]))) ? (
            <SubmitButton
              onClick={() =>
                getERC20Contract(asset.underlying.address, library?.getSigner()).approve(
                  asset.token,
                  constants.MaxUint256
                )
              }
              isDisabled={isDisabled}
            >
              Approve
            </SubmitButton>
          ) : (
            <SubmitButton
              onClick={() => contract.mint(asset.token === ANCHOR_ETH ? { value: amount } : amount)}
              isDisabled={isDisabled}
            >
              Supply
            </SubmitButton>
          )}
        </Stack>
      )

    case AnchorOperations.withdraw:
      return (
        <Stack w="full" spacing={4}>
          {asset.token === XINV && <XINVEscrowAlert showDescription />}
          {asset.token === XINV && withdrawalAmount?.gt(0) && (
            <SubmitButton
              onClick={() => getEscrowContract(library?.getSigner()).withdraw()}
              isDisabled={moment(withdrawalTime).isAfter(moment())}
            >
              {moment(withdrawalTime).isAfter(moment())
                ? `${parseFloat(formatUnits(withdrawalAmount)).toFixed(2)} INV unlocks ${timeUntil(withdrawalTime)}`
                : `Claim ${parseFloat(formatUnits(withdrawalAmount)).toFixed(2)} INV`}
            </SubmitButton>
          )}
          <SubmitButton
            onClick={() => contract.redeemUnderlying(amount)}
            isDisabled={isDisabled || !supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token]))}
          >
            Withdraw
          </SubmitButton>
        </Stack>
      )

    case AnchorOperations.borrow:
      return (
        <SubmitButton onClick={() => contract.borrow(amount)} isDisabled={isDisabled}>
          Borrow
        </SubmitButton>
      )

    case AnchorOperations.repay:
      return asset.token !== ANCHOR_ETH && (!approvals || !parseFloat(formatUnits(approvals[asset.token]))) ? (
        <SubmitButton
          onClick={() =>
            getERC20Contract(asset.underlying.address, library?.getSigner()).approve(asset.token, constants.MaxUint256)
          }
          isDisabled={isDisabled}
        >
          Approve
        </SubmitButton>
      ) : (
        <SubmitButton
          isDisabled={isDisabled || !borrowBalances || !parseFloat(formatUnits(borrowBalances[asset.token]))}
          onClick={() => contract.repayBorrow(asset.token === ANCHOR_ETH ? { value: amount } : amount)}
        >
          Repay
        </SubmitButton>
      )
  }

  return <></>
}
