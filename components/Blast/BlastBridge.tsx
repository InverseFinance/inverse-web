import { useEffect, useState } from "react";
import { SimpleAmountForm } from "../common/SimpleAmountForm"
import { BLAST_L1_ERC20_BRIDGE, BLAST_L2_ERC20_BRIDGE, bridgeEthToBlast, bridgeToBlast, withdrawEthFromBlast, withdrawFromBlast } from "@app/util/blast";
import { useWeb3React } from "@web3-react/core";
import { VStack, Text, HStack, Image, Checkbox, Stack } from "@chakra-ui/react";
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
import { switchWalletNetwork, importToken } from "@app/util/web3";
import { isAddress } from "ethers/lib/utils";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import { getBnToNumber } from "@app/util/markets";
import { useToken } from "@app/hooks/useToken";
import { useBlastToken } from "./useBlast";
import { useRouter } from "next/router";
import { BURN_ADDRESS } from "@app/config/constants";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { useAccount } from "@app/hooks/misc";

const DOLAmain = '0x865377367054516e17014CcdED1e7d814EDC9ce4';
const DOLAl2 = '0x8e38179D361402f6a94767757e807146609E9B3d';
export const ETH_AD = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const BlastBridge = () => {
    const { provider, chainId } = useWeb3React();
    const account = useAccount();
    const { themeStyles } = useAppTheme();
    // const { query } = useRouter();
    const isMainnet = chainId?.toString() === NetworkIds.mainnet;

    const [l1token, setL1token] = useState(DOLAmain);
    const [l2token, setL2token] = useState(DOLAl2);
    const [inited, setInited] = useState(false);
    const [isEthCase, setIsEthCase] = useState(false);
    // const { symbol: l2tokenSymbol, decimals: l2tokenDecimals, l1Token: l1tokenDetected } = useBlastToken(l2token);
    const symbol = isEthCase ? 'Ether' : 'DOLA';
    const decimals = 18//isEthCase ? 18 : l2tokenDecimals;

    const { bnBalance: bnConnectedTokenBalance } = useToken(!account ? l1token : (isMainnet ? l1token : l2token), account);
    const { data: bnConnectedEthBalance } = useEtherSWR(['getBalance', account, 'latest']);
    const bnConnectedBalance = isEthCase ? bnConnectedEthBalance : bnConnectedTokenBalance;
    const { bnBalance: bnL1tokenBalance } = useSpecificChainBalance(account, isEthCase ? ETH_AD : l1token, NetworkIds.mainnet);
    const { bnBalance: bnL2tokenBalance } = useSpecificChainBalance(account, isEthCase ? ETH_AD : l2token, NetworkIds.blast);

    const chainBalances = {
        [NetworkIds.mainnet]: bnL1tokenBalance,
        [NetworkIds.blast]: bnL2tokenBalance,
    }

    const signer = !!provider ? provider?.getSigner() : undefined;
    const [amount, setAmount] = useState('');
    const [to, setTo] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCustomAddress, setIsCustomAddress] = useState(false);
    const [mode, setMode] = useState<'Deposit' | 'Withdraw'>('Deposit');
    const isDeposit = mode === 'Deposit';

    // useEffect(() => {
    //     if (!query?.l2token || !utils.isAddress(query?.l2token)) return;
    //     setL2token(query.l2token);
    // }, [query]);

    // useEffect(() => {
    //     if (!l2token) return;
    //     setL1token(l1tokenDetected);
    // }, [l2token, l1tokenDetected]);

    useEffect(() => {
        if (inited || !chainId) return;
        setMode(isMainnet ? 'Deposit' : 'Withdraw');
        setInited(true);
    }, [chainId, isMainnet, inited]);

    const handleAction = (bnAmount: BigNumber) => {
        if (!signer || isWrongAddress) return;
        const _to = !!to ? to : undefined;
        if (isEthCase) {
            const args = [bnAmount, signer, _to];
            const bridgeMethod = isDeposit ? bridgeEthToBlast : withdrawEthFromBlast;
            return bridgeMethod(...args);
        }
        const args = [l1token, l2token, bnAmount, signer, _to];
        const bridgeMethod = isDeposit ? bridgeToBlast : withdrawFromBlast;
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

    const isWrongNetwork = (isMainnet && !isDeposit) || (chainId?.toString() === NetworkIds.blast && mode !== 'Withdraw') || ![NetworkIds.blast, NetworkIds.mainnet].includes(chainId?.toString());
    const isWrongAddress = !!to ? !isAddress(to) || to === BURN_ADDRESS : false;
    const bnBalance = !isWrongNetwork && !!account ? bnConnectedBalance : chainBalances[isDeposit ? NetworkIds.mainnet : NetworkIds.blast];
    const balance = getBnToNumber(bnBalance, decimals);

    const isDisabled = !l1token || !l2token || isWrongNetwork || isWrongAddress || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) > balance;
    const isDisabledMax = !l1token || !l2token || isWrongNetwork || isWrongAddress || !balance;

    return <Container
        label="Blast Native Bridge"
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
                            <Stack w='full' justify="space-around" direction={{ base: 'column', sm: 'row' }}>
                                <HStack justify="center" spacing="0" flexDirection={isDeposit ? 'row' : 'row-reverse'}>
                                    <VStack w="73px">
                                        <Image src={`/assets/networks/ethereum.png`} w="30px" h="30px" />
                                        <Text color="mainTextColorLight">Ethereum</Text>
                                    </VStack>
                                    <VStack w='73px' alignItems="center">
                                        <ArrowForwardIcon fontSize="20px" />
                                    </VStack>
                                    <VStack w="73px">
                                        <Image src={`https://icons.llamao.fi/icons/chains/rsz_blast?w=48&h=48`} w="30px" h="30px" />
                                        <Text color="mainTextColorLight">Blast</Text>
                                    </VStack>
                                </HStack>
                                <Checkbox isChecked={isEthCase} onChange={e => setIsEthCase(!isEthCase)}>Bridge Ether</Checkbox>
                            </Stack>
                            <VStack alignItems="flex-start" w='full'>
                                <TextInfo message="From source chain to destination chain, you will pay gas on the source chain">
                                    <Text><b>{symbol}</b> amount to bridge:</Text>
                                </TextInfo>
                            </VStack>
                            <SimpleAmountForm
                                showBalance={true}
                                defaultAmount={amount}
                                address={isDeposit ? l1token : l2token}
                                destination={isDeposit ? BLAST_L1_ERC20_BRIDGE : BLAST_L2_ERC20_BRIDGE}
                                signer={signer}
                                decimals={decimals}
                                hideInputIfNoAllowance={false}
                                onAction={({ bnAmount }) => handleAction(bnAmount)}
                                onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                                actionLabel={`${mode} ${symbol}`}
                                maxActionLabel={`${mode} all ${symbol}`}
                                onAmountChange={(v) => setAmount(v)}
                                showMaxBtn={!isEthCase}
                                onSuccess={() => handleSuccess()}
                                enableCustomApprove={true}
                                containerProps={{ spacing: '4' }}
                                isDisabled={isDisabled}
                                isMaxDisabled={isDisabledMax}
                                alsoDisableApprove={true}
                                needApprove={isDeposit && !isEthCase}
                                includeBalanceInMax={true}
                                customBalance={bnBalance}
                                inputRight={symbol === 'DOLA' ? <MarketImage pr="2" image={TOKEN_IMAGES.DOLA} size={25} /> : undefined}
                                btnProps={{
                                    needPoaFirst: true,
                                }}
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
                                                    onClick={() => switchWalletNetwork(isMainnet ? NetworkIds.blast : NetworkIds.mainnet)}
                                                >
                                                    Switch to {isMainnet ? 'Blast' : 'Ethereum'}
                                                </Text>
                                            } />
                                        }
                                        {
                                            !isDeposit && <InfoMessage alertProps={{ w: 'full' }}
                                                description={<VStack w='full' alignItems="flex-start" >
                                                    <Text>To withdraw from Blast, there will be three transactions required:</Text>
                                                    <Text>- Initiate withdrawal (Tx on Blast)</Text>
                                                    <Text>- After 1h, verify the withdrawal (Tx on Ethereum)</Text>
                                                    <Text>- 14 days after the verification, claim (Tx on Ethereum)</Text>
                                                </VStack>}
                                            />
                                        }
                                    </VStack>
                                }
                            />
                            {
                                chainId?.toString() === NetworkIds.blast
                                && <Text cursor="pointer" color="mainTextColorLight" fontSize='14px' textDecoration="underline" onClick={() => {
                                    return importToken({ address: DOLAl2, symbol: 'DOLA', decimals: 18, image: 'https://assets.coingecko.com/coins/images/14287/small/dola.png?1667738374' })
                                }}>
                                    Add DOLA to my Blast token list in my wallet
                                </Text>
                            }
                        </>
                            : <SuccessMessage
                                title={`Bridging to ${isDeposit ? 'Blast' : 'Ethereum'} started!`}
                                description={
                                    <VStack alignItems="flex-start">
                                        {
                                            isDeposit ?
                                                <Text>
                                                    It usually takes a few minutes for the bridging to complete and the {symbol} to arrive on Blast.
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