import { getCacheFromRedisAsObj, redisSetWithTimestamp } from "@app/util/redis";
import sharp from 'sharp';
import satori from "satori";
import { join } from 'path';
import * as fs from "fs";
import { lightTheme } from '@app/variables/theme';

const fontPath = join(process.cwd(), '/frames/inter-all-700-normal.woff')
const fontData = fs.readFileSync(fontPath);

const imgHeight = 600;
// should be 1.91 or 1;
const aspectRatio = 1.91;
const inverseFinanceFid = '254450';

export const getFramePngBuffer = async ({
    title,
    subtitle,
    footer,
    imageSrc,
    containerProps,
    subContainerProps,
    titleProps,
    subtitleProps,
    footerProps,
    imageProps,
    imageWidth = '100px',
    imageHeight = '100px',
}: {
    title: string,
    subtitle?: string,
    imageSrc?: string,
    footer?: string,
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
                {
                    !!footer && <h3 style={{ fontSize: 40, color: lightTheme.colors.mainTextColorLight2, ...footerProps }}>
                        {footer}
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

export const setFrameCheckAction = async (frameId, step, valueObj, fid) => {
    const key = `frames:${frameId}-${step}-fid${fid}`;
    const { data } = (await getCacheFromRedisAsObj(key)) || {};
    if (!!data) {
        return { alreadyUsed: true, data };
    } else {
        await redisSetWithTimestamp(key, valueObj);
        return { saved: true };
    }
}

const endpoint = "https://nemes.farcaster.xyz:2281";
const version = "v1";

function hexToBytes(hex: string) {
    for (var bytes = [], c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return new Uint8Array(bytes);
}

export const validateFrameMessage = async (message: string) => {
    const u = new URL(`${endpoint}/${version}/validateMessage`);
    const response = await fetch(u.toString(), {
        method: "POST",
        body: hexToBytes(message),
        headers: {
            "Content-Type": "application/octet-stream",
        },
    });
    return response.json();
};

export const getFarcasterUserProfile = async (fid: string) => {
    const u = new URL(`${endpoint}/${version}/userDataByFid`);
    u.searchParams.append("fid", fid);
    const response = await fetch(u.toString());
    return response.json();
};

export const isFollowingInverseFarcaster = async (fid: string) => {
    const u = new URL(`${endpoint}/${version}/linkById`);
    u.searchParams.append("link_type", 'follow');
    u.searchParams.append("fid", fid);
    u.searchParams.append("target_fid", inverseFinanceFid);    
    const response = await fetch(u.toString());
    const followResult = await response.json();
    return followResult?.data?.type === 'MESSAGE_TYPE_LINK_ADD';
};

export const getFarcasterUserAddresses = async (fid: string) => {
    const u = new URL(`${endpoint}/${version}/verificationsByFid`);
    u.searchParams.append("fid", fid);
    const response = await fetch(u.toString());
    const data = await response.json();
    return data.messages
        .filter((message: any) => {
            return message.data.type === "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS";
        })
        .map((message: any) => {
            return message.data.verificationAddEthAddressBody.address;
        });
};
