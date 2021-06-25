import { Web3Provider } from '@ethersproject/providers'
import { CETHER_ABI, COMPTROLLER_ABI, CTOKEN_ABI, ERC20_ABI } from '@inverse/abis'
import { AnchorOperations } from '@inverse/components/Anchor/AnchorModals'
import { SubmitButton } from '@inverse/components/Button'
import { ANCHOR_ETH, COMPTROLLER } from '@inverse/config'
import { useApprovals } from '@inverse/hooks/useApprovals'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useAccountMarkets } from '@inverse/hooks/useMarkets'
import { Market } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, constants, Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

type AnchorButtonProps = {
  operation: AnchorOperations
  asset: Market
  amount: BigNumber
  isDisabled: boolean
}

export const AnchorButton = ({ operation, asset, amount, isDisabled }: AnchorButtonProps) => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { markets } = useAccountMarkets()
  const { approvals } = useApprovals()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()

  const contract = new Contract(asset.token, asset.token === ANCHOR_ETH ? CETHER_ABI : CTOKEN_ABI, library?.getSigner())

  switch (operation) {
    case AnchorOperations.supply:
      return asset.token !== ANCHOR_ETH && (!approvals || !parseFloat(formatUnits(approvals[asset.token]))) ? (
        <SubmitButton
          onClick={() =>
            new Contract(asset.underlying.address, ERC20_ABI, library?.getSigner()).approve(
              account,
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
      )

    case AnchorOperations.withdraw:
      return (
        <SubmitButton
          onClick={() => contract.redeemUnderlying(amount)}
          isDisabled={isDisabled || !supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token]))}
        >
          Withdraw
        </SubmitButton>
      )

    case AnchorOperations.borrow:
      return !markets.find(({ token }: Market) => token === asset.token) ? (
        <SubmitButton
          onClick={() => new Contract(COMPTROLLER, COMPTROLLER_ABI, library?.getSigner()).enterMarkets([asset.token])}
          isDisabled={isDisabled}
        >
          Enable
        </SubmitButton>
      ) : (
        <SubmitButton onClick={() => contract.borrow(amount)} isDisabled={isDisabled}>
          Borrow
        </SubmitButton>
      )

    case AnchorOperations.repay:
      return asset.token !== ANCHOR_ETH && (!approvals || !parseFloat(formatUnits(approvals[asset.token]))) ? (
        <SubmitButton
          onClick={() =>
            new Contract(asset.underlying.address, ERC20_ABI, library?.getSigner()).approve(
              account,
              constants.MaxUint256
            )
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
