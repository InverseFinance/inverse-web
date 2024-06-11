import { SubmitButton } from "@app/components/common/Button";
import Container from "@app/components/common/Container";
import { Input, Textarea } from "@app/components/common/Input";
import { Autocomplete } from "@app/components/common/Input/Autocomplete"
import { InfoMessage, SuccessMessage } from "@app/components/common/Messages";
import { UNISWAP_TOKENS } from "@app/components/ThirdParties/uniswaptokens"
import { shortenAddress } from "@app/util";
import { requestNewFirmCollateral } from "@app/util/analytics";
import { getNetworkConfigConstants } from "@app/util/networks";
import { VStack, Text, Image, Flex, Checkbox } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { isAddress } from "ethers/lib/utils";
import { useState } from "react"

const { F2_MARKETS } = getNetworkConfigConstants();
const alreadyListed = F2_MARKETS.map(m => m.collateral.toLowerCase());

const uniqueAddresses = [
    ...new Set(
        UNISWAP_TOKENS
            .filter(t => t.chainId === 1)
            .filter(t => !alreadyListed.includes(t.address.toLowerCase()))
            .map(t => t.address)
    )
];

const uniqueTokens = uniqueAddresses.map(ad => UNISWAP_TOKENS.find(t => t.chainId === 1 && t.address === ad));
const tokens = uniqueTokens.map(t => {
    return {
        value: t.address,
        address: t.address,
        label: `${t.symbol} - ${shortenAddress(t.address)}`,
        symbol: t?.symbol,
        logoURI: t?.logoURI,
    };
})

export const CollateralRequestForm = () => {
    const { account } = useWeb3React();
    const [value, setValue] = useState('');
    const [symbol, setSymbol] = useState('');
    const [description, setDescription] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [wouldUse, setWouldUse] = useState(false);

    const selectItem = (item) => {
        if (!!item.address) {
            setValue(item?.address);
            setSymbol(item?.symbol);
        } else {
            setValue(isAddress(item?.value) ? item.value : '');
            setSymbol(isAddress(item?.value) ? '' : item.value);
        }
    }

    const showSuccess = () => {
        setIsSuccess(true)
    }

    const submit = () => {
        return requestNewFirmCollateral(value, symbol, description, wouldUse, account, showSuccess);
    }

    return <Container noPadding p="0" label="Request a new Collateral on FiRM">
        {
            isSuccess ? <SuccessMessage alertProps={{ fontSize: '18px', fontWeight: 'bold', w: 'full' }} iconProps={{ height: 50, width: 50 }} title="Request submitted!" />
                : <VStack spacing="6" w='full' alignItems="flex-start">
                    <VStack w='full' alignItems="flex-start">
                        <Text fontSize="18px" fontWeight="bold">Collateral *:</Text>
                        <Autocomplete
                            w='full'
                            onItemSelect={selectItem}
                            // InputComp={(p) => <Input isInvalid={!!defaultValue && !isAddress(defaultValue)} {...p} />}
                            list={tokens}
                            title={"Select from the list or type a token symbol / address"}
                            placeholder={"Select from the list or type a symbol / address"}
                            itemRenderer={(value, label, i, searchValue, filteredList) => {
                                const item = filteredList[i];
                                if (!!item?.symbol) {
                                    return (
                                        <Flex alignItems="center">
                                            <Image src={item.logoURI} h="20px" w="20px" />
                                            <Text ml="2" fontWeight="bold">
                                                {item.symbol}
                                            </Text>
                                            <Text ml="2">
                                                - {shortenAddress(item.value)}
                                            </Text>
                                        </Flex>
                                    )
                                }
                                return <Flex alignItems="center">
                                    <Text>Select unlisted item: </Text>
                                    <Text fontWeight="bold" ml="2">{value}</Text>
                                </Flex>
                            }}
                        />
                    </VStack>

                    <VStack w='full' alignItems="flex-start">
                        <Text fontSize="18px" fontWeight="bold">Would you use this new market yourself?</Text>
                        <Checkbox isChecked={wouldUse} onChange={e => setWouldUse(!wouldUse)}>
                            Yes I have this collateral and I would use the market
                        </Checkbox>
                    </VStack>

                    <VStack w='full' alignItems="flex-start">
                        <Text fontSize="18px" fontWeight="bold">Reasons why it could be a good collateral option for FiRM:</Text>
                        <Textarea maxlength="500" w='full' minHeight="200px" resize="vertical" onChange={(e: any) => setDescription(e.target.value)} value={description} fontSize="14" placeholder={"Give a short description"} />
                        <Text w='full' textAlign="right" fontSize="14px">{description.length} / 500 characters</Text>
                    </VStack>

                    {
                        !account && <InfoMessage
                            alertProps={{ w: 'full' }}
                            description="Please connect your wallet"
                        />
                    }

                    <SubmitButton isDisabled={!account || (!value && !symbol)} onClick={() => submit()}>
                        Submit the request
                    </SubmitButton>

                </VStack>
        }
    </Container>
}