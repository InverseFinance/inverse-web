import { useState } from 'react'
import { FormControl, FormLabel } from '@chakra-ui/react'
import { isAddress } from 'ethers/lib/utils'
import { useEffect } from 'react';
import { NetworkIds, TemplateProposalFormActionFields } from '@app/types'
import { getNetworkConfigConstants } from '@app/util/networks';
import { AnchorTemplate } from './AnchorTemplate';
import { Input } from '@app/components/common/Input';

const { ORACLE, UNDERLYING } = getNetworkConfigConstants(NetworkIds.mainnet)

const functionName = 'setFeed'

export const AnchorOracleTemplate = ({
    defaultAddress = '',
    defaultOracleAddress = '',
    onDisabledChange,
    onActionChange,
}: {
    defaultAddress?: string,
    defaultOracleAddress?: string,
    onDisabledChange: (v: boolean) => void
    onActionChange: (action: TemplateProposalFormActionFields | undefined) => void
}) => {
    const [address, setAddress] = useState(defaultAddress);
    const [oracleAddress, setOracleAddress] = useState(defaultOracleAddress);
    const [underlyingTokenDecimals, setUnderlyingTokenDecimals] = useState('');

    useEffect(() => {
        setUnderlyingTokenDecimals('')
        if(!address) { return }
        setUnderlyingTokenDecimals(UNDERLYING[address].decimals.toString())
    }, [address])

    useEffect(() => {
        const disabled = !underlyingTokenDecimals || !oracleAddress || !isAddress(oracleAddress) || !address || !isAddress(address)
        onDisabledChange(disabled)
        if (disabled) { return }

        const action: TemplateProposalFormActionFields = {
            contractAddress: ORACLE,
            func: `${functionName}(address cToken,address feed,uint8 tokenDecimals)`,
            args: [
                { type: 'address', value: address, name: 'cToken' },
                { type: 'address', value: oracleAddress, name: 'feed' },
                { type: 'uint8', value: underlyingTokenDecimals, name: 'tokenDecimals' },
            ],
            value: '0',
        }
        onActionChange(action)
    }, [oracleAddress, address])

    const handleValueChange = (e: any) => {
        setOracleAddress(e.target.value)
    }

    const onMarketChange = (newAddress: string) => {
        setAddress(newAddress)
    }

    return (
        <AnchorTemplate onMarketChange={onMarketChange}>
            <FormControl>
                <FormLabel>
                    Oracle Feed Address :
                </FormLabel>
                <Input isInvalid={oracleAddress && !isAddress(oracleAddress)}
                    textAlign="left"
                    fontSize="12px"
                    placeholder="0x..."
                    value={oracleAddress}
                    onChange={handleValueChange} />
            </FormControl>
            <FormControl>
                <FormLabel>
                    Underlying Token Decimals (automatic) :
                </FormLabel>
                <Input disabled={true}
                    textAlign="left"
                    fontSize="12px"
                    placeholder="Automatically filled"
                    value={underlyingTokenDecimals} />
            </FormControl>
        </AnchorTemplate>
    )
}