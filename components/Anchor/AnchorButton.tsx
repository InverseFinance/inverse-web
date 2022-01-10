import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, GridItem, SimpleGrid, Stack } from '@chakra-ui/react'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { SubmitButton } from '@inverse/components/common/Button'
import { useApprovals } from '@inverse/hooks/useApprovals'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useEscrow } from '@inverse/hooks/useEscrow'
import { Market, AnchorOperations } from '@inverse/types'
import { getAnchorContract, getCEtherContract, getERC20Contract, getEscrowContract, getEthRepayAllContract } from '@inverse/util/contracts'
import { timeUntil } from '@inverse/util/time'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, constants } from 'ethers'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
import moment from 'moment'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip'
import { InfoMessage } from '@inverse/components/common/Messages'
import { handleTx } from '@inverse/util/transactions';
import { hasAllowance } from '@inverse/util/web3';
import { getMonthlyRate, getParsedBalance } from '@inverse/util/markets';
import { removeScientificFormat, roundFloorString } from '@inverse/util/misc';

type AnchorButtonProps = {
  operation: AnchorOperations
  asset: Market
  amount: BigNumber
  isDisabled: boolean
  needWithdrawWarning?: boolean
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

const ApproveButton = ({
  asset,
  signer,
  isDisabled,
  onSuccess = () => { },
}: {
  asset: Market,
  signer?: JsonRpcSigner,
  isDisabled: boolean,
  onSuccess?: () => void,
}) => {
  return (
    <SubmitButton
      onClick={async () =>
        handleTx(
          await getERC20Contract(asset.underlying.address, signer).approve(asset.token, constants.MaxUint256),
          { onSuccess },
        )
      }
      isDisabled={isDisabled}
      rightIcon={<AnimatedInfoTooltip ml="1" message='Approving is the first step, it will allow us to use your tokens for the next final step. You only need to do the approve step once per token type and contract' />}
    >
      Approve
    </SubmitButton>
  )
}

export const AnchorButton = ({ operation, asset, amount, isDisabled, needWithdrawWarning }: AnchorButtonProps) => {
  const { library, chainId, account } = useWeb3React<Web3Provider>()
  const { ANCHOR_ETH, XINV, XINV_V1, ESCROW, ESCROW_V1, AN_ETH_REPAY_ALL } = getNetworkConfigConstants(chainId);
  const isEthMarket = asset.token === ANCHOR_ETH;
  const { approvals } = useApprovals()
  const [isApproved, setIsApproved] = useState(isEthMarket || hasAllowance(approvals, asset?.token));
  const [freshApprovals, setFreshApprovals] = useState<{ [key: string]: boolean }>({})
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()

  useEffect(() => {
    setIsApproved(isEthMarket || freshApprovals[asset?.token] || hasAllowance(approvals, asset?.token))
  }, [approvals, asset, freshApprovals])

  const handleApproveSuccess = () => {
    setFreshApprovals({ ...freshApprovals, [asset?.token]: true });
  }

  const handleRepayAll = () => {
    return isEthMarket ? handleEthRepayAll() : handleStandardRepayAll()
  }

  const handleEthRepayAll = () => {
    const repayAllContract = getEthRepayAllContract(AN_ETH_REPAY_ALL, library?.getSigner())

    const parsedBal = getParsedBalance(borrowBalances, asset.token, asset.underlying.decimals)
    const dailyInterests = removeScientificFormat(getMonthlyRate(parsedBal, asset.borrowApy) / 30);

    const marginForOneDayInterests = roundFloorString(dailyInterests, 18)

    const value = borrowBalances[asset.token].add(parseEther(marginForOneDayInterests))

    return repayAllContract.repayAll({ value })
  }

  const handleStandardRepayAll = () => {
    const repayAllContract = getAnchorContract(asset.token, library?.getSigner())
    return repayAllContract.repayBorrow(constants.MaxUint256)
  }

  const { withdrawalTime: withdrawalTime_v1, withdrawalAmount: withdrawalAmount_v1 } = useEscrow(ESCROW_V1)
  const { withdrawalTime, withdrawalAmount } = useEscrow(ESCROW)

  const contract =
    isEthMarket
      ? getCEtherContract(asset.token, library?.getSigner())
      : getAnchorContract(asset.token, library?.getSigner())

  switch (operation) {
    case AnchorOperations.supply:
      return (
        <Stack w="full" spacing={4}>
          {asset.token === XINV && <XINVEscrowAlert />}
          {!isApproved ? (
            <ApproveButton asset={asset} signer={library?.getSigner()} isDisabled={isDisabled} onSuccess={handleApproveSuccess} />
          ) : (
            <SubmitButton
              onClick={() => contract.mint(isEthMarket ? { value: amount } : amount)}
              refreshOnSuccess={true}
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
          <SimpleGrid columns={2} spacingX="3" spacingY="1">
            <SubmitButton
              onClick={() => contract.redeemUnderlying(amount)}
              refreshOnSuccess={true}
              isDisabled={isDisabled || !supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token]))}
            >
              Withdraw
            </SubmitButton>
            <SubmitButton
              onClick={async () => {
                const bn = await contract.balanceOf(account);
                return contract.redeem(bn);
              }}
              refreshOnSuccess={true}
              isDisabled={!supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token]))}
              rightIcon={<AnimatedInfoTooltip ml="1" message='Withdraw all and avoid "dust" being left behind. May fail if you have the asset enabled as collateral and have outstanding debt.' />}
            >
              Withdraw ALL
            </SubmitButton>
          </SimpleGrid>
        </Stack>
      )

    case AnchorOperations.borrow:
      return (
        <SubmitButton onClick={() => contract.borrow(amount)} refreshOnSuccess={true} isDisabled={isDisabled}>
          Borrow
        </SubmitButton>
      )

    case AnchorOperations.repay:
      return !isApproved ? (
        <ApproveButton asset={asset} signer={library?.getSigner()} isDisabled={isDisabled} onSuccess={handleApproveSuccess} />
      ) : (
        <SimpleGrid columns={2} spacingX="3" spacingY="1">
          <SubmitButton
            isDisabled={isDisabled || !borrowBalances || !parseFloat(formatUnits(borrowBalances[asset.token]))}
            onClick={() => contract.repayBorrow(isEthMarket ? { value: amount } : amount)}
            refreshOnSuccess={true}
          >
            Repay
          </SubmitButton>

          <SubmitButton
            isDisabled={!borrowBalances || !parseFloat(formatUnits(borrowBalances[asset.token]))}
            onClick={handleRepayAll}
            refreshOnSuccess={true}
            rightIcon={<AnimatedInfoTooltip ml="1" message='Repay all the debt for this market and avoid "debt dust" being left behind.' />}
          >
            Repay ALL
          </SubmitButton>
        </SimpleGrid>
      )
  }

  return <></>
}
