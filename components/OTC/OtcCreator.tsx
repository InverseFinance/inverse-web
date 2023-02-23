import { HStack, VStack, Text } from "@chakra-ui/react"
import ScannerLink from "../common/ScannerLink";
import { preciseCommify } from "@app/util/misc";
import moment from "moment";
import { OTC_CONTRACT } from "@app/config/constants";
import { ERC20_ABI, OTC_ABI } from "@app/config/abis";
import { BigNumber, Contract } from "ethers";
import { JsonRpcSigner } from "@ethersproject/providers";
import Container from "../common/Container";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { getBnToNumber, shortenNumber } from "@app/util/markets";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { Input } from "../common/Input";
import { useState } from "react";
import { InfoMessage } from "../common/Messages";
import { isAddress, parseUnits } from "ethers/lib/utils";
import { REWARD_TOKEN } from "@app/variables/tokens";

// only by owner
const setDeal = async (signer: JsonRpcSigner, buyer: string, token: string, tokenAmount:  BigNumber, invAmount: BigNumber, deadline: string) => {
    const contract = new Contract(OTC_CONTRACT, OTC_ABI, signer);
    return contract.setDeal(buyer, token, tokenAmount, invAmount, deadline);
}

export const OtcCreator = ({
    signer,
}: {
    signer: JsonRpcSigner,
}) => {
    // default USDC
    const [tokenAddress, setTokenAddress] = useState('0xdac17f958d2ee523a2206206994597c13d831ec7');
    const [buyerAddress, setBuyerAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [invAmount, setInvAmount] = useState('');
    const [duration, setDuration] = useState('30');

    const { data: tokenData, error } = useEtherSWR({
        args: [
            [tokenAddress, 'symbol'],
            [tokenAddress, 'decimals'],
        ],
        abi: ERC20_ABI,
    });

    const symbol = tokenData ? tokenData[0] : '';
    const decimals = tokenData ? getBnToNumber(tokenData[1], 0) : 0;

    const hasTokenError = (!!tokenAddress && !isAddress(tokenAddress)) || (!!tokenAddress && isAddress(tokenAddress) && (!symbol || !decimals));
    const hasBuyerError = (!!buyerAddress && !isAddress(buyerAddress));
    const hasAmountError = !!amount && !(parseFloat(amount) > 0);
    const hasInvAmountError = !!invAmount && !(parseFloat(invAmount) > 0);
    const hasDurationError = !!duration && !(parseFloat(duration) > 0);
    const isDisabled = hasTokenError || hasBuyerError || hasAmountError || hasInvAmountError || hasDurationError
        || !tokenAddress || !buyerAddress || !amount || !invAmount || !duration;

    const deadline = Math.round((parseFloat(duration) +(+(new Date())))/1000);

    const handleNumber = (value: string) => {
        return value.replace(/[^0-9.]/, '').replace(/(?<=\..*)\./g, '');
    }

    return <Container noPadding p="0" label="Set a Deal" description="Creates or Replaces a deal for a buyer">
        <VStack spacing="4" w='full' alignItems="flex-start">
            <VStack w='full' justify="space-between" alignItems="flex-start">
                <Text fontWeight="bold">
                    Token Address:
                </Text>
                <Input fontSize="16px" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <HStack w='full' justify="space-between">
                            <Text>Symbol: {symbol}</Text>
                            {/* <Text>Decimals: {decimals}</Text> */}
                        </HStack>
                    }
                />
            </VStack>
            <VStack w='full' justify="space-between" alignItems="flex-start">
                <Text fontWeight="bold">
                    Buyer Address:
                </Text>
                <Input isInvalid={hasBuyerError} fontSize="16px" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} />
            </VStack>
            <VStack w='full' justify="space-between" alignItems="flex-start">
                <Text fontWeight="bold">
                    INV amount:
                </Text>
                <Input isInvalid={hasInvAmountError} value={invAmount} onChange={(e) => setInvAmount(handleNumber(e.target.value))} />
            </VStack>
            <VStack w='full' justify="space-between" alignItems="flex-start">
                <Text fontWeight="bold">
                    {symbol} amount:
                </Text>
                <Input isInvalid={hasAmountError} value={amount} onChange={(e) => setAmount(handleNumber(e.target.value))} />
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description={
                        <HStack w='full' justify="space-between">
                            <Text>Exchange Rate: </Text>
                            <Text>1 INV = {shortenNumber(parseFloat(amount)/parseFloat(invAmount), 2)} {symbol}</Text>
                        </HStack>
                    }
                />
            </VStack>
            <VStack w='full' justify="space-between" alignItems="flex-start">
                <Text fontWeight="bold">
                    Deal validity in minutes:
                </Text>
                <Input isInvalid={hasDurationError} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </VStack>
            <SimpleAmountForm
                address={REWARD_TOKEN}
                destination={OTC_CONTRACT}
                decimals={18}
                hideInput={true}
                defaultAmount={amount}
                isDisabled={isDisabled}
                approveLabel="Step 1/2 - Approve INV"
                btnProps={{ fontSize: '18px' }}
                signer={signer}
                onAction={() => setDeal(signer, buyerAddress, tokenAddress, parseUnits(amount, decimals), parseUnits(invAmount, 18), deadline)}
                onMaxAction={() => setDeal(signer, buyerAddress, tokenAddress, parseUnits(amount, decimals), parseUnits(invAmount, 18), deadline)}
                actionLabel={'Execute Deal'}
            />
        </VStack>
    </Container>
}