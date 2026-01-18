/**
 * UI Renderer - Main UIController class
 */

import { getServerNameKR, JOB_COLORS } from '../constants.js';
import { attachTooltipListeners } from './tooltips.js';
import { formatJobText, formatWeekBadge, formatAllStarScore, formatTierBadge, formatNumber } from './formatters.js';
import { calculateApiUsage } from '../utils/apiUsage.js';
import { MESSAGES } from '../config/messages.js';

/**
 * UI Controller for rendering raid history
 */
export class UIController {
    constructor() {
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsTable = document.getElementById('resultsTable');
        this.characterName = document.getElementById('characterName');
        this.loadingSection = document.getElementById('loadingSection');
        this.loadingText = document.getElementById('loadingText');
        this.progressText = document.getElementById('progressText');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.serverSelectSection = document.getElementById('serverSelectSection');
        this.serverSelectMessage = document.getElementById('serverSelectMessage');
        this.serverButtons = document.getElementById('serverButtons');
        this.apiUsageSection = document.getElementById('apiUsageSection');
        this.apiUsageValue = document.getElementById('apiUsageValue');
        this.apiUsageReset = document.getElementById('apiUsageReset');

        // Cache control elements for enable/disable operations
        this.controls = {
            searchInput: document.getElementById('characterSearch'),
            raidSelectBtn: document.getElementById('raidSelectBtn'),
            settingsBtn: document.getElementById('settingsBtn')
        };
    }

    /**
     * Set enabled state for all input controls
     */
    setControlsEnabled(enabled) {
        Object.values(this.controls).forEach(el => {
            if (el) el.disabled = !enabled;
        });
    }

    /**
     * Disable all input controls during search
     */
    disableControls() {
        this.setControlsEnabled(false);
    }

    /**
     * Enable all input controls after search
     */
    enableControls() {
        this.setControlsEnabled(true);
    }

    /**
     * Show loading state
     */
    showLoading(message = MESSAGES.SEARCH.LOADING_DEFAULT) {
        this.hideAll();
        this.loadingText.textContent = message;
        this.progressText.style.display = 'none';
        this.loadingSection.style.display = 'block';
    }

    /**
     * Update search progress
     */
    updateProgress(progress) {
        const { current, total, message } = progress;

        // Show and update progress text
        this.progressText.style.display = 'block';
        this.progressText.textContent = `${message} (${current}/${total})`;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.hideAll();
        this.errorMessage.textContent = message;
        this.errorSection.style.display = 'block';
    }

    /**
     * Hide all sections
     */
    hideAll() {
        this.loadingSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        this.serverSelectSection.style.display = 'none';
    }

    /**
     * Render raid history results
     */
    renderResults(character, raidHistory) {
        this.hideAll();

        // Find the most frequently used job (most recent if tied)
        const mostUsedJob = this.findMostUsedJob(raidHistory);
        const jobColor = this.getJobColor(mostUsedJob);

        // Set character name with Korean server and link to FFLogs
        const serverKR = getServerNameKR(character.server.name);
        const characterName = `${character.name}@${serverKR}`;
        const fFlogsUrl = `https://ko.fflogs.com/character/id/${character.id}`;

        // Apply gradient with job color and make it clickable
        this.characterName.innerHTML = `<a href="${fFlogsUrl}" target="_blank" style="text-decoration: none; background: linear-gradient(135deg, ${jobColor}, #ffffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${characterName}</a>`;

        // Store job color for image export
        this.characterName.setAttribute('data-job-color', jobColor);
        this.characterName.setAttribute('data-character-name', characterName);

        // Generate table HTML
        const tableHTML = this.generateTableHTML(raidHistory);
        this.resultsTable.innerHTML = tableHTML;

        // Show results section
        this.resultsSection.style.display = 'block';

        // Attach event listeners for tooltips
        attachTooltipListeners();
    }

    /**
     * Find the most frequently used job in raid history
     * If tied, return the most recent one
     */
    findMostUsedJob(raidHistory) {
        if (!raidHistory || raidHistory.length === 0) return null;

        const jobCounts = {};
        const jobFirstIndex = {};

        // Count job frequency and track first occurrence (raidHistory is sorted newest first)
        raidHistory.forEach((entry, index) => {
            const job = entry.clearData?.job;
            if (job && job !== 'Unknown') {
                jobCounts[job] = (jobCounts[job] || 0) + 1;
                // Only store the first occurrence (smallest index = most recent)
                if (!(job in jobFirstIndex)) {
                    jobFirstIndex[job] = index;
                }
            }
        });

        if (Object.keys(jobCounts).length === 0) return null;

        // Find maximum count
        const maxCount = Math.max(...Object.values(jobCounts));

        // Get all jobs with max count
        const topJobs = Object.keys(jobCounts).filter(job => jobCounts[job] === maxCount);

        // If tied, return the most recent one (smallest index)
        if (topJobs.length > 1) {
            return topJobs.reduce((mostRecent, job) =>
                jobFirstIndex[job] < jobFirstIndex[mostRecent] ? job : mostRecent
            );
        }

        return topJobs[0];
    }

    /**
     * Get job color from constants
     */
    getJobColor(job) {
        if (!job) return '#e94560'; // Default color
        return JOB_COLORS[job] || '#e94560';
    }

    /**
     * Generate HTML for the results table
     */
    generateTableHTML(raidHistory) {
        if (raidHistory.length === 0) {
            return `<p class="no-results">${MESSAGES.SEARCH.NO_CLEAR_RECORDS}</p>`;
        }

        let html = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th class="tooltip-header">레이드<span class="header-tooltip">모든 레이드는 흔히 '현역'이라고 부르는 첫번째 파티션만 집계합니다.<br>예를 들어, 영웅 난이도의 경우 짝수 패치 데이터만 취합하며, 홀수는 취합하지 않습니다.</span></th>
                        <th class="tooltip-header">주차<span class="header-tooltip">화요일 17시를 기점으로 클리어 주차를 구분합니다.<br>화요일 17시~19시 사이의 클리어는 17시 이전 진입하여 전 주차로 클리어 한 것으로 반영합니다. 이 경우 올바르지 않은 결과일 수 있으니 유의해주세요.</span></th>
                        <th class="date-col">날짜</th>
                        <th class="tooltip-header">직업<span class="header-tooltip">최초로 최종층을 클리어한 직업을 표시합니다.<br>올스타 직업과 다를 수 있습니다.<br>다른 직업으로도 클리어한 경우, +N으로 직업의 가짓수가 표현됩니다.<br>커서를 올려 더 자세한 정보를 확인할 수 있습니다.</span></th>
                        <th class="tooltip-header">올스타<span class="header-tooltip">모든 층의 올스타 점수를 합산하여 120점 만점으로 표준화한 점수입니다.</span></th>
                        <th class="tooltip-header">백분위<span class="header-tooltip">올스타 기준의 백분위입니다.<br>소숫점은 버림하고 표기하였습니다.</span></th>
                        <th class="tooltip-header rank-col">순위<span class="header-tooltip">올스타 기준의 순위입니다.</span></th>
                    </tr>
                </thead>
                <tbody>
        `;

        let previousExpansion = null;
        for (const entry of raidHistory) {
            const isNewExpansion = previousExpansion !== null && entry.tier.expansion !== previousExpansion;
            html += this.generateRowHTML(entry, isNewExpansion);
            previousExpansion = entry.tier.expansion;
        }

        html += `
                </tbody>
            </table>
        `;

        return html;
    }

    /**
     * Generate HTML for a single table row
     * @param {Object} entry - Raid history entry
     * @param {boolean} isNewExpansion - Whether this row starts a new expansion
     */
    generateRowHTML(entry, isNewExpansion = false) {
        const { tier, clearData } = entry;

        // Create raid name badge with tier name inside
        const raidNameBadge = formatTierBadge(tier);

        // Get boss count for this tier
        const bossCount = tier.encounterCount;

        // Job display (full name with color)
        let jobText = formatJobText(clearData.job);

        // Add additional job count indicator if multiple jobs were used
        const jobFrequency = clearData.jobFrequency || [];
        if (jobFrequency.length > 1) {
            const additionalJobCount = jobFrequency.length - 1;
            jobText += ` <span style="color: var(--text-secondary); font-size: 0.85em;">+${additionalJobCount}</span>`;
        }

        // Week badge
        const weekBadge = formatWeekBadge(clearData.clearWeek, clearData.isWeekAmbiguous);

        // Date text
        const dateText = (clearData.clearDate && clearData.clearDate !== 'Unknown') ? clearData.clearDate : '-';

        // Calculate normalized all-star score and separate rank
        const { scoreText, percentileText, rankText } = formatAllStarScore(
            clearData.allStarPoints,
            clearData.allStarRank,
            clearData.allStarTotal,
            bossCount
        );

        const rowClass = isNewExpansion ? 'raid-row expansion-first' : 'raid-row';

        return `
            <tr class="${rowClass}" data-report="${clearData.reportCode || ''}" data-fight="${clearData.fightId || ''}" data-timestamp="${clearData.clearTimestamp || ''}" data-fight-start="${clearData.fightStartTime || ''}" data-week-ambiguous="${clearData.isWeekAmbiguous || false}" data-week="${clearData.clearWeek || 0}" data-tier='${JSON.stringify(tier).replace(/'/g, "&apos;")}' data-encounters='${JSON.stringify(clearData.encounterAllStars || []).replace(/'/g, "&apos;")}' data-party='${JSON.stringify(clearData.partyMembers || []).replace(/'/g, "&apos;")}' data-jobs='${JSON.stringify(clearData.jobFrequency || []).replace(/'/g, "&apos;")}'>
                <td>${raidNameBadge}</td>
                <td>${weekBadge}</td>
                <td class="date-col">${dateText}</td>
                <td>${jobText}</td>
                <td>${scoreText}</td>
                <td>${percentileText}</td>
                <td class="rank-col">${rankText}</td>
            </tr>
        `;
    }

    /**
     * Update API usage display
     */
    updateApiUsage(rateLimitData) {
        const usage = calculateApiUsage(rateLimitData);

        if (!usage) {
            this.apiUsageSection.style.display = 'none';
            return;
        }

        // Update value with formatted numbers
        this.apiUsageValue.textContent = `${formatNumber(usage.pointsSpent)} / ${formatNumber(usage.pointsLimit)} (${usage.usagePercent}%)`;

        // Update color based on usage level
        this.apiUsageValue.className = `usage-value usage-${usage.usageLevel}`;

        // Update reset time
        this.apiUsageReset.textContent = MESSAGES.API.RESET_TIME(usage.resetMinutes);

        // Show section
        this.apiUsageSection.style.display = 'block';
    }

    /**
     * Show server selection UI
     * @param {string} characterName - Character name to search
     * @param {string[]} servers - Array of server names (English) to show as options
     * @param {Function} onServerSelect - Callback function when server is selected
     * @param {string} message - Optional custom message to display
     * @param {string} disabledServer - Optional server to show as disabled
     * @param {Object} serverExistsMap - Optional map of server -> exists (boolean/id)
     */
    showServerSelection(characterName, servers, onServerSelect, message = null, disabledServer = null, serverExistsMap = null) {
        // Hide other sections
        this.loadingSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        this.resultsSection.style.display = 'none';

        // Set message
        if (message) {
            this.serverSelectMessage.innerHTML = message;
        } else {
            this.serverSelectMessage.innerHTML = MESSAGES.SEARCH.SELECT_SERVER(characterName);
        }

        // Clear previous buttons
        this.serverButtons.innerHTML = '';

        // Create server buttons
        servers.forEach(serverEN => {
            const serverKR = getServerNameKR(serverEN);
            const button = document.createElement('button');
            button.className = 'server-choice-btn';
            button.setAttribute('data-server', serverEN);
            button.textContent = serverKR;

            // Check if character exists on this server
            const exists = serverExistsMap && serverExistsMap[serverEN];

            // Disable if: explicitly disabled server OR character doesn't exist (when map provided)
            const isExplicitlyDisabled = disabledServer && serverEN.toLowerCase() === disabledServer.toLowerCase();
            const isNotExists = serverExistsMap && !exists;

            if (isExplicitlyDisabled || isNotExists) {
                button.disabled = true;
            } else {
                button.addEventListener('click', () => {
                    onServerSelect(serverEN);
                });
            }

            this.serverButtons.appendChild(button);
        });

        // Show section
        this.serverSelectSection.style.display = 'block';

        // Enable controls
        this.enableControls();
    }

    /**
     * Hide server selection UI
     */
    hideServerSelection() {
        this.serverSelectSection.style.display = 'none';
    }
}
