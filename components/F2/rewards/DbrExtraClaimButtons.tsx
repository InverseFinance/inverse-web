import { ROutlineButton, RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { Input } from "@app/components/common/Input"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { Modal } from "@app/components/common/Modal"
import { F2_ESCROW_ABI } from "@app/config/abis"
import { BURN_ADDRESS } from "@app/config/constants"
import { useAccount } from "@app/hooks/misc"
import { useAccountDBR, useAccountF2Markets, useDBRMarkets, useTriCryptoSwap } from "@app/hooks/useDBR"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { useStakedInFirm } from "@app/hooks/useFirm"
import { ZapperToken } from "@app/types"
import { claimDbrAndSellForDola, claimDbrSellAndDepositInv, claimDbrSellAndRepay } from "@app/util/firm-extra"
import { getNumberToBn, smartShortNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { getNetworkConfigConstants } from "@app/util/networks"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, useDisclosure, Text, Stack, RadioGroup, Radio, HStack, Select } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core"
import { Contract } from "ethers"
import { isAddress } from "ethers/lib/utils"
import { useMemo, useState } from "react"

const { F2_DBR_REWARDS_HELPER } = getNetworkConfigConstants();

export const DbrRewardsModal = ({
    isOpen,
    onClose,
    basicClaim,
    dbrRewardsInfo,
}: {
    isOpen: boolean,
    onClose: () => void,
    basicClaim: () => void,
    dbrRewardsInfo: ZapperToken
}) => {
    const account = useAccount();
    const { provider } = useWeb3React();
    const { debt } = useAccountDBR(account);
    const { markets } = useDBRMarkets();
    const { escrow } = useStakedInFirm(account);
    const { data: claimersData } = useEtherSWR(
        {
            args: !!escrow && escrow !== BURN_ADDRESS ? [
                [escrow, 'claimers', F2_DBR_REWARDS_HELPER],
            ] : [[]],
            abi: F2_ESCROW_ABI,
        }
    );
    const isHelperAllowedAsClaimer = claimersData ? claimersData[0] : false;
    const accountMarkets = useAccountF2Markets(markets, account);
    const marketsWithDebt = useMemo(() => {
        return accountMarkets.filter(m => m.debt > 0).sort((a, b) => b.debt - a.debt);
    }, [accountMarkets.map(m => m.debt).join('-')]);

    const [isCustomAddress, setIsCustomAddress] = useState(false);
    const [customAddress, setCustomAddress] = useState('');
    const [selected, setSelected] = useState('restake');
    const [slippage, setSlippage] = useState('1');
    const [marketToRepay, setMarketToRepay] = useState('');

    // amounts of DOLA and INV for selling DBR
    const { amountOut: dolaMinAmountOut } = useTriCryptoSwap(dbrRewardsInfo.balance, 1, 0);
    const { amountOut: invMinAmountOut } = useTriCryptoSwap(dbrRewardsInfo.balance, 1, 2);

    const isRestake = selected === 'restake';
    const isNotBasicClaim = selected !== 'claim';
    const isRepay = selected === 'repay';
    const amountOut = isRestake ? invMinAmountOut : dolaMinAmountOut;
    const minAmountOut = (amountOut || 0) * (1 - parseFloat(slippage) / 100);

    const changeSlippage = (e) => {
        setSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'));
    }

    const authorizeAsClaimer = () => {
        if (!account) return;
        const contract = new Contract(escrow, F2_ESCROW_ABI, provider?.getSigner())
        return contract.setClaimer(F2_DBR_REWARDS_HELPER, true);
    }

    const handleClaim = () => {
        if (!account) return;
        const minAmountOutBn = getNumberToBn(minAmountOut);
        const destinationAddress = isCustomAddress ? customAddress : account;
        if (selected === 'restake') {
            return claimDbrSellAndDepositInv(minAmountOutBn, provider?.getSigner(), destinationAddress);
        } else if (selected === 'sell') {
            return claimDbrAndSellForDola(minAmountOutBn, provider?.getSigner(), destinationAddress);
        } else if (selected === 'repay' && !!marketToRepay) {
            return claimDbrSellAndRepay(minAmountOutBn, marketToRepay, provider?.getSigner(), destinationAddress);
        } else if (selected === 'claim') {
            return basicClaim(destinationAddress);
        }
    }

    const hasInvalidSlippage = (!slippage || slippage === '0' || isNaN(parseFloat(slippage)));

    return <Modal
        isOpen={isOpen}
        onClose={onClose}
        width="550px"
        maxW="98vw"
        header={
            <Stack minWidth={24} direction="row" align="center" >
                <Text>
                    Advanced DBR Claim Options
                </Text>
            </Stack>
        }
    >
        <VStack w='full' spacing="8" px="6" py="5" alignItems="flex-start">
            <VStack w='full' spacing="3" alignItems="flex-start">
                <HStack w='full' justify="space-between">
                    <Text>DBR rewards: {smartShortNumber(dbrRewardsInfo.balance)} (~{smartShortNumber(dbrRewardsInfo.balanceUSD, 0, true)})</Text>
                    {
                        debt > 0 && <Text>My total debt: {smartShortNumber(debt, 2)} DOLA</Text>
                    }
                </HStack>
                <Text fontSize='20px' fontWeight="bold">
                    Choose an action to do with the DBR rewards:
                </Text>
                <RadioGroup onChange={setSelected} pl="4" defaultValue='restake'>
                    <Stack spacing="3">
                        <Radio value='restake'>
                            <Text fontWeight={selected === 'restake' ? 'bold' : undefined}>Re-invest it in INV and stake</Text>
                        </Radio>
                        <Radio value='sell'>
                            <Text fontWeight={selected === 'sell' ? 'bold' : undefined}>Sell it for DOLA</Text>
                        </Radio>
                        <Radio value='claim'>
                            <Text fontWeight={selected === 'claim' ? 'bold' : undefined}>Simply claim it</Text>
                        </Radio>
                        <Radio value='repay' isDisabled={!debt}>
                            <Text fontWeight={selected === 'repay' ? 'bold' : undefined}>Sell it for DOLA and repay debt in a market</Text>
                        </Radio>
                    </Stack>
                </RadioGroup>
                {
                    isRepay && <Select onChange={(e) => setMarketToRepay(e.target.value)} value={marketToRepay} placeholder='Select a Market to repay debt'>
                        {
                            marketsWithDebt.map((m) => {
                                return <option key={m.address} value={m.address}>
                                    {m.name} ({`${preciseCommify(m.debt, 0)} debt`})
                                </option>
                            })
                        }
                    </Select>
                }
            </VStack>
            {
                isNotBasicClaim && <HStack justify="space-between" w='full'>
                    <HStack>
                        <Text>Max. slippage:</Text>
                        <Input _focusVisible={false} border={hasInvalidSlippage ? '1px solid red' : undefined} py="0" maxH="30px" w='80px' value={slippage} onChange={(e) => changeSlippage(e)} />
                    </HStack>
                    <Text>Min. {isRestake ? 'INV' : 'DOLA'} amount from sell: <b>{minAmountOut ? smartShortNumber(minAmountOut, 2, false, true) : '-'}</b></Text>
                </HStack>
            }
            <VStack spacing="0" w='full' alignItems="flex-start">
                <TextInfo message="If you wish to assets transferred or deposited to another account address">
                    <HStack spacing="1" cursor="pointer" onClick={v => !!customAddress ? () => { } : setIsCustomAddress(!isCustomAddress)}>
                        <Text>Recipient address (optional)</Text>
                        {!customAddress ? isCustomAddress ? <ChevronDownIcon /> : <ChevronRightIcon /> : null}
                    </HStack>
                </TextInfo>
                <Input fontSize="14px" isInvalid={!!customAddress && !isAddress(customAddress)} display={isCustomAddress ? 'block' : 'none'} w='full' placeholder={account} value={customAddress} onChange={e => setCustomAddress(e.target.value)} />
            </VStack>
            <VStack alignItems="center" w='full'>
                {
                    !isHelperAllowedAsClaimer ?
                        <RSubmitButton refreshOnSuccess={true} onClick={authorizeAsClaimer} p="6" w='fit-content' fontSize="18px">
                            Authorize DBR Rewards Helper
                        </RSubmitButton>
                        :
                        <RSubmitButton refreshOnSuccess={true} disabled={(isNotBasicClaim && hasInvalidSlippage) || (isRepay && !marketToRepay)} onClick={handleClaim} p="6" w='fit-content' fontSize="18px">
                            Confirm
                        </RSubmitButton>
                }
            </VStack>
        </VStack>
    </Modal>
}

export const DbrExtraClaimButtons = ({
    basicClaim,
    dbrRewardsInfo,
}: {
    basicClaim: () => void,
    dbrRewardsInfo: any,
}) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    return <VStack>
        <ROutlineButton onClick={onOpen} minW='220px' fontSize='16px'>
            Advanced Claim Options
        </ROutlineButton>
        {
            isOpen && <DbrRewardsModal dbrRewardsInfo={dbrRewardsInfo} basicClaim={basicClaim} isOpen={isOpen} onClose={onClose} />
        }
    </VStack>
}