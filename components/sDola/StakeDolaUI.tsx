import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
// import { SDOLA_HELPER_ADDRESS, swapDolaForExactDbr, swapExactDolaForDbr } from "@app/util/dbr-auction"
import { stakeDola, unstakeDola, useStakedDolaBalance } from "@app/util/dola-staking"
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
    const { balance: stakedDolaBalance } = useStakedDolaBalance(account);

    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const handleAction = async () => {         
        // return sdolaDevInit(provider?.getSigner());
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
                                DOLA balance: {dolaBalance ? preciseCommify(dolaBalance, 2) : '-'}
                            </Text>
                            <Text fontSize="14px">
                                sDOLA balance: {stakedDolaBalance ? preciseCommify(stakedDolaBalance, 2) : '-'}
                            </Text>
                        </HStack>
                        {
                            isStake ?
                                <VStack w='full' alignItems="flex-start">
                                    <Text fontSize="18px" fontWeight="bold">
                                        Amount to stake:
                                    </Text>
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
                                    />
                                </VStack>
                                :
                                <VStack w='full' alignItems="flex-start">
                                    <Text fontSize="18px" fontWeight="bold">
                                        Amount to unstake:
                                    </Text>
                                    <SimpleAmountForm
                                        defaultAmount={dolaAmount}
                                        address={SDOLA_ADDRESS}
                                        destination={SDOLA_ADDRESS}
                                        needApprove={false}
                                        signer={provider?.getSigner()}
                                        decimals={18}
                                        onAction={() => handleAction()}
                                        actionLabel={`Unstake`}
                                        onAmountChange={(v) => setDolaAmount(v)}
                                        showMaxBtn={false}                                        
                                        hideInputIfNoAllowance={false}
                                        showBalance={true}
                                    />
                                </VStack>
                        }                        
                    </>
            }
        </VStack>
    </Container>
}