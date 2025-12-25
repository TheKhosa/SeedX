import WebTorrent from 'webtorrent';
import { TRACKER_CONFIG } from './tracker';
import { updateTorrentStats } from './db';

// Global WebTorrent client for seeding
let client: WebTorrent.Instance | null = null;

// Track active torrents
const activeTorrents: Map<string, {
	infoHash: string;
	torrentId: string;
	seeders: number;
	leechers: number;
	uploaded: number;
	downloaded: number;
	uploadSpeed: number;
	downloadSpeed: number;
	progress: number;
}> = new Map();

/**
 * Initialize the WebTorrent client
 */
export function initSeeder(): WebTorrent.Instance {
	if (!client) {
		client = new WebTorrent({
			maxConns: 100
		});

		client.on('error', (err) => {
			console.error('[Seeder] Client error:', err.message);
		});

		console.log('[Seeder] WebTorrent client initialized');
	}
	return client;
}

/**
 * Get the WebTorrent client instance
 */
export function getClient(): WebTorrent.Instance {
	if (!client) {
		return initSeeder();
	}
	return client;
}

/**
 * Add a torrent for seeding
 */
export async function seedTorrent(
	magnetOrTorrent: string | Buffer,
	torrentId: string,
	options: {
		path?: string;
	} = {}
): Promise<{ success: boolean; infoHash?: string; error?: string }> {
	const wtClient = getClient();

	return new Promise((resolve) => {
		try {
			// Add custom announce URL
			const announceUrl = TRACKER_CONFIG.announceUrl;
			const opts: WebTorrent.TorrentOptions = {
				announce: [announceUrl],
				path: options.path
			};

			const torrent = wtClient.add(magnetOrTorrent, opts);

			torrent.on('ready', () => {
				console.log(`[Seeder] Torrent ready: ${torrent.name} (${torrent.infoHash})`);

				activeTorrents.set(torrent.infoHash, {
					infoHash: torrent.infoHash,
					torrentId,
					seeders: torrent.numPeers,
					leechers: 0,
					uploaded: torrent.uploaded,
					downloaded: torrent.downloaded,
					uploadSpeed: torrent.uploadSpeed,
					downloadSpeed: torrent.downloadSpeed,
					progress: torrent.progress
				});

				resolve({ success: true, infoHash: torrent.infoHash });
			});

			torrent.on('error', (err) => {
				console.error(`[Seeder] Torrent error: ${err.message}`);
				resolve({ success: false, error: err.message });
			});

			// Update stats periodically
			torrent.on('upload', () => {
				const stats = activeTorrents.get(torrent.infoHash);
				if (stats) {
					stats.uploaded = torrent.uploaded;
					stats.uploadSpeed = torrent.uploadSpeed;
					stats.seeders = torrent.numPeers;
				}
			});

			torrent.on('download', () => {
				const stats = activeTorrents.get(torrent.infoHash);
				if (stats) {
					stats.downloaded = torrent.downloaded;
					stats.downloadSpeed = torrent.downloadSpeed;
					stats.progress = torrent.progress;
					stats.leechers = torrent.numPeers;
				}
			});

			torrent.on('done', () => {
				console.log(`[Seeder] Torrent complete: ${torrent.name}`);
			});

			// Timeout if torrent doesn't become ready
			setTimeout(() => {
				if (!torrent.ready) {
					resolve({ success: false, error: 'Torrent timeout - no metadata received' });
				}
			}, 30000);
		} catch (error) {
			resolve({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	});
}

/**
 * Remove a torrent from seeding
 */
export function removeTorrent(infoHash: string): boolean {
	const wtClient = getClient();
	const torrent = wtClient.get(infoHash);

	if (torrent) {
		torrent.destroy();
		activeTorrents.delete(infoHash);
		console.log(`[Seeder] Removed torrent: ${infoHash}`);
		return true;
	}
	return false;
}

/**
 * Get stats for a specific torrent
 */
export function getTorrentStats(infoHash: string) {
	return activeTorrents.get(infoHash);
}

/**
 * Get stats for all active torrents
 */
export function getAllTorrentStats() {
	return Array.from(activeTorrents.values());
}

/**
 * Get overall seeder statistics
 */
export function getSeederStats() {
	const wtClient = getClient();
	const torrents = wtClient.torrents;

	let totalUploaded = 0;
	let totalDownloaded = 0;
	let totalUploadSpeed = 0;
	let totalDownloadSpeed = 0;

	for (const torrent of torrents) {
		totalUploaded += torrent.uploaded;
		totalDownloaded += torrent.downloaded;
		totalUploadSpeed += torrent.uploadSpeed;
		totalDownloadSpeed += torrent.downloadSpeed;
	}

	return {
		activeTorrents: torrents.length,
		totalUploaded,
		totalDownloaded,
		totalUploadSpeed,
		totalDownloadSpeed,
		ratio: totalDownloaded > 0 ? totalUploaded / totalDownloaded : 0
	};
}

/**
 * Sync torrent stats to database
 */
export function syncStatsToDb() {
	for (const [infoHash, stats] of activeTorrents) {
		if (stats.torrentId) {
			updateTorrentStats(stats.torrentId, stats.seeders, stats.leechers);
		}
	}
}

// Sync stats every 30 seconds
setInterval(() => {
	syncStatsToDb();
}, 30000);

/**
 * Fetch full metadata from a magnet link by connecting to DHT/peers
 * Returns complete torrent info including file sizes
 */
export async function fetchMagnetMetadata(
	magnetUri: string,
	timeoutMs: number = 30000
): Promise<{
	success: boolean;
	data?: {
		name: string;
		infoHash: string;
		size: number;
		files: { path: string; size: number }[];
		magnetLink: string;
		numPeers: number;
	};
	error?: string;
}> {
	const wtClient = getClient();

	// Extract info hash to check for existing torrent
	const infoHashMatch = magnetUri.match(/btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/i);
	const infoHash = infoHashMatch ? infoHashMatch[1].toLowerCase() : null;

	// Check if torrent already exists in client
	if (infoHash) {
		const existing = wtClient.get(infoHash);
		if (existing && existing.ready) {
			console.log(`[Seeder] Using existing torrent: ${existing.name}`);
			const files = existing.files.map((f) => ({
				path: f.path,
				size: f.length
			}));
			return {
				success: true,
				data: {
					name: existing.name,
					infoHash: existing.infoHash,
					size: existing.length,
					files,
					magnetLink: existing.magnetURI,
					numPeers: existing.numPeers
				}
			};
		}
		// If exists but not ready, remove it first
		if (existing) {
			existing.destroy();
		}
	}

	return new Promise((resolve) => {
		const timeout = setTimeout(() => {
			if (infoHash) {
				const torrent = wtClient.get(infoHash);
				if (torrent && !torrent.ready) {
					torrent.destroy();
				}
			}
			resolve({
				success: false,
				error: 'Timeout fetching metadata from peers. Try again or use a .torrent file.'
			});
		}, timeoutMs);

		try {
			const torrent = wtClient.add(magnetUri, {
				announce: [TRACKER_CONFIG.announceUrl]
			});

			torrent.on('metadata', () => {
				clearTimeout(timeout);
				console.log(`[Seeder] Got metadata for: ${torrent.name}`);

				const files = torrent.files.map((f) => ({
					path: f.path,
					size: f.length
				}));

				const result = {
					name: torrent.name,
					infoHash: torrent.infoHash,
					size: torrent.length,
					files,
					magnetLink: torrent.magnetURI,
					numPeers: torrent.numPeers
				};

				// Destroy the torrent since we only wanted metadata
				torrent.destroy();

				resolve({ success: true, data: result });
			});

			torrent.on('error', (err) => {
				clearTimeout(timeout);
				try { torrent.destroy(); } catch {}
				resolve({ success: false, error: err.message });
			});
		} catch (error) {
			clearTimeout(timeout);
			resolve({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	});
}

/**
 * Destroy the client and cleanup
 */
export function destroySeeder(): Promise<void> {
	return new Promise((resolve) => {
		if (client) {
			client.destroy(() => {
				client = null;
				activeTorrents.clear();
				console.log('[Seeder] Client destroyed');
				resolve();
			});
		} else {
			resolve();
		}
	});
}
