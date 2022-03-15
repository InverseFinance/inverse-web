import { ProposalFunction } from '@app/types'
import { AbiCoder, commify, FunctionFragment, isAddress } from 'ethers/lib/utils';
import { Stack, Flex, Text, StackProps } from '@chakra-ui/react';
import Link from '@app/components/common/Link'
import { namedAddress } from '@app/util';
import { TOKENS, UNDERLYING } from '@app/variables/tokens';
import { capitalize } from '@app/util/misc';
import { formatUnits } from 'ethers/lib/utils';
import { getNetworkConfigConstants } from '@app/util/networks';
import ScannerLink from '../common/ScannerLink';

const { DOLA_PAYROLL, DOLA } = getNetworkConfigConstants();

const Amount = ({ value, decimals }: { value: string, decimals: number }) => {
    return <Text display="inline-block" fontWeight="bold" color="secondary">
        {commify(formatUnits(value, decimals)).replace(/\.0$/, '')}
    </Text>;
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
            <b>{funName === '_addReserves' ? 'Add' : 'Reduce'}</b> <b>{contractKnownToken.symbol}</b> Anchor Market's <b>Reserves</b> by {amount}
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
    const isHumanRedeableCaseHandled = ['approve', 'transfer', 'mint', 'addRecipient', '_reduceReserves', '_addReserves'].includes(funName);
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
                    isHumanRedeableCaseHandled && !!contractKnownToken && <HumanReadableActionLabel target={target} signature={signature} callDatas={callDatas} />
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