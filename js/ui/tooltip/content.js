/**
 * Tooltip content generation (pure functions)
 * All functions here are side-effect free and only generate HTML strings
 */

import { getServerNameKR, getJobOrder, JOB_COLORS, JOB_NAMES_KR } from '../../constants.js';
import { formatJobBadge, getPercentileColor, formatNumber } from '../formatters.js';
import { DAY_NAMES } from '../../config/time.js';

// Common table styles (internal use only)
const TABLE_STYLES = {
    table: 'width: 100%; border-collapse: collapse;',
    headerCell: 'padding: 4px 8px 4px 0; text-align: center; border-bottom: 1px solid var(--border-color);',
    headerCellMiddle: 'padding: 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);',
    headerCellLast: 'padding: 4px 0 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);',
    dataCell: 'padding: 4px 8px 4px 0; text-align: center;',
    dataCellMiddle: 'padding: 4px 8px; text-align: center;',
    dataCellLast: 'padding: 4px 0 4px 8px; text-align: center;',
    // Info table styles (for raid info, date tooltips, etc.)
    infoTableLabelCell: 'padding: 4px 8px 4px 0; color: var(--text-secondary); width: 80px;',
    infoTableValueCell: 'padding: 4px 0; font-weight: 500;'
};

/**
 * Format job information for display
 */
function formatJobInfo(job) {
    const jobColor = JOB_COLORS[job] || '#999';
    const jobName = JOB_NAMES_KR[job] || job;
    return { jobColor, jobName };
}

/**
 * Create party members HTML for tooltip
 */
export function createPartyMembersHTML(partyMembers) {
    if (!partyMembers || partyMembers.length === 0) {
        return '<p style="color: var(--text-secondary);">파티 정보 없음</p>';
    }

    // Sort party members by job order
    const sortedMembers = [...partyMembers].sort((a, b) => {
        return getJobOrder(a.job) - getJobOrder(b.job);
    });

    let html = '<p style="font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">파티 멤버</p>';

    for (const member of sortedMembers) {
        const jobBadge = formatJobBadge(member.job);
        const serverKR = getServerNameKR(member.server);
        const memberName = `${member.name}@${serverKR}`;
        html += `
            <div class="party-member">
                ${jobBadge}
                <span class="member-name">${memberName}</span>
            </div>
        `;
    }

    return html;
}

/**
 * Create raid info tooltip HTML
 */
export function createRaidInfoHTML(tier) {
    if (!tier) {
        return '<p style="color: var(--text-secondary);">레이드 정보 없음</p>';
    }

    const typeText = tier.type === 'SAVAGE' ? '영식' : '절';
    const rows = [
        { label: '이름', value: tier.fullName },
        { label: '종류', value: typeText },
        { label: '확장팩', value: tier.expansion },
        { label: '버전', value: tier.version },
        { label: '개방 일자', value: tier.releaseDate }
    ];

    let html = `<table style="${TABLE_STYLES.table}"><tbody>`;
    for (const row of rows) {
        html += `<tr><td style="${TABLE_STYLES.infoTableLabelCell}">${row.label}</td><td style="${TABLE_STYLES.infoTableValueCell}">${row.value}</td></tr>`;
    }
    html += '</tbody></table>';

    return html;
}

/**
 * Format date and time string from date (single line)
 */
function formatDateTimeString(date) {
    const dayName = DAY_NAMES.FULL[date.getDay()];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${dayName} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Create week tooltip HTML
 */
export function createWeekTooltipHTML(isWeekAmbiguous, week) {
    if (!isWeekAmbiguous || week <= 0) {
        return '';
    }

    const nextWeek = week + 1;

    return `<p style="color: #ff8000; font-size: 0.9em; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); max-width: 320px;">⚠️ ${week}주차인지, ${nextWeek}주차인지 정확하게 알 수 없는 로그입니다. 화요일 17시~19시 사이의 클리어는 17시 이전 진입하여 전 주차로 클리어 한 것으로 반영합니다. 이 경우 올바르지 않은 결과일 수 있으니 유의해주세요.</p>`;
}

/**
 * Check if fight start time is valid and different from clear time
 */
function isValidAndDifferentFightStart(fightStartTime, clearTimestamp) {
    if (!fightStartTime || fightStartTime === '') return false;

    const fightStartNum = Number(fightStartTime);
    if (isNaN(fightStartNum) || fightStartNum <= 0) return false;

    return fightStartNum !== clearTimestamp;
}

/**
 * Create date tooltip HTML
 */
export function createDateTooltipHTML(timestamp, rowData) {
    if (!timestamp || timestamp === '') {
        return null;
    }

    const timestampNum = Number(timestamp);
    if (isNaN(timestampNum)) {
        return null;
    }

    const clearDate = new Date(timestampNum);
    const fightStartTime = rowData?.fightStartTime;

    let html = `<table style="${TABLE_STYLES.table}"><tbody>`;

    // Show both fight start and clear times if fight start time is available and different
    if (isValidAndDifferentFightStart(fightStartTime, timestampNum)) {
        const startDate = new Date(Number(fightStartTime));

        html += `<tr><td style="${TABLE_STYLES.infoTableLabelCell}">전투 시작</td><td style="${TABLE_STYLES.infoTableValueCell}">${formatDateTimeString(startDate)}</td></tr>`;
        html += `<tr><td style="${TABLE_STYLES.infoTableLabelCell}">클리어</td><td style="${TABLE_STYLES.infoTableValueCell}">${formatDateTimeString(clearDate)}</td></tr>`;
    } else {
        // Only show clear time if start time not available or same as clear time
        html += `<tr><td style="${TABLE_STYLES.infoTableLabelCell}">클리어</td><td style="${TABLE_STYLES.infoTableValueCell}">${formatDateTimeString(clearDate)}</td></tr>`;
    }

    html += '</tbody></table>';
    return html;
}

/**
 * Create job frequency HTML for tooltip
 */
export function createJobFrequencyHTML(jobFrequency) {
    if (!jobFrequency || jobFrequency.length === 0) {
        return null;
    }

    let html = '<p style="font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">클리어 직업</p>';

    for (const item of jobFrequency) {
        const { jobColor, jobName } = formatJobInfo(item.job);
        html += `
            <div class="job-frequency-item" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="color: ${jobColor}; font-weight: 500;">${jobName}</span>
                <span style="color: var(--text-secondary); font-size: 0.9em;">(${item.count}회)</span>
            </div>
        `;
    }

    return html;
}

/**
 * Get encounter floor name by floor number (0-based index)
 */
function getFloorName(floorIndex, totalCount) {
    if (totalCount === 1) {
        return '-'; // Ultimate raids
    }

    if (totalCount === 5) {
        const floorNames = ['1층', '2층', '3층', '4전', '4후'];
        return floorNames[floorIndex] || `${floorIndex + 1}층`;
    }

    return `${floorIndex + 1}층`; // 4 encounters
}

/**
 * Build complete floor data array with all encounters
 * Maps encounter data to correct floor positions, fills missing with null
 */
function buildCompleteFloorData(encounterAllStars, tier) {
    const encounterCount = tier.encounterCount;
    const finalEncounterId = tier.finalEncounterId;
    const firstEncounterId = finalEncounterId - encounterCount + 1;

    // Create a map of encounter ID to encounter data
    const encounterMap = new Map();
    encounterAllStars.forEach(encounter => {
        encounterMap.set(encounter.encounterId, encounter);
    });

    // Build complete array with all floors
    const completeData = [];
    for (let i = 0; i < encounterCount; i++) {
        const encounterId = firstEncounterId + i;
        const encounterData = encounterMap.get(encounterId);

        completeData.push({
            floorIndex: i,
            floorName: getFloorName(i, encounterCount),
            data: encounterData || null
        });
    }

    return completeData;
}

/**
 * Create encounter table header HTML
 */
function createEncounterTableHeader(metricLabel) {
    return `
        <table style="${TABLE_STYLES.table}">
            <thead>
                <tr>
                    <th style="${TABLE_STYLES.headerCell}">층</th>
                    <th style="${TABLE_STYLES.headerCellMiddle}">${metricLabel}</th>
                    <th style="${TABLE_STYLES.headerCellLast}">직업</th>
                </tr>
            </thead>
            <tbody>
    `;
}

/**
 * Create empty data row HTML
 */
function createEmptyDataRow(floorName) {
    return `
        <tr>
            <td style="${TABLE_STYLES.dataCell}">${floorName}</td>
            <td style="${TABLE_STYLES.dataCellMiddle} color: var(--text-secondary);">-</td>
            <td style="${TABLE_STYLES.dataCellLast} color: var(--text-secondary);">-</td>
        </tr>
    `;
}

/**
 * Calculate percentile from rank and total
 */
function calculatePercentile(rank, total) {
    if (!rank || !total) return 0;
    return ((total - rank + 1) / total) * 100;
}

/**
 * Create encounter table HTML with custom row renderer
 * @param {Array} encounterAllStars - Encounter data
 * @param {Object} tier - Tier info
 * @param {string} metricLabel - Column header label
 * @param {Function} renderMetricCell - Function to render the metric cell content
 */
function createEncounterTableHTML(encounterAllStars, tier, metricLabel, renderMetricCell) {
    if (!tier) {
        return null;
    }

    const completeFloorData = buildCompleteFloorData(encounterAllStars || [], tier);
    const hasAnyData = completeFloorData.some(floor => floor.data !== null);
    if (!hasAnyData) {
        return null;
    }

    let html = createEncounterTableHeader(metricLabel);

    completeFloorData.forEach(floor => {
        if (!floor.data) {
            html += createEmptyDataRow(floor.floorName);
        } else {
            const { jobColor, jobName } = formatJobInfo(floor.data.job || 'Unknown');
            const metricContent = renderMetricCell(floor.data);

            html += `
                <tr>
                    <td style="${TABLE_STYLES.dataCell}">${floor.floorName}</td>
                    <td style="${TABLE_STYLES.dataCellMiddle}">${metricContent}</td>
                    <td style="${TABLE_STYLES.dataCellLast} color: ${jobColor}; font-weight: 500;">${jobName}</td>
                </tr>
            `;
        }
    });

    html += '</tbody></table>';
    return html;
}

/**
 * Create encounter all-star scores tooltip HTML (올스타 셀용)
 */
export function createEncounterScoresHTML(encounterAllStars, tier) {
    return createEncounterTableHTML(encounterAllStars, tier, '점수', (data) => {
        const points = data.points ? data.points.toFixed(2) : '0.00';
        return `<span style="color: #d1fa99;">${points}</span>`;
    });
}

/**
 * Create encounter percentiles tooltip HTML (백분위 셀용)
 */
export function createEncounterPercentilesHTML(encounterAllStars, tier) {
    return createEncounterTableHTML(encounterAllStars, tier, '백분위', (data) => {
        const percentile = calculatePercentile(data.rank, data.total).toFixed(2);
        const color = getPercentileColor(parseFloat(percentile));
        return `<span style="color: ${color};">${percentile}%</span>`;
    });
}

/**
 * Create encounter ranks tooltip HTML (순위 셀용)
 */
export function createEncounterRanksHTML(encounterAllStars, tier) {
    return createEncounterTableHTML(encounterAllStars, tier, '순위', (data) => {
        const percentile = calculatePercentile(data.rank, data.total);
        const color = getPercentileColor(percentile);
        const rank = data.rank ? formatNumber(data.rank) : '-';
        const total = data.total ? formatNumber(data.total) : '-';
        return `<span style="color: ${color};">#${rank}</span><span style="color: var(--text-secondary);"> / ${total}</span>`;
    });
}
