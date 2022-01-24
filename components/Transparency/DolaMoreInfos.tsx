import Link from '@inverse/components/common/Link'
import { InfoMessage } from '@inverse/components/common/Messages'

export const DolaMoreInfos = () => {
    return (
        <InfoMessage
            alertProps={{ fontSize: '12px', w: 'full' }}
            description={
                <Link href="https://docs.inverse.finance/user-guides/dola-stablecoin">
                    Learn more about DOLA and the Fed contracts
                </Link>
            }
        />
    )
}