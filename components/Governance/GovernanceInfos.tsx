import { InfoMessage } from '@inverse/components/common/Messages'
import Link from '@inverse/components/common/Link'

export const GovernanceInfos = () => {
    return (
        <InfoMessage
            alertProps={{ fontSize: '12px', w: 'full' }}
            title="Governance data is updated every 15 min"
            description={
                <Link href="/governance/diagrams">
                    See the Governance Overview
                </Link>
            } />
    )
}