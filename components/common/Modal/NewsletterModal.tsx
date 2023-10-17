import SimpleModal from "./SimpleModal"
import { Newsletter } from "../Newsletter"

export const NewsletterModal = ({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose: () => void
}) => {
    return <SimpleModal
        title="Subscribe to Our Newsletter"
        isOpen={isOpen}
        onClose={onClose}
        modalProps={{ minW: { base: '98vw', lg: '600px' }, scrollBehavior: 'inside' }}
    >
        <Newsletter />
    </SimpleModal>
}