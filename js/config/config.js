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

// Raid tier difficulty constants
export const DIFFICULTY = {
    ULTIMATE: 100,  // 절 (Ultimate)
    SAVAGE: 101     // 영식 (Savage)
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
