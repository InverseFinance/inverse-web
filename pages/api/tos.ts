import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';

const ALLOWED_DOMAINS = ['inverse.finance', 'stableyields.info'];

function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return false;
    try {
        const hostname = new URL(origin).hostname;
        return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    } catch {
        return false;
    }
}

export default async function handler(req, res) {
    const { method } = req;

    const origin = req.headers['origin'] || req.headers['referer'];

    const { terms, lang, version } = req.body;

    if (!isAllowedOrigin(origin) || !version || !terms || !Array.isArray(terms) || terms.length > 40 || [...new Set(terms.flatMap(v => Object.keys(v)))].some(key => !['title', 'subtitle', 'warning', 'text', 'list'].includes(key))) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const key = `tos-agreements`;
    const { agreements } = (await getCacheFromRedis(key, false, 600)) || { agreements: [] };

    switch (method) {
        case 'POST':
            const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            const result = { accepted: true, ip, version, cookie: req.cookie, lang, acceptLang: req.headers["accept-language"], userAgent, timestamp: Date.now(), terms };
            agreements.push(result);
            await redisSetWithTimestamp(key, { agreements });
            res.status(200).json({ accepted: result.accepted, timestamp: result.timestamp });
            break;
        default:
            res.setHeader('Allow', ['POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}