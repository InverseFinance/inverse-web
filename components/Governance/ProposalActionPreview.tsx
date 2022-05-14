import { ProposalFunction } from '@app/types'
import { AbiCoder, commify, FunctionFragment, isAddress } from 'ethers/lib/utils';
import { Stack, Flex, Text, StackProps } from '@chakra-ui/react';
import Link from '@app/components/common/Link'
import { namedAddress, shortenAddress } from '@app/util';
import { REWARD_TOKEN, TOKENS, UNDERLYING } from '@app/variables/tokens';
import { capitalize, removeScientificFormat } from '@app/util/misc';
import { formatUnits } from 'ethers/lib/utils';
import { getNetworkConfigConstants } from '@app/util/networks';
import ScannerLink from '@app/components/common/ScannerLink';
import moment from 'moment';
import { shortenNumber } from '@app/util/markets';
import { ErrorBoundary } from '../common/ErrorBoundary';

const { DOLA_PAYROLL, DOLA, COMPTROLLER, XINV_VESTOR_FACTORY, STABILIZER, GOVERNANCE } = getNetworkConfigConstants();

const Amount = ({ value, decimals, isPerc = false }: { value: string, decimals: number, isPerc?: boolean }) => {
    return <Text display="inline-block" fontWeight="bold" color="secondary">
        {commify(removeScientificFormat(parseFloat(formatUnits(value, decimals)) * (isPerc ? 100 : 1))).replace(/\.0$/, '')}{isPerc && '%'}
    </Text>;
}

const XinvVestorHumanReadable = ({
    target,
    signature,
    callDatas,
}: {
    target: string,
    signature: string,
    callDatas: string[],
}) => {
    const funName = signature.split('(')[0];
    let text;

    if (['deployVester'].includes(funName)) {
        const [recipient, amountValue, startTimestampSec, durationSec, isCancellable] = callDatas;
        const contractKnownToken = REWARD_TOKEN!;
        const amount = <Amount value={amountValue} decimals={contractKnownToken.decimals} />;
        const destinator = <ScannerLink color="info" value={recipient} label={namedAddress(recipient)} />;
        const durationInDays = <b>{shortenNumber(parseInt(durationSec) / (3600 * 24), 0)} days</b>;
        const startingDate = <b>{moment(parseInt(startTimestampSec)*1000).format('MMM Do YYYY')}</b>;

        text = <Flex display="inline-block">
            <Text>&laquo; Deploy a <b>{ isCancellable === 'false' && 'Non-' }Cancellable</b> XinvVester for {destinator}:</Text>
            <Text>{amount} INV vested for {durationInDays} with a starting date of {startingDate} &raquo;</Text>
        </Flex>
    }

    return (
        <Flex display="inline-block" mb="2" fontStyle="italic">
           {text}
        </Flex>
    )
}

const ComptrollerHumanReadableActionLabel = ({
    target,
    signature,
    callDatas,
}: {
    target: string,
    signature: string,
    callDatas: string[],
}) => {
    const funName = signature.split('(')[0];
    let text;

    if (['_setCollateralFactor'].includes(funName)) {
        const contractKnownToken = UNDERLYING[callDatas[0]];
        const amount = <Amount value={callDatas[1]} decimals={18} isPerc={true} />;
        text = <Flex display="inline-block">
            Set <ScannerLink color="info" label={<><b>{contractKnownToken?.symbol || shortenAddress(callDatas[0])}</b>'s Anchor Market</>} value={callDatas[0]} /> <b>Collateral Factor</b> to {amount}
        </Flex>
    }

    return (
        <Flex display="inline-block" mb="2" fontStyle="italic">
            &laquo; {text} &raquo;
        </Flex>
    )
}

const AnchorHumanReadableActionLabel = ({
    target,
    signature,
    callDatas,
}: {
    target: string,
    signature: string,
    callDatas: string[],
}) => {
    const contractKnownToken = UNDERLYING[target];

    const funName = signature.split('(')[0];
    let text;

    if (['_reduceReserves', '_addReserves'].includes(funName)) {
        const amount = <Amount value={callDatas[0]} decimals={contractKnownToken.decimals} />;
        text = <Flex display="inline-block">
            <b>{funName === '_addReserves' ? 'Add' : 'Reduce'}</b> <ScannerLink color="info" label={<><b>{contractKnownToken.symbol}</b>'s Anchor Market</>} value={target} /> <b>Reserves</b> by {amount}
        </Flex>
    } else if (funName === '_setReserveFactor') {
        const amount = <Amount value={callDatas[0]} decimals={18} isPerc={true} />;
        text = <Flex display="inline-block">
            Set <ScannerLink color="info" label={<><b>{contractKnownToken.symbol}</b>'s Anchor Market</>} value={target} /> <b>Reserve Factor</b> to {amount}
        </Flex>
    }

    return (
        <Flex display="inline-block" mb="2" fontStyle="italic">
            &laquo; {text} &raquo;
        </Flex>
    )
}

const StabilizerHumanReadableActionLabel = ({
    target,
    signature,
    callDatas,
}: {
    target: string,
    signature: string,
    callDatas: string[],
}) => {
    const funName = signature.split('(')[0];
    let text;

    if (['setBuyFee', 'setSellFee'].includes(funName)) {
        const amount = <Amount value={callDatas[0]} decimals={4} isPerc={true} />;
        text = <Flex display="inline-block">
            Set the <ScannerLink color="info" label={<><b>Stabilizer</b></>} value={target} /> <b>{ funName === 'setBuyFee' ? 'Buy Fee' : 'Sell Fee' }</b> to {amount}
        </Flex>
    }

    return (
        <Flex display="inline-block" mb="2" fontStyle="italic">
            &laquo; {text} &raquo;
        </Flex>
    )
}

const GovernanceHumanReadableActionLabel = ({
    target,
    signature,
    callDatas,
}: {
    target: string,
    signature: string,
    callDatas: string[],
}) => {
    const funName = signature.split('(')[0];
    let text;

    if (['updateProposalQuorum', 'updateProposalThreshold'].includes(funName)) {
        const amount = <Amount value={callDatas[0]} decimals={18} />;
        text = <Flex display="inline-block">
            Set <b>{ funName === 'updateProposalQuorum' ? 'Proposal Success Quorum' : 'Proposal Submit Threshold' }</b> to {amount}
        </Flex>
    }

    return (
        <Flex display="inline-block" mb="2" fontStyle="italic">
            &laquo; {text} &raquo;
        </Flex>
    )
}

const HumanReadableActionLabel = ({
    target,
    signature,
    callDatas,
}: {
    target: string,
    signature: string,
    callDatas: string[],
}) => {
    if (UNDERLYING[target]) {
        return <AnchorHumanReadableActionLabel target={target} signature={signature} callDatas={callDatas} />;
    } else if (target === COMPTROLLER) {
        return <ComptrollerHumanReadableActionLabel target={target} signature={signature} callDatas={callDatas} />;
    } else if (target === XINV_VESTOR_FACTORY) {
        return <XinvVestorHumanReadable target={target} signature={signature} callDatas={callDatas} />
    } else if (target === STABILIZER) {
        return <StabilizerHumanReadableActionLabel target={target} signature={signature} callDatas={callDatas} />
    } else if (target === GOVERNANCE) {
        return <GovernanceHumanReadableActionLabel target={target} signature={signature} callDatas={callDatas} />
    }

    const contractKnownToken = target === DOLA_PAYROLL ? TOKENS[DOLA] : TOKENS[target];

    const destinator = <ScannerLink color="info" value={callDatas[0]} label={namedAddress(callDatas[0])} />;
    const funName = signature.split('(')[0];
    const symbol = <Text fontWeight="bold" display="inline-block">{contractKnownToken.symbol}</Text>;

    const amount = <Amount value={callDatas[1]} decimals={contractKnownToken.decimals} />

    let text;

    if (target === DOLA_PAYROLL) {
        text = <Flex display="inline-block">Add {destinator} to the <b>PayRolls</b> with a yearly salary of {amount} {symbol}</Flex>
    } else if (funName === 'approve') {
        text = <Flex display="inline-block">Set {destinator}'s {symbol} <b>Allowance</b> to {amount}</Flex>;
    } else {
        text = <Flex display="inline-block"><b>{capitalize(funName)}</b> {amount} {symbol} to {destinator}</Flex>;
    }

    return (
        <Flex display="inline-block" mb="2" fontStyle="italic">
            &laquo; {text} &raquo;
        </Flex>
    )
}

export const ProposalActionPreview = (({
    target,
    signature,
    callData,
    num,
    ...props
}: ProposalFunction & { num?: number } & StackProps) => {
    const callDatas = new AbiCoder()
        .decode(FunctionFragment.from(signature).inputs, callData)
        .toString()
        .split(',');

    const funName = signature.split('(')[0];
    const isHumanRedeableCaseHandled = [
        'approve',
        'transfer',
        'mint',
        'addRecipient',
        '_reduceReserves',
        '_addReserves',
        '_setReserveFactor',
        '_setCollateralFactor',
        'deployVester',
        'setSellFee',
        'setBuyFee',
        'updateProposalQuorum',
        'updateProposalThreshold',
    ].includes(funName);

    const contractKnownToken = target === DOLA_PAYROLL ? TOKENS[DOLA] : TOKENS[target] || UNDERLYING[target];

    return (
        <Stack w="full" spacing={1} {...props} textAlign="left">
            {
                num ?
                    <Flex fontSize="xs" fontWeight="bold" textTransform="uppercase" color="secondaryTextColor">
                        {`Action ${num}`}
                    </Flex>
                    : null
            }
            <Flex w="full" overflowX="auto" direction="column" bgColor="primary.850" borderRadius={8} p={3}>
                {
                    isHumanRedeableCaseHandled && (!!contractKnownToken || [COMPTROLLER, XINV_VESTOR_FACTORY, STABILIZER, GOVERNANCE].includes(target))
                    && <ErrorBoundary description={null}>
                        <HumanReadableActionLabel target={target} signature={signature} callDatas={callDatas} />
                    </ErrorBoundary>
                }
                <Flex fontSize="15px">
                    <Link isExternal href={`https://etherscan.io/address/${target}`} color="secondaryTextColor" fontWeight="semibold">
                        {namedAddress(target)}
                    </Link>
                    <Flex>{`.${signature.split('(')[0]}(${!callDatas[0] ? ')' : ''}`}</Flex>
                </Flex>
                <Flex direction="column" fontSize="sm" pl={4} pr={4}>
                    {callDatas.map((data: string, i) =>
                        isAddress(data) ? (
                            <Link isExternal key={i} href={`https://etherscan.io/address/${data}`} whiteSpace="nowrap">
                                {namedAddress(data)}
                                {i + 1 !== callDatas.length ? ',' : ''}
                            </Link>
                        ) : (
                            <Text key={i}>
                                {data}
                                {i + 1 !== callDatas.length ? ',' : ''}
                            </Text>
                        )
                    )}
                </Flex>
                {callDatas[0] && <Text>)</Text>}
            </Flex>
        </Stack>
    )
})