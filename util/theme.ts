import { gaEvent } from "./analytics";

export const switchTheme = () => {
    const currentTheme = localStorage.getItem('theme');
    const newTheme = currentTheme === 'light' || !currentTheme ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    const customEvent = new CustomEvent('change-theme', { detail: { newTheme } });
    document.dispatchEvent(customEvent);
    gaEvent({ action: 'switch-theme-to-'+newTheme });
}