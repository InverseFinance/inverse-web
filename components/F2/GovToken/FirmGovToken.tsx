import Container from "@app/components/common/Container"
import { Stack, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { F2MarketContext } from "../F2Contex";
import { useContext, useEffect, useState } from "react";
import ScannerLink from "@app/components/common/ScannerLink";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { F2_ESCROW_ABI, INV_ABI } from "@app/config/abis";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import ConfirmModal from "@app/components/common/Modal/ConfirmModal";
import { Input } from "@app/components/common/Input";
import { isAddress } from "ethers/lib/utils";
import { InfoMessage } from "@app/components/common/Messages";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import Link from "@app/components/common/Link";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { getNetworkConfigConstants } from "@app/util/networks";
import { NetworkIds } from "@app/types";
import { BURN_ADDRESS } from "@app/config/constants";

const { INV } = getNetworkConfigConstants(NetworkIds.mainnet);

export const FirmGovToken = () => {
    const { provider, account } = useWeb3React<Web3Provider>();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [newDelegate, setNewDelegate] = useState('');
    const [hasError, setHasError] = useState(false);
    const { market, escrow } = useContext(F2MarketContext);
    const hasEscrow = escrow?.replace(BURN_ADDRESS, '');

    // standard case
    const { data: delegateData } = useEtherSWR({
        args: market.isInv ? [[INV, 'delegates', escrow]] : [[escrow, 'delegatingTo']],
        abi: market.isInv ? INV_ABI : F2_ESCROW_ABI,
    });

    const delegatingTo = (delegateData ? delegateData[0] : '')?.replace(BURN_ADDRESS, '');

    useEffect(() => {
        setHasError(
            !newDelegate
            || !account
            || (!!newDelegate && !isAddress(newDelegate))
            || delegatingTo?.toLowerCase() === newDelegate.toLowerCase()
        );
    }, [newDelegate, account]);

    const handleOk = async () => {
        const contract = new Contract(escrow, F2_ESCROW_ABI, provider?.getSigner());
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
        defaultCollapse={false}
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
                        delegatingTo?.toLowerCase() === newDelegate.toLowerCase() && !!delegatingTo && !!newDelegate
                        && <InfoMessage alertProps={{ w: 'full' }} description="You already delegate to that address" />
                    }
                </VStack>
            </ConfirmModal>
            {
                hasEscrow ? <Stack w='full' alignItems={{ base: 'flex-start', md: 'center' }} justify="space-between" spacing="4" direction={{ base: 'column', md: 'row' }}>
                    <Stack alignItems={{ base: 'flex-start', md: 'center' }} spacing="1" direction={{ base: 'column', md: 'row' }}>
                        <Text>You are currently delegating to:</Text>
                        {
                            !delegatingTo ? <Text>No one</Text> : <ScannerLink value={delegatingTo} useName={false} />
                        }
                    </Stack>
                    <RSubmitButton refreshOnSuccess={true} onSuccess={onClose} fontSize="14px" w='fit-content' onClick={onOpen}>
                        Change delegate address
                    </RSubmitButton>
                </Stack>
                    : <Text>Once you do your first deposit the escrow contract will delegate to your address (can be changed later)</Text>
            }
            {
                !!market.govLink && <Link textDecoration="underline" href={market.govLink} target="_blank" isExternal>
                    Vote on proposals<ExternalLinkIcon ml="1" />
                </Link>
            }
        </VStack>
    </Container>
}