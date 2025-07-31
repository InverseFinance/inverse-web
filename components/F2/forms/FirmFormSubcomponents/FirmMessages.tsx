import Link from "@app/components/common/Link"
import { InfoMessage, WarningMessage } from "@app/components/common/Messages"
import InfoModal from "@app/components/common/Modal/InfoModal"
import { BUY_LINKS } from "@app/config/constants"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { Flex, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { FirmFAQ } from "../../Infos/FirmFAQ"

export const DebtDustErrorMessage = ({
    debt
}: {
    debt: number
}) => {
    return <WarningMessage alertProps={{ w: 'full' }} description={
        `Sorry, a temporary bug prevents you from borrowing, please try again later or repay your dust debt first${debt === 0 ? ' (may be in another market than this one)' : ''}`
    } />
}

export const MinDebtBorrowMessage = ({
    minDebt,
    debt,
}: {
    minDebt: number
    debt: number
}) => {
    return <WarningMessage alertProps={{ w: 'full' }} description={
        !debt ? `You need to borrow at least ${preciseCommify(minDebt, 0)} DOLA`
            : `The resulting debt should be at least ${preciseCommify(minDebt, 0)} DOLA or zero`
    } />
}

export const NoDbrInWalletMessage = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return <>
        <InfoMessage
            title="No DBRs in wallet"
            alertProps={{ w: 'full' }}
            description={
                <Flex display="inline-block">
                    To borrow DOLA you need to first <Link textDecoration="underline" color="accentTextColor" display="inline-block" href={BUY_LINKS.DBR} isExternal target="_blank">
                        buy DBR tokens
                    </Link> OR use the <b>auto-buy</b> option which adds the DBR cost to your DOLA loan.
                    <Text onClick={onOpen} cursor="pointer" textDecoration="underline" mt="2">
                        New to FiRM? Discover how DBR powers FiRM loans
                    </Text>
                </Flex>
            }
        />
        <InfoModal modalProps={{ minW: { base: '98vw', lg: '1000px' }, scrollBehavior: 'inside' }} title="DBR powers DOLA loans on FiRM" isOpen={isOpen} onClose={onClose}>
            <VStack p="4">
                <FirmFAQ hideTitle={true} dbrOnly={true} smaller={false} labelProps={{ fontSize: '14px' }} />
            </VStack>
        </InfoModal>
    </>
}

export const NotEnoughDolaToRepayMessage = ({
    amount
}: {
    amount: number
}) => {
    return <InfoMessage
        alertProps={{ w: 'full' }}
        description={`Not enough DOLA in wallet to repay ${preciseCommify(amount, 2)} DOLA`}
    />
}

export const AutoBuyDbrNoteMessage = () => {
    return <InfoMessage
        alertProps={{ w: 'full', fontStyle: 'italic', fontSize: '14px' }}
        description="Note: The cost of the auto-bought DBR will be added to your debt."
    />
}

export const NotEnoughCollateralMessage = () => {
    return <InfoMessage
        alertProps={{ w: 'full' }}
        description="Not Enough collateral to deposit"
    />
}

export const CannotWithdrawIfDbrDeficitMessage = () => {
    return <WarningMessage
        alertProps={{ w: 'full' }}
        description="Can not withdraw when there is a DBR deficit"
    />
}

export const NotEnoughLiqWithAutobuyMessage = ({
    leftToBorrow,
    isAutoDBR,
    dbrCoverDebt,
    deltaDebt,
}: {
    leftToBorrow: number
    isAutoDBR: boolean
    dbrCoverDebt: number
    deltaDebt: number
}) => {
    return <WarningMessage alertProps={{ w: 'full' }} description={
        `Only ${shortenNumber(leftToBorrow, 2)} DOLA are available for borrowing at the moment${isAutoDBR ? ` but around ${shortenNumber(dbrCoverDebt + deltaDebt, 2)} DOLA are needed to cover the debt (borrow amount+DBR auto-buy cost)` : ''}.`
    } />
}

export const ResultingBorrowLimitTooHighMessage = () => {
    return <WarningMessage
        alertProps={{ w: 'full' }}
        description="The resulting Borrow Limit is too high"
    />
}

export const NoDolaLiqMessage = () => {
    return <WarningMessage alertProps={{ w: 'full' }} description="No DOLA liquidity at the moment" />
}
export const BorrowPausedMessage = () => {
    return <WarningMessage alertProps={{ w: 'full' }} description="Borrowing is paused" />
}