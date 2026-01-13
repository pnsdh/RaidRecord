/**
 * UI Controller - Main export file
 * Re-exports UI components and utilities
 */

// Re-export UIController
export { UIController } from './ui/renderer.js';

// Re-export formatting utilities
export {
    formatJobText,
    formatJobBadge,
    formatWeekBadge,
    formatAllStarScore,
    formatTierBadge
} from './ui/formatters.js';

// Re-export tooltip utilities
export { createPartyMembersHTML, attachTooltipListeners } from './ui/tooltips.js';

// Export configuration constants
const EXPORT_CONFIG = {
    TABLE_WIDTH: 800,           // Base table width in pixels
    CONTAINER_PADDING: 64,      // Left + right padding (2rem * 2 = 32px * 2)
    BACKGROUND_COLOR: '#1a1a1a',
    HEADER_FONT_SIZE: '2rem',
    HEADER_COLOR: '#e94560',

    // Desktop styles to apply to table elements
    DESKTOP_STYLES: {
        TABLE: {
            padding: '0.75rem',
            fontSize: '1rem'
        },
        HEADER_TH: {
            padding: '0.75rem',
            fontSize: '0.9rem'
        },
        BODY_TD: {
            padding: '0.5rem 0.5rem',
            fontSize: '0.9rem'
        },
        RAID_NAME: {
            fontSize: '0.8rem'
        }
    }
};

/**
 * Apply desktop styles to table to override any mobile CSS
 */
function applyDesktopStylesToTable(tableClone) {
    // Make hidden columns visible
    const hiddenCols = tableClone.querySelectorAll('.date-col, .rank-col');
    hiddenCols.forEach(el => {
        el.style.display = 'table-cell';
    });

    // Set table width (auto layout for natural column sizing)
    const table = tableClone.querySelector('table') || tableClone;
    if (table.tagName === 'TABLE') {
        table.style.width = `${EXPORT_CONFIG.TABLE_WIDTH}px`;
    }

    // Apply desktop font sizes and padding to headers
    const headers = tableClone.querySelectorAll('thead th');
    headers.forEach(th => {
        th.style.padding = EXPORT_CONFIG.DESKTOP_STYLES.HEADER_TH.padding;
        th.style.fontSize = EXPORT_CONFIG.DESKTOP_STYLES.HEADER_TH.fontSize;
    });

    // Apply desktop font sizes and padding to body cells
    const cells = tableClone.querySelectorAll('tbody td');
    cells.forEach(td => {
        td.style.padding = EXPORT_CONFIG.DESKTOP_STYLES.BODY_TD.padding;
        td.style.fontSize = EXPORT_CONFIG.DESKTOP_STYLES.BODY_TD.fontSize;
    });

    // Apply desktop font size to raid names
    const raidNames = tableClone.querySelectorAll('.raid-name');
    raidNames.forEach(el => {
        el.style.fontSize = EXPORT_CONFIG.DESKTOP_STYLES.RAID_NAME.fontSize;
    });
}

/**
 * Create and style the character name header for export
 */
function createStyledHeader(resultsSection) {
    const resultsHeader = resultsSection.querySelector('.results-header');
    if (!resultsHeader) return null;

    const headerClone = resultsHeader.cloneNode(true);
    const h2 = headerClone.querySelector('h2');

    if (h2) {
        // Get job color from stored data attribute
        const jobColor = h2.getAttribute('data-job-color') || EXPORT_CONFIG.HEADER_COLOR;
        const characterName = h2.getAttribute('data-character-name') || h2.textContent;

        // Replace gradient text with solid job color for image export
        h2.textContent = characterName;
        h2.style.cssText = `
            font-size: ${EXPORT_CONFIG.HEADER_FONT_SIZE};
            font-weight: 600;
            color: ${jobColor};
            white-space: nowrap;
            margin: 0;
            background: none;
            -webkit-background-clip: unset;
            -webkit-text-fill-color: unset;
        `;
    }

    headerClone.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 0.5rem;
        padding: 0.5rem 0;
    `;

    return headerClone;
}

/**
 * Create temporary container for image export
 */
function createExportContainer(includeCharacterName) {
    const container = document.createElement('div');
    const width = includeCharacterName
        ? EXPORT_CONFIG.TABLE_WIDTH + EXPORT_CONFIG.CONTAINER_PADDING
        : EXPORT_CONFIG.TABLE_WIDTH;

    container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: -9999px;
        background-color: ${EXPORT_CONFIG.BACKGROUND_COLOR};
        ${includeCharacterName ? 'padding: 1rem 2rem 2rem 2rem;' : ''}
        width: ${width}px;
        box-sizing: border-box;
    `;

    return container;
}

/**
 * Export results table as image
 * @param {boolean} includeCharacterName - Whether to include character name in the export
 */
export async function exportAsImage(includeCharacterName = false) {
    const resultsSection = document.getElementById('resultsSection');

    if (!resultsSection) {
        alert('내보낼 결과가 없습니다.');
        return;
    }

    let tempContainer = null;

    try {
        // Create temporary container
        tempContainer = createExportContainer(includeCharacterName);

        // Add header if requested
        if (includeCharacterName) {
            const headerClone = createStyledHeader(resultsSection);
            if (!headerClone) {
                alert('캡처할 요소를 찾을 수 없습니다.');
                return;
            }
            tempContainer.appendChild(headerClone);
        }

        // Clone and style table
        const table = resultsSection.querySelector('table');
        if (!table) {
            alert('테이블을 찾을 수 없습니다.');
            return;
        }

        const tableClone = table.cloneNode(true);
        applyDesktopStylesToTable(tableClone);
        tempContainer.appendChild(tableClone);

        // Add to DOM for rendering
        document.body.appendChild(tempContainer);

        // Capture with html2canvas
        const canvas = await html2canvas(tempContainer, {
            backgroundColor: EXPORT_CONFIG.BACKGROUND_COLOR,
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false
        });

        // Clean up
        if (tempContainer.parentNode) {
            tempContainer.parentNode.removeChild(tempContainer);
        }

        // Download image
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const suffix = includeCharacterName ? 'with-name' : 'table-only';
            a.download = `raid-record-${suffix}-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    } catch (error) {
        // Clean up on error
        if (tempContainer && tempContainer.parentNode) {
            tempContainer.parentNode.removeChild(tempContainer);
        }
        alert('이미지 저장 중 오류가 발생했습니다.');
    }
}
