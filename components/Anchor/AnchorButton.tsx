import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, GridItem, SimpleGrid, Stack } from '@chakra-ui/react'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { SubmitButton } from '@inverse/components/common/Button'
import { useApprovals } from '@inverse/hooks/useApprovals'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useEscrow } from '@inverse/hooks/useEscrow'
import { Market, AnchorOperations } from '@inverse/types'
import { getAnchorContract, getCEtherContract, getERC20Contract, getEscrowContract } from '@inverse/util/contracts'
import { timeUntil } from '@inverse/util/time'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, constants } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import moment from 'moment'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip'
import { InfoMessage } from '@inverse/components/common/Messages'

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
        xINV withdrawals are subject to a 10-day escrow
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

const ClaimFromEscrowBtn = ({
  escrowAddress,
  withdrawalTime,
  withdrawalAmount,
  signer,
}:
  {
    escrowAddress: string,
    withdrawalTime: Date | undefined,
    withdrawalAmount: BigNumber,
    signer: JsonRpcSigner,
  }) => {
  return <SubmitButton
    onClick={() => getEscrowContract(escrowAddress, signer).withdraw()}
    isDisabled={moment(withdrawalTime).isAfter(moment())}
  >
    {moment(withdrawalTime).isAfter(moment())
      ? `${parseFloat(formatUnits(withdrawalAmount)).toFixed(2)} INV unlocks ${timeUntil(withdrawalTime)}`
      : `Claim ${parseFloat(formatUnits(withdrawalAmount)).toFixed(2)} INV`}
  </SubmitButton>
}

export const AnchorButton = ({ operation, asset, amount, isDisabled }: AnchorButtonProps) => {
  const { library, chainId } = useWeb3React<Web3Provider>()
  const { approvals } = useApprovals()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { ANCHOR_ETH, XINV, XINV_V1, ESCROW, ESCROW_V1 } = getNetworkConfigConstants(chainId);

  const { withdrawalTime: withdrawalTime_v1, withdrawalAmount: withdrawalAmount_v1 } = useEscrow(ESCROW_V1)
  const { withdrawalTime, withdrawalAmount } = useEscrow(ESCROW)

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
          {asset.token === XINV && withdrawalAmount?.gt(0) && library?.getSigner() && (
            <ClaimFromEscrowBtn
              escrowAddress={ESCROW}
              withdrawalTime={withdrawalTime}
              withdrawalAmount={withdrawalAmount}
              signer={library?.getSigner()}
            />
          )}
          {asset.token === XINV_V1 && withdrawalAmount_v1?.gt(0) && library?.getSigner() && (
            <ClaimFromEscrowBtn
              escrowAddress={ESCROW_V1}
              withdrawalTime={withdrawalTime_v1}
              withdrawalAmount={withdrawalAmount_v1}
              signer={library?.getSigner()}
            />
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
        <SimpleGrid columns={2} spacingX="3" spacingY="1">
          <SubmitButton
            isDisabled={isDisabled || !borrowBalances || !parseFloat(formatUnits(borrowBalances[asset.token]))}
            onClick={() => contract.repayBorrow(asset.token === ANCHOR_ETH ? { value: amount } : amount)}
          >
            Repay
          </SubmitButton>

          <SubmitButton
            isDisabled={!borrowBalances || asset.token === ANCHOR_ETH || !parseFloat(formatUnits(borrowBalances[asset.token]))}
            onClick={() => contract.repayBorrow(constants.MaxUint256)}
            rightIcon={<AnimatedInfoTooltip ml="1" message='Repays all the debt and avoids "dust" being left behind.' />}
          >
            Repay ALL
          </SubmitButton>
          {
            asset.token === ANCHOR_ETH ?
              <GridItem colSpan={2}>
                <InfoMessage
                  alertProps={{ fontSize: '12px', mt: "2", w: 'full' }}
                  description="Repay ALL feature is not supported in the ETH market." />
              </GridItem>
              : null
          }
        </SimpleGrid>
      )
  }

  return <></>
}
