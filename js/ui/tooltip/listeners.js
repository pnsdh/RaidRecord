/**
 * Tooltip event listener management (DOM side effects)
 * Handles attaching event listeners and managing tooltip display
 */

import { UI_CONFIG } from '../../config/config.js';
import {
    createPartyMembersHTML,
    createRaidInfoHTML,
    createDateTooltipHTML,
    createJobFrequencyHTML,
    createEncounterScoresHTML,
    createEncounterPercentilesHTML,
    createEncounterRanksHTML,
    createWeekTooltipHTML
} from './content.js';

// Constants for table cell indices
const CELL_INDICES = {
    RAID: 1,
    WEEK: 2,
    DATE: 3,
    JOB: 4,
    SCORE: 5,
    PERCENTILE: 6,
    RANK: 7
};

/**
 * Configuration for cell tooltip handlers
 */
const CELL_TOOLTIP_CONFIG = [
    {
        index: CELL_INDICES.RAID,
        dataAttribute: 'data-tier',
        createHTML: (data) => createRaidInfoHTML(JSON.parse(data)),
        requiresTier: false
    },
    {
        index: CELL_INDICES.WEEK,
        dataAttribute: 'data-party',
        createHTML: (partyData, rowData) => {
            const partyHTML = createPartyMembersHTML(JSON.parse(partyData));
            const weekHTML = createWeekTooltipHTML(rowData.isWeekAmbiguous, rowData.week);
            return weekHTML + partyHTML;
        },
        requiresSecondary: true,
        getSecondaryData: (row) => ({
            isWeekAmbiguous: row.getAttribute('data-week-ambiguous') === 'true',
            week: parseInt(row.getAttribute('data-week') || '0')
        })
    },
    {
        index: CELL_INDICES.DATE,
        dataAttribute: 'data-timestamp',
        createHTML: (clearTime, rowData) => createDateTooltipHTML(clearTime, rowData),
        requiresSecondary: true,
        getSecondaryData: (row) => ({
            fightStartTime: row.getAttribute('data-fight-start'),
            isWeekAmbiguous: row.getAttribute('data-week-ambiguous') === 'true',
            week: parseInt(row.getAttribute('data-week') || '0')
        })
    },
    {
        index: CELL_INDICES.JOB,
        dataAttribute: 'data-jobs',
        createHTML: (data) => createJobFrequencyHTML(JSON.parse(data)),
        requiresTier: false
    },
    {
        index: CELL_INDICES.SCORE,
        dataAttribute: 'data-encounters',
        createHTML: (encounters, tier) => createEncounterScoresHTML(JSON.parse(encounters || '[]'), JSON.parse(tier)),
        requiresTier: true
    },
    {
        index: CELL_INDICES.PERCENTILE,
        dataAttribute: 'data-encounters',
        createHTML: (encounters, tier) => createEncounterPercentilesHTML(JSON.parse(encounters || '[]'), JSON.parse(tier)),
        requiresTier: true
    },
    {
        index: CELL_INDICES.RANK,
        dataAttribute: 'data-encounters',
        createHTML: (encounters, tier) => createEncounterRanksHTML(JSON.parse(encounters || '[]'), JSON.parse(tier)),
        requiresTier: true
    }
];

/**
 * Update tooltip position based on mouse coordinates
 */
function updateTooltipPosition(e, tooltip) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const offset = UI_CONFIG.TOOLTIP_OFFSET;
    const margin = UI_CONFIG.TOOLTIP_MIN_MARGIN;

    let top = e.clientY + offset;
    let left = e.clientX + offset;

    // Adjust if tooltip goes below viewport
    if (top + tooltipRect.height > window.innerHeight - margin) {
        top = e.clientY - tooltipRect.height - offset;
    }

    // Adjust if tooltip goes off right edge
    if (left + tooltipRect.width > window.innerWidth - margin) {
        left = e.clientX - tooltipRect.width - offset;
    }

    // Adjust if tooltip goes off left edge
    if (left < margin) {
        left = margin;
    }

    // Adjust if tooltip goes above viewport
    if (top < margin) {
        top = margin;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
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
 * Attach cell tooltip listeners for a given row
 */
function attachCellTooltipListeners(row, tooltip) {
    CELL_TOOLTIP_CONFIG.forEach(config => {
        const cell = row.querySelector(`td:nth-child(${config.index})`);
        if (!cell) return;

        cell.addEventListener('mouseenter', (e) => {
            const data = row.getAttribute(config.dataAttribute);
            if (!data && !config.requiresTier && !config.requiresSecondary) return;

            try {
                let html;
                if (config.requiresTier) {
                    const tierData = row.getAttribute('data-tier');
                    if (!tierData) return;
                    html = config.createHTML(data, tierData);
                } else if (config.requiresSecondary) {
                    const secondaryData = config.getSecondaryData ? config.getSecondaryData(row) : row.getAttribute(config.secondaryAttribute);
                    html = config.createHTML(data, secondaryData);
                } else {
                    html = config.createHTML(data);
                }

                tooltip.innerHTML = html;
                tooltip.style.display = 'block';
                updateTooltipPosition(e, tooltip);
            } catch (error) {
                // Silent fail
            }
        });

        cell.addEventListener('mousemove', (e) => {
            if (tooltip.style.display === 'block') {
                updateTooltipPosition(e, tooltip);
            }
        });

        cell.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
}

/**
 * Attach row click listener for FFLogs link
 */
function attachRowClickListener(row) {
    row.addEventListener('click', (e) => {
        const reportCode = row.getAttribute('data-report');
        const fightId = row.getAttribute('data-fight');

        if (reportCode && fightId && reportCode !== '' && fightId !== '') {
            const url = `https://ko.fflogs.com/reports/${reportCode}#fight=${fightId}`;
            window.open(url, '_blank');
        }
    });
}

/**
 * Attach event listeners for tooltips
 */
export function attachTooltipListeners() {
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
        attachRowClickListener(row);
        attachCellTooltipListeners(row, tooltip);
    });
}
