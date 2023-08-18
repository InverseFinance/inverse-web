import { useState } from "react";
import { SimpleAmountForm } from "../common/SimpleAmountForm"
import { BASE_L1_ERC20_BRIDGE, bridgeDolaToBase } from "@app/util/base";
import { getNetworkConfigConstants } from "@app/util/networks";
import { useWeb3React } from "@web3-react/core";
import { parseEther } from "@ethersproject/units";
import { VStack, Text, HStack } from "@chakra-ui/react";
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
                description="Note: this is a temporary UI to allow DOLA users to bridge to Base while the official Base UI and third-party parties don't support DOLA yet. To bridge back DOLA to Ethereum the native bridge takes around 7 days."
            />
        </VStack>
    </Container>
}