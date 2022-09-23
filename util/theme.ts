
export const switchTheme = () => {
    const currentTheme = localStorage.getItem('theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    const customEvent = new CustomEvent('change-theme', { detail: { newTheme } });
    document.dispatchEvent(customEvent);    
}