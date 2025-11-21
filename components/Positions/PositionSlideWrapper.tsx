import { PositionSlide } from './PositionSlide'
import { useBorrowedAssets, useSuppliedCollaterals } from '@app/hooks/useBalances'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router'

export const PositionSlideWrapper = ({
    isOpen,
    onClose,
}: {
    isOpen: boolean,
    onClose: () => void,
}) => {
    const { account } = useWeb3React<Web3Provider>();
    const { query } = useRouter()
    const userAddress = (query?.viewAddress as string) || account;
    const supplied = useSuppliedCollaterals();
    const borrowed = useBorrowedAssets();

    const { usdBorrow, usdShortfall, usdBorrowable, usdSupply } = useAccountLiquidity();

    const position = {
        account: userAddress,
        usdBorrowed: usdBorrow, 
        usdShortfall,
        usdBorrowable,
        usdSupplied: usdSupply,
        supplied,
        borrowed,
        borrowingPower: supplied.map(s => ({...s, usdPrice: s.usdPrice * s.collateralFactor})),
    }

    return <PositionSlide needFresh={true} position={position} isOpen={isOpen} onClose={onClose} />
}