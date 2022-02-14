import { VictoryTooltip } from 'victory';

export const FlyoutTooltip = ({ ...props }) => {
    return <VictoryTooltip {...props} flyoutPadding={10} style={{ fill: '#fff', fontFamily: 'Inter' }} centerOffset={{ x: -50 }} cornerRadius={10} flyoutStyle={{ fill: '#8881c966' }} />
}