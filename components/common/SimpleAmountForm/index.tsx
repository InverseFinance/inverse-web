import { ApproveButton } from "@app/components/Anchor/AnchorButton";
import { useAllowances } from "@app/hooks/useApprovals";
import { useBalances } from "@app/hooks/useBalances";
import { getBnToNumber } from "@app/util/markets";
import { hasAllowance } from "@app/util/web3";
import { ButtonProps, Checkbox, FlexProps, InputProps, Stack, StackProps, TextProps, VStack } from "@chakra-ui/react"
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
    checkBalanceOnTopOfIsDisabled?: boolean
    alsoDisableApprove?: boolean
    isMaxDisabled?: boolean
    decimals?: number
    actionLabel?: string
    approveLabel?: string
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
    enableCustomApprove?: boolean
    defaultInfiniteApprovalMode?: boolean
    needApprove?: boolean
    extraBeforeButton?: any
    customBalance?: BigNumber
    containerProps?: StackProps
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
    onApprove?: () => void
    approveForceRefresh?: boolean
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
        checkBalanceOnTopOfIsDisabled,
        alsoDisableApprove,
        isMaxDisabled,
        onAction,
        onMaxAction,
        decimals = 18,
        approveLabel = 'Step 1/2 - Approve',
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
        enableCustomApprove = false,
        defaultInfiniteApprovalMode = true,
        extraBeforeButton = null,
        customBalance,
        containerProps,
        needApprove = true,
        onApprove,
        approveForceRefresh = false,
    } = props;
    const [amount, setAmount] = useState(!defaultAmount ? '' : defaultAmount);
    const [isInfiniteApprovalMode, setIsInfiniteApprovalMode] = useState(defaultInfiniteApprovalMode);
    const [tokenApproved, setTokenApproved] = useState(false);
    const [freshTokenApproved, setFreshTokenApproved] = useState(false);
    const { approvals } = useAllowances([address], destination);
    const { balances } = useBalances([address]);
    const _tokenAddress = address || 'CHAIN_COIN';

    const balanceBn = !!customBalance ? customBalance : (balances && balances[_tokenAddress] ? balances[_tokenAddress] : zeroBn);
    const balance = getBnToNumber(balanceBn, decimals);
    let maxBn = maxAmountFrom ? [...maxAmountFrom] : [balanceBn];
    if (maxAmountFrom && includeBalanceInMax) {
        maxBn.push(balanceBn);
    }

    maxBn.sort((a, b) => getBnToNumber(a) > getBnToNumber(b) ? 1 : -1);
    if (!maxBn.length || !maxBn[0]) {
        maxBn = [zeroBn];
    }
    const maxFloat = parseFloat(formatUnits(maxBn[0], decimals));

    const _amount = (amount || '')?.toString()?.startsWith('.') ? `0${amount}` : amount;
    const _bnAmount = parseUnits((roundFloorString(_amount, decimals) || '0'), decimals);

    useEffect(() => {
        setAmount(defaultAmount);
    }, [defaultAmount])

    useEffect(() => {        
        setFreshTokenApproved(false);
    }, [address, destination]);

    useEffect(() => {
        setTokenApproved(freshTokenApproved || !address || hasAllowance(approvals, address, decimals, amount));
    }, [approvals, address, freshTokenApproved]);

    const setToMaxDeposit = () => {
        const max = formatUnits(maxBn[0], decimals);
        setAmount(max);
        handleChange(max);
    }

    const handleAction = (isMax = false) => {
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
        const stringAmount = value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1');
        setAmount(stringAmount);
        if (onAmountChange && (!stringAmount.endsWith('.') || stringAmount === '.')) {
            const floatAmount = parseFloat(stringAmount) || 0;
            onAmountChange(stringAmount, floatAmount);
        }
    }

    return <VStack w='full' {...containerProps}>
        {
            ((tokenApproved || !needApprove) || !hideInputIfNoAllowance) && !hideInput &&
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
            extraBeforeButton
        }
        {
            hideButtons && !onlyShowApproveBtn ? null :
                (!tokenApproved && needApprove) && !noApprovalNeeded ?
                    <>
                        <ApproveButton
                            w='full'
                            themeColor={btnThemeColor}
                            address={address}
                            toAddress={destination}
                            signer={signer}
                            isDisabled={(isInfiniteApprovalMode ? balance <= 0 : !parseFloat(_amount)) || (!!alsoDisableApprove && !!isDisabled)}
                            onSuccess={() => {
                                setFreshTokenApproved(isInfiniteApprovalMode);
                                if(onApprove){
                                    onApprove();
                                }
                            }}
                            ButtonComp={ButtonComp}
                            amount={isInfiniteApprovalMode ? undefined : _bnAmount}
                            forceRefresh={approveForceRefresh}
                            {...btnProps}
                        >
                            {approveLabel}
                        </ApproveButton>
                        {
                            enableCustomApprove && <Checkbox
                                isChecked={isInfiniteApprovalMode}
                                onChange={() => setIsInfiniteApprovalMode(!isInfiniteApprovalMode)}
                                isDisabled={balance <= 0}
                            >
                                Infinite Approval
                            </Checkbox>
                        }
                    </> :
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
                            disabled={((!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxFloat) && (isDisabled === undefined || checkBalanceOnTopOfIsDisabled)) || (isDisabled !== undefined && isDisabled)}
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