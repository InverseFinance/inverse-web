import Container from "@app/components/common/Container"
import { Stack, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { F2MarketContext } from "../F2Contex";
import { useContext, useEffect, useState } from "react";
import ScannerLink from "@app/components/common/ScannerLink";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { F2_SIMPLE_ESCROW_ABI } from "@app/config/abis";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import ConfirmModal from "@app/components/common/Modal/ConfirmModal";
import { Input } from "@app/components/common/Input";
import { isAddress } from "ethers/lib/utils";
import { InfoMessage } from "@app/components/common/Messages";
import { Contract } from "ethers";

export const FirmGovToken = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [newDelegate, setNewDelegate] = useState('');
    const [hasError, setHasError] = useState(false);
    const { market, escrow } = useContext(F2MarketContext);
    const { data } = useEtherSWR({
        args: [[escrow, 'delegatingTo']],
        abi: F2_SIMPLE_ESCROW_ABI,
    });
    const delegatingTo = data ? data[0] : '';

    useEffect(() => {
        setHasError(
            !newDelegate
            || (!!newDelegate && !isAddress(newDelegate))
            || delegatingTo?.toLowerCase() === newDelegate.toLowerCase()
        );
    }, [newDelegate]);

    const handleOk = async () => {
        const contract = new Contract(escrow, F2_SIMPLE_ESCROW_ABI, library?.getSigner());
        return contract.delegate(newDelegate);        
    }

    const handleClose = () => {
        setNewDelegate('');
        onClose();
    }

    return <Container
        noPadding
        p="0"
        collapsable={true}
        defaultCollapse={true}
        label={`${market.underlying.symbol} Governance Rights`}
        description={`Governance tokens deposited on FiRM keep their voting power!`}
    >
        <VStack w='full' alignItems="flex-start">
            <ConfirmModal
                title="Delegate"
                isOpen={isOpen}
                onClose={handleClose}
                onOk={handleOk}
                onCancel={handleClose}
                okDisabled={hasError}
                okLabel="Change"
            >
                <VStack p="2" w='full' alignItems="flex-start">
                    <Input _hover={hasError ? {} : undefined} borderWidth="1" borderColor={hasError ? !!newDelegate ? 'error' : undefined : 'success'} onChange={(e) => setNewDelegate(e.target.value)} fontSize="14px" value={newDelegate} placeholder={'New delegate address'} />
                    {
                        delegatingTo?.toLowerCase() === newDelegate.toLowerCase()
                        && <InfoMessage alertProps={{ w: 'full' }} description="You already delegate to that address" />
                    }
                </VStack>
            </ConfirmModal>
            <Stack w='full' alignItems={{ base: 'flex-start', md: 'center' }} justify="space-between" spacing="4" direction={{ base: 'column', md: 'row' }}>
                <Stack alignItems={{ base: 'flex-start', md: 'center' }} spacing="1" direction={{ base: 'column', md: 'row' }}>
                    <Text>You are currently delegating to:</Text>
                    {
                        !!delegatingTo && <ScannerLink value={delegatingTo} useName={false} />
                    }
                </Stack>
                <RSubmitButton refreshOnSuccess={true} onSuccess={onClose} fontSize="14px" w='fit-content' onClick={onOpen}>
                    Change delegate address
                </RSubmitButton>
            </Stack>
        </VStack>
    </Container>
}