import { useState } from 'react'
import { FormControl, FormLabel, VStack } from '@chakra-ui/react'
import { Input } from '@app/components/common/Input'
import { AddressAutocomplete } from '@app/components/common/Input/AddressAutocomplete'
import ScannerLink from '@app/components/common/ScannerLink'
import { isAddress } from 'ethers/lib/utils'
import { useEffect } from 'react';
import { AutocompleteItem, NetworkIds, TemplateProposalFormActionFields } from '@app/types'
import { parseUnits } from '@ethersproject/units';
import { getNetworkConfigConstants } from '@app/util/networks';
import { shortenAddress } from '@app/util'
import { REWARD_TOKEN } from '@app/variables/tokens'
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup';

const { XINV_VESTOR_FACTORY } = getNetworkConfigConstants(NetworkIds.mainnet);

// 2 years
const DAY_DURATION = 3600 * 24;
const DEFAULT_DURATION_SEC = DAY_DURATION * 365 * 2;

export const XinvVestor = ({
    defaultAddress = '',
    defaultAmount = '',
    defaultDuration = DEFAULT_DURATION_SEC.toString(),
    onDisabledChange,
    onActionChange,
}: {
    defaultAddress?: string,
    defaultAmount?: string,
    defaultDuration?: string,
    onDisabledChange: (v: boolean) => void
    onActionChange: (action: TemplateProposalFormActionFields | undefined) => void
}) => {
    const [destination, setDestination] = useState(defaultAddress);
    const [amount, setAmount] = useState(defaultAmount);
    const [startTimestampSec, setStartTimestampSec] = useState(Math.floor(Date.now() / 1000));
    const [durationSec, setDurationSec] = useState(defaultDuration);
    const [cancellable, setCancellable] = useState('true');
    const [action, setAction] = useState<TemplateProposalFormActionFields | undefined>(undefined);
    const [isDisabled, setIsDisabled] = useState(true);

    useEffect(() => {
        onDisabledChange(isDisabled)
    }, [isDisabled])

    useEffect(() => {
        onActionChange(action)
    }, [action])

    useEffect(() => {
        const disabled = ((!amount || amount === '0')) || !destination || !isAddress(destination) || parseFloat(durationSec) < 1 || !startTimestampSec
        setIsDisabled(disabled)
        if (disabled) { return }
        const args: any[] = [
            { type: 'address', value: destination, name: 'recipient' },
            { type: 'uint256', value: parseUnits(amount, REWARD_TOKEN?.decimals), name: 'amount' },
            { type: 'uint256', value: startTimestampSec, name: 'startTimestamp' },
            { type: 'uint256', value: durationSec, name: 'duration' },
            { type: 'bool', value: cancellable, name: 'cancellable' },
        ];

        const action: TemplateProposalFormActionFields = {
            contractAddress: XINV_VESTOR_FACTORY,
            func: `deployVester(address recipient, uint256 amount, uint256 startTimestamp, uint256 duration, bool cancellable)`,
            args,
            value: '0',
        }
        setAction(action)
    }, [amount, destination])


    const handleCancellableChange = (val: string) => {
        setCancellable(val)
    }

    const handleAmountChange = (e: any) => {
        setAmount(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))
    }

    const handleAddressChange = (item: AutocompleteItem | undefined) => {
        setDestination(item?.value || '')
    }

    const handleDurationChange = (e) => {
        const duration = parseFloat(e.target.value);
        setDurationSec((duration * DAY_DURATION).toString());
    }

    const handleStartTimestampChange = (e) => {
        const splitted = e.target.value.split('-');
        const [year, month, day] = splitted;
        const secs = Date.UTC(year, parseFloat(month) - 1, day) / 1000
        setStartTimestampSec(Math.floor(secs));
    }

    return (
        <VStack spacing="4">
            <FormControl>
                <FormLabel>
                    Recipient Address :
                    {
                        destination && isAddress(destination) ?
                            <ScannerLink ml="2" value={destination} label={shortenAddress(destination)} /> : null
                    }
                </FormLabel>
                <AddressAutocomplete
                    defaultValue={destination}
                    onItemSelect={handleAddressChange}
                />
            </FormControl>
            <FormControl>
                <FormLabel>
                    INV amount:
                </FormLabel>
                <Input placeholder="10" type="number" min="1" defaultValue={defaultAmount} onChange={handleAmountChange} />
            </FormControl>
            <FormControl>
                <FormLabel>
                    Start time (YYYY-MM-DD, can be retroactive):
                </FormLabel>
                <Input placeholder="2022-01-01" defaultValue={new Date().toISOString().substring(0, 10)} onChange={handleStartTimestampChange} />
            </FormControl>
            <FormControl>
                <FormLabel>
                    Duration in days:
                </FormLabel>
                <Input placeholder="365" type="number" min="1" defaultValue={parseFloat(defaultDuration)/DAY_DURATION} onChange={handleDurationChange} />
            </FormControl>
            <FormControl>
                <FormLabel>
                    Cancellable?:
                </FormLabel>
                <RadioCardGroup
                    wrapperProps={{ w: 'full', justify: 'center', mt: '4' }}
                    group={{
                        name: 'bool',
                        defaultValue: 'true',
                        onChange: handleCancellableChange,
                    }}
                    radioCardProps={{ w: '80px', textAlign: 'center', p: '1' }}
                    options={[{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }]}
                />
            </FormControl>
        </VStack>
    )
}