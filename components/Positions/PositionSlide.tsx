import { AccountPositionDetailed } from '@app/types'
import { PositionDetails } from './PositionDetails'
import { SlideModal } from '@app/components/common/Modal/SlideModal'
import ScannerLink from '@app/components/common/ScannerLink'
import { Text } from '@chakra-ui/react'

export const PositionSlide = ({
    isOpen,
    onClose,
    position,
    needFresh = true,
}: {
    isOpen: boolean,
    onClose: () => void,
    position: AccountPositionDetailed,
    needFresh?: boolean
}) => {
    return <SlideModal
        isOpen={isOpen}
        onClose={onClose}
        right={<Text fontWeight="bold">
            Account: {position?.account ? <ScannerLink value={position?.account} /> : '-'}
        </Text>}
    >
        {!!position && <PositionDetails needFresh={needFresh} position={position} />}
    </SlideModal>
}