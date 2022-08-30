import InfoModal from "@app/components/common/Modal/InfoModal"
import { DBRInfos } from "../Infos/DBRInfos"

export const F2DbrInfosModal = ({
    onClose,
    isOpen,
}: {
    onClose: () => void
    isOpen: boolean
}) => {
    return <InfoModal
        title={`Fixed Rate Validity and What is DBR?`}
        onClose={onClose}
        onOk={onClose}
        isOpen={isOpen}
        minW={{ base: '98vw', lg: '650px' }}
        okLabel="Close"
    >
        <DBRInfos />
    </InfoModal>
}