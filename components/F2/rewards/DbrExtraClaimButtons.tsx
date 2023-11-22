import { ROutlineButton, RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { Input } from "@app/components/common/Input"
import { Modal } from "@app/components/common/Modal"
import { useAccount } from "@app/hooks/misc"
import { useAccountDBR } from "@app/hooks/useDBR"
import { ZapperToken } from "@app/types"
import { claimDbrAndSell, claimDbrSellAndDepositInv, claimDbrSellAndRepay } from "@app/util/firm-extra"
import { VStack, useDisclosure, Text, Stack, RadioGroup, Radio, HStack } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core"
import { useState } from "react"

export const DbrRewardsModal = ({
    isOpen,
    onClose,
    basicClaim,
    dbrRewardsInfo,
    marketToRepay,
}: {
    isOpen: boolean,
    onClose: () => void,
    basicClaim: () => void,
    dbrRewardsInfo: ZapperToken
    marketToRepay?: string,
}) => {
    const account = useAccount();
    const { debt } = useAccountDBR(account);
    const { provider } = useWeb3React();
    const [selected, setSelected] = useState('restake');
    const [slippage, setSlippage] = useState('1');
    const [minAmountOut, setMinAmountOut] = useState('0');

    const changeSlippage = (e) => {
        setSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'));
        // setMinAmountOut();
    }

    const handleClaim = () => {
        if (!account) return;        
        if (selected === 'restake') {
            return claimDbrSellAndDepositInv(minAmountOut, provider?.getSigner());
        } else if (selected === 'sell') {
            return claimDbrAndSell(minAmountOut, provider?.getSigner());
        } else if (selected === 'repay' && !!marketToRepay) {
            return claimDbrSellAndRepay(minAmountOut, marketToRepay, provider?.getSigner());
        } else if (selected === 'claim') {
            return basicClaim()
        }
    }

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
        <VStack spacing="8" px="6" py="5" alignItems="flex-start">
            <VStack spacing="3" alignItems="flex-start">
                <Text fontSize='18px' fontWeight="bold">
                    Please choose an action to do with the DBR rewards:
                </Text>
                <RadioGroup onChange={setSelected} pl="4" defaultValue='restake'>
                    <Stack spacing="3">
                        <Radio value='restake'>
                            Reinvest it in INV and stake
                        </Radio>
                        <Radio value='sell'>
                            Sell it for DOLA
                        </Radio>
                        <Radio value='repay' isDisabled={!debt}>
                            Sell it for DOLA and repay debt in a market
                        </Radio>
                        <Radio value='claim'>
                            Simply claim it
                        </Radio>
                    </Stack>
                </RadioGroup>
            </VStack>
            {
                selected !== 'claim' && <HStack justify="space-between" w='full'>
                    <HStack>
                        <Text>Max. slippage:</Text>
                        <Input py="0" maxH="30px" w='90px' value={slippage} onChange={(e) => changeSlippage(e)} />
                    </HStack>
                    <Text>Min. {selected === 'restake' ? 'INV' : 'DOLA'} amount: {minAmountOut}</Text>
                </HStack>
            }
            <VStack alignItems="center" w='full'>
                <RSubmitButton onClick={handleClaim} p="6" w='fit-content' fontSize="18px">
                    Confirm
                </RSubmitButton>
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
        <DbrRewardsModal dbrRewardsInfo={dbrRewardsInfo} basicClaim={basicClaim} isOpen={isOpen} onClose={onClose} />
    </VStack>
}