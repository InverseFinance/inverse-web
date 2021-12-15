import { useState } from 'react'
import { isAddress } from 'ethers/lib/utils'
import { useEffect } from 'react';
import { NetworkIds, TemplateProposalFormActionFields } from '@inverse/types'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { AnchorTemplate } from './AnchorTemplate';
import { InfoMessage } from '@inverse/components/common/Messages';

const { COMPTROLLER } = getNetworkConfigConstants(NetworkIds.mainnet)

const functionName = '_supportMarket'

export const AnchorSupportMarketTemplate = ({
    defaultAddress = '',
    onDisabledChange,
    onActionChange,
}: {
    defaultAddress?: string,
    onDisabledChange: (v: boolean) => void
    onActionChange: (action: TemplateProposalFormActionFields | undefined) => void
}) => {
    const [address, setAddress] = useState(defaultAddress);

    useEffect(() => {
        const disabled = !address || !isAddress(address)
        onDisabledChange(disabled)
        if (disabled) { return }

        const action: TemplateProposalFormActionFields = {
            contractAddress: COMPTROLLER,
            func: `${functionName}(address cToken)`,
            args: [
                { type: 'address', value: address, name: 'cToken' },
            ],
            value: '0',
        }
        onActionChange(action)
    }, [address])

    const onMarketChange = (newAddress: string) => {
        setAddress(newAddress)
    }

    return (
        <AnchorTemplate onMarketChange={onMarketChange}>
            <InfoMessage description={`This will add the market in Anchor`} />
        </AnchorTemplate>
    )
}