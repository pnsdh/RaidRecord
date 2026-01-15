/**
 * Tooltip content generation (pure functions)
 * All functions here are side-effect free and only generate HTML strings
 */

import { getServerNameKR, getJobOrder, JOB_COLORS, JOB_NAMES_KR } from '../../constants.js';
import { formatJobBadge, getPercentileColor, formatNumber } from '../formatters.js';

// Common table styles
export const TABLE_STYLES = {
    table: 'width: 100%; border-collapse: collapse;',
    headerCell: 'padding: 4px 8px 4px 0; text-align: center; border-bottom: 1px solid var(--border-color);',
    headerCellMiddle: 'padding: 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);',
    headerCellLast: 'padding: 4px 0 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);',
    dataCell: 'padding: 4px 8px 4px 0; text-align: center;',
    dataCellMiddle: 'padding: 4px 8px; text-align: center;',
    dataCellLast: 'padding: 4px 0 4px 8px; text-align: center;'
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
        { label: '패치 날짜', value: tier.releaseDate }
    ];

    let html = '<table style="width: 100%; border-collapse: collapse;"><tbody>';
    for (const row of rows) {
        html += `<tr><td style="padding: 4px 8px 4px 0; color: var(--text-secondary); width: 80px;">${row.label}</td><td style="padding: 4px 0; font-weight: 500;">${row.value}</td></tr>`;
    }
    html += '</tbody></table>';

    return html;
}

/**
 * Create date tooltip HTML
 */
export function createDateTooltipHTML(timestamp) {
    if (!timestamp || timestamp === '') {
        return '<p style="color: var(--text-secondary);">날짜 정보 없음</p>';
    }

    const timestampNum = Number(timestamp);
    if (isNaN(timestampNum)) {
        return '<p style="color: var(--text-secondary);">날짜 정보 오류</p>';
    }

    const date = new Date(timestampNum);
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    const dateStr = `${year}-${month}-${day} ${dayName}`;
    const timeStr = `${hours}:${minutes}:${seconds}.${milliseconds}`;

    let html = `<p style="font-weight: 600; margin-bottom: 8px;">${dateStr}<br>${timeStr}</p>`;

    // Check if it's between Tuesday 17:00-19:00 (warning period)
    if (dayOfWeek === 2 && hours >= 17 && hours < 19) {
        html += `<p style="color: #ff8000; font-size: 0.9em; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">⚠️ 화요일 17시~19시 사이 클리어<br>주차가 이전 주차일 가능성이 있습니다.</p>`;
    }

    return html;
}

/**
 * Create job frequency HTML for tooltip
 */
export function createJobFrequencyHTML(jobFrequency) {
    if (!jobFrequency || jobFrequency.length === 0) {
        return '<p style="color: var(--text-secondary);">직업 정보 없음</p>';
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
 * Create encounter all-star scores tooltip HTML (올스타 셀용)
 */
export function createEncounterScoresHTML(encounterAllStars, tier) {
    if (!tier) {
        return '<p style="color: var(--text-secondary);">층별 정보 없음</p>';
    }

    const completeFloorData = buildCompleteFloorData(encounterAllStars || [], tier);
    let html = createEncounterTableHeader('점수');

    completeFloorData.forEach(floor => {
        if (!floor.data) {
            html += createEmptyDataRow(floor.floorName);
        } else {
            const points = floor.data.points ? floor.data.points.toFixed(2) : '0.00';
            const { jobColor, jobName } = formatJobInfo(floor.data.job || 'Unknown');

            html += `
                <tr>
                    <td style="${TABLE_STYLES.dataCell}">${floor.floorName}</td>
                    <td style="${TABLE_STYLES.dataCellMiddle} color: #d1fa99;">${points}</td>
                    <td style="${TABLE_STYLES.dataCellLast} color: ${jobColor}; font-weight: 500;">${jobName}</td>
                </tr>
            `;
        }
    });

    html += '</tbody></table>';
    return html;
}

/**
 * Create encounter percentiles tooltip HTML (백분위 셀용)
 */
export function createEncounterPercentilesHTML(encounterAllStars, tier) {
    if (!tier) {
        return '<p style="color: var(--text-secondary);">층별 정보 없음</p>';
    }

    const completeFloorData = buildCompleteFloorData(encounterAllStars || [], tier);
    let html = createEncounterTableHeader('백분위');

    completeFloorData.forEach(floor => {
        if (!floor.data) {
            html += createEmptyDataRow(floor.floorName);
        } else {
            const encounter = floor.data;
            const percentile = (encounter.rank && encounter.total)
                ? (((encounter.total - encounter.rank + 1) / encounter.total) * 100).toFixed(2)
                : '0.00';
            const percentileColor = getPercentileColor(parseFloat(percentile));
            const { jobColor, jobName } = formatJobInfo(encounter.job || 'Unknown');

            html += `
                <tr>
                    <td style="${TABLE_STYLES.dataCell}">${floor.floorName}</td>
                    <td style="${TABLE_STYLES.dataCellMiddle} color: ${percentileColor};">${percentile}%</td>
                    <td style="${TABLE_STYLES.dataCellLast} color: ${jobColor}; font-weight: 500;">${jobName}</td>
                </tr>
            `;
        }
    });

    html += '</tbody></table>';
    return html;
}

/**
 * Create encounter ranks tooltip HTML (순위 셀용)
 */
export function createEncounterRanksHTML(encounterAllStars, tier) {
    if (!tier) {
        return '<p style="color: var(--text-secondary);">층별 정보 없음</p>';
    }

    const completeFloorData = buildCompleteFloorData(encounterAllStars || [], tier);
    let html = createEncounterTableHeader('순위');

    completeFloorData.forEach(floor => {
        if (!floor.data) {
            html += createEmptyDataRow(floor.floorName);
        } else {
            const encounter = floor.data;
            const percentile = (encounter.rank && encounter.total)
                ? ((encounter.total - encounter.rank + 1) / encounter.total) * 100
                : 0;
            const percentileColor = getPercentileColor(percentile);
            const rank = encounter.rank ? formatNumber(encounter.rank) : '-';
            const total = encounter.total ? formatNumber(encounter.total) : '-';
            const { jobColor, jobName } = formatJobInfo(encounter.job || 'Unknown');

            html += `
                <tr>
                    <td style="${TABLE_STYLES.dataCell}">${floor.floorName}</td>
                    <td style="${TABLE_STYLES.dataCellMiddle}">
                        <span style="color: ${percentileColor};">#${rank}</span>
                        <span style="color: var(--text-secondary);"> / ${total}</span>
                    </td>
                    <td style="${TABLE_STYLES.dataCellLast} color: ${jobColor}; font-weight: 500;">${jobName}</td>
                </tr>
            `;
        }
    });

    html += '</tbody></table>';
    return html;
}
