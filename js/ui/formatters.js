/**
 * Formatting utilities for UI display
 * Consolidated logic for consistent display across the application
 */

import { JOB_COLORS, JOB_NAMES_KR, JOB_ABBR_KR } from '../constants.js';

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
function getPercentileColor(percentile) {
    if (percentile >= 100) return '#e5cc80';      // Gold - rank 1
    if (percentile >= 99) return '#e268a8';       // Pink - 99-100%
    if (percentile >= 95) return '#ff8000';       // Orange - 95-99%
    if (percentile >= 75) return '#a335ee';       // Purple - 75-95%
    if (percentile >= 50) return '#0070ff';       // Blue - 50-75%
    if (percentile >= 25) return '#1eff00';       // Green - 25-50%
    return '#666666';                             // Gray - < 25%
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
export function formatWeekBadge(week) {
    if (!week) {
        return '<span class="week-badge unknown">-</span>';
    }
    const weekClass = getWeekClass(week);
    return `<span class="week-badge ${weekClass}">${week}주클</span>`;
}

/**
 * Format all-star score with normalized value and color
 */
export function formatAllStarScore(points, rank, total, bossCount) {
    if (!points || points === 0 || !rank || !total) {
        return {
            scoreText: '<span style="color: var(--text-secondary);">-</span>',
            rankText: '-'
        };
    }

    // Normalize score to 120 point scale
    const normalizedScore = (points / bossCount).toFixed(2);

    // Calculate percentile and get color
    const percentile = calculatePercentile(rank, total);
    const scoreColor = getPercentileColor(percentile);

    const scoreText = `<span style="color: ${scoreColor};">${normalizedScore}</span>`;
    const rankText = `#${formatNumber(rank)} / ${formatNumber(total)}`;

    return { scoreText, rankText };
}

/**
 * Format raid tier badge
 */
export function formatTierBadge(tier) {
    const typeClass = tier.type === 'SAVAGE' ? 'tier-type-savage' : 'tier-type-ultimate';
    return `<span class="tier-type-badge ${typeClass}">${tier.shortName}</span>`;
}
