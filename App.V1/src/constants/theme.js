// ============================================
// DESIGN SYSTEM - Smart Parking App
// Premium, Minimal, Coffee Brown Theme
// ============================================

export const COLORS = {
    // Primary
    primary: '#FFFFFF',
    accent: '#6F4E37',        // Coffee Brown
    lightBrown: '#A67B5B',

    // Text
    text: '#2D2016',
    textSecondary: '#8B7E74',

    // Backgrounds
    background: '#F8F6F3',
    cardBg: '#FFFFFF',

    // Borders & Dividers
    border: '#E8E4E0',
    divider: '#F0EDE9',

    // Status
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const TYPOGRAPHY = {
    // Headings
    h1: {
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 30,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 26,
    },
    h4: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
    },

    // Body
    title: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
    },
    body: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
    },
    small: {
        fontSize: 11,
        fontWeight: '400',
        lineHeight: 14,
    },
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
};

export const ANIMATION = {
    duration: {
        fast: 150,
        normal: 250,
        slow: 350,
    },
    easing: {
        default: 'ease-in-out',
        spring: 'spring',
    },
};
