import { getCacheFromRedisAsObj, redisSetWithTimestamp } from "@app/util/redis";
import sharp from 'sharp';
import satori from "satori";
import { join } from 'path';
import * as fs from "fs";
import { lightTheme } from '@app/variables/theme';

const fontPath = join(process.cwd(), '/node_modules/@fontsource/inter/files/inter-all-700-normal.woff')
const fontData = fs.readFileSync(fontPath);

const imgHeight = 600;
// should be 1.91 or 1;
const aspectRatio = 1.91;

export const getFramePngBuffer = async ({
    title,
    subtitle,
    imageSrc,
    containerProps,
    subContainerProps,
    titleProps,
    subtitleProps,
    imageProps,
    imageWidth = '100px',
    imageHeight = '100px',
}: {
    title: string,
    subtitle?: string,
    imageSrc?: string,
    containerProps?: any
    subContainerProps?: any
    titleProps?: any
    subtitleProps?: any
    imageProps?: any
}) => {
    const svg = await satori(
        <div style={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: lightTheme.colors.mainBackgroundColor,
            padding: '50px',
            fontWeight: 'bold',
            ...containerProps,
        }}>
            <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                ...subContainerProps,
            }}>
                {
                    !!imageSrc && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', backgroundSize: `${imageWidth} ${imageHeight}`, background: `url(${imageSrc})`, width: imageWidth, height: imageHeight, ...imageProps }}></div>
                    </div>
                }
                {/* <image style={{ src:  }} width="50px" height="50px" /> */}
                <h2 style={{ fontSize: 68, color: lightTheme.colors.mainTextColor, ...titleProps, }}>
                    {title}
                </h2>
                {
                    !!subtitle && <h3 style={{ fontSize: 48, color: lightTheme.colors.mainTextColorLight, ...subtitleProps }}>
                        {subtitle}
                    </h3>
                }
            </div>
        </div>
        ,
        {
            width: imgHeight * aspectRatio, height: imgHeight, fonts: [{
                data: fontData,
                name: 'Inter',
                style: 'normal',
                weight: 800
            }]
        }
    );

    // Convert SVG to PNG using Sharp
    const pngBuffer = await sharp(Buffer.from(svg))
        .toFormat('png')
        .toBuffer();

    return pngBuffer;
}

export const setFrameCheckAction = async (frameId, step, value, fid) => {
    const key = `frames:${frameId}-${step}-fid${fid}`;
    const { data } = (await getCacheFromRedisAsObj(key)) || {};
    if (!!data) {
        return { alreadyUsed: true };
    } else {
        await redisSetWithTimestamp(key, { value });
    }
}