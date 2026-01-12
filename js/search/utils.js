/**
 * Utility functions for raid history processing
 */

/**
 * Sort raid history (newest first)
 */
export function sortRaidHistory(raidHistory) {
    return raidHistory.sort((a, b) => {
        const dateA = new Date(a.tier.releaseDate);
        const dateB = new Date(b.tier.releaseDate);
        return dateB - dateA; // Newest first
    });
}
