import { JsonRpcSigner } from '@ethersproject/providers';
import localforage from 'localforage';

const mockTx = async (signer: JsonRpcSigner, msg: string) => {
    const sig = await signer.signMessage(msg).catch(() => '');
    return !!sig;
}

export const createAlePosition = async ({
    inputMarket,
    collateralMarket,
    borrowMarket,
    inputAmount,
    collateralAmount,
    maxBorrowedAmount,
    signer,
}: {
    signer: JsonRpcSigner
}) => {
    const positions = (await localforage.getItem('ale-positions')) || [];
    const owner = await signer.getAddress();

    const mockResult = await mockTx(signer, "Mock: createPosition()");
    
    if (mockResult) {
        positions.push({
            collateralMarket: collateralMarket,
            borrowMarket: borrowMarket,
            owner,
        });

        await localforage.setItem('ale-positions', positions);
    }
}