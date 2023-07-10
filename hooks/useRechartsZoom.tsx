import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import { ONE_DAY_MS } from "@app/config/constants";
import { timestampToUTC } from "@app/util/misc";
import { VStack, Text, HStack } from '@chakra-ui/react'
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

const rangeBtns = [
    { label: 'All' },
    { label: '1Y' },
    { label: '6M' },
    { label: '3M' },
    { label: 'YTD' },
]

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

export const useRechartsZoom = (combodata, xKey = 'x', yKey= 'y', allowZoom = false, showRangeBtns = false, yAxisId = undefined) => {
    const [state, setState] = useState({ ...initialState, data: null });
    const [refAreaLeft, setRefAreaLeft] = useState(initialState.refAreaLeft);
    const [refAreaRight, setRefAreaRight] = useState(initialState.refAreaRight);
    const [lastRangeType, setLastRangeType] = useState(rangeBtns[0].label);
    const { data, left, right, top, bottom } = state

    const zoomOut = () => {
        setRefAreaLeft('');
        setRefAreaRight('');
        setLastRangeType(rangeBtns[0].label);
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

    const changeToRange = (rangeType: string) => {
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
            } else if (rangeType === '1Y') {
                left = combodata.find(d => d[xKey] >= (right - ONE_DAY_MS * 366))[xKey];
            } else if (rangeType === '6M') {
                left = combodata.find(d => d[xKey] >= (right - ONE_DAY_MS * 181))[xKey];
            } else if (rangeType === '3M') {
                left = combodata.find(d => d[xKey] >= (right - ONE_DAY_MS * 91))[xKey];
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
        const refLeft = l || refAreaLeft;
        const refRight = r || refAreaRight;        

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

    const rangeButtons = <>{rangeBtns.map((btn, i) => <RSubmitButton bgColor={btn.label === lastRangeType ? 'accentTextColor' : undefined} onClick={() => changeToRange(btn.label)} maxH="30px" py="1" px="2" fontSize="12px">{btn.label}</RSubmitButton>)}</>
    const rangeButtonsBarAbs = !showRangeBtns || !allowZoom ? null : <HStack position={{ base: 'static', md: 'absolute' }} top="-43px">
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