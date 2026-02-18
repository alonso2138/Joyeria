import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getCampaignConfig } from '../services/api';
import { useLocation } from 'react-router-dom';

interface ConfigContextType {
    config: any;
    isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType>({ config: null, isLoading: true });

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Leer tag de la URL (soporta ?id=... o ?tag=... o path /demo/:tag)
                const searchParams = new URLSearchParams(location.search);
                let tag = searchParams.get('tag') || searchParams.get('id');
                const apiKey = searchParams.get('apiKey');

                // Si la ruta es /demo/algo, extraer 'algo' como tag
                // Support both HashRouter (#/demo/...) and potentially normal paths if switched later
                const pathToCheck = location.pathname;
                if (pathToCheck.includes('/demo/')) {
                    const parts = pathToCheck.split('/demo/');
                    if (parts[1]) {
                        tag = parts[1].split('/')[0];
                    }
                }

                const data = await getCampaignConfig(tag || undefined, apiKey || undefined);
                setConfig(data);

                if (data && data.branding) {
                    const root = document.documentElement;
                    root.style.setProperty('--primary-color', data.branding.primaryColor || '#D4AF37');
                    root.style.setProperty('--secondary-color', data.branding.secondaryColor || '#111111');
                    root.style.setProperty('--accent-color', data.branding.accentColor || '#FFFFFF');
                    root.style.setProperty('--text-color', data.branding.textColor || '#FFFFFF');
                    root.style.setProperty('--header-bg', data.branding.headerBackground || 'rgba(0,0,0,0.2)');
                    root.style.setProperty('--card-border-color', data.branding.cardBorderColor || 'rgba(255,255,255,0.1)');
                    root.style.setProperty('--text-secondary-color', data.branding.secondaryTextColor || '#9CA3AF');
                    root.style.setProperty('--price-color', data.branding.priceColor || '#D4AF37');

                    // Apply font family
                    const fontMap: Record<string, string> = {
                        'sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        'serif': '"Playfair Display", "Merriweather", Georgia, serif',
                        'mono': '"Space Mono", "Courier New", monospace'
                    };
                    const fontFamily = fontMap[data.branding.fontFamily || 'sans'] || fontMap.sans;
                    root.style.setProperty('--font-family', fontFamily);

                    // Update favicon dynamically (use dedicated favicon or fallback to logo)
                    const faviconUrl = data.branding.logoIconUrl || data.branding.logoMainUrl;
                    if (faviconUrl) {
                        const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                        if (favicon) {
                            favicon.href = faviconUrl;
                        } else {
                            const newFavicon = document.createElement('link');
                            newFavicon.rel = 'icon';
                            newFavicon.href = faviconUrl;
                            document.head.appendChild(newFavicon);
                        }
                    }

                    if (data.branding.backgroundGradient) {
                        document.body.style.background = data.branding.backgroundGradient;
                    } else {
                        document.body.style.background = ''; // Reset to default CSS class
                    }
                }
            } catch (error) {
                console.error('Failed to fetch config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [location]);

    return (
        <ConfigContext.Provider value={{ config, isLoading }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
