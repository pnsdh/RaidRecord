/**
 * Application and API configuration
 */

// Application configuration
export const APP_CONFIG = {
    APP_NAME: 'RaidRecord',
    VERSION: '1.0.0',
    REGION: 'KR' // Fixed to Korea
};

// Storage keys
export const STORAGE_KEYS = {
    CLIENT_ID: 'raidrecord_client_id',
    CLIENT_SECRET: 'raidrecord_client_secret',
    SERVER: 'raidrecord_server',
    ACCESS_TOKEN: 'raidrecord_access_token',
    TOKEN_EXPIRY: 'raidrecord_token_expiry',
    SELECTED_RAIDS: 'raidrecord_selected_raids',
    LAST_SEARCH: 'raidrecord_last_search'
};

// FFLogs API configuration
export const API_CONFIG = {
    TOKEN_URL: 'https://www.fflogs.com/oauth/token',
    API_URL: 'https://www.fflogs.com/api/v2/client',
    GRANT_TYPE: 'client_credentials'
};

// Rate limiting and timing configuration
export const TIMING = {
    TOKEN_REFRESH_THRESHOLD: 60 * 60 * 1000, // 1 hour before expiry
    SEARCH_DELAY_MS: 0,                       // Delay between tier searches
    MS_PER_WEEK: 7 * 24 * 60 * 60 * 1000,    // Milliseconds in a week
    POINTS_PER_TIER: 20                       // Estimated API points per tier search
};

// UI configuration
export const UI_CONFIG = {
    TOOLTIP_OFFSET: 10,                       // Tooltip offset from cursor
    TOOLTIP_MIN_MARGIN: 10,                   // Minimum margin from viewport edge
    HEADER_TOOLTIP_MARGIN: 10,                // Margin for header tooltips from viewport edge
    HEADER_TOOLTIP_VERTICAL_OFFSET: 8,       // Vertical offset below header for header tooltips
    CANCEL_BUTTON_COLOR: '#e94560'            // Red color for cancel button
};

// Percentile color thresholds (FFLogs colors)
export const PERCENTILE_THRESHOLDS = {
    GOLD: 100,      // Rank 1
    PINK: 99,       // 99-100%
    ORANGE: 95,     // 95-99%
    PURPLE: 75,     // 75-95%
    BLUE: 50,       // 50-75%
    GREEN: 25       // 25-50%, below is gray
};

// Percentile colors
export const PERCENTILE_COLORS = {
    GOLD: '#e5cc80',
    PINK: '#e268a8',
    ORANGE: '#ff8000',
    PURPLE: '#a335ee',
    BLUE: '#0070ff',
    GREEN: '#1eff00',
    GRAY: '#666666'
};

// API usage display thresholds (percentage)
export const API_USAGE_THRESHOLDS = {
    LOW: 50,        // Below 50%: green
    MEDIUM: 80      // 50-80%: yellow, above: red
};
