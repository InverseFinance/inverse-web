import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { HStack } from "@chakra-ui/react"

export const PercentagesOfMax = ({
    isSmallerThan728 = false,
    onChange,
    max,
    usableMax,
}: {
    isSmallerThan728?: boolean,
    onChange?: (v: string) => void,
    max: number,
    usableMax?: number,
}) => {
    const quarterMax = Math.floor(0.25 * max);
    const halfMax = Math.floor(0.50 * max);
    const threeQuarterMax = Math.floor(0.75 * max);
    const _usableMax = usableMax || max;

    return <HStack w='full' justify="space-between">
        <AmountInfos label={`${!isSmallerThan728 ? 'Borrow ' : ''}~25%`} format={false} value={quarterMax} textProps={{ fontSize: '14px', onClick: () => onChange(quarterMax.toFixed(0)) }} />
        <AmountInfos label={`${!isSmallerThan728 ? 'Borrow ' : ''}~50%`} format={false} value={halfMax} textProps={{ fontSize: '14px', onClick: () => onChange(halfMax.toFixed(0)) }} />
        <AmountInfos label={`${!isSmallerThan728 ? 'Borrow ' : ''}~75%`} format={false} value={threeQuarterMax} textProps={{ fontSize: '14px', onClick: () => onChange(threeQuarterMax.toFixed(0)) }} />
        <AmountInfos label={`${!isSmallerThan728 ? 'Borrow ' : ''}~99%`} format={false} value={_usableMax} textProps={{ fontSize: '14px', onClick: () => onChange(_usableMax.toFixed(0)) }} />
    </HStack>
}