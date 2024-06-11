
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

export const answerPoll = async (pollCode: string, answerValue: string, onSuccess?: () => void) => {
    gaEvent({ action: 'answer-poll-'+pollCode });
    const rawResponse = await fetch(`/api/polls`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ poll: pollCode, answer: answerValue }),
    });
    const result = await rawResponse.json();
    if (onSuccess && result.status === 'success') { onSuccess() }
}

export const requestNewFirmCollateral = async (value: string, symbol: string, description: string, wouldUse: boolean, account: string, onSuccess?: () => void) => {
    const rawResponse = await fetch(`/api/f2/request-collateral`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value, symbol, description, account, wouldUse }),
    });
    const result = await rawResponse.json();
    if (onSuccess && result.status === 'success') { onSuccess() }
}