import { JsonRpcSigner } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import localforage from 'localforage';

const mockTx = async (signer: JsonRpcSigner, msg: string) => {
    const sig = await signer.signMessage(msg).catch(() => '');
    return !!sig;
}

export const createAlePosition = async ({
    inputToken,
    collateralMarket,
    borrowMarket,
    inputAmount,
    collateralAmount,
    maxBorrowedAmount,
    signer,
}: {
    inputToken: string,
    collateralMarket: string,
    borrowMarket: string,
    inputAmount: string | BigNumber,
    collateralAmount: string | BigNumber,
    maxBorrowedAmount: string | BigNumber,
    signer: JsonRpcSigner
}) => {
    const positions = (await localforage.getItem('ale-positions')) || [];
    const owner = await signer.getAddress();

    const mockResult = await mockTx(signer, "Mock: createPosition()");
    
    if (mockResult) {
        positions.push({
            inputToken,
            inputAmount: inputAmount.toString(),
            collateralMarket: collateralMarket,
            borrowMarket: borrowMarket,
            collateralAmount: collateralAmount.toString(),
            maxBorrowedAmount: maxBorrowedAmount.toString(),
            owner,
        });

        await localforage.setItem('ale-positions', positions);
    }
}