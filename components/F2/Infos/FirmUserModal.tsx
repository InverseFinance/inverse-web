import { Modal } from "@app/components/common/Modal"
import { DbrReplenishmentForm } from "../liquidations/DbrReplenishmentForm";
import { shortenAddress } from "@app/util";
import { NavButtons } from "@app/components/common/Button";
import { useState } from "react";
import { HStack, VStack, useDisclosure, Text } from "@chakra-ui/react";
import { FirmPositionsTable } from "./FirmPositionsTable";
import { FirmLiquidationForm } from "../liquidations/FirmLiquidationForm";
import { ArrowBackIcon } from "@chakra-ui/icons";

export const FirmUserModal = ({
    userData,
    onClose,
    isOpen,
    useSimple = false,
}: {
    userData: any,
    onClose: () => void,
    isOpen: boolean,
    useSimple?: boolean,
}) => {
    const [active, setActive] = useState('Markets');
    const { isOpen: isOpenMarket, onOpen: onOpenMarket, onClose: onCloseMarket } = useDisclosure();

    const [position, setPosition] = useState(null);

    const openLiquidation = async (data) => {
        setPosition(data);
        onOpenMarket();
    }

    const back = () => {
        onCloseMarket();
        setTimeout(() => {
            setPosition(null);
        });
    }

    return <Modal
        header={`${shortenAddress(userData.user)} details`}
        onClose={() => {
            onClose();
            setTimeout(() => {
                setActive('Markets');
            });
        }}
        isOpen={isOpen}
        size="lg"
        scrollBehavior="inside"
    >
        {
            !useSimple && <NavButtons options={['Markets', 'DBR replenishment']} onClick={(v) => setActive(v)} active={active} />
        }
        <VStack w='100%' alignItems="center">
            <VStack w='100%' px="2" py="4">
                {
                    active === 'DBR replenishment' && <DbrReplenishmentForm userData={userData} />
                }
                {
                    active === 'Markets' ?
                        !isOpenMarket ?
                            <FirmPositionsTable isOneUserOnly={true} onClick={useSimple ? undefined : openLiquidation} positions={userData.marketPositions} />
                            : <VStack w='full' alignItems="flex-start">
                                <HStack cursor="pointer" spacing="1" onClick={back}>
                                    <ArrowBackIcon size="20px" />
                                    <Text fontWeight="bold">Back to list</Text>
                                </HStack>
                                <FirmLiquidationForm position={position} />
                            </VStack>
                        : null
                }
            </VStack>
        </VStack>
    </Modal>
}