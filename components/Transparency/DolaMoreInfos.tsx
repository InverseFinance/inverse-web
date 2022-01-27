import Link from '@app/components/common/Link'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'

export const DolaMoreInfos = () => {
    return (
        <ShrinkableInfoMessage
            description={
                <Link href="https://docs.inverse.finance/user-guides/dola-stablecoin">
                    Learn more about DOLA and the Fed contracts
                </Link>
            }
        />
    )
}