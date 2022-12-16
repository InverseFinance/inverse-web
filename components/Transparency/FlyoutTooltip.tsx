import { useAppTheme } from '@app/hooks/useAppTheme';
import { VictoryTooltip } from 'victory';

export const FlyoutTooltip = ({ ...props }) => {
    const { themeStyles } = useAppTheme();
    return <VictoryTooltip {...props} flyoutPadding={10} style={{ fill: '#fff', fontFamily: 'Inter' }} centerOffset={{ x: -50 }} cornerRadius={10} flyoutStyle={{ fill: themeStyles.colors.darkPrimary, stroke: '#fff' }} />
}