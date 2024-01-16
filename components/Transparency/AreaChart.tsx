import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { VictoryChart, VictoryBar, VictoryLabel, VictoryAxis, VictoryArea, VictoryTheme, VictoryClipContainer, VictoryVoronoiContainer, VictoryAreaProps, VictoryAxisProps, VictoryLabelProps, VictoryZoomContainer, VictoryBrushContainer, createContainer } from 'victory';
import moment from 'moment'
import { Box, VStack, useMediaQuery } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FlyoutTooltip } from './FlyoutTooltip';
import { useAppTheme } from '@app/hooks/useAppTheme';
import { CoordinatesArray } from '@app/types';
import { AreaChartRecharts } from './AreaChartRecharts';
import { fillMissingDailyDatesWithMostRecentData } from '@app/util/misc';

const strokeColors = {
    primary: '#8881c9',
    secondary: '#00FF8A',
    info: '#43a0e2',
}

const VictoryZoomVoronoiContainer = createContainer("zoom", "voronoi");

export type AreaChartProps = {
    data: CoordinatesArray,
    title?: string,
    width?: number,
    height?: number,
    showLabels?: boolean,
    showTooltips?: boolean,
    showMaxY?: boolean,
    interpolation?: VictoryAreaProps["interpolation"],
    axisStyle?: VictoryAxisProps["style"],
    domainYpadding?: number | 'auto',
    isDollars?: boolean,
    isPerc?: boolean,
    autoMinY?: boolean,
    allowZoom?: boolean,
    mainColor?: 'primary' | 'secondary' | 'info',
    titleProps?: VictoryLabelProps,
    id?: string,
    yTickPrecision?: number
    simplifyData?: boolean
    useRecharts?: boolean
    showEvents?: boolean
    showEventsLabels?: boolean
    showRangeBtns?: boolean
    showLegend?: boolean
    fillInByDayInterval?: number
    yLabel?: string
    minTickGap?: number
    interval?: number
    rangesToInclude?: string[]
    strokeColor?: string
};
// make sure there is only one data point per x value
const getSimplifiedData = (data: CoordinatesArray) => {
    const uniqueX = [...new Set(data.map(d => d.x))];
    return uniqueX.map(v => {
        return data.findLast(d => d.x <= v);
    });
}

export const AreaChart = ({
    data,
    title,
    width = 900,
    height = 300,
    showLabels = false,
    showTooltips = false,
    showMaxY = true,
    interpolation = 'basis',
    axisStyle,
    domainYpadding = 0,
    mainColor = 'primary',
    isDollars = false,
    isPerc = false,
    autoMinY = false,
    titleProps,
    allowZoom = false,
    id = 'area-chart',
    yTickPrecision = 2,
    simplifyData = false,
    useRecharts = false,
    showLegend = false,
    showEvents = false,
    showEventsLabels = false,
    fillInByDayInterval = 0,
    yLabel,
    minTickGap,
    interval,
    showRangeBtns,
    rangesToInclude,
    strokeColor,
}: AreaChartProps) => {
    const _data = simplifyData ? getSimplifiedData(data) : fillInByDayInterval > 0 ? fillMissingDailyDatesWithMostRecentData(data, fillInByDayInterval) : data;
    const [isLargerThan] = useMediaQuery('(min-width: 900px)');
    const [rightPadding, setRightPadding] = useState(50);
    const [selectedDomain, setSelectedDomain] = useState(undefined);
    const rangedData = selectedDomain?.x ? _data?.filter(d => d.x >= selectedDomain.x[0] && d.x <= selectedDomain.x[1]) : _data;

    const maxY = rangedData.length > 0 ? Math.max(...rangedData.map(d => d.y)) : 95000000;
    const minY = rangedData.length > 0 ? Math.min(...rangedData.map(d => d.y)) : 0;

    const { themeStyles } = useAppTheme();

    useEffect(() => {
        setRightPadding(isLargerThan ? 50 : 20)
    }, [isLargerThan]);

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '12px' },
        grid: {
            stroke: '#66666633',
            strokeDasharray: '4 4',
        }
    }

    const _yPad = domainYpadding === 'auto' ? maxY * 0.1 : domainYpadding;
    const calcYDomain = [autoMinY ? minY - _yPad < 0 ? 0 : minY - _yPad : 0, maxY + _yPad];

    const events = _data.filter(d => !!d.eventPointLabel);

    if (useRecharts) {
        return <AreaChartRecharts
            title={title}
            rightPadding={rightPadding}
            combodata={_data}
            allowZoom={allowZoom}
            interpolation={interpolation}
            chartWidth={width}
            chartHeight={height}
            useUsd={isDollars}
            mainColor={mainColor}
            events={events}
            yDomain={calcYDomain}            
            showTooltips={showTooltips}
            showLegend={showLegend}
            showEvents={showEvents}
            showEventsLabels={showEventsLabels}
            yLabel={yLabel}
            minTickGap={minTickGap}
            interval={interval}
            showRangeBtns={showRangeBtns}
            rangesToInclude={rangesToInclude}
            strokeColor={strokeColor}
            isPerc={isPerc}
        />
    }

    const handleZoom = (domain) => {
        setSelectedDomain(domain);
    }

    const zoomProps = { zoomDimension: 'x', zoomDomain: selectedDomain ? { x: selectedDomain?.x, y: calcYDomain } : undefined, onZoomDomainChange: handleZoom };
    const voronoiProps = {
        mouseFollowTooltips: true, voronoiDimension: 'x', labelComponent: <FlyoutTooltip />,
        labels: ({ datum }) => {
            return (
                moment(datum.x).format('MMM Do YYYY') + '\n' + `${shortenNumber(datum.y, yTickPrecision, isDollars)}${isPerc ? '%' : ''}`
            )
        }
    };

    return (
        <VStack width={width} spacing="0" position="relative">
            <Box
                width={width}
                height={height}
                position="relative"
            >
                <VictoryChart
                    width={width}
                    height={height}
                    theme={VictoryTheme.grayscale}
                    animate={{ duration: 500 }}
                    scale={{ x: "time" }}
                    padding={{ top: 50, bottom: 50, left: 50, right: rightPadding }}
                    containerComponent={
                        showTooltips && allowZoom ?
                            <VictoryZoomVoronoiContainer {...zoomProps} {...voronoiProps} />
                            : showTooltips && !allowZoom ?
                                <VictoryVoronoiContainer {...voronoiProps} /> :
                                !showTooltips && allowZoom ? <VictoryZoomContainer {...zoomProps} /> : null
                    }
                >
                    {
                        !!title && <VictoryLabel text={title} style={{ fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '16px' }} x={Math.floor(width / 2)} y={20} textAnchor="middle" {...titleProps} />
                    }
                    <VictoryAxis style={_axisStyle} dependentAxis tickFormat={(t) => `${smartShortNumber(t, yTickPrecision, isDollars)}${isPerc ? '%' : ''}`} />
                    <VictoryAxis style={_axisStyle} />
                    <VictoryArea
                        domain={{ y: [autoMinY ? minY - _yPad < 0 ? 0 : minY - _yPad : 0, maxY + _yPad] }}
                        groupComponent={<VictoryClipContainer clipId={id} />}
                        data={_data}
                        labelComponent={
                            <VictoryLabel
                                dx={-rightPadding - 30}
                                textAnchor="start"
                                verticalAnchor="start"
                            />
                        }
                        labels={
                            ({ data, index }) => {
                                const isMax = (maxY === data[index].y && index > 0 && maxY !== data[index - 1].y);
                                const pointLabel = ''//data[index].eventPointLabel;
                                return !!pointLabel ? pointLabel : (showLabels || (isMax && showMaxY) ? `${isMax && 'High: '}${smartShortNumber(data[index].y, 2, isDollars)}${isPerc ? '%' : ''}` : '')
                            }
                        }
                        style={{
                            data: { fillOpacity: 0.9, fill: `url(#${mainColor}-gradient)`, stroke: strokeColors[mainColor], strokeWidth: 1 },
                            labels: { fill: themeStyles.colors.mainTextColor, fontSize: '12px', fontFamily: 'Inter' }
                        }}
                        interpolation={interpolation}
                    />
                    <VictoryBar
                        barWidth={1}
                        labels={events.map(e => e.eventPointLabel)}
                        labelComponent={<VictoryLabel style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: '600', fill: themeStyles.colors.mainTextColor }} dy={-5} />}
                        style={{ data: { fill: "#c43a31", stroke: "#c43a31", strokeWidth: 1 } }}
                        data={events.map(e => ({ x: e.x, y: maxY + (_yPad / 20) }))}
                    />
                </VictoryChart>
            </Box>
            {
                allowZoom && <Box
                    width={width}
                    height={50}
                    position="relative"
                >
                    <VictoryChart
                        width={width}
                        height={50}
                        theme={VictoryTheme.grayscale}
                        animate={{ duration: 500 }}
                        scale={{ x: "time" }}
                        padding={{ top: 0, bottom: 0, left: 50, right: rightPadding }}
                        containerComponent={
                            <VictoryBrushContainer
                                responsive={false}
                                brushDimension="x"
                                brushDomain={selectedDomain}
                                onBrushDomainChange={handleZoom}
                            />
                        }
                    >
                        <VictoryAxis style={_axisStyle} dependentAxis tickFormat={(t) => ``} />
                        <VictoryAxis style={_axisStyle} />
                        <VictoryArea
                            domain={{ y: calcYDomain }}
                            groupComponent={<VictoryClipContainer clipId={`${id}-mini`} />}
                            data={_data}
                            style={{
                                data: { fillOpacity: 0.2, fill: `url(#${mainColor}-gradient)`, stroke: strokeColors[mainColor], strokeWidth: 1 },
                            }}
                            interpolation={interpolation}
                        />
                        <VictoryBar
                            barWidth={1}
                            labelComponent={<VictoryLabel style={{ fontFamily: 'Inter', fontSize: '13px', fontWeight: '600', fill: themeStyles.colors.mainTextColor }} dy={-5} />}
                            style={{ data: { fill: "#c43a31", stroke: "#c43a31", strokeWidth: 1 } }}
                            data={events.map(e => ({ x: e.x, y: maxY + (_yPad / 10) }))}
                        />
                    </VictoryChart>
                </Box>
            }
        </VStack>
    )
}