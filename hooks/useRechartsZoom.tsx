import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import { ONE_DAY_MS } from "@app/config/constants";
import { HStack } from '@chakra-ui/react'
import { useState } from "react";
import { ReferenceArea } from "recharts";

const initialState = {
    left: 'dataMin',
    right: 'dataMax',
    refAreaLeft: '',
    refAreaRight: '',
    top: 'auto',
    bottom: 'auto',
    animation: true,
};

const DEFAULT_RANGES_TO_INCLUDE = ['All', '1Y', '6M', '3M', 'YTD'];

const RANGES = [
    { label: 'All' },
    { label: '1Y', daysInPast: ONE_DAY_MS * 366 },
    { label: '6M', daysInPast: ONE_DAY_MS * 181 },
    { label: '3M', daysInPast: ONE_DAY_MS * 91 },
    { label: '1M', daysInPast: ONE_DAY_MS * 31 },
    { label: '3W', daysInPast: ONE_DAY_MS * 22 },
    { label: '2W', daysInPast: ONE_DAY_MS * 15 },
    { label: '1W', daysInPast: ONE_DAY_MS * 8 },
    { label: '7D', daysInPast: ONE_DAY_MS * 8 },
    { label: '2D', daysInPast: ONE_DAY_MS * 2 },
    { label: '1D', daysInPast: ONE_DAY_MS * 1 },
    { label: 'YTD' },
];

const getAxisYDomain = (combodata, from, to, xKey, ref, offsetPerc = 0.05) => {
    const xs = combodata.map(d => d[xKey]);
    const fromIndex = Math.max(xs.indexOf(from), 0);
    const toIndex = xs.indexOf(to) === -1 ? xs.length - 1 : xs.indexOf(to);
    const refData = combodata.slice(fromIndex, toIndex + 1);
    let [bottom, top] = [refData[0][ref], refData[0][ref]];
    refData.forEach((d) => {
        if (d[ref] > top) top = d[ref];
        if (d[ref] < bottom) bottom = d[ref];
    });

    return [Math.max((bottom || 0) * (1 - offsetPerc), 0), (top | 0) * (1 + offsetPerc), refData];
};

export const useRechartsZoom = ({
    combodata,
    xKey = 'x',
    yKey = 'y',
    allowZoom = true,
    showRangeBtns = true,
    yAxisId = undefined,
    forceStaticRangeBtns = false,
    rangesToInclude = DEFAULT_RANGES_TO_INCLUDE,
}: {
    combodata: any[]
    xKey?: string
    yKey?: string
    allowZoom?: boolean
    showRangeBtns?: boolean
    forceStaticRangeBtns?: boolean
    yAxisId?: string
    rangesToInclude?: string[]
}) => {
    const ranges = RANGES.filter(r => rangesToInclude.includes(r.label));
    const [state, setState] = useState({ ...initialState, data: null });
    const [refAreaLeft, setRefAreaLeft] = useState(initialState.refAreaLeft);
    const [refAreaRight, setRefAreaRight] = useState(initialState.refAreaRight);
    const [lastRangeType, setLastRangeType] = useState(ranges[0].label);
    const { data, left, right, top, bottom } = state

    const zoomOut = () => {
        setRefAreaLeft('');
        setRefAreaRight('');
        setLastRangeType(ranges[0].label);
        setState({
            ...state,
            data: null,
            left: 'dataMin',
            right: 'dataMax',
            top: 'auto',
            bottom: 'auto',
        });
    }

    const mouseLeave = () => {
        zoom();
        setRefAreaLeft('');
        setRefAreaRight('');
    }

    const mouseMove = (e) => {
        refAreaLeft && !!e && setRefAreaRight(e.activeLabel);
    }

    const changeToRange = (range: { label: string, daysInPast?: number }) => {
        const { label: rangeType, daysInPast } = range;
        setLastRangeType(rangeType);
        if (rangeType === 'All') {
            zoomOut();
            return;
        } else {
            const startOfYearTs = Date.UTC(new Date().getUTCFullYear());
            let left;
            const right = combodata[combodata.length - 1][xKey];

            if (rangeType === 'YTD') {
                left = combodata.find(d => d[xKey] >= startOfYearTs)[xKey];
            } else if (!!daysInPast) {
                left = combodata.find(d => d[xKey] >= (right - daysInPast))[xKey];
            } else {
                return;
            }
            zoom(left, right);
        }
    }

    const mouseDown = (e) => {
        setLastRangeType('');
        return !!e && setRefAreaLeft(e.activeLabel);
    }

    const mouseUp = () => {
        zoom();
    }

    const zoom = (l?: string | number, r?: string | number) => {
        let refLeft = l || refAreaLeft;
        let refRight = r || refAreaRight;

        if (refLeft === refRight || refRight === '') {
            setRefAreaLeft('');
            setRefAreaRight('');
            return;
        }

        // xAxis domain
        if (refLeft > refRight) [refLeft, refRight] = [refRight, refLeft];

        // yAxis domain
        const [bottom, top, data] = getAxisYDomain(combodata, refLeft, refRight, xKey, yKey, 0.02);

        setRefAreaLeft('');
        setRefAreaRight('');
        setState({
            ...state,
            data,
            left: refLeft,
            right: refRight,
            bottom,
            top,
        });
    }

    const rangeButtons = <>{ranges.map((range, i) => <RSubmitButton key={range.label} bgColor={range.label === lastRangeType ? 'accentTextColor' : undefined} onClick={() => changeToRange(range)} maxH="30px" py="1" px="2" fontSize="12px">{range.label}</RSubmitButton>)}</>
    const rangeButtonsBarAbs = !showRangeBtns || !allowZoom ? null : <HStack position={forceStaticRangeBtns ? 'static' : { base: 'static', md: 'absolute' }} top="-43px">
        {rangeButtons}
    </HStack>
    const rangeButtonsBar = !showRangeBtns || !allowZoom ? null : <HStack>
        {rangeButtons}
    </HStack>

    const zoomOutButton = allowZoom && left !== 'dataMin' && right !== 'dataMax' ?
        <RSubmitButton onClick={zoomOut} opacity="0.9" zIndex="1" w='fit-content' top={{ base: '35px', md: '0' }} right="0" position="absolute">
            Zoom Out
        </RSubmitButton> : null;

    const zoomReferenceArea = allowZoom && refAreaLeft && refAreaRight ? (
        <ReferenceArea yAxisId={yAxisId} x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
    ) : null;

    return { data, left, right, top, bottom, refAreaLeft, refAreaRight, lastRangeType, rangeButtons, rangeButtonsBarAbs, rangeButtonsBar, zoomOutButton, zoomReferenceArea, zoomOut, mouseLeave, mouseMove, changeToRange, mouseDown, mouseUp }
}