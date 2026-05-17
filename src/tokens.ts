export const tokens = {
    color: {
        bg: '#ffffff',
        surface: '#f7f7f8',
        border: '#e5e7eb',
        text: '#111111',
        muted: '#6b7280',
        primary: '#111111',
        primaryText: '#ffffff',
        accent: '#2563eb',
        accentText: '#ffffff',
        danger: '#dc2626',
    },
    space: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
    },
    radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
    },
    font: {
        family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        sm: '14px',
        md: '16px',
        lg: '20px',
        xl: '28px',
        xxl: '40px',
    },
    shadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
    },
} as const;

export type Tokens = typeof tokens;
