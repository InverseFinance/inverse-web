import { smartShortNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc";
import { useMediaQuery } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { Pie, PieChart, Sector } from "recharts";

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { isMobile, precision, activeFill, nameKey, isUsd, cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={activeFill}>
                {payload[nameKey]}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={activeFill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={activeFill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={activeFill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={activeFill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fontSize={18} fill={activeFill}>{isMobile ? smartShortNumber(value, 2, isUsd)  : `${preciseCommify(value, precision, isUsd)}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`${(percent * 100).toFixed(2)}%`}
            </text>
        </g>
    );
};

export const PieChartRecharts = ({ data, activeFill = '#8884d8', fill = '#8884d8', cx, cy, dataKey = 'value', nameKey = 'name', width = 300, height = 300, precision = 2, isUsd = false }) => {
    const [activeIndex, setActiveIndex] = useState(0);    
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
                activeShape={(props) => renderActiveShape({...props, precision, isUsd, nameKey, activeFill, isMobile: isSmallerThan400 })}                                
                data={data}
                cx={cx}
                cy={cy}
                innerRadius={40}
                outerRadius={80}
                fill={fill}
                dataKey={dataKey}
                onMouseEnter={onPieEnter}                
            />
        </PieChart>
    );
}