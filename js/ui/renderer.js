/**
 * UI Renderer - Main UIController class
 */

import { getServerNameKR } from '../constants.js';
import { attachTooltipListeners } from './tooltips.js';
import { formatJobText, formatWeekBadge, formatAllStarScore, formatTierBadge } from './formatters.js';

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
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
        this.apiUsageSection = document.getElementById('apiUsageSection');
        this.apiUsageValue = document.getElementById('apiUsageValue');
        this.apiUsageReset = document.getElementById('apiUsageReset');
    }

    /**
     * Show loading state
     */
    showLoading(message = '캐릭터 데이터를 불러오는 중...') {
        this.hideAll();
        this.loadingText.textContent = message;
        this.progressContainer.style.display = 'none';
        this.loadingSection.style.display = 'block';
    }

    /**
     * Update search progress
     */
    updateProgress(progress) {
        const { current, total, tierName, expansion } = progress;
        const percentage = (current / total) * 100;

        // Show progress container
        this.progressContainer.style.display = 'block';

        // Update progress bar
        this.progressFill.style.width = `${percentage}%`;

        // Update progress text
        this.progressText.textContent = `${expansion} - ${tierName} 검색 중... (${current}/${total})`;
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
    }

    /**
     * Render raid history results
     */
    renderResults(character, raidHistory) {
        this.hideAll();

        // Set character name with Korean server
        const serverKR = getServerNameKR(character.server.name);
        this.characterName.textContent = `${character.name}@${serverKR}`;

        // Generate table HTML
        const tableHTML = this.generateTableHTML(raidHistory);
        this.resultsTable.innerHTML = tableHTML;

        // Show results section
        this.resultsSection.style.display = 'block';

        // Attach event listeners for tooltips
        attachTooltipListeners();
    }

    /**
     * Generate HTML for the results table
     */
    generateTableHTML(raidHistory) {
        if (raidHistory.length === 0) {
            return '<p class="no-results">클리어 기록이 없습니다.</p>';
        }

        let html = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>레이드</th>
                        <th>주</th>
                        <th class="date-col">날짜</th>
                        <th class="tooltip-header">직업<span class="header-tooltip">최초로 최종층을 클리어한 직업을 표시합니다. 올스타 직업과 다를 수 있습니다.</span></th>
                        <th class="tooltip-header">점수<span class="header-tooltip">모든 층의 올스타 점수를 합산하여 120점 만점으로 표준화한 점수입니다.</span></th>
                        <th class="rank-col">순위</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const entry of raidHistory) {
            html += this.generateRowHTML(entry);
        }

        html += `
                </tbody>
            </table>
        `;

        return html;
    }

    /**
     * Generate HTML for a single table row
     */
    generateRowHTML(entry) {
        const { tier, clearData } = entry;

        // Create raid name badge with tier name inside
        const raidNameBadge = formatTierBadge(tier);

        // Get boss count for this tier
        const bossCount = tier.encounterCount;

        // Job display (full name with color)
        const jobText = formatJobText(clearData.job);

        // Week badge
        const weekBadge = formatWeekBadge(clearData.clearWeek);

        // Date text
        const dateText = (clearData.clearDate && clearData.clearDate !== 'Unknown') ? clearData.clearDate : '-';

        // Calculate normalized all-star score and separate rank
        const { scoreText, rankText } = formatAllStarScore(
            clearData.allStarPoints,
            clearData.allStarRank,
            clearData.allStarTotal,
            bossCount
        );

        return `
            <tr class="raid-row" data-report="${clearData.reportCode || ''}" data-fight="${clearData.fightId || ''}" data-party='${JSON.stringify(clearData.partyMembers || []).replace(/'/g, "&apos;")}'>
                <td>${raidNameBadge}</td>
                <td>${weekBadge}</td>
                <td class="date-col">${dateText}</td>
                <td>${jobText}</td>
                <td>${scoreText}</td>
                <td class="rank-col">${rankText}</td>
            </tr>
        `;
    }

    /**
     * Update API usage display
     */
    updateApiUsage(rateLimitData) {
        if (!rateLimitData) {
            this.apiUsageSection.style.display = 'none';
            return;
        }

        const { limitPerHour, pointsSpentThisHour, pointsResetIn } = rateLimitData;
        const usagePercent = (pointsSpentThisHour / limitPerHour) * 100;

        // Update value
        this.apiUsageValue.textContent = `${pointsSpentThisHour} / ${limitPerHour} (${usagePercent.toFixed(1)}%)`;

        // Update color based on usage
        this.apiUsageValue.className = 'usage-value';
        if (usagePercent < 50) {
            this.apiUsageValue.classList.add('usage-low');
        } else if (usagePercent < 80) {
            this.apiUsageValue.classList.add('usage-medium');
        } else {
            this.apiUsageValue.classList.add('usage-high');
        }

        // Update reset time
        const resetMinutes = Math.ceil(pointsResetIn / 60);
        this.apiUsageReset.textContent = `(${resetMinutes}분 후 리셋)`;

        // Show section
        this.apiUsageSection.style.display = 'block';
    }
}
