/**
 * API usage formatting utilities
 */

import { API_USAGE_THRESHOLDS } from '../config/config.js';

/**
 * Calculate API usage data from rate limit info
 * @param {Object} rateLimitData - Rate limit data from API
 * @returns {Object|null} Formatted usage data or null if no data
 */
export function calculateApiUsage(rateLimitData) {
    if (!rateLimitData) {
        return null;
    }

    const { limitPerHour, pointsSpentThisHour, pointsResetIn } = rateLimitData;
    const usagePercent = (pointsSpentThisHour / limitPerHour) * 100;
    const resetMinutes = Math.ceil(pointsResetIn / 60);

    // Determine usage level
    let usageLevel;
    if (usagePercent < API_USAGE_THRESHOLDS.LOW) {
        usageLevel = 'low';
    } else if (usagePercent < API_USAGE_THRESHOLDS.MEDIUM) {
        usageLevel = 'medium';
    } else {
        usageLevel = 'high';
    }

    return {
        pointsSpent: pointsSpentThisHour,
        pointsLimit: limitPerHour,
        usagePercent: Math.round(usagePercent),
        resetMinutes,
        usageLevel
    };
}
