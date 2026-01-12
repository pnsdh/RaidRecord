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

/**
 * Export results table as image
 */
export async function exportAsImage() {
    const resultsTable = document.getElementById('resultsTable');

    if (!resultsTable) {
        alert('내보낼 결과가 없습니다.');
        return;
    }

    try {
        // Get the actual content area
        const table = resultsTable.querySelector('table');
        if (!table) {
            alert('테이블을 찾을 수 없습니다.');
            return;
        }

        // Use html2canvas to capture the table
        const canvas = await html2canvas(table, {
            backgroundColor: '#1a1a2e',
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false
        });

        // Convert to blob (PNG is lossless, no quality parameter needed)
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `raid-record-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    } catch (error) {
        alert('이미지 저장 중 오류가 발생했습니다.');
    }
}
