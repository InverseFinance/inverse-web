import { useEffect, useState } from "react";
import { SimpleAmountForm } from "../common/SimpleAmountForm"
import { BASE_L1_ERC20_BRIDGE, BASE_L2_ERC20_BRIDGE, bridgeToBase, withdrawFromBase } from "@app/util/base";
import { useWeb3React } from "@web3-react/core";
import { VStack, Text, HStack, Image } from "@chakra-ui/react";
import { InfoMessage, SuccessMessage, WarningMessage } from "../common/Messages";
import { ArrowForwardIcon, ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import Container from "../common/Container";
import { NavButtons } from "../common/Button";
import { BigNumber, utils } from "ethers";
import { Input } from "../common/Input";
import { TextInfo } from "../common/Messages/TextInfo";
import { NetworkIds } from "@app/types";
import { MarketImage } from "../common/Assets/MarketImage";
import { TOKEN_IMAGES } from "@app/variables/images";
import useSpecificChainBalance from "@app/hooks/useSpecificChainBalance";
import { switchWalletNetwork } from "@app/util/web3";
import { isAddress } from "ethers/lib/utils";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import { getBnToNumber } from "@app/util/markets";
import { useToken } from "@app/hooks/useToken";
import { useBaseToken } from "./useBase";
import { useRouter } from "next/router";
import { BURN_ADDRESS } from "@app/config/constants";

const DOLAmain = '0x865377367054516e17014CcdED1e7d814EDC9ce4';
const DOLAbase = '0x4621b7A9c75199271F773Ebd9A499dbd165c3191';

export const BaseBridge = () => {
    const { provider, account, chainId } = useWeb3React();
    const { themeStyles } = useAppTheme();
    const { query } = useRouter();
    const isMainnet = chainId?.toString() === NetworkIds.mainnet;

    const [l1token, setL1token] = useState(DOLAmain);
    const [l2token, setL2token] = useState(DOLAbase);
    const { symbol, decimals, l1Token: l1tokenDetected } = useBaseToken(l2token);

    const { bnBalance: bnConnectedBalance } = useToken(!account ? l1token : (isMainnet ? l1token : l2token), account);
    const { bnBalance: bnL1tokenBalance } = useSpecificChainBalance(account, l1token, NetworkIds.mainnet);
    const { bnBalance: bnL2tokenBalance } = useSpecificChainBalance(account, l2token, NetworkIds.base);

    const chainBalances = {
        [NetworkIds.mainnet]: bnL1tokenBalance,
        [NetworkIds.base]: bnL2tokenBalance,
    }

    const signer = !!provider ? provider?.getSigner() : undefined;
    const [amount, setAmount] = useState('');
    const [to, setTo] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCustomAddress, setIsCustomAddress] = useState(false);
    const [mode, setMode] = useState<'Deposit' | 'Withdraw'>('Deposit');
    const isDeposit = mode === 'Deposit';

    useEffect(() => {
        if (!query?.l2token || !utils.isAddress(query?.l2token)) return;
        setL2token(query.l2token);
    }, [query]);

    useEffect(() => {
        if(!l2token) return;
        setL1token(l1tokenDetected);
    }, [l2token, l1tokenDetected])

    const handleAction = (bnAmount: BigNumber) => {
        if (!signer || isWrongAddress) return;
        const args = [l1token, l2token, bnAmount, signer, !!to ? to : undefined];
        const bridgeMethod = isDeposit ? bridgeToBase : withdrawFromBase;
        return bridgeMethod(...args);
    }

    const handleSuccess = () => {
        setIsSuccess(true);
    }

    const reset = () => {
        setIsSuccess(false);
        setTo('');
        setAmount('');
        setIsCustomAddress(false);
    }

    const isWrongNetwork = (isMainnet && !isDeposit) || (chainId?.toString() === NetworkIds.base && mode !== 'Withdraw');
    const isWrongAddress = !!to ? !isAddress(to) || to === BURN_ADDRESS : false;
    const bnBalance = !isWrongNetwork && !!account ? bnConnectedBalance : chainBalances[isDeposit ? NetworkIds.mainnet : NetworkIds.base];
    const balance = getBnToNumber(bnBalance, decimals);

    const isDisabled = isWrongNetwork || isWrongAddress || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) > balance;
    const isDisabledMax = isWrongNetwork || isWrongAddress || !balance;

    return <Container
        label="Base Native Bridge"
        noPadding
        p="0"
        contentProps={{ direction: 'column', minH: !account ? undefined : '400px' }}
    >
        {
            !account ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                : <VStack spacing="4">
                    {
                        !isSuccess ? <>
                            <NavButtons options={['Deposit', 'Withdraw']} active={mode} onClick={v => setMode(v)} />
                            <HStack w='full' justify="center" spacing="0" flexDirection={isDeposit ? 'row' : 'row-reverse'}>
                                <VStack w="73px">
                                    <Image src={`/assets/networks/ethereum.png`} w="30px" h="30px" />
                                    <Text color="mainTextColorLight">Ethereum</Text>
                                </VStack>
                                <VStack w='73px' alignItems="center">
                                    <ArrowForwardIcon fontSize="20px" />
                                </VStack>
                                <VStack w="73px">
                                    <Image src={`/assets/networks/base.svg`} w="30px" h="30px" />
                                    <Text color="mainTextColorLight">Base</Text>
                                </VStack>
                            </HStack>
                            <VStack alignItems="flex-start" w='full'>
                                <TextInfo message="From source chain to destination chain, you will pay gas on the source chain">
                                    <Text>{symbol} amount to bridge:</Text>
                                </TextInfo>
                            </VStack>
                            <SimpleAmountForm
                                showBalance={true}
                                defaultAmount={amount}
                                address={isDeposit ? l1token : l2token}
                                destination={isDeposit ? BASE_L1_ERC20_BRIDGE : BASE_L2_ERC20_BRIDGE}
                                signer={signer}
                                decimals={decimals}
                                hideInputIfNoAllowance={false}
                                onAction={({ bnAmount }) => handleAction(bnAmount)}
                                onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                                actionLabel={`Bridge ${symbol}`}
                                maxActionLabel={`Bridge all ${symbol}`}
                                onAmountChange={(v) => setAmount(v)}
                                showMaxBtn={true}
                                onSuccess={() => handleSuccess()}
                                enableCustomApprove={true}
                                containerProps={{ spacing: '4' }}
                                isDisabled={isDisabled}
                                isMaxDisabled={isDisabledMax}
                                alsoDisableApprove={true}
                                needApprove={isDeposit}
                                includeBalanceInMax={true}
                                customBalance={bnBalance}
                                inputRight={symbol === 'DOLA' ? <MarketImage pr="2" image={TOKEN_IMAGES.DOLA} size={25} /> : undefined}
                                extraBeforeButton={
                                    <VStack alignItems="flex-start" w='full'>
                                        <TextInfo message="If you wish to receive the asset on another address than the current connected wallet address">
                                            <HStack spacing="1" cursor="pointer" onClick={v => !!to ? () => { } : setIsCustomAddress(!isCustomAddress)}>
                                                <Text>Recipient address (optional)</Text>
                                                {!to ? isCustomAddress ? <ChevronDownIcon /> : <ChevronRightIcon /> : null}
                                            </HStack>
                                        </TextInfo>
                                        <Input borderColor={isWrongAddress ? `${themeStyles.colors.error}` : undefined} borderWidth={isWrongAddress ? '1px' : '0'} display={isCustomAddress ? 'block' : 'none'} w='full' placeholder={account} value={to} onChange={e => setTo(e.target.value)} />
                                        {
                                            isWrongNetwork && <WarningMessage alertProps={{ w: 'full' }} title={`Wrong network`} description={
                                                <Text textDecoration="underline" cursor="pointer"
                                                    onClick={() => switchWalletNetwork(isMainnet ? NetworkIds.base : NetworkIds.mainnet)}
                                                >
                                                    Switch to {isMainnet ? 'Base' : 'Ethereum'}
                                                </Text>
                                            } />
                                        }
                                        {
                                            !isDeposit && <InfoMessage alertProps={{ w: 'full' }}
                                                description={<VStack w='full' alignItems="flex-start" >
                                                    <Text>To withdraw from Base, there will be three transactions required:</Text>
                                                    <Text>- Initiate withdraw (Tx on Base)</Text>
                                                    <Text>- After 1h, verify the withdrawal (Tx on Ethereum)</Text>
                                                    <Text>- 7 days after the verification, claim (Tx on Ethereum)</Text>
                                                </VStack>}
                                            />
                                        }
                                    </VStack>
                                }
                            />
                        </>
                            : <SuccessMessage
                                title={`Bridging to ${isDeposit ? 'Base' : 'Ethereum'} started!`}
                                description={
                                    <VStack alignItems="flex-start">
                                        {
                                            isDeposit ?
                                                <Text>
                                                    It can take up to 30 minutes for the bridging to complete and the {symbol} to arrive on Base.
                                                </Text>
                                                :
                                                <Text>
                                                    Bridging back to Ethereum initiated, after one hour you will be able to verify the withdrawal on Ethereum, then after 7 days you can claim on Ethereum.
                                                </Text>
                                        }
                                        <RSubmitButton onClick={reset}>
                                            OK
                                        </RSubmitButton>
                                    </VStack>
                                }
                            />
                    }
                </VStack>
        }
    </Container>
}