// @ts-nocheck
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { SubmitButton } from '@app/components/common/Button'
import { useApprovals } from '@app/hooks/useApprovals'
import { useAccountBalances, useBorrowBalances, useMarketCash, useSupplyBalances } from '@app/hooks/useBalances'
import { useEscrow } from '@app/hooks/useEscrow'
import { Market, AnchorOperations } from '@app/types'
import { getAnchorContract, getCEtherContract, getERC20Contract, getEscrowContract, getEthRepayAllContract } from '@app/util/contracts'
import { timeUntil, isAfter } from '@app/util/time'
import { useWeb3React } from '@app/util/wallet'
import { BigNumber, constants } from 'ethers'
import { formatUnits, parseEther } from 'ethers/lib/utils'
 
import { getNetworkConfigConstants } from '@app/util/networks';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { handleTx } from '@app/util/transactions';
import { hasAllowance } from '@app/util/web3';
import { getBnToNumber, getMonthlyRate, getParsedBalance } from '@app/util/markets';
import { removeScientificFormat, roundFloorString } from '@app/util/misc';
import { RTOKEN_SYMBOL } from '@app/variables/tokens';
import { useExchangeRates } from '@app/hooks/useExchangeRates';

type AnchorButtonProps = {
  operation: AnchorOperations
  asset: Market
  amount: BigNumber
  isDisabled: boolean
  needWithdrawWarning?: boolean
}

const XINVEscrowAlert = ({ showDescription, duration }: any) => (
  <Alert borderRadius={8} flexDirection="column" color="primary.600" bgColor="primary.200" p={3}>
    <Flex w="full" align="center">
      <AlertIcon color="primary.600" />
      <AlertTitle ml={-1} fontSize="sm">
        x{process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} withdrawals are subject to a {duration}-day escrow
      </AlertTitle>
    </Flex>
    {showDescription && (
      <AlertDescription fontWeight="medium" fontSize="sm">
        During this duration, the withdrawn amount will not earn {process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} rewards and cannot be used as collateral. New
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
    isDisabled={isAfter(withdrawalTime)}
  >
    {isAfter(withdrawalTime)
      ? `${parseFloat(formatUnits(withdrawalAmount)).toFixed(2)} ${process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL} unlocks ${timeUntil(withdrawalTime)}`
      : `Claim ${parseFloat(formatUnits(withdrawalAmount)).toFixed(2)} ${process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL}`}
  </SubmitButton>
}

export const ApproveButton = ({
  address,
  toAddress,
  signer,
  isDisabled,
  onSuccess = () => { },
  tooltipMsg,
  ButtonComp = SubmitButton,
  amount = constants.MaxUint256,
  forceRefresh = false,
  ...props
}: {
  address: string,
  toAddress: string,
  signer?: JsonRpcSigner,
  isDisabled: boolean,
  onSuccess?: () => void,
  tooltipMsg?: string
  amount?: string | BigNumber,
  ButtonComp?: React.ComponentType<any>
  forceRefresh?: boolean
}) => {
  return (
    <ButtonComp
      onClick={async () => {
        return forceRefresh ?
          getERC20Contract(address, signer).approve(toAddress, amount) :
          // backward compatibility
          handleTx(
            await getERC20Contract(address, signer).approve(toAddress, amount),
            { onSuccess },
          )
      }}
      isDisabled={isDisabled}
      onSuccess={onSuccess}
      refreshOnSuccess={true}
      rightIcon={tooltipMsg === '' ? undefined : <AnimatedInfoTooltip type="tooltip" ml="1" message='Approving is the first step, it will allow us to use your tokens for the next final step. You only need to do the approve step once per token type and contract' />}
      {...props}
    >
      {props?.children || 'Step 1/2 - Approve'}
    </ButtonComp>
  )
}

export const AnchorButton = ({ operation, asset, amount, isDisabled, needWithdrawWarning }: AnchorButtonProps) => {
  const { provider, chainId, account } = useWeb3React<Web3Provider>()
  const { XINV, XINV_V1, ESCROW, ESCROW_OLD } = getNetworkConfigConstants(chainId);
  const isEthMarket = !asset.underlying.address;
  const { approvals } = useApprovals()
  const [isApproved, setIsApproved] = useState(isEthMarket || hasAllowance(approvals, asset?.token));
  const [freshApprovals, setFreshApprovals] = useState<{ [key: string]: boolean }>({})
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { balances } = useAccountBalances();
  const { exchangeRates } = useExchangeRates();
  const { cash } = useMarketCash(asset);

  const balance = balances && balances[asset.underlying.address || 'CHAIN_COIN']
    ? getBnToNumber(balances[asset.underlying.address || 'CHAIN_COIN'], asset.underlying.decimals)
    : 0;

  const borrowBalance = borrowBalances && borrowBalances[asset.token]
    ? getBnToNumber(borrowBalances[asset.token], asset.underlying.decimals)
    : 0;
  // needs to be higher because debt accrues in tx
  const canRepayAll = balance > borrowBalance;

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
    const repayAllContract = getEthRepayAllContract(asset.repayAllAddress!, provider?.getSigner())

    const parsedBal = getParsedBalance(borrowBalances, asset.token, asset.underlying.decimals)
    const dailyInterests = removeScientificFormat(getMonthlyRate(parsedBal, asset.borrowApy) / 30);

    const marginForOneDayInterests = roundFloorString(dailyInterests, 18)

    const value = borrowBalances[asset.token].add(parseEther(marginForOneDayInterests))

    return repayAllContract.repayAll({ value })
  }

  const handleStandardRepayAll = () => {
    const repayAllContract = getAnchorContract(asset.token, provider?.getSigner())
    return repayAllContract.repayBorrow(constants.MaxUint256)
  }

  const { withdrawalTime: withdrawalTime_v1, withdrawalAmount: withdrawalAmount_v1 } = useEscrow(ESCROW_OLD)
  const { withdrawalTime, withdrawalAmount } = useEscrow(ESCROW)

  const contract =
    isEthMarket
      ? getCEtherContract(asset.token, provider?.getSigner())
      : getAnchorContract(asset.token, provider?.getSigner())

  const supply =
    supplyBalances && exchangeRates
      ? parseFloat(formatUnits(supplyBalances[asset.token], asset.underlying.decimals)) *
      parseFloat(formatUnits(exchangeRates[asset.token]))
      : 0;

  const hasEnoughMarketLiqToWithdrawAll = cash > supply;

  switch (operation) {
    case AnchorOperations.supply:
      return (
        <Stack w="full" spacing={4}>
          {asset.token === XINV && asset.escrowDuration && asset.escrowDuration > 0 && <XINVEscrowAlert duration={asset.escrowDuration} />}
          {!isApproved ? (
            <ApproveButton needPoaFirst={true} address={asset.underlying.address} toAddress={asset.token} signer={provider?.getSigner()} isDisabled={isDisabled} onSuccess={handleApproveSuccess} />
          ) : (
            <SubmitButton
              onClick={() => contract.mint(isEthMarket ? { value: amount } : amount)}
              refreshOnSuccess={true}
              isDisabled={isDisabled}
              needPoaFirst={true}
            >
              {asset.underlying.symbol === RTOKEN_SYMBOL ? 'Stake' : 'Supply'}
            </SubmitButton>
          )}
        </Stack>
      )

    case AnchorOperations.withdraw:
      return (
        <Stack w="full" spacing={4}>
          {asset.escrowDuration && asset.escrowDuration > 0 && <XINVEscrowAlert showDescription duration={asset.escrowDuration} />}
          {asset.token === XINV && withdrawalAmount?.gt(0) && provider?.getSigner() && (
            <ClaimFromEscrowBtn
              escrowAddress={ESCROW}
              withdrawalTime={withdrawalTime}
              withdrawalAmount={withdrawalAmount}
              signer={provider?.getSigner()}
            />
          )}
          {asset.token === XINV_V1 && withdrawalAmount_v1?.gt(0) && provider?.getSigner() && (
            <ClaimFromEscrowBtn
              escrowAddress={ESCROW_OLD}
              withdrawalTime={withdrawalTime_v1}
              withdrawalAmount={withdrawalAmount_v1}
              signer={provider?.getSigner()}
            />
          )}
          <SimpleGrid columns={2} spacingX="3" spacingY="1">
            <SubmitButton
              onClick={() => contract.redeemUnderlying(amount)}
              refreshOnSuccess={true}
              isDisabled={isDisabled || !supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token]))}
            >
              {asset.underlying.symbol === RTOKEN_SYMBOL ? 'Unstake' : 'Withdraw'}
            </SubmitButton>
            <SubmitButton
              onClick={async () => {
                const bn = await contract.balanceOf(account);
                return contract.redeem(bn);
              }}
              refreshOnSuccess={true}
              isDisabled={!supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token])) || !hasEnoughMarketLiqToWithdrawAll}
              rightIcon={<AnimatedInfoTooltip type='tooltip' ml="1" message={<VStack><Text>Withdraw all and avoid "dust" being left behind.</Text><Text>May fail if you have the asset enabled as collateral and have outstanding debt.</Text></VStack>} />}
            >
              {asset.underlying.symbol === RTOKEN_SYMBOL ? 'Unstake' : 'Withdraw'} ALL
            </SubmitButton>
          </SimpleGrid>
        </Stack>
      )

    case AnchorOperations.borrow:
      return (
        <SubmitButton needPoaFirst={true} onClick={() => contract.borrow(amount)} refreshOnSuccess={true} isDisabled={isDisabled}>
          Borrow
        </SubmitButton>
      )

    case AnchorOperations.repay:
      return !isApproved ? (
        <ApproveButton address={asset.underlying.address} toAddress={asset.token} signer={provider?.getSigner()} isDisabled={isDisabled} onSuccess={handleApproveSuccess} />
      ) : (
        <SimpleGrid columns={2} spacingX="3" spacingY="1">
          <SubmitButton
            isDisabled={isDisabled || !borrowBalance}
            onClick={() => contract.repayBorrow(isEthMarket ? { value: amount } : amount)}
            refreshOnSuccess={true}
          >
            Repay
          </SubmitButton>

          <SubmitButton
            isDisabled={!canRepayAll || !borrowBalance || (isEthMarket && !asset.repayAllAddress)}
            onClick={handleRepayAll}
            refreshOnSuccess={true}
            rightIcon={<AnimatedInfoTooltip type="tooltip" ml="1" message='Repay all the debt for this market and avoid "debt dust" being left behind.' />}
          >
            Repay ALL
          </SubmitButton>
        </SimpleGrid>
      )
  }

  return <></>
}
