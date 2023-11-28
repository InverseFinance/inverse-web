import { VStack, Text, HStack } from "@chakra-ui/react"
import { DBR_AUCTION_ADDRESS, sellDolaForDbr } from "@app/util/dbr-auction"
import useEtherSWR from "@app/hooks/useEtherSWR";
import { useWeb3React } from "@web3-react/core";
import { getBnToNumber, getNumberToBn, smartShortNumber } from "@app/util/markets";
import { TextInfo } from "../common/Messages/TextInfo";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { Input } from "../common/Input";
import Container from "../common/Container";

const { DOLA } = getNetworkConfigConstants();

export const DbrAuctionBuyer = () => {
    const { provider } = useWeb3React();
    const [amount, setAmount] = useState('');
    const [slippage, setSlippage] = useState('1');
    const { data } = useEtherSWR([
        [DBR_AUCTION_ADDRESS, 'getDbrOut', parseEther(amount || '0')]
    ]);
    const minDbrOut = data && data[0] ? getNumberToBn(getBnToNumber(data[0]) * (1 - parseFloat(slippage) / 100)) : BigNumber.from('0');

    const sell = async () => {
        return sellDolaForDbr(provider?.getSigner(), parseEther(amount), minDbrOut);
    }

    return <Container label="DBR auction" noPadding m="0" p="0" maxW='400px'>
        <VStack spacing="8" alignItems="flex-start" w='full'>
            <VStack w='full' alignItems="flex-start">
                <TextInfo message="Title">
                    <Text>Amount of DOLA to sell</Text>
                </TextInfo>
                <SimpleAmountForm
                    defaultAmount={amount}
                    address={DOLA}
                    destination={DBR_AUCTION_ADDRESS}
                    signer={provider?.getSigner()}
                    decimals={18}                    
                    onAction={() => sell()}
                    actionLabel={'Buy DBR'}
                    onAmountChange={(v) => setAmount(v)}
                    showMaxBtn={false}
                    hideInputIfNoAllowance={false}
                    showBalance={true}
                />
            </VStack>
            <VStack spacing="2" alignItems="flex-start">
                <HStack>
                    <Text>
                        Max. slippage %:
                    </Text>
                    <Input py="0" maxH="30px" w='90px' value={slippage} onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
                </HStack>
                <HStack>
                    <Text>
                        Min. DBR to receive:
                    </Text>
                    <Text fontWeight="bold">{smartShortNumber(getBnToNumber(minDbrOut), 2, false, true)}</Text>
                </HStack>
            </VStack>
        </VStack>
    </Container>
}