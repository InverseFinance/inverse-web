import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { HStack, VStack, Text, FormControl, FormLabel, Switch, Badge, Image } from "@chakra-ui/react"
import { F2DurationInput } from "../F2DurationInput"
import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { Input } from "@app/components/common/Input"
import { AutoBuyDbrNoteMessage } from "./FirmMessages"
import { SimpleAmountForm } from "@app/components/common/SimpleAmountForm"
import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { TOKENS } from "@app/variables/tokens"
import { getNetworkConfigConstants } from "@app/util/networks"
import { InfoMessage } from "@app/components/common/Messages"
import { BigNumber } from "ethers"
import { TOKEN_IMAGES } from "@app/variables/images"
import { AnimatedInfoTooltip } from "@app/components/common/Tooltip"
import { preciseCommify } from "@app/util/misc"
import { INPUT_BORDER } from "@app/variables/theme.dark"

const { DBR } = getNetworkConfigConstants();

const dbrToken = TOKENS[DBR];

export const AutoBuyDbrDurationInputs = ({
    setDbrBuySlippage,
    dbrBuySlippage,
    duration,
    handleDurationChange,
    durationType,
    durationTypedValue,
    userDebt,
    debtToCover,
    handleDebtChange,
    isDexMode = false
}: {
    setDbrBuySlippage: (value: string) => void
    handleDurationChange: (v: number, typedValue: number, type: string) => void
    durationType: 'days' | 'weeks' | 'months' | 'quarters' | 'years'
    dbrBuySlippage: string
    durationTypedValue: string
    duration: string | number
    userDebt: number
    debtToCover: number
    handleDebtChange?: (value: string) => void
    isDexMode?: boolean
}) => {
    return <VStack spacing='4' w={{ base: '100%', lg: '100%' }}>
        <VStack w='full' alignItems="flex-start">
            {
                isDexMode && <VStack w='full' alignItems="flex-start">
                    <TextInfo
                        w='full'
                        message={"Debt size to cover, as a reminder one DBR covers 1 DOLA of debt for 365 days"}>
                        <HStack w='full' justify="space-between">
                            <Text fontSize='18px' color="mainTextColor"><b>Debt size</b> to cover:</Text>
                            {
                                userDebt > 0 && <Text textDecoration="underline" fontSize='14px' color="mainTextColorLight" cursor="pointer" onClick={() => handleDebtChange(userDebt.toFixed(0))}>
                                    Total debt ({preciseCommify(userDebt, 0)} DOLA)
                                </Text>
                            }
                        </HStack>
                    </TextInfo>
                    <Input py="0" h='48px' borderWidth='1' border={INPUT_BORDER} w='full' value={debtToCover} defaultValue="" onChange={(e) => handleDebtChange(e.target.value)} />
                </VStack>
            }
            <TextInfo
                message={isDexMode ? "Buy enough DBR to cover the desired debt size and duration" : "This will lock-in a Borrow Rate for the desired duration by auto-buying DBR tokens, after the duration you can still keep the loan but at the expense of a higher debt and Borrow Rate."}>
                <Text fontSize='18px' color="mainTextColor"><b>Duration</b> to cover:</Text>
            </TextInfo>
            <F2DurationInput
                onChange={handleDurationChange}
                defaultType={durationType}
                defaultValue={durationTypedValue}
            />
            <AmountInfos format={false} label="Duration in days" value={duration} textProps={{ fontSize: '14px' }} />
            {
                !isDexMode && <HStack w='full' justify="space-between">
                    <TextInfo
                        message="DBR price can vary while trying to buy, the max. slippage % allows the resulting total DOLA debt created to be within a certain range, if out of range, tx will revert or fail">
                        <Text>
                            Max. slippage %:
                        </Text>
                    </TextInfo>
                    <Input py="0" maxH="30px" w='90px' value={dbrBuySlippage} onChange={(e) => setDbrBuySlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
                </HStack>
            }
            {
                !isDexMode && <AutoBuyDbrNoteMessage />
            }
        </VStack>
    </VStack>
}

export const SellDbrInput = ({
    dbrSellAmount,
    setDbrSellAmount,
    helperAddress,
    dbrBalance,
    bnDbrBalance,
    signer,
    dbrBuySlippage,
    setDbrBuySlippage,
}: {
    dbrSellAmount: string
    setDbrSellAmount: (value: string) => void
    helperAddress: string
    dbrBalance: number
    bnDbrBalance: BigNumber
    signer: any
    dbrBuySlippage: string
    setDbrBuySlippage: (value: string) => void
}) => {
    return <VStack spacing='4' w={{ base: '100%', lg: '100%' }}>
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="Will auto-sell the specified amount of DBRs against DOLAs">
                <Text fontSize='18px' color="mainTextColor"><b>DBR</b> to sell:</Text>
            </TextInfo>
            <SimpleAmountForm
                defaultAmount={dbrSellAmount}
                address={DBR}
                destination={helperAddress}
                signer={signer}
                decimals={18}
                maxAmountFrom={[bnDbrBalance]}
                onAmountChange={setDbrSellAmount}
                approveLabel="Approve DBR for auto-selling"
                showMax={true}
                showMaxBtn={false}
                onlyShowApproveBtn={true}
                hideInputIfNoAllowance={true}
                inputRight={<MarketImage pr="2" image={dbrToken.image} size={25} />}
                // balance decreases if debt, calling with higher sell amount to contract is ok
                isError={dbrBalance < parseFloat(dbrSellAmount) * 1.01}
            />
            <HStack w='full' justify="space-between">
                <TextInfo
                    message="DBR price can vary while trying to sell, the max. slippage % allows the resulting total DOLA received to be within a certain range, if out of range, tx will revert or fail">
                    <Text>
                        Max. slippage %:
                    </Text>
                </TextInfo>
                <Input py="0" maxH="30px" w='90px' value={dbrBuySlippage} onChange={(e) => setDbrBuySlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
            </HStack>
            <InfoMessage
                alertProps={{ w: 'full', fontStyle: 'italic' }}
                description="Note: The DOLA received from the DBR swap will be sent to your wallet."
            />
        </VStack>
    </VStack>
}

export const DbrHelperSwitch = ({
    isDeposit,
    setIsAutoDBR,
    isAutoDBR,
    hasHelper
}: {
    isDeposit: boolean
    setIsAutoDBR: (v: boolean) => void
    isAutoDBR: boolean
    hasHelper: boolean
}) => {
    return <FormControl w='fit-content' display='flex' alignItems='center'>
        <AnimatedInfoTooltip
            iconProps={{ color: 'secondaryTextColor', fontSize: '12px', mr: '2' }}
            message="This feature allows you to automatically buy DBR alongside your borrow"
        />
        <FormLabel cursor="pointer" alignItems="center" display="inline-flex" w='130px' fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor='auto-dbr' mb='0'>
            Auto-{isDeposit ? 'buy' : 'sell'} DBR
            <Image ml="2" src={TOKEN_IMAGES.DBR} display="inline-block" w="20px" h="20px" />
        </FormLabel>
        <Switch isDisabled={!hasHelper} onChange={() => setIsAutoDBR(!isAutoDBR)} isChecked={isAutoDBR} id='auto-dbr' />
        {
            !hasHelper && <Badge ml="2">
                Coming soon
            </Badge>
        }
    </FormControl>
}