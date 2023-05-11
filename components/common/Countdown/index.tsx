import moment from 'moment'
import { Box, Text, useInterval, SlideFade } from '@chakra-ui/react';
import { useState } from 'react';
import { LaunchAnim } from '@app/components/common/Animation';

const queued = Date.UTC(2022, 1, 2, 14, 5);
const execution = Date.UTC(2022, 1, 4, 14, 5);
const countdownOverText = 'Launching'

const getText = (end: number, textWhenOver = '') => {
    const now = Date.now()
    const delta = end - now;
    if (delta <= 0) {
        return textWhenOver;
    }
    const duration = moment.duration(delta, "milliseconds");
    const days = duration.days()
    return `${(24 * days + duration.hours()).toString().padStart(2, '0')}:${duration.minutes().toString().padStart(2, '0')}:${duration.seconds().toString().padStart(2, '0')}`
}

export const DailyLimitCountdown = ({
    prefix,
    suffix,
}: {
    prefix?: string,
    suffix?: string,
}) => {
    const [text, setText] = useState(getText(+(moment.utc().endOf('day')._d)));

    useInterval(() => {
        const utcDayEnd = +(moment.utc().endOf('day')._d);
        setText(getText(utcDayEnd));
    }, 1000);

    return <>
        {prefix}{text}{suffix}
    </>
}

export const InvPlusCountdown = () => {
    const [text, setText] = useState(getText(execution, countdownOverText));
    const [isOver, setIsOver] = useState(execution - Date.now() <= 0)

    useInterval(() => {
        setIsOver(execution - Date.now() <= 0);
        setText(getText(execution, countdownOverText));
    }, 1000);

    return (
        <Box w="365px">
            <SlideFade
                transition={{
                    enter: { duration: 0 },
                    exit: { duration: 0 },
                }}
                in={!isOver}
                unmountOnExit={true}>
                Countdown to Inverse Plus
                <Text>{text}</Text>
            </SlideFade>
            <SlideFade
                transition={{
                    enter: { duration: 0 },
                    exit: { duration: 0 },
                }}
                in={isOver}
                unmountOnExit={true}>
                <LaunchAnim width={30} height={30} loop={true} />
                <Text fontSize="12px">INV+ is Launched!</Text>
            </SlideFade>
        </Box>
    )
}