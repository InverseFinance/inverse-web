import { ApproveButton } from "@app/components/Anchor/AnchorButton";
import { useAllowances } from "@app/hooks/useApprovals";
import { useBalances } from "@app/hooks/useBalances";
import { getBnToNumber } from "@app/util/markets";
import { hasAllowance } from "@app/util/web3";
import { ButtonProps, FlexProps, InputProps, Stack, TextProps, VStack } from "@chakra-ui/react"
import { JsonRpcSigner } from "@ethersproject/providers";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { SubmitButton } from "@app/components/common/Button";
import { BalanceInput } from "@app/components/common//Input"

type Props = {
    defaultAmount?: string
    address: string
    destination: string
    signer?: JsonRpcSigner
    isDisabled?: boolean
    isMaxDisabled?: boolean
    decimals?: number
    actionLabel?: string
    maxActionLabel?: string
    maxAmountFrom?: BigNumber[]
    btnThemeColor?: string
    showMaxBtn?: boolean
    onlyShowApproveBtn?: boolean
    hideInputIfNoAllowance?: boolean
    hideButtons?: boolean
    hideInput?: boolean
    btnProps?: ButtonProps
    showBalance?: boolean
    isError?: boolean
    inputRight?: any
    inputProps?: InputProps
    showMax?: boolean
    inputRightProps?: TextProps
    inputLeftProps?: FlexProps
    onSuccess?: () => void
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
        defaultAmount = '',
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
        btnThemeColor,
        showMaxBtn = true,
        onlyShowApproveBtn = false,
        hideInputIfNoAllowance = true,
        hideButtons = false,
        hideInput = false,
        btnProps,
        showBalance,
        inputRight,
        inputProps,
        isError,
        showMax,
        inputRightProps,
        inputLeftProps,
        onSuccess,
    } = props;
    const [amount, setAmount] = useState(defaultAmount);
    const [tokenApproved, setTokenApproved] = useState(false);
    const [freshTokenApproved, setFreshTokenApproved] = useState(false);
    const { approvals } = useAllowances([address], destination);
    const { balances } = useBalances([address]);
    const balance = balances ? getBnToNumber(balances[address], decimals) : 0;
    const maxBn = maxAmountFrom ? [...maxAmountFrom] : [balances && balances[address] ? balances[address] : zeroBn];
    maxBn.sort((a, b) => getBnToNumber(a) > getBnToNumber(b) ? 1 : -1);
    const maxFloat = parseFloat(formatUnits(maxBn[0], decimals));

    useEffect(() => {
        setAmount(defaultAmount);
    }, [defaultAmount])

    useEffect(() => {
        setTokenApproved(freshTokenApproved || hasAllowance(approvals, address));
    }, [approvals, address, freshTokenApproved]);

    const setToMaxDeposit = () => {
        const max = formatUnits(maxBn[0], decimals);
        setAmount(max);
        handleChange(max);
    }

    const handleAction = (isMax = false) => {
        const bnAmount = isMax ? maxBn[0] : parseUnits((amount || '0'), decimals);
        const params = {
            bnAmount,
            floatAmount: isMax ? getBnToNumber(maxBn[0]) : parseFloat(amount) || 0,
            balance,
            ...props,
        };
        return isMax ? onMaxAction(params) : onAction(params);
    }

    const handleChange = (value: string) => {
        setAmount(value);
        if (onAmountChange) {
            const floatAmount = parseFloat(value) || 0;
            onAmountChange(floatAmount);
        }
    }

    return <VStack w='full'>
        {
            (tokenApproved || !hideInputIfNoAllowance) && !hideInput &&
            <BalanceInput
                value={amount}
                showBalance={showBalance}
                balance={balance}
                inputProps={{ fontSize: '24px', py: { base: '20px', sm: '24px' }, ...inputProps }}
                inputRightProps={inputRightProps}
                inputLeftProps={inputLeftProps}
                onChange={(e: React.MouseEvent<HTMLInputElement>) => handleChange(e.target.value)}
                onMaxClick={() => setToMaxDeposit()}
                label={inputRight}
                isError={isError}
                showMax={showMax}
            />
        }
        {
            hideButtons ? null :
                !tokenApproved ?
                    <ApproveButton
                        w='full'
                        themeColor={btnThemeColor}
                        address={address}
                        toAddress={destination}
                        signer={signer}
                        isDisabled={balance <= 0}
                        onSuccess={() => setFreshTokenApproved(true)}
                        {...btnProps}
                    /> :
                    !onlyShowApproveBtn &&
                    <Stack w='full' direction={{ base: 'column', lg: 'row' }}>
                        <SubmitButton
                            themeColor={btnThemeColor}
                            onClick={() => handleAction()}
                            refreshOnSuccess={true}
                            onSuccess={() => handleChange('0')}
                            disabled={((!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxFloat) && isDisabled === undefined) || (isDisabled !== undefined && isDisabled)}
                            {...btnProps}
                        >
                            {actionLabel}
                        </SubmitButton>
                        {
                            showMaxBtn && <SubmitButton
                                onSuccess={() => {
                                    handleChange('0');
                                    if (onSuccess) {
                                        onSuccess();
                                    }
                                }}
                                themeColor={btnThemeColor}
                                onClick={() => handleAction(true)}
                                disabled={isMaxDisabled}
                                refreshOnSuccess={true}
                                {...btnProps}
                            >
                                {maxActionLabel}
                            </SubmitButton>
                        }
                    </Stack>
        }
    </VStack>
}