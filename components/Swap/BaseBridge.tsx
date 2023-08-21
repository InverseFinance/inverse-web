import { useState } from "react";
import { SimpleAmountForm } from "../common/SimpleAmountForm"
import { BASE_L1_ERC20_BRIDGE, bridgeDolaToBase } from "@app/util/base";
import { getNetworkConfigConstants } from "@app/util/networks";
import { useWeb3React } from "@web3-react/core";
import { parseEther } from "@ethersproject/units";
import { VStack, Text, HStack, Box } from "@chakra-ui/react";
import { InfoMessage, SuccessMessage } from "../common/Messages";
import Link from "../common/Link";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import Container from "../common/Container";

const { DOLA } = getNetworkConfigConstants();

export const BaseBridge = () => {
    const { provider, account } = useWeb3React();
    const signer = !!provider ? provider?.getSigner() : undefined;
    const [amount, setAmount] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleAction = () => {
        if (!signer) return;
        return bridgeDolaToBase(parseEther(amount), signer);
    }

    return <Container
        label="Base Native Bridge"
        noPadding
        p="0"
        contentProps={{ direction: 'column' }}
    >
        <VStack spacing="4">
            <SimpleAmountForm
                defaultAmount={amount}
                address={DOLA}
                destination={BASE_L1_ERC20_BRIDGE}
                signer={signer}
                decimals={18}
                hideInputIfNoAllowance={false}
                onAction={({ bnAmount }) => handleAction()}
                onMaxAction={({ bnAmount }) => handleWithdrawMax()}
                actionLabel={'Bridge DOLA (native bridge)'}
                onAmountChange={(v) => setAmount(v)}
                showMaxBtn={true}
                onSuccess={() => setIsSuccess(true)}
                enableCustomApprove={true}
            />
            {
                isSuccess && <SuccessMessage
                    title="Bridging to Base started!"
                    description={
                        <VStack>
                            <Text>
                                It can take up to 30 minutes for the bridging to complete and the DOLA to arrive on Base.
                            </Text>
                            <HStack>
                                <Text>
                                    Your wallet on Base:
                                </Text>
                                <Link isExternal target="_blank" href={`https://basescan.org/address/${account}`}>
                                    Basescan <ExternalLinkIcon />
                                </Link>
                            </HStack>
                        </VStack>
                    }
                />
            }
            <InfoMessage
                description={
                    <VStack alignItems="flex-start">
                        <Box>
                            <Text fontWeight="bold" display="inline">
                                Please note:
                            </Text>
                            <Text ml="1" display="inline">
                                DOLA has been deployed to the native base Bridge however DOLA may not be reflected on
                            </Text>
                            <Link ml="1" textDecoration="underline" href="https://bridge.base.org/deposit" isExternal target="_blank">
                                the official Base UI
                            </Link>
                            <Text display="inline" ml="1">
                                pull-down menu for several weeks.
                            </Text>
                        </Box>
                        <Text>
                            Until then, we are providing this user interface to the Base native bridge for our users wishing to move DOLA to Base.
                        </Text>
                        <Box w='full'>
                            <Text display="inline">
                                For more information on using bridges with DOLA please visit:
                            </Text>
                            <Link ml="1" textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola" isExternal={true} target="_blank">
                                DOLA docs
                            </Link>
                        </Box>
                    </VStack>
                }
            />
        </VStack>
    </Container>
}