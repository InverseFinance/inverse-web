import { useState } from "react";
import { SimpleAmountForm } from "../common/SimpleAmountForm"
import { BASE_L1_ERC20_BRIDGE, BASE_L2_ERC20_BRIDGE, bridgeDolaToBase, withdrawDolaFromBase } from "@app/util/base";
import { getNetworkConfigConstants } from "@app/util/networks";
import { useWeb3React } from "@web3-react/core";
import { VStack, Text, HStack, Box, Checkbox } from "@chakra-ui/react";
import { InfoMessage, SuccessMessage } from "../common/Messages";
import Link from "../common/Link";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import Container from "../common/Container";
import { NavButtons } from "../common/Button";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { BigNumber } from "ethers";
import { Input } from "../common/Input";
import { TextInfo } from "../common/Messages/TextInfo";

const { DOLA } = getNetworkConfigConstants();

export const BaseBridge = () => {
    const { provider, account } = useWeb3React();
    const { balance: dolaBalance, bnBalance: bnDolaBalance } = useDOLABalance(account);
    const signer = !!provider ? provider?.getSigner() : undefined;
    const [amount, setAmount] = useState('');
    const [to, setTo] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCustomAddress, setIsCustomAddress] = useState(false);
    const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');

    const handleAction = (bnAmount: BigNumber) => {
        if (!signer) return;
        if (mode === 'withdraw') {
            return withdrawDolaFromBase(bnAmount, signer);
        }
        return bridgeDolaToBase(bnAmount, signer);
    }

    const handleSuccess = () => {
        setIsSuccess(true);
        setAmount('');
    }

    return <Container
        label="Base Native Bridge"
        noPadding
        p="0"
        contentProps={{ direction: 'column' }}
    >
        <VStack spacing="8">
            <NavButtons options={['deposit', 'withdraw']} active={mode} onClick={v => setMode(v)} />
            <SimpleAmountForm
                defaultAmount={amount}
                address={DOLA}
                destination={mode === 'deposit' ? BASE_L1_ERC20_BRIDGE : BASE_L2_ERC20_BRIDGE}
                signer={signer}
                decimals={18}
                hideInputIfNoAllowance={false}
                onAction={({ bnAmount }) => handleAction(bnAmount)}
                onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                actionLabel={'Bridge DOLA (native bridge)'}
                onAmountChange={(v) => setAmount(v)}
                showMaxBtn={true}
                onSuccess={() => handleSuccess()}
                enableCustomApprove={true}
                containerProps={{ spacing: '4' }}
                extraBeforeButton={
                    <VStack alignItems="flex-start" w='full'>
                        <TextInfo message="If you wish to receive the asset on another address than the current connected wallet address">
                            <Text>Recipient address (optional):</Text>
                        </TextInfo>
                        {/* <HStack>
                            <Checkbox isChecked={isCustomAddress} onChange={() => setIsCustomAddress(!isCustomAddress)} value='true'>
                                Send to another address?
                            </Checkbox>
                        </HStack> */}
                        <Input w='full' placeholder={account} value={to} onChange={e => setTo(e.target.value)} />
                    </VStack>
                }
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