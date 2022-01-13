import { InfoMessage } from '@inverse/components/common/Messages'

export const GovernanceInfos = () => {
    return (
        <InfoMessage
            alertProps={{ fontSize: '12px', w: 'full' }}
            title="Governance data is updated every 15 min"
        />
    )
}