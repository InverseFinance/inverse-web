import { ApproveButton } from "@app/components/Anchor/AnchorButton";
import { useAllowances } from "@app/hooks/useApprovals";
import { useBalances } from "@app/hooks/useBalances";
import { getBnToNumber } from "@app/util/markets";
import { Stack, VStack } from "@chakra-ui/react"
import { JsonRpcSigner } from "@ethersproject/providers";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { useState } from "react";
import { SubmitButton } from "../Button";
import { BalanceInput } from "../Input"

type Props = {
    address: string
    destination: string
    signer?: JsonRpcSigner
    isDisabled?: boolean
    isMaxDisabled?: boolean
    decimals?: number
    actionLabel?: string
    maxActionLabel?: string
    maxAmountFrom?: BigNumber[]
}

type ActionProps = Props & {
    bnAmount: BigNumber
    floatAmount: number
    allowance: number
    balance: number
}

export type SimpleAmountFormProps = Props & {
    onAction: (p: ActionProps) => void
    onMaxAction: (p: ActionProps) => void
    onAmountChange?: (v: number) => void
}

const zeroBn = BigNumber.from('0');

export const SimpleAmountForm = (props: SimpleAmountFormProps) => {
    const {
        address,
        destination,
        signer,
        isDisabled,
        isMaxDisabled,
        onAction,
        onMaxAction,
        decimals = 18,
        actionLabel = 'Submit',
        maxActionLabel = 'Submit MAX',
        maxAmountFrom,
        onAmountChange,
    } = props;

    const [amount, setAmount] = useState('0');
    const { approvals } = useAllowances([address], destination);
    const { balances } = useBalances([address]);
    const allowance = approvals ? getBnToNumber(approvals[address], decimals) : 0;
    const balance = balances ? getBnToNumber(balances[address], decimals) : 0;
    const maxBn = maxAmountFrom ? [...maxAmountFrom] : [balances && balances[address] ? balances[address] : zeroBn];
    maxBn.sort((a, b) => a.gt(b) ? 1 : -1);

    const setToMaxDeposit = () => {
        setAmount(formatUnits(maxBn[0], decimals));
    }

    const handleAction = (isMax = false) => {
        const bnAmount = isMax ? maxBn[0] : parseUnits((amount || '0'), decimals);
        const params = {
            bnAmount,
            floatAmount: isMax ? getBnToNumber(maxBn[0]) : parseFloat(amount)||0,
            allowance,
            balance,
            ...props,
        };
        return isMax ? onAction(params) : onMaxAction(params);
    }

    const handleChange = (value: string) => {
        setAmount(value);
        if(onAmountChange) {
            const floatAmount = parseFloat(value)||0;
            onAmountChange(floatAmount);
        }
    }

    return <VStack w='full'>
        {
            !!allowance &&
            <BalanceInput
                value={amount}
                inputProps={{ fontSize: '15px', py: { base: '20px', sm: '24px' } }}
                onChange={(e: React.MouseEvent<HTMLInputElement>) => handleChange(e.target.value)}
                onMaxClick={() => setToMaxDeposit()}
            />
        }
        {
            !allowance ?
                <ApproveButton
                    w='full'
                    address={address}
                    toAddress={destination}
                    signer={signer}
                    isDisabled={balance <= 0}
                /> :
                <Stack w='full' direction={{ base: 'column', lg: 'row' }}>
                    <SubmitButton
                        onClick={() => handleAction()}
                        refreshOnSuccess={true}
                        disabled={((!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance) && isDisabled === undefined) || (isDisabled !== undefined && isDisabled)}>
                        {actionLabel}
                    </SubmitButton>
                    <SubmitButton
                        onClick={() => handleAction(true)}
                        disabled={isMaxDisabled}
                        refreshOnSuccess={true}>
                        {maxActionLabel}
                    </SubmitButton>
                </Stack>
        }
    </VStack>
}