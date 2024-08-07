import { SubmitButton } from "@app/components/common/Button";
import Container from "@app/components/common/Container";
import { Textarea } from "@app/components/common/Input";
import { Autocomplete } from "@app/components/common/Input/Autocomplete"
import { InfoMessage, SuccessMessage } from "@app/components/common/Messages";
import { UNISWAP_TOKENS } from "@app/components/ThirdParties/uniswaptokens"
import { ERC20_ABI } from "@app/config/abis";
import { shortenAddress } from "@app/util";
import { requestNewFirmCollateral } from "@app/util/analytics";
import { getNetworkConfigConstants } from "@app/util/networks";
import { showToast } from "@app/util/notify";
import { VStack, Text, Image, Flex, Checkbox } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
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
        symbol: t.symbol,
        logoURI: t.logoURI,
        decimals: t.decimals,
    };
})

export const CollateralRequestForm = () => {
    const { account, provider } = useWeb3React();
    const [value, setValue] = useState('');
    const [symbol, setSymbol] = useState('');
    const [decimals, setDecimals] = useState('');
    const [description, setDescription] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [wouldUse, setWouldUse] = useState(false);

    const selectItem = (item) => {
        if (!!item.address) {
            setValue(item?.address);
            setSymbol(item?.symbol);
            setDecimals(item?.decimals);
        } else {
            setValue(isAddress(item?.value) ? item.value : '');
            setSymbol(isAddress(item?.value) ? '' : item.value);
            setDecimals('');
        }
    }

    const showSuccess = () => {
        setIsSuccess(true);
    }

    const onFail = (result: any) => {
        showToast({ title: result.message })
    }

    const submit = async () => {
        let _symbol, _decimals;
        if (isAddress(value) && !symbol) {
            try {
                const contract = new Contract(value, ERC20_ABI, provider?.getSigner());
                const [s, d] = await Promise.all([
                    contract.symbol(),
                    contract.decimals(),
                ]);
                _symbol = s;
                _decimals = d;
            } catch (e) {
                showToast({ title: 'Invalid token address', status: 'error' });
                return;
            }
        }
        return requestNewFirmCollateral(value, _symbol||symbol, description, wouldUse, account, _decimals||decimals, showSuccess, onFail);
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
                            title={"Select from the list or type in any token symbol / address"}
                            placeholder={"Select from the list or type in any symbol / address"}
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