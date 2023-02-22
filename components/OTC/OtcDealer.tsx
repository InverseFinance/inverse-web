import { HStack, VStack, Text } from "@chakra-ui/react"
import ScannerLink from "../common/ScannerLink";
import { preciseCommify } from "@app/util/misc";
import moment from "moment";
import { OTC_CONTRACT } from "@app/config/constants";
import { OTC_ABI } from "@app/config/abis";
import { Contract } from "ethers";
import { JsonRpcSigner } from "@ethersproject/providers";
import Container from "../common/Container";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { getBnToNumber } from "@app/util/markets";
import useEtherSWR from "@app/hooks/useEtherSWR";

// only by buyer
const executeDeal = async (signer: JsonRpcSigner, token: string, tokenAmount: number, invAmount: number) => {
    const contract = new Contract(OTC_CONTRACT, OTC_ABI, signer);
    return contract.buy(token, tokenAmount, invAmount);
}

export const OtcDealer = ({
    signer,
    owner,
    deal,
    // invTreasuryAllowance,
    // invBuyerBalance,
}: {
    signer: JsonRpcSigner,
    owner: string,
    deal: { token: string, tokenAmount: number, invAmount: number, deadline: number }
    // invTreasuryAllowance: number
    // invBuyerBalance: number
}) => {
    const { token, tokenAmount, invAmount, deadline } = deal;
    const { data: tokenDecimals } = useEtherSWR([
        token, 'decimals'
    ]);
    const decimals = tokenDecimals ? getBnToNumber(tokenDecimals, 0) : 18;

    return <Container noPadding p="0" label="Deal Terms">
        <VStack w='full'>
            <HStack w='full' justify="space-between">
                <Text>
                    Token:
                </Text>
                <ScannerLink value={token} />
            </HStack>
            <HStack w='full' justify="space-between">
                <Text>
                    Amount to swap:
                </Text>
                <Text>
                    {preciseCommify(tokenAmount, 2)}
                </Text>
            </HStack>
            <HStack w='full' justify="space-between">
                <Text>
                    INV to receive:
                </Text>
                <Text>
                    {preciseCommify(invAmount, 2)}
                </Text>
            </HStack>
            <HStack w='full' justify="space-between">
                <Text>
                    Deadline:
                </Text>
                <Text>
                    {moment(deadline).fromNow()}
                </Text>
            </HStack>
            <SimpleAmountForm
                decimals={decimals}
                defaultAmount={tokenAmount}
                address={token}
                destination={OTC_CONTRACT}
                signer={signer}
                onAction={() => executeDeal(signer, token, tokenAmount, invAmount)}
                onMaxAction={() => executeDeal(signer, token, tokenAmount, invAmount)}
                actionLabel={'Execute Deal'}
                hideInput={true}
                showMaxBtn={false}
                inputProps={{ placeholder: 'USDC to swap' }}
                btnProps={{ fontSize: '18px' }}
            />
        </VStack>
    </Container>
}