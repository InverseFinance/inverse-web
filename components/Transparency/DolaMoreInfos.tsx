import Link from '@app/components/common/Link'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'

export const DolaMoreInfos = () => {
    return (
        <ShrinkableInfoMessage
            description={
                <Link href="https://docs.inverse.finance/inverse-finance/technical/the-dola-fed">
                    Learn more about DOLA and the Fed contracts
                </Link>
            }
        />
    )
}