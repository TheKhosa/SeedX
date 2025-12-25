import { getTunnelUrl } from './tunnel-config';

// SeedX Tracker Configuration
class TrackerConfig {
	// Tracker name for identification
	name = 'SeedX Tracker';

	// Get the current tunnel URL (reads from file each time for freshness)
	get tunnelUrl(): string | null {
		return getTunnelUrl();
	}

	// Primary announcer URL - uses tunnel URL dynamically
	get announceUrl(): string {
		const tunnel = this.tunnelUrl;
		if (tunnel) {
			return `${tunnel}/announce`;
		}
		// Fallback for local development
		return process.env.TRACKER_ANNOUNCE_URL || 'http://localhost:5173/announce';
	}

	// WebSocket tracker URL for real-time
	get wsAnnounceUrl(): string {
		const tunnel = this.tunnelUrl;
		if (tunnel) {
			return tunnel.replace('https://', 'wss://') + '/announce';
		}
		return 'ws://localhost:5173/announce';
	}
}

export const TRACKER_CONFIG = new TrackerConfig();

/**
 * Adds SeedX tracker to a magnet link
 * Injects our announcer as the first tracker in the list
 */
export function addTrackerToMagnet(magnetLink: string): string {
	if (!magnetLink.startsWith('magnet:?')) {
		return magnetLink;
	}

	const announceUrl = TRACKER_CONFIG.announceUrl;
	const trackerParam = `&tr=${encodeURIComponent(announceUrl)}`;

	// Check if magnet already has our tracker
	if (magnetLink.includes(encodeURIComponent(announceUrl))) {
		return magnetLink;
	}

	// Find the position after xt=urn:btih:HASH to insert tracker first
	const btihMatch = magnetLink.match(/btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/);
	if (btihMatch) {
		const insertPos = magnetLink.indexOf(btihMatch[0]) + btihMatch[0].length;
		return magnetLink.slice(0, insertPos) + trackerParam + magnetLink.slice(insertPos);
	}

	// Fallback: append to end
	return magnetLink + trackerParam;
}

/**
 * Removes existing trackers from a magnet link
 */
export function stripTrackers(magnetLink: string): string {
	return magnetLink.replace(/&tr=[^&]*/gi, '');
}

/**
 * Replaces all trackers with SeedX tracker
 */
export function replaceTrackers(magnetLink: string): string {
	const stripped = stripTrackers(magnetLink);
	return addTrackerToMagnet(stripped);
}

/**
 * Extracts info hash from magnet link
 */
export function extractInfoHash(magnetLink: string): string | null {
	const match = magnetLink.match(/btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/i);
	return match ? match[1].toUpperCase() : null;
}

/**
 * Generates a clean magnet link with SeedX tracker
 */
export function generateMagnetLink(infoHash: string, name: string): string {
	const encodedName = encodeURIComponent(name);
	const baseLink = `magnet:?xt=urn:btih:${infoHash}&dn=${encodedName}`;
	return addTrackerToMagnet(baseLink);
}
