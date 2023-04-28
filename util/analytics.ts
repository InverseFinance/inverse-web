
const isProd = () => {
    return ["https://www.inverse.finance", "https://inverse.finance"].includes(location.origin);
}

export const ACTIVE_POLL = 'poll-0';

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

export const answerPoll = async (poll: string, answer: string, onSuccess?: () => void) => {
    gaEvent({ action: 'answer-poll-'+poll });
    const rawResponse = await fetch(`/api/polls`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ poll, answer }),
    });
    const result = await rawResponse.json();
    if (onSuccess && result.status === 'success') { onSuccess() }
}