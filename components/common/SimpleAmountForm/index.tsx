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
import { BalanceInput } from "@app/components/common//Input"
import { roundFloorString } from "@app/util/misc";
import { InfoMessage } from "../Messages";
import { RSubmitButton } from "../Button/RSubmitButton";

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
    includeBalanceInMax?: boolean
    showNotEnoughTokenMsg?: boolean
    btnProps?: ButtonProps
    ButtonComp?: React.ReactNode
    showBalance?: boolean
    isError?: boolean
    noApprovalNeeded?: boolean
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
    onAmountChange?: (v: string, s: number) => void
}

const zeroBn = BigNumber.from('0');

const Btn = (props) => <RSubmitButton px="8" {...props} />

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
        noApprovalNeeded = false,
        hideInputIfNoAllowance = true,
        hideButtons = false,
        hideInput = false,
        includeBalanceInMax = false,
        showNotEnoughTokenMsg = false,
        btnProps,
        ButtonComp = Btn,
        showBalance,
        inputRight,
        inputProps,
        isError,
        showMax,
        inputRightProps,
        inputLeftProps,
        onSuccess,
    } = props;
    const [amount, setAmount] = useState(!defaultAmount ? '' : defaultAmount);
    const [tokenApproved, setTokenApproved] = useState(false);
    const [freshTokenApproved, setFreshTokenApproved] = useState(false);
    const { approvals } = useAllowances([address], destination);
    const { balances } = useBalances([address]);

    const balanceBn = balances && balances[address] ? balances[address] : zeroBn;
    const balance = getBnToNumber(balanceBn, decimals);
    let maxBn = maxAmountFrom ? [...maxAmountFrom] : [balances && balances[address] ? balances[address] : zeroBn];
    if (maxAmountFrom && includeBalanceInMax) {
        maxBn.push(balanceBn);
    }
    
    maxBn.sort((a, b) => getBnToNumber(a) > getBnToNumber(b) ? 1 : -1);
    if(!maxBn.length || !maxBn[0]){
        maxBn = [zeroBn];
    }
    const maxFloat = parseFloat(formatUnits(maxBn[0], decimals));

    useEffect(() => {
        setAmount(defaultAmount);
    }, [defaultAmount])

    useEffect(() => {
        setTokenApproved(freshTokenApproved || hasAllowance(approvals, address, decimals, amount));
    }, [approvals, address, freshTokenApproved]);

    const setToMaxDeposit = () => {
        const max = formatUnits(maxBn[0], decimals);        
        setAmount(max);
        handleChange(max);
    }

    const handleAction = (isMax = false) => {
        const _amount = (amount||'')?.toString()?.startsWith('.') ? `0${amount}` : amount;
        const bnAmount = isMax ? maxBn[0] : parseUnits((roundFloorString(_amount, decimals) || '0'), decimals);        
        const params = {
            bnAmount,
            floatAmount: isMax ? getBnToNumber(maxBn[0]) : parseFloat(_amount) || 0,
            balance,
            ...props,
        };
        return isMax ? onMaxAction(params) : onAction(params);
    }

    const handleChange = (value: string) => {
        const stringAmount = value.replace(/[^0-9.]/, '').replace(/(?<=\..*)\./g, '');
        setAmount(stringAmount);
        if (onAmountChange && !stringAmount.endsWith('.')) {
            const floatAmount = parseFloat(stringAmount) || 0;
            onAmountChange(stringAmount, floatAmount);
        }
    }

    return <VStack w='full'>
        {
            (tokenApproved || !hideInputIfNoAllowance) && !hideInput &&
            <BalanceInput
                value={!amount ? '' : amount}
                showBalance={showBalance}
                balance={balance}
                inputProps={{
                    fontSize: { base: '14px', sm: '20px', md: '22px', lg: '24px' },
                    py: { base: '20px', sm: '24px' },
                    ...inputProps
                }}
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
            hideButtons && !onlyShowApproveBtn ? null :
                !tokenApproved && !noApprovalNeeded ?
                    <ApproveButton
                        w='full'
                        themeColor={btnThemeColor}
                        address={address}
                        toAddress={destination}
                        signer={signer}
                        isDisabled={balance <= 0}
                        onSuccess={() => setFreshTokenApproved(true)}
                        ButtonComp={ButtonComp}
                        {...btnProps}
                    /> :
                    !onlyShowApproveBtn &&
                    <Stack w='full' direction={{ base: 'column', lg: 'row' }}>
                        <ButtonComp
                            themeColor={btnThemeColor}
                            onClick={() => handleAction()}
                            refreshOnSuccess={true}
                            onSuccess={() => {
                                handleChange('0');
                                if (onSuccess) {
                                    onSuccess();
                                }
                            }}
                            disabled={((!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxFloat) && isDisabled === undefined) || (isDisabled !== undefined && isDisabled)}
                            {...btnProps}
                        >
                            {actionLabel}
                        </ButtonComp>
                        {
                            showMaxBtn && <ButtonComp
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
                            </ButtonComp>
                        }
                    </Stack>
        }
        {
            showNotEnoughTokenMsg && balance < parseFloat(amount) && <InfoMessage description="Not Enough tokens" alertProps={{ w: 'full' }} />
        }
    </VStack>
}