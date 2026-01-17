/**
 * Time and date utilities
 */

import { TIMING } from './config.js';

// Week reset configuration (Korea timezone)
export const WEEK_CONFIG = {
    // Week resets on Tuesday at 17:00 KST
    RESET_DAY: 2, // 0 = Sunday, 1 = Monday, 2 = Tuesday
    RESET_HOUR: 17,
    RESET_MINUTE: 0,
    TIMEZONE_OFFSET: 9, // KST = UTC+9
    AMBIGUOUS_END_HOUR: 19 // End of ambiguous window (17:00-19:00)
};

// Day names for display
export const DAY_NAMES = {
    SHORT: ['일', '월', '화', '수', '목', '금', '토'],
    FULL: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
};

/**
 * Calculate which week a clear happened in
 */
export function getWeekNumber(releaseDate, clearTimestamp) {
    // Parse release date and create reset time
    const release = new Date(releaseDate);
    release.setHours(WEEK_CONFIG.RESET_HOUR, WEEK_CONFIG.RESET_MINUTE, 0, 0);

    // Convert clear timestamp (in milliseconds) to Date
    const clear = new Date(clearTimestamp);

    // Calculate difference in milliseconds
    const diffMs = clear - release;

    // If cleared before release, return 0 (shouldn't happen in normal cases)
    if (diffMs < 0) return 0;

    // Calculate weeks using centralized constant
    const weekNumber = Math.floor(diffMs / TIMING.MS_PER_WEEK) + 1;

    return weekNumber;
}

/**
 * Check if fight start time is in ambiguous window (Tue 17:00-19:00)
 * Returns true if we can't definitively determine which week the clear belongs to
 */
export function isAmbiguousWeek(fightStartTimestamp) {
    if (!fightStartTimestamp) return false;

    const startDate = new Date(fightStartTimestamp);
    const dayOfWeek = startDate.getDay();
    const hours = startDate.getHours();

    // Tuesday (2) between 17:00-19:00
    return dayOfWeek === WEEK_CONFIG.RESET_DAY && hours >= WEEK_CONFIG.RESET_HOUR && hours < WEEK_CONFIG.AMBIGUOUS_END_HOUR;
}

/**
 * Format date for display
 */
export function formatDate(timestamp) {
    const date = new Date(timestamp);
    const dayName = DAY_NAMES.SHORT[date.getDay()];

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day} (${dayName})`;
}
