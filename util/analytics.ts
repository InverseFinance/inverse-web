
const isProd = () => {
    return ["https://www.inverse.finance", "https://inverse.finance"].includes(location.origin);
}
export const gaPageview = (url: string) => {
    if(!isProd()){
        return
    }
    window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS, {
        page_path: url,
    })
}

type GTagEvent = {
    action: string;
    params?: {
        category: string;
        label: string;
        value: number;
    }
};

export const gaEvent = ({ action, params }: GTagEvent) => {
    if(!isProd()){
        return
    }
    window.gtag('event', action, params)
}