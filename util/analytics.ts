
export const gaPageview = (url: string) => {
    window.gtag('config', 'G-63L0VKERNQ', {
        page_path: url,
    })
}


export const gaEvent = ({ action, params }: { action: string, params?: any }) => {
    window.gtag('event', action, params)
}