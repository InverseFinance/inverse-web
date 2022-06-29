import theme from '@app/variables/theme';
import { VictoryTooltip } from 'victory';

export const FlyoutTooltip = ({ ...props }) => {
    return <VictoryTooltip {...props} flyoutPadding={10} style={{ fill: '#fff', fontFamily: 'Inter' }} centerOffset={{ x: -50 }} cornerRadius={10} flyoutStyle={{ fill: theme.colors.darkPrimary, stroke: '#fff' }} />
}