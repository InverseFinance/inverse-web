import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
// import { SDOLA_HELPER_ADDRESS, swapDolaForExactDbr, swapExactDolaForDbr } from "@app/util/dbr-auction"
import { SDOLA_HELPER_ADDRESS, stakeDola, swapDolaForExactDbr, swapExactDolaForDbr } from "@app/util/dola-staking"
import useEtherSWR from "@app/hooks/useEtherSWR";
import { useWeb3React } from "@web3-react/core";
import { getBnToNumber, getNumberToBn, shortenNumber, smartShortNumber } from "@app/util/markets";
import { TextInfo } from "../common/Messages/TextInfo";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { Input } from "../common/Input";
import Container from "../common/Container";
import { useAccountDBR, useDBRPrice, useTriCryptoSwap } from "@app/hooks/useDBR";
import { NavButtons } from "@app/components/common/Button";
import { useDOLAPriceLive } from "@app/hooks/usePrices";
import { InfoMessage } from "@app/components/common/Messages";
import { preciseCommify } from "@app/util/misc";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { SDOLA_ADDRESS } from "@app/util/dola-staking";

const { DOLA } = getNetworkConfigConstants();

export const StakeDolaUI = () => {
    const { provider, account } = useWeb3React();
    const [dolaAmount, setDolaAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const { signedBalance: dbrBalance, dbrExpiryDate, debt: currentTotalDebt } = useAccountDBR(account);
    const { balance: dolaBalance } = useDOLABalance(account);

    const [slippage, setSlippage] = useState('1');
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const isInvalidSlippage = !slippage || parseFloat(slippage) <= 0 || parseFloat(slippage) >= 20;
    const isExactDolaBtnDisabled = isInvalidSlippage || !dolaAmount || parseFloat(dolaAmount) <= 0;

    const handleAction = async () => {          
        if (isStake) {
            return stakeDola(provider?.getSigner(), parseEther(dolaAmount));
        }
        return unstakeDola(provider?.getSigner(), parseEther(dolaAmount));
    }

    useDebouncedEffect(() => {
        setIsConnected(!!account)
    }, [account], 500);

    return <Container
        label="sDOLA"
        description="Yield-Bearing Stablecoin - See contract"
        href={`https://etherscan.io/address/${SDOLA_ADDRESS}`}
        noPadding
        m="0"
        p="0"
        maxW='450px'>
        <VStack spacing="4" alignItems="flex-start" w='full'>
            {
                !isConnected ? <InfoMessage alertProps={{ w:'full' }} description="Please connect your wallet" />
                    :
                    <>                        
                        <NavButtons active={tab} options={['Stake', 'Unstake']} onClick={(v) => setTab(v)} />
                        <HStack w='full' justify="space-between">
                            <Text fontSize="14px">
                                DBR balance: {preciseCommify(dbrBalance, 2)}
                            </Text>
                            <Text fontSize="14px">
                                DOLA balance: {preciseCommify(dolaBalance, 2)}
                            </Text>
                        </HStack>
                        {
                            isStake ?
                                <VStack w='full' alignItems="flex-start">
                                    <TextInfo message="Exact amount of DOLA in exchange for DBR, the auction formula is of type K=xy">
                                        <Text fontWeight="bold" fontSize="14px">Exact amount DOLA to sell:</Text>
                                    </TextInfo>
                                    <SimpleAmountForm
                                        defaultAmount={dolaAmount}
                                        address={DOLA}
                                        destination={SDOLA_ADDRESS}
                                        signer={provider?.getSigner()}
                                        decimals={18}                                        
                                        onAction={() => handleAction()}
                                        actionLabel={`Stake`}
                                        onAmountChange={(v) => setDolaAmount(v)}
                                        showMaxBtn={false}
                                        hideInputIfNoAllowance={false}
                                        showBalance={true}
                                        isDisabled={isExactDolaBtnDisabled}
                                        checkBalanceOnTopOfIsDisabled={true}
                                    />
                                </VStack>
                                :
                                <VStack w='full' alignItems="flex-start">
                                    <TextInfo message="Exact amount of DBR in exchange for DOLA, the auction formula is of type K=xy">
                                        <Text fontWeight="bold" fontSize="14px">Exact amount of DBR to buy:</Text>
                                    </TextInfo>
                                    <SimpleAmountForm
                                        defaultAmount={dolaAmount}
                                        address={DOLA}
                                        destination={SDOLA_ADDRESS}
                                        needApprove={false}
                                        signer={provider?.getSigner()}
                                        decimals={18}
                                        onAction={() => handleAction()}
                                        actionLabel={`Unstake`}
                                        onAmountChange={(v) => setDolaAmount(v)}
                                        showMaxBtn={false}
                                        showMax={false}
                                        hideInputIfNoAllowance={false}
                                        showBalance={false}
                                        isDisabled={isExactDolaBtnDisabled}
                                        checkBalanceOnTopOfIsDisabled={true}
                                    />
                                </VStack>
                        }                        
                    </>
            }
        </VStack>
    </Container>
}