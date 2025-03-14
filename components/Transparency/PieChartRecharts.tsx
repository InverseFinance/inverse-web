import { useAppTheme } from "@app/hooks/useAppTheme";
import { smartShortNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc";
import { useMediaQuery } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { Cell, Pie, PieChart, Sector } from "recharts";

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { isMobile, precision, activeFill, centralFill, nameKey, isUsd, cx, cy, centralValue, centralNameKey, midAngle, innerRadius, outerRadius, startAngle, endAngle, activeSubtextFill, activeTextFill, payload, percent, value, isShortenNumbers } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const isPosCos = cos >= 0;
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (isPosCos ? 1 : -1) * 22;
    const ey = my;
    
    const textAnchor = isPosCos ? 'start' : 'end';

    const formattedValue = isMobile || isShortenNumbers ? smartShortNumber(value, 2, isUsd) : `${preciseCommify(value, precision, isUsd)}`;
    const formattedPerc = `${(percent * 100).toFixed(2)}%`;
    const formattedValueAndPerc = `${formattedValue} (${formattedPerc})`;
    const x = isMobile ? mx : (ex + (isPosCos ? 1 : -1) * 12);

    const isCustomCentral = centralValue || centralNameKey;    
    const activeColor = activeFill === 'keep' && payload.fillColor ? payload.fillColor : activeFill;

    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={activeColor}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={activeColor}
            />
            {
                !isMobile && <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={activeColor} fill="none" />
            }
            {
                !isMobile && <circle cx={ex} cy={ey} r={2} fill={activeColor} stroke="none" />
            }
            <text x={x} y={ey} fontWeight="bold" textAnchor={textAnchor} fontSize={16} fill={activeTextFill || activeColor}>
                {isCustomCentral ? payload[nameKey] : formattedValue}
            </text>
            <text x={x} y={ey} dy={20} textAnchor={textAnchor} fill={activeSubtextFill || '#999'} fontSize={14} >
                {isCustomCentral ? formattedValueAndPerc : formattedPerc}
            </text>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fontWeight="bold" fill={centralFill || activeColor}>
                {centralValue || payload[centralNameKey || nameKey]}
            </text>
        </g>
    );
};

export const PieChartRecharts = ({ data, centralValue = '', colorScale, centralFill = '', activeFill = '#8884d8', activeTextFill = '', activeSubtextFill = '', fill = '', cx, cy, dataKey = 'value', nameKey = 'name', centralNameKey = '', width = 300, height = 300, precision = 2, isUsd = false, isShortenNumbers = false }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const { themeParams } = useAppTheme();
    const { CHART_COLORS } = themeParams;
    const _colorScale = colorScale || CHART_COLORS;

    const onPieEnter = useCallback(
        (_, index) => {
            setActiveIndex(index);
        },
        [setActiveIndex]
    );
    const [isSmallerThan400] = useMediaQuery('(max-width: 400px)')

    return (
        <PieChart width={width} height={height} overflow="visible">
            <Pie
                activeIndex={activeIndex}
                activeShape={(props) => renderActiveShape({ ...props, centralFill, activeSubtextFill, activeTextFill, isShortenNumbers, precision, isUsd, centralNameKey, centralValue, nameKey, activeFill, fill, isMobile: isSmallerThan400 })}
                data={data}
                cx={cx}
                cy={cy}
                innerRadius={40}
                outerRadius={80}
                dataKey={dataKey}
                onMouseEnter={onPieEnter}
            >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={data[index]['fillColor'] || fill || _colorScale[index % _colorScale.length]} />
                ))}
            </Pie>
        </PieChart>
    );
}