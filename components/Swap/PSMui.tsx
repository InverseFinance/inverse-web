import { VStack, Text, Stack } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import Container from "../common/Container";
import { InfoMessage } from "@app/components/common/Messages";
import { preciseCommify } from "@app/util/misc";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { getBnToNumber,  } from "@app/util/markets";
import { PSM_ADDRESS } from "@app/config/constants";
import { useAccount } from "@app/hooks/misc";
import useEtherSWR from "@app/hooks/useEtherSWR";

const { INV, DOLA } = getNetworkConfigConstants();

export const PSMui = () => {
    const account = useAccount();
    const { provider, account: connectedAccount } = useWeb3React();

    const [invAmount, setInvAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);

    const { data: dolaBalanceBn } = useEtherSWR(
        [DOLA, 'balanceOf', account],
    );
    const dolaBalance = dolaBalanceBn ? getBnToNumber(dolaBalanceBn) : 0;

    useDebouncedEffect(() => {
        setIsConnected(!!connectedAccount);
    }, [connectedAccount], 500);

    const noLiquidity = false;

    const handleAction = async () => {

    }

    return <Stack direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'center', lg: 'flex-start' }} justify="space-around" w='full' spacing="12" >
        <Container
            label={`PSM`}
            description="PSM between DOLA and USDS"
            href={`https://etherscan.io/address/${PSM_ADDRESS}`}
            noPadding
            m="0"
            p="0"
            maxW='450px'
        >
            <VStack spacing="4" alignItems="flex-start" w='full'>
                {
                    !isConnected ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                        :
                        <VStack w='full' alignItems="flex-start">
                            <Text fontSize="22px" fontWeight="bold">
                                INV amount to stake:
                            </Text>
                            <SimpleAmountForm
                                btnProps={{ needPoaFirst: true }}
                                defaultAmount={invAmount}
                                address={DOLA}
                                destination={PSM_ADDRESS}
                                signer={provider?.getSigner()}
                                decimals={18}
                                onAction={() => handleAction()}
                                actionLabel={`Stake`}
                                maxActionLabel={`Stake all`}
                                onAmountChange={(v) => setInvAmount(v)}
                                showMaxBtn={false}
                                showMax={true}
                                isDisabled={!invAmount || noLiquidity}
                                hideInputIfNoAllowance={false}
                                showBalance={false}
                                enableCustomApprove={true}
                            />
                            {
                                noLiquidity &&
                                    <InfoMessage description={`Note: sINV has reached its deposit limit of ${preciseCommify(depositLimit, 0)} INV for the moment`} />
                            }
                        </VStack>
                }
            </VStack>
        </Container>
    </Stack>
}