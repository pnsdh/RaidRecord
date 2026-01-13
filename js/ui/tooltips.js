/**
 * Tooltip utilities for party member display
 */

import { getServerNameKR, getJobOrder } from '../constants.js';
import { formatJobBadge } from './formatters.js';
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
 * Attach event listeners for tooltips
 */
export function attachTooltipListeners() {
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

        row.addEventListener('mouseenter', (e) => {
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

        row.addEventListener('mousemove', (e) => {
            if (tooltip.style.display === 'block') {
                updateTooltipPosition(e, tooltip);
            }
        });

        row.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
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
