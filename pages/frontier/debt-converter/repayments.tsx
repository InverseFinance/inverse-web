import { HStack, Stack, VStack } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useState } from 'react'

import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { AssetInput } from '@app/components/common/Assets/AssetInput'
import { getNetworkConfigConstants } from '@app/util/networks'
import { useBalances } from '@app/hooks/useBalances'

import { InfoMessage } from '@app/components/common/Messages'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { SubmitButton } from '@app/components/common/Button'
import { useAllowances } from '@app/hooks/useApprovals'
import { hasAllowance } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { debtRepay } from '@app/util/contracts'
import { DebtRepayments } from '@app/components/Anchor/DebtConverter/DebtRepayments'
import { useRouter } from 'next/router'

import { parseEther } from 'ethers/lib/utils';
import { TOKENS } from '@app/variables/tokens'
import useEtherSWR from '@app/hooks/useEtherSWR'

const { DEBT_CONVERTER, DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const DebtConverterRepaymentsPage = () => {
    const { library, account } = useWeb3React<Web3Provider>()
    const { query } = useRouter()
    const userAddress = (query?.viewAddress as string) || account;

    const { data } = useEtherSWR([DEBT_CONVERTER, 'outstandingDebt']);
    const outstandingDebt = data ? getBnToNumber(data) : 0;

    const swapOptions = [DOLA];
    const [collateralAmount, setCollateralAmount] = useState('');

    const { approvals } = useAllowances([DOLA], DEBT_CONVERTER);

    const { balances } = useBalances([DOLA], 'balanceOf', userAddress);

    const commonAssetInputProps = { tokens: TOKENS, balances, showBalance: true }

    const changeCollateralAmount = (newAmount: string) => {
        setCollateralAmount(newAmount);
    }

    const handleRepayment = () => {
        return debtRepay(
            library?.getSigner(),
            parseEther(collateralAmount),
        );
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Debt Converter Repayments</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Debt Converter" />
            <ErrorBoundary>
                <VStack maxWidth="1200px">
                    <Container label="Repay">
                        <VStack w='full'>
                            <InfoMessage description={`Current outstanding debt: ${shortenNumber(outstandingDebt, 2)}`} />
                            <AssetInput
                                amount={collateralAmount}
                                token={dolaToken}
                                assetOptions={swapOptions}
                                onAssetChange={(newToken) => { }}
                                onAmountChange={(newAmount) => changeCollateralAmount(newAmount)}
                                orderByBalance={true}
                                dropdownSelectedProps={{ fontSize: '12px' }}
                                {...commonAssetInputProps}
                            />
                            <HStack w='full' pt="4">
                                {
                                    !hasAllowance(approvals, DOLA) ?
                                        <ApproveButton
                                            tooltipMsg=""
                                            isDisabled={false}
                                            address={DOLA}
                                            toAddress={DEBT_CONVERTER}
                                            signer={library?.getSigner()}
                                        />
                                        :
                                        <Stack direction={{ base: 'column', lg: 'row' }} w='full'>
                                            <SubmitButton
                                                disabled={!collateralAmount || !parseFloat(collateralAmount)}
                                                onClick={() => handleRepayment()}
                                                refreshOnSuccess={true}>
                                                make a repayment
                                            </SubmitButton>
                                        </Stack>
                                }
                            </HStack>
                        </VStack>
                    </Container>
                    {
                        !!account && <DebtRepayments />
                    }
                </VStack>
            </ErrorBoundary>
        </Layout >
    )
}

export default DebtConverterRepaymentsPage
