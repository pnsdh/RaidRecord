/**
 * Tooltip utilities for party member display
 */

import { getServerNameKR, getJobOrder, JOB_COLORS, JOB_NAMES_KR } from '../constants.js';
import { formatJobBadge, getPercentileColor } from './formatters.js';
import { UI_CONFIG } from '../config/config.js';

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

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tbody>';
    html += `<tr><td style="padding: 4px 8px 4px 0; color: var(--text-secondary); width: 80px;">이름</td><td style="padding: 4px 0; font-weight: 500;">${tier.fullName}</td></tr>`;
    html += `<tr><td style="padding: 4px 8px 4px 0; color: var(--text-secondary);">종류</td><td style="padding: 4px 0; font-weight: 500;">${typeText}</td></tr>`;
    html += `<tr><td style="padding: 4px 8px 4px 0; color: var(--text-secondary);">확장팩</td><td style="padding: 4px 0; font-weight: 500;">${tier.expansion}</td></tr>`;
    html += `<tr><td style="padding: 4px 8px 4px 0; color: var(--text-secondary);">버전</td><td style="padding: 4px 0; font-weight: 500;">${tier.version}</td></tr>`;
    html += `<tr><td style="padding: 4px 8px 4px 0; color: var(--text-secondary);">패치 날짜</td><td style="padding: 4px 0; font-weight: 500;">${tier.releaseDate}</td></tr>`;
    html += '</tbody>';
    html += '</table>';

    return html;
}

/**
 * Get encounter floor name by floor number (0-based index)
 */
function getFloorName(floorIndex, totalCount) {
    if (totalCount === 1) {
        // Ultimate raids: show "-" instead of floor number
        return '-';
    } else if (totalCount === 5) {
        // 5 encounters: 1층, 2층, 3층, 4전, 4후
        const floorNames = ['1층', '2층', '3층', '4전', '4후'];
        return floorNames[floorIndex] || `${floorIndex + 1}층`;
    } else {
        // 4 encounters: 1층, 2층, 3층, 4층
        return `${floorIndex + 1}층`;
    }
}

/**
 * Build complete floor data array with all encounters
 * Maps encounter data to correct floor positions, fills missing with null
 */
function buildCompleteFloorData(encounterAllStars, tier) {
    const encounterCount = tier.encounterCount;
    const finalEncounterId = tier.finalEncounterId;

    // Calculate first encounter ID (final - count + 1)
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
            data: encounterData || null  // null if no data for this floor
        });
    }

    return completeData;
}

/**
 * Create encounter all-star scores tooltip HTML (올스타 셀용)
 */
export function createEncounterScoresHTML(encounterAllStars, tier) {
    if (!tier) {
        return '<p style="color: var(--text-secondary);">층별 정보 없음</p>';
    }

    // Build complete floor data with all encounters
    const completeFloorData = buildCompleteFloorData(encounterAllStars || [], tier);

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr>';
    html += '<th style="padding: 4px 8px 4px 0; text-align: center; border-bottom: 1px solid var(--border-color);">층</th>';
    html += '<th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);">점수</th>';
    html += '<th style="padding: 4px 0 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);">직업</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    completeFloorData.forEach(floor => {
        const floorName = floor.floorName;
        const encounter = floor.data;

        if (!encounter) {
            // No data for this floor
            html += '<tr>';
            html += `<td style="padding: 4px 8px 4px 0; text-align: center;">${floorName}</td>`;
            html += `<td style="padding: 4px 8px; text-align: center; color: var(--text-secondary);">-</td>`;
            html += `<td style="padding: 4px 0 4px 8px; text-align: center; color: var(--text-secondary);">-</td>`;
            html += '</tr>';
        } else {
            // Has data for this floor
            const points = encounter.points ? encounter.points.toFixed(2) : '0.00';
            const job = encounter.job || 'Unknown';
            const jobColor = JOB_COLORS[job] || '#999';
            const jobName = JOB_NAMES_KR[job] || job;

            html += '<tr>';
            html += `<td style="padding: 4px 8px 4px 0; text-align: center;">${floorName}</td>`;
            html += `<td style="padding: 4px 8px; text-align: center; color: #d1fa99;">${points}</td>`;
            html += `<td style="padding: 4px 0 4px 8px; text-align: center; color: ${jobColor}; font-weight: 500;">${jobName}</td>`;
            html += '</tr>';
        }
    });

    html += '</tbody>';
    html += '</table>';

    return html;
}

/**
 * Create encounter percentiles tooltip HTML (백분위 셀용)
 */
export function createEncounterPercentilesHTML(encounterAllStars, tier) {
    if (!tier) {
        return '<p style="color: var(--text-secondary);">층별 정보 없음</p>';
    }

    // Build complete floor data with all encounters
    const completeFloorData = buildCompleteFloorData(encounterAllStars || [], tier);

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr>';
    html += '<th style="padding: 4px 8px 4px 0; text-align: center; border-bottom: 1px solid var(--border-color);">층</th>';
    html += '<th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);">백분위</th>';
    html += '<th style="padding: 4px 0 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);">직업</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    completeFloorData.forEach(floor => {
        const floorName = floor.floorName;
        const encounter = floor.data;

        if (!encounter) {
            // No data for this floor
            html += '<tr>';
            html += `<td style="padding: 4px 8px 4px 0; text-align: center;">${floorName}</td>`;
            html += `<td style="padding: 4px 8px; text-align: center; color: var(--text-secondary);">-</td>`;
            html += `<td style="padding: 4px 0 4px 8px; text-align: center; color: var(--text-secondary);">-</td>`;
            html += '</tr>';
        } else {
            // Has data for this floor
            // Calculate percentile with 2 decimal places
            let percentile = 0;
            if (encounter.rank && encounter.total) {
                percentile = (((encounter.total - encounter.rank + 1) / encounter.total) * 100).toFixed(2);
            }
            const percentileColor = getPercentileColor(parseFloat(percentile));

            const job = encounter.job || 'Unknown';
            const jobColor = JOB_COLORS[job] || '#999';
            const jobName = JOB_NAMES_KR[job] || job;

            html += '<tr>';
            html += `<td style="padding: 4px 8px 4px 0; text-align: center;">${floorName}</td>`;
            html += `<td style="padding: 4px 8px; text-align: center; color: ${percentileColor};">${percentile}%</td>`;
            html += `<td style="padding: 4px 0 4px 8px; text-align: center; color: ${jobColor}; font-weight: 500;">${jobName}</td>`;
            html += '</tr>';
        }
    });

    html += '</tbody>';
    html += '</table>';

    return html;
}

/**
 * Create encounter ranks tooltip HTML (순위 셀용)
 */
export function createEncounterRanksHTML(encounterAllStars, tier) {
    if (!tier) {
        return '<p style="color: var(--text-secondary);">층별 정보 없음</p>';
    }

    // Build complete floor data with all encounters
    const completeFloorData = buildCompleteFloorData(encounterAllStars || [], tier);

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr>';
    html += '<th style="padding: 4px 8px 4px 0; text-align: center; border-bottom: 1px solid var(--border-color);">층</th>';
    html += '<th style="padding: 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);">순위</th>';
    html += '<th style="padding: 4px 0 4px 8px; text-align: center; border-bottom: 1px solid var(--border-color);">직업</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    completeFloorData.forEach(floor => {
        const floorName = floor.floorName;
        const encounter = floor.data;

        if (!encounter) {
            // No data for this floor
            html += '<tr>';
            html += `<td style="padding: 4px 8px 4px 0; text-align: center;">${floorName}</td>`;
            html += `<td style="padding: 4px 8px; text-align: center; color: var(--text-secondary);">-</td>`;
            html += `<td style="padding: 4px 0 4px 8px; text-align: center; color: var(--text-secondary);">-</td>`;
            html += '</tr>';
        } else {
            // Has data for this floor
            // Calculate percentile for color (using raw value for color calculation)
            let percentile = 0;
            if (encounter.rank && encounter.total) {
                percentile = ((encounter.total - encounter.rank + 1) / encounter.total) * 100;
            }
            const percentileColor = getPercentileColor(percentile);

            const rank = encounter.rank ? encounter.rank.toLocaleString('en-US') : '-';
            const total = encounter.total ? encounter.total.toLocaleString('en-US') : '-';

            const job = encounter.job || 'Unknown';
            const jobColor = JOB_COLORS[job] || '#999';
            const jobName = JOB_NAMES_KR[job] || job;

            html += '<tr>';
            html += `<td style="padding: 4px 8px 4px 0; text-align: center;">${floorName}</td>`;
            html += `<td style="padding: 4px 8px; text-align: center;"><span style="color: ${percentileColor};">#${rank}</span> <span style="color: var(--text-secondary);">/ ${total}</span></td>`;
            html += `<td style="padding: 4px 0 4px 8px; text-align: center; color: ${jobColor}; font-weight: 500;">${jobName}</td>`;
            html += '</tr>';
        }
    });

    html += '</tbody>';
    html += '</table>';

    return html;
}

/**
 * Create date tooltip HTML
 */
export function createDateTooltipHTML(timestamp) {
    if (!timestamp || timestamp === '') {
        return '<p style="color: var(--text-secondary);">날짜 정보 없음</p>';
    }

    // Parse timestamp as number (milliseconds since epoch)
    const timestampNum = Number(timestamp);
    if (isNaN(timestampNum)) {
        return '<p style="color: var(--text-secondary);">날짜 정보 오류</p>';
    }

    const date = new Date(timestampNum);

    // Day of week names in Korean
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];

    // Format: YYYY-MM-DD 요일\nHH:mm:ss.mmm
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
    const hour = date.getHours();

    if (dayOfWeek === 2 && hour >= 17 && hour < 19) {
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
        const job = item.job;
        const color = JOB_COLORS[job] || '#999';
        const jobName = JOB_NAMES_KR[job] || job;
        html += `
            <div class="job-frequency-item" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="color: ${color}; font-weight: 500;">${jobName}</span>
                <span style="color: var(--text-secondary); font-size: 0.9em;">(${item.count}회)</span>
            </div>
        `;
    }

    return html;
}

/**
 * Attach header tooltip listeners
 */
function attachHeaderTooltipListeners() {
    const headers = document.querySelectorAll('.tooltip-header');

    headers.forEach(header => {
        const tooltip = header.querySelector('.header-tooltip');
        if (!tooltip) return;

        header.addEventListener('mouseenter', (e) => {
            const headerRect = header.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            // Position below the header
            let top = headerRect.bottom + 8;
            let left = headerRect.left + (headerRect.width / 2) - (tooltipRect.width / 2);

            // Check if tooltip goes off right edge
            if (left + tooltipRect.width > window.innerWidth - 10) {
                left = window.innerWidth - tooltipRect.width - 10;
            }

            // Check if tooltip goes off left edge
            if (left < 10) {
                left = 10;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        });
    });
}

/**
 * Attach event listeners for tooltips
 */
export function attachTooltipListeners() {
    // Attach header tooltip listeners
    attachHeaderTooltipListeners();

    const rows = document.querySelectorAll('.results-table tbody tr.raid-row');

    // Create a single tooltip element that we'll reuse
    let tooltip = document.getElementById('party-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'party-tooltip';
        tooltip.className = 'row-tooltip';
        document.body.appendChild(tooltip);
    }

    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            const reportCode = row.getAttribute('data-report');
            const fightId = row.getAttribute('data-fight');

            if (reportCode && fightId && reportCode !== '' && fightId !== '') {
                const url = `https://ko.fflogs.com/reports/${reportCode}#fight=${fightId}`;
                window.open(url, '_blank');
            }
        });

        // Get the 1st cell (레이드) for raid info tooltip
        const raidCell = row.querySelector('td:nth-child(1)');
        if (raidCell) {
            raidCell.addEventListener('mouseenter', (e) => {
                const tierData = row.getAttribute('data-tier');
                if (!tierData) return;

                try {
                    const tier = JSON.parse(tierData);
                    const raidHTML = createRaidInfoHTML(tier);
                    tooltip.innerHTML = raidHTML;
                    tooltip.style.display = 'block';

                    // Position tooltip at mouse position
                    updateTooltipPosition(e, tooltip);
                } catch (error) {
                    // Silent fail
                }
            });

            raidCell.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    updateTooltipPosition(e, tooltip);
                }
            });

            raidCell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }

        // Get the 2nd cell (주차) for party member tooltip
        const weekCell = row.querySelector('td:nth-child(2)');
        if (weekCell) {
            weekCell.addEventListener('mouseenter', (e) => {
                const partyData = row.getAttribute('data-party');
                if (!partyData) return;

                try {
                    const partyMembers = JSON.parse(partyData);
                    const partyHTML = createPartyMembersHTML(partyMembers);
                    tooltip.innerHTML = partyHTML;
                    tooltip.style.display = 'block';

                    // Position tooltip at mouse position
                    updateTooltipPosition(e, tooltip);
                } catch (error) {
                    // Silent fail
                }
            });

            weekCell.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    updateTooltipPosition(e, tooltip);
                }
            });

            weekCell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }

        // Get the 3rd cell (날짜) for date tooltip
        const dateCell = row.querySelector('td:nth-child(3)');
        if (dateCell) {
            dateCell.addEventListener('mouseenter', (e) => {
                const timestamp = row.getAttribute('data-timestamp');
                if (!timestamp) return;

                const dateHTML = createDateTooltipHTML(timestamp);
                tooltip.innerHTML = dateHTML;
                tooltip.style.display = 'block';

                // Position tooltip at mouse position
                updateTooltipPosition(e, tooltip);
            });

            dateCell.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    updateTooltipPosition(e, tooltip);
                }
            });

            dateCell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }

        // Get the 4th cell (직업) for job frequency tooltip
        const jobCell = row.querySelector('td:nth-child(4)');
        if (jobCell) {
            jobCell.addEventListener('mouseenter', (e) => {
                const jobsData = row.getAttribute('data-jobs');
                if (!jobsData) return;

                try {
                    const jobFrequency = JSON.parse(jobsData);
                    const jobHTML = createJobFrequencyHTML(jobFrequency);
                    tooltip.innerHTML = jobHTML;
                    tooltip.style.display = 'block';

                    // Position tooltip at mouse position
                    updateTooltipPosition(e, tooltip);
                } catch (error) {
                    // Silent fail
                }
            });

            jobCell.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    updateTooltipPosition(e, tooltip);
                }
            });

            jobCell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }

        // Get the 5th cell (올스타) for encounter scores tooltip
        const scoreCell = row.querySelector('td:nth-child(5)');
        if (scoreCell) {
            scoreCell.addEventListener('mouseenter', (e) => {
                const encountersData = row.getAttribute('data-encounters');
                const tierData = row.getAttribute('data-tier');
                if (!tierData) return;

                try {
                    const encounters = JSON.parse(encountersData || '[]');
                    const tier = JSON.parse(tierData);

                    // Show tooltip for both SAVAGE and ULTIMATE raids
                    const encounterHTML = createEncounterScoresHTML(encounters, tier);
                    tooltip.innerHTML = encounterHTML;
                    tooltip.style.display = 'block';

                    // Position tooltip at mouse position
                    updateTooltipPosition(e, tooltip);
                } catch (error) {
                    // Silent fail
                }
            });

            scoreCell.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    updateTooltipPosition(e, tooltip);
                }
            });

            scoreCell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }

        // Get the 6th cell (백분위) for encounter percentiles tooltip
        const percentileCell = row.querySelector('td:nth-child(6)');
        if (percentileCell) {
            percentileCell.addEventListener('mouseenter', (e) => {
                const encountersData = row.getAttribute('data-encounters');
                const tierData = row.getAttribute('data-tier');
                if (!tierData) return;

                try {
                    const encounters = JSON.parse(encountersData || '[]');
                    const tier = JSON.parse(tierData);

                    // Show tooltip for both SAVAGE and ULTIMATE raids
                    const encounterHTML = createEncounterPercentilesHTML(encounters, tier);
                    tooltip.innerHTML = encounterHTML;
                    tooltip.style.display = 'block';

                    // Position tooltip at mouse position
                    updateTooltipPosition(e, tooltip);
                } catch (error) {
                    // Silent fail
                }
            });

            percentileCell.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    updateTooltipPosition(e, tooltip);
                }
            });

            percentileCell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }

        // Get the 7th cell (순위) for encounter ranks tooltip
        const rankCell = row.querySelector('td:nth-child(7)');
        if (rankCell) {
            rankCell.addEventListener('mouseenter', (e) => {
                const encountersData = row.getAttribute('data-encounters');
                const tierData = row.getAttribute('data-tier');
                if (!tierData) return;

                try {
                    const encounters = JSON.parse(encountersData || '[]');
                    const tier = JSON.parse(tierData);

                    // Show tooltip for both SAVAGE and ULTIMATE raids
                    const encounterHTML = createEncounterRanksHTML(encounters, tier);
                    tooltip.innerHTML = encounterHTML;
                    tooltip.style.display = 'block';

                    // Position tooltip at mouse position
                    updateTooltipPosition(e, tooltip);
                } catch (error) {
                    // Silent fail
                }
            });

            rankCell.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    updateTooltipPosition(e, tooltip);
                }
            });

            rankCell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
    });
}

/**
 * Update tooltip position based on mouse coordinates
 */
function updateTooltipPosition(e, tooltip) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const offset = UI_CONFIG.TOOLTIP_OFFSET;
    const margin = UI_CONFIG.TOOLTIP_MIN_MARGIN;

    // Position tooltip at mouse position
    let top = e.clientY + offset;
    let left = e.clientX + offset;

    // Check if tooltip goes below viewport
    if (top + tooltipRect.height > window.innerHeight - margin) {
        top = e.clientY - tooltipRect.height - offset;
    }

    // Check if tooltip goes off right edge
    if (left + tooltipRect.width > window.innerWidth - margin) {
        left = e.clientX - tooltipRect.width - offset;
    }

    // Check if tooltip goes off left edge
    if (left < margin) {
        left = margin;
    }

    // Check if tooltip goes above viewport
    if (top < margin) {
        top = margin;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}
