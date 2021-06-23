import { Web3Provider } from '@ethersproject/providers'
import { CETHER_ABI, COMPTROLLER_ABI, CTOKEN_ABI, ERC20_ABI } from '@inverse/abis'
import { ANCHOR_ETH, COMPTROLLER } from '@inverse/config'
import { useApprovals } from '@inverse/hooks/useApprovals'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import { useAccountMarkets } from '@inverse/hooks/useMarkets'
import { Market } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { constants, Contract } from 'ethers'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'
import { ModalButton } from '../Button'
import { AnchorOperations } from './AnchorModals'

export const AnchorButton = ({ operation, asset, amount, isDisabled }: any) => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { markets } = useAccountMarkets()
  const { approvals } = useApprovals()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()

  const contract = new Contract(asset.token, asset.token === ANCHOR_ETH ? CETHER_ABI : CTOKEN_ABI, library?.getSigner())
  const parsedAmount = amount ? parseUnits(amount, asset.underlying.decimals) : 0

  switch (operation) {
    case AnchorOperations.supply:
      return asset.token !== ANCHOR_ETH && (!approvals || !parseFloat(formatUnits(approvals[asset.token]))) ? (
        <ModalButton
          onClick={() =>
            new Contract(asset.underlying.address, ERC20_ABI, library?.getSigner()).approve(
              account,
              constants.MaxUint256
            )
          }
          isDisabled={isDisabled}
        >
          Approve
        </ModalButton>
      ) : (
        <ModalButton
          onClick={() => contract.mint(asset.token === ANCHOR_ETH ? { value: parseEther(amount) } : parsedAmount)}
          isDisabled={isDisabled}
        >
          Supply
        </ModalButton>
      )

    case AnchorOperations.withdraw:
      return (
        <ModalButton
          onClick={() => contract.redeemUnderlying(parsedAmount)}
          isDisabled={isDisabled || !supplyBalances || !parseFloat(formatUnits(supplyBalances[asset.token]))}
        >
          Withdraw
        </ModalButton>
      )

    case AnchorOperations.borrow:
      return !markets.find(({ token }: Market) => token === asset.token) ? (
        <ModalButton
          onClick={() => new Contract(COMPTROLLER, COMPTROLLER_ABI, library?.getSigner()).enterMarkets([asset.token])}
          isDisabled={isDisabled}
        >
          Enable
        </ModalButton>
      ) : (
        <ModalButton onClick={() => contract.borrow(parsedAmount)} isDisabled={isDisabled}>
          Borrow
        </ModalButton>
      )

    case AnchorOperations.repay:
      return asset.token !== ANCHOR_ETH && (!approvals || !parseFloat(formatUnits(approvals[asset.token]))) ? (
        <ModalButton
          onClick={() =>
            new Contract(asset.underlying.address, ERC20_ABI, library?.getSigner()).approve(
              account,
              constants.MaxUint256
            )
          }
          isDisabled={isDisabled}
        >
          Approve
        </ModalButton>
      ) : (
        <ModalButton
          isDisabled={isDisabled || !borrowBalances || !parseFloat(formatUnits(borrowBalances[asset.token]))}
          onClick={() =>
            contract.repayBorrow(asset.token === ANCHOR_ETH ? { value: parseEther(amount) } : parsedAmount)
          }
        >
          Repay
        </ModalButton>
      )
  }

  return <></>
}
