import { useState } from "react";
import { SimpleAmountForm } from "../common/SimpleAmountForm"
import { BASE_L1_ERC20_BRIDGE, BASE_L2_ERC20_BRIDGE, bridgeDolaToBase, withdrawDolaFromBase } from "@app/util/base";
import { useWeb3React } from "@web3-react/core";
import { VStack, Text, HStack, Image } from "@chakra-ui/react";
import { InfoMessage, SuccessMessage, WarningMessage } from "../common/Messages";
import { ArrowForwardIcon, ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import Container from "../common/Container";
import { NavButtons } from "../common/Button";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { BigNumber } from "ethers";
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

const DOLAmain = '0x865377367054516e17014CcdED1e7d814EDC9ce4';
const DOLAbase = '0x4621b7A9c75199271F773Ebd9A499dbd165c3191';

export const BaseBridge = () => {
    const { provider, account, chainId } = useWeb3React();
    const { themeStyles } = useAppTheme();
    const isMainnet = chainId?.toString() === NetworkIds.mainnet;
    const { balance: dolaBalance, bnBalance: bnDolaBalance } = useDOLABalance(account, !account ? DOLAmain : (isMainnet ? '0x865377367054516e17014CcdED1e7d814EDC9ce4' : '0x4621b7A9c75199271F773Ebd9A499dbd165c3191'));
    const { balance: mainnetBalance, bnBalance: mainnetBnBalance } = useSpecificChainBalance(account, DOLAmain, NetworkIds.mainnet);
    const { balance: baseBalance, bnBalance: baseBnBalance } = useSpecificChainBalance(account, DOLAbase, NetworkIds.base);
    const chainBalances = {
        [NetworkIds.mainnet]: mainnetBnBalance,
        [NetworkIds.base]: baseBnBalance,
    }

    const signer = !!provider ? provider?.getSigner() : undefined;
    const [amount, setAmount] = useState('');
    const [to, setTo] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCustomAddress, setIsCustomAddress] = useState(false);
    const [mode, setMode] = useState<'Deposit' | 'Withdraw'>('Deposit');
    const isDeposit = mode === 'Deposit';

    const handleAction = (bnAmount: BigNumber) => {
        if (!signer || isWrongAddress) return;
        if (mode === 'Withdraw') {
            return withdrawDolaFromBase(bnAmount, signer, !!to ? to : undefined);
        }
        return bridgeDolaToBase(bnAmount, signer, !!to ? to : undefined);
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
    const isWrongAddress = !!to ? !isAddress(to) : false;
    const balance = !isWrongNetwork && !!account ? bnDolaBalance : chainBalances[isDeposit ? NetworkIds.mainnet : NetworkIds.base];
    const isDisabled = isWrongNetwork || isWrongAddress || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) > getBnToNumber(balance);
    const isDisabledMax = isWrongNetwork || isWrongAddress || !getBnToNumber(balance);

    return <Container
        label="Base Native Bridge"
        noPadding
        p="0"
        contentProps={{ direction: 'column', minH: '400px' }}
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
                                    <Text>DOLA amount to bridge:</Text>
                                </TextInfo>
                            </VStack>
                            <SimpleAmountForm
                                showBalance={true}
                                defaultAmount={amount}
                                address={isDeposit ? DOLAmain : DOLAbase}
                                destination={isDeposit ? BASE_L1_ERC20_BRIDGE : BASE_L2_ERC20_BRIDGE}
                                signer={signer}
                                decimals={18}
                                hideInputIfNoAllowance={false}
                                onAction={({ bnAmount }) => handleAction(bnAmount)}
                                onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                                actionLabel={'Bridge DOLA'}
                                maxActionLabel={'Bridge all DOLA'}
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
                                customBalance={balance}
                                inputRight={<MarketImage pr="2" image={TOKEN_IMAGES.DOLA} size={25} />}
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
                                        <Text>
                                            It can take up to {isDeposit ? '30 minutes' : '7 days'} for the bridging to complete and the DOLA to arrive on {isMainnet ? 'Base' : 'Ethereum'}.
                                        </Text>
                                        {/* <HStack>
                                            <Text>
                                                Recipient address:
                                            </Text>
                                            <Link isExternal target="_blank" href={`https://basescan.org/address/${account}`}>
                                                Basescan <ExternalLinkIcon />
                                            </Link>
                                        </HStack> */}
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