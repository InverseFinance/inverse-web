import Container from "@app/components/common/Container"
import { HStack, Stack, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { F2MarketContext } from "../F2Contex";
import { useContext, useEffect, useState } from "react";
import ScannerLink from "@app/components/common/ScannerLink";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { F2_ESCROW_ABI, INV_ABI } from "@app/config/abis";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import ConfirmModal from "@app/components/common/Modal/ConfirmModal";
import { Input } from "@app/components/common/Input";
import { isAddress } from "ethers/lib/utils";
import { InfoMessage, WarningMessage } from "@app/components/common/Messages";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import Link from "@app/components/common/Link";
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { getNetworkConfigConstants } from "@app/util/networks";
import { NetworkIds } from "@app/types";
import { BURN_ADDRESS } from "@app/config/constants";
import { useStakedInFirm } from "@app/hooks/useFirm";
import { useAccount } from "@app/hooks/misc";
import useStorage from "@app/hooks/useStorage";
import { getBnToNumber, shortenNumber } from "@app/util/markets";
import { useTopAndSmallDelegates } from "@app/hooks/useDelegates";
import { DelegatesAutocomplete } from "@app/components/common/Input/TopDelegatesAutocomplete";
import { namedAddress } from "@app/util";
import { useAppTheme } from "@app/hooks/useAppTheme";

const CONTAINER_ID = 'firm-gov-token-container'

const { INV, XINV } = getNetworkConfigConstants(NetworkIds.mainnet);

export const InvInconsistentFirmDelegation = () => {
    const account = useAccount();
    const { escrow } = useContext(F2MarketContext);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { data: invData, error } = useEtherSWR([
        [INV, 'delegates', account],
        [INV, 'balanceOf', account],
        [XINV, 'balanceOf', account],
        [XINV, 'exchangeRateStored'],
    ]);
    const nonFirmDelegation = invData?.[0];
    const invBalance = invData ? getBnToNumber(invData[1]) : 0;
    const xinvBalance = invData ? getBnToNumber(invData[2]) * getBnToNumber(invData[3]) : 0;
    const nonFirmInvBalance = invBalance + xinvBalance;

    const { delegate: firmDelegate, isLoading } = useStakedInFirm(account);
    const delegatingTo = firmDelegate?.replace(BURN_ADDRESS, '');
    const { value: decidedToIgnore, setter: ignoreInconsistentDel } = useStorage(`firm-inconsistent-del-${account?.substring(0, 5)}-${delegatingTo?.substring(0, 5)}-${nonFirmDelegation?.substring(0, 5)}`);

    if (nonFirmInvBalance >= 1 && !decidedToIgnore && decidedToIgnore !== undefined && !isLoading && !error && !!delegatingTo && !!nonFirmDelegation && nonFirmDelegation?.replace(BURN_ADDRESS, '') !== delegatingTo) {
        return <>
            <FirmGovDelegationModal
                isOpen={isOpen}
                onClose={onClose}
                delegatingTo={delegatingTo}
                suggestedValue={nonFirmDelegation?.replace(BURN_ADDRESS, '')}
                escrow={escrow}
            />
            <WarningMessage
                alertProps={{ w: 'full' }}
                description={
                    <VStack alignItems="flex-start">
                        <Text><b>Note</b>: your FiRM INV delegation is inconsistent with your non-FiRM INV delegation</Text>
                        <HStack spacing="1">
                            <Text>- FiRM INV is delegated to:</Text>
                            <ScannerLink fontWeight="bold" value={delegatingTo} />
                        </HStack>
                        <HStack spacing="1">
                            <Text>- INV/xINV is delegated to:</Text>
                            <ScannerLink fontWeight="bold" value={nonFirmDelegation} />
                        </HStack>
                        <Text fontWeight="bold" textDecoration="underline" cursor="pointer" onClick={() => onOpen()}>
                            Change FiRM delegation
                        </Text>
                        <Text onClick={() => ignoreInconsistentDel(true)} fontWeight="bold" textDecoration="underline" cursor="pointer">
                            Close and don't show this message again
                        </Text>
                    </VStack>
                }
            />
        </>
    }
    return null
}

export const FirmGovDelegationModal = ({
    isOpen,
    onClose,
    delegatingTo,
    suggestedValue = '',
    escrow,
}) => {
    const { provider } = useWeb3React<Web3Provider>();
    const { themeStyles } = useAppTheme();
    const account = useAccount();
    const [hasError, setHasError] = useState(false);
    const [newDelegate, setNewDelegate] = useState('');
    const [topDefault, setTopDefault] = useState('');
    const [activeDefault, setActiveDefault] = useState('');
    const [showSelectors, setShowSelectors] = useState(true);
    const { topDelegates, smallButActive } = useTopAndSmallDelegates()

    const handleOk = async () => {
        const contract = new Contract(escrow, F2_ESCROW_ABI, provider?.getSigner());
        return contract.delegate(newDelegate);
    }

    const handleClose = () => {
        setNewDelegate('');
        onClose();
    }

    useEffect(() => {
        setHasError(
            !newDelegate
            || !account
            || (!!newDelegate && !isAddress(newDelegate))
            || delegatingTo?.toLowerCase() === newDelegate.toLowerCase()
        );
    }, [newDelegate, account]);

    return <ConfirmModal
        title="Change FiRM INV Delegation"
        isOpen={isOpen}
        onClose={handleClose}
        onOk={handleOk}
        onCancel={handleClose}
        okDisabled={hasError}
        okLabel="Change"
        modalProps={{ minW: { base: '98vw', lg: '600px' } }}
    >
        <VStack spacing="4" p="4" w='full' alignItems="flex-start">

            <HStack onClick={() => setShowSelectors(!showSelectors)} cursor="pointer">
                <Text>
                    Delegator lists
                </Text>
                {showSelectors ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </HStack>
            {
                showSelectors && <VStack
                    alignItems='flex-start'
                    px="4"
                    pb='4'
                    borderLeft={`1px solid ${themeStyles.colors.mainTextColor}`}
                    borderRight={`1px solid ${themeStyles.colors.mainTextColor}`}
                    borderBottom={`1px solid ${themeStyles.colors.mainTextColor}`}
                    borderBottomRadius="5px"
                >
                    <Text fontWeight="bold">Voters active in the last 90 days with less than 15k Voting Power:</Text>
                    <DelegatesAutocomplete
                        delegates={smallButActive}
                        onItemSelect={(item) => {
                            setNewDelegate(item.value);
                            setTopDefault('');
                            setActiveDefault(item.value);
                            setShowSelectors(false);
                        }}
                        defaultValue={activeDefault}
                        title={'Recent active voters with smaller voting power'}
                        placeholder={'Choose'}
                        limit={50}
                        w='full'
                        labelFormatter={(data, index) => {
                            return `#${(index + 1).toString().padStart(2, '0')} ${namedAddress(data.address)} (VP: ${shortenNumber(data.votingPower, 2)}, Recent votes: ${data.nbRecentVotes})`
                        }}
                    />
                    <InfoMessage
                        description="Note: choosing a recent active voter with lower voting power help decentralize the DAO"
                    />
                    <Text fontWeight="bold">Or choose from the top delegates:</Text>
                    <DelegatesAutocomplete
                        delegates={topDelegates}
                        onItemSelect={(item) => {
                            setNewDelegate(item.value);
                            setActiveDefault('');
                            setTopDefault(item.value);
                            setShowSelectors(false);
                        }}
                        labelFormatter={(data, index) => {
                            return `#${(index + 1).toString().padStart(2, '0')} ${namedAddress(data.address)} (VP: ${shortenNumber(data.votingPower, 2)}, Recent votes: ${data.nbRecentVotes})`
                        }}
                        defaultValue={topDefault}
                        title={'Delegates with the most voting power'}
                        placeholder={'Choose'}
                        limit={50}
                        w='full'
                    />
                </VStack>
            }

            {
                !!suggestedValue && suggestedValue !== delegatingTo && <HStack>
                    <Text cursor="pointer" fontWeight="bold" textDecoration="underline" onClick={() => setNewDelegate(suggestedValue)}>
                        Click here to sync with my non-FiRM delegation
                    </Text>
                </HStack>
            }
            <Text fontWeight="bold">Chosen delegate:</Text>
            <Input _hover={hasError ? {} : undefined} borderWidth="1" borderColor={hasError ? !!newDelegate ? 'error' : undefined : 'success'} onChange={(e) => setNewDelegate(e.target.value)} fontSize="14px" value={newDelegate} placeholder={'New delegate address'} />
            {
                delegatingTo?.toLowerCase() === newDelegate.toLowerCase() && !!delegatingTo && !!newDelegate
                && <InfoMessage alertProps={{ w: 'full' }} description="You already delegate to that address" />
            }
        </VStack>
    </ConfirmModal>
}

export const FirmGovToken = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const { market, escrow } = useContext(F2MarketContext);
    const hasEscrow = escrow?.replace(BURN_ADDRESS, '');

    // standard case
    const { data: delegateData } = useEtherSWR({
        args: market.isInv ? [[INV, 'delegates', escrow]] : [[escrow, 'delegatingTo']],
        abi: market.isInv ? INV_ABI : F2_ESCROW_ABI,
    });

    const delegatingTo = (delegateData ? delegateData[0] : '')?.replace(BURN_ADDRESS, '');

    return <Container
        noPadding
        p="0"
        id={CONTAINER_ID}
        collapsable={true}
        defaultCollapse={false}
        label={`${market.underlying.symbol} Governance Rights`}
        description={`Governance tokens deposited on FiRM keep their voting power!`}
    >
        <VStack w='full' alignItems="flex-start">
            <FirmGovDelegationModal
                isOpen={isOpen}
                onClose={onClose}
                delegatingTo={delegatingTo}
                escrow={escrow}
            />
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