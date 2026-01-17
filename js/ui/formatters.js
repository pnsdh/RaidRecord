/**
 * Formatting utilities for UI display
 * Consolidated logic for consistent display across the application
 */

import { JOB_COLORS, JOB_NAMES_KR, JOB_ABBR_KR } from '../constants.js';
import { PERCENTILE_THRESHOLDS, PERCENTILE_COLORS } from '../config/config.js';

/**
 * Format number with thousand separators (e.g., 3600 -> 3,600)
 */
export function formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    return Math.round(num).toLocaleString('en-US');
}

/**
 * Calculate percentile from rank and total
 */
function calculatePercentile(rank, total) {
    return ((total - rank + 1) / total) * 100;
}

/**
 * Get FFLogs color based on percentile
 */
export function getPercentileColor(percentile) {
    if (percentile >= PERCENTILE_THRESHOLDS.GOLD) return PERCENTILE_COLORS.GOLD;
    if (percentile >= PERCENTILE_THRESHOLDS.PINK) return PERCENTILE_COLORS.PINK;
    if (percentile >= PERCENTILE_THRESHOLDS.ORANGE) return PERCENTILE_COLORS.ORANGE;
    if (percentile >= PERCENTILE_THRESHOLDS.PURPLE) return PERCENTILE_COLORS.PURPLE;
    if (percentile >= PERCENTILE_THRESHOLDS.BLUE) return PERCENTILE_COLORS.BLUE;
    if (percentile >= PERCENTILE_THRESHOLDS.GREEN) return PERCENTILE_COLORS.GREEN;
    return PERCENTILE_COLORS.GRAY;
}

/**
 * Get week badge CSS class based on week number
 */
function getWeekClass(week) {
    if (week === 1) return 'week-1';
    if (week >= 2 && week <= 4) return 'week-2-4';
    return 'week-5-plus';
}

/**
 * Format job text with color (full Korean name)
 */
export function formatJobText(job) {
    if (!job || job === 'Unknown') {
        return '<span style="color: var(--text-secondary);">-</span>';
    }
    const color = JOB_COLORS[job] || '#999';
    const jobName = JOB_NAMES_KR[job] || job;
    return `<span style="color: ${color};">${jobName}</span>`;
}

/**
 * Format job badge with color (abbreviated Korean name for tooltips)
 */
export function formatJobBadge(job) {
    if (!job || job === 'Unknown') {
        return '<span class="job-badge unknown">-</span>';
    }
    const color = JOB_COLORS[job] || '#999';
    const jobName = JOB_ABBR_KR[job] || job;
    return `<span class="job-badge" style="color: ${color};">${jobName}</span>`;
}

/**
 * Format week badge
 */
export function formatWeekBadge(week, isAmbiguous = false) {
    if (!week) {
        return '<span class="week-badge unknown">-</span>';
    }
    const weekClass = getWeekClass(week);
    const question = isAmbiguous ? '<span style="font-size: 0.85em; color: #331111;">+?</span>' : '';
    return `<span class="week-badge ${weekClass}">${week}주클${question}</span>`;
}

/**
 * Format all-star score with normalized value and color
 */
export function formatAllStarScore(points, rank, total, bossCount) {
    if (!points || points === 0 || !rank || !total) {
        return {
            scoreText: '<span style="color: var(--text-secondary);">-</span>',
            percentileText: '-',
            rankText: '-'
        };
    }

    // Normalize score to 120 point scale
    const normalizedScore = (points / bossCount).toFixed(2);

    // Calculate percentile and get color
    const percentile = calculatePercentile(rank, total);
    const scoreColor = getPercentileColor(percentile);

    const scoreText = `<span style="color: #d1fa99;">${normalizedScore}</span>`;
    const percentileText = `<span style="color: ${scoreColor};">${Math.floor(percentile)}%</span>`;
    const rankText = `<span style="color: ${scoreColor};">#${formatNumber(rank)}</span> <span style="color: var(--text-secondary); font-size: 0.85em;">/ ${formatNumber(total)}</span>`;

    return { scoreText, percentileText, rankText };
}

/**
 * Format raid tier badge
 */
export function formatTierBadge(tier) {
    const typeClass = tier.type === 'SAVAGE' ? 'tier-type-savage' : 'tier-type-ultimate';
    return `<span class="tier-type-badge ${typeClass}">${tier.shortName}</span>`;
}
