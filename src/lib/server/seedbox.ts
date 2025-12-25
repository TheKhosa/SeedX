import Transmission from 'transmission-promise';
import { TRACKER_CONFIG } from './tracker';

// Seedbox Configuration
export const SEEDBOX_CONFIG = {
	enabled: process.env.SEEDBOX_ENABLED === 'true',
	host: process.env.TRANSMISSION_HOST || 'localhost',
	port: parseInt(process.env.TRANSMISSION_PORT || '9091', 10),
	username: process.env.TRANSMISSION_USER || '',
	password: process.env.TRANSMISSION_PASS || '',
	downloadDir: process.env.TRANSMISSION_DOWNLOAD_DIR || '/downloads'
};

// Transmission client instance
let transmissionClient: Transmission | null = null;

function getClient(): Transmission {
	if (!transmissionClient) {
		transmissionClient = new Transmission({
			host: SEEDBOX_CONFIG.host,
			port: SEEDBOX_CONFIG.port,
			username: SEEDBOX_CONFIG.username,
			password: SEEDBOX_CONFIG.password
		});
	}
	return transmissionClient;
}

export interface AddTorrentResult {
	success: boolean;
	torrentId?: number;
	name?: string;
	hashString?: string;
	error?: string;
}

/**
 * Adds a torrent to the seedbox via magnet link
 */
export async function addTorrentToSeedbox(magnetLink: string): Promise<AddTorrentResult> {
	if (!SEEDBOX_CONFIG.enabled) {
		return { success: false, error: 'Seedbox is not enabled' };
	}

	try {
		const client = getClient();
		const result = await client.addUrl(magnetLink, {
			'download-dir': SEEDBOX_CONFIG.downloadDir
		});

		if (result && result.id) {
			console.log(`[Seedbox] Added torrent: ${result.name} (ID: ${result.id})`);
			return {
				success: true,
				torrentId: result.id,
				name: result.name,
				hashString: result.hashString
			};
		}

		return { success: false, error: 'Failed to add torrent' };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		console.error(`[Seedbox] Error adding torrent: ${message}`);
		return { success: false, error: message };
	}
}

/**
 * Gets the status of a torrent by info hash
 */
export async function getTorrentStatus(infoHash: string): Promise<{
	found: boolean;
	status?: string;
	progress?: number;
	seeders?: number;
	leechers?: number;
	uploadRatio?: number;
}> {
	if (!SEEDBOX_CONFIG.enabled) {
		return { found: false };
	}

	try {
		const client = getClient();
		const torrents = await client.get();

		const torrent = torrents.torrents?.find(
			(t: { hashString: string }) => t.hashString?.toUpperCase() === infoHash.toUpperCase()
		);

		if (torrent) {
			return {
				found: true,
				status: getStatusString(torrent.status),
				progress: torrent.percentDone * 100,
				seeders: torrent.peersSendingToUs,
				leechers: torrent.peersGettingFromUs,
				uploadRatio: torrent.uploadRatio
			};
		}

		return { found: false };
	} catch (error) {
		console.error('[Seedbox] Error getting torrent status:', error);
		return { found: false };
	}
}

/**
 * Removes a torrent from the seedbox
 */
export async function removeTorrentFromSeedbox(infoHash: string, deleteData = false): Promise<boolean> {
	if (!SEEDBOX_CONFIG.enabled) {
		return false;
	}

	try {
		const client = getClient();
		const torrents = await client.get();

		const torrent = torrents.torrents?.find(
			(t: { hashString: string }) => t.hashString?.toUpperCase() === infoHash.toUpperCase()
		);

		if (torrent) {
			await client.remove(torrent.id, deleteData);
			console.log(`[Seedbox] Removed torrent: ${torrent.name}`);
			return true;
		}

		return false;
	} catch (error) {
		console.error('[Seedbox] Error removing torrent:', error);
		return false;
	}
}

/**
 * Gets all torrents from the seedbox
 */
export async function getAllSeedboxTorrents(): Promise<{
	success: boolean;
	torrents?: Array<{
		id: number;
		name: string;
		hashString: string;
		status: string;
		progress: number;
		uploadRatio: number;
	}>;
	error?: string;
}> {
	if (!SEEDBOX_CONFIG.enabled) {
		return { success: false, error: 'Seedbox is not enabled' };
	}

	try {
		const client = getClient();
		const result = await client.get();

		const torrents = result.torrents?.map((t: {
			id: number;
			name: string;
			hashString: string;
			status: number;
			percentDone: number;
			uploadRatio: number;
		}) => ({
			id: t.id,
			name: t.name,
			hashString: t.hashString,
			status: getStatusString(t.status),
			progress: t.percentDone * 100,
			uploadRatio: t.uploadRatio
		})) || [];

		return { success: true, torrents };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return { success: false, error: message };
	}
}

/**
 * Tests connection to the seedbox
 */
export async function testSeedboxConnection(): Promise<{ connected: boolean; error?: string }> {
	if (!SEEDBOX_CONFIG.enabled) {
		return { connected: false, error: 'Seedbox is not enabled' };
	}

	try {
		const client = getClient();
		await client.get();
		return { connected: true };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return { connected: false, error: message };
	}
}

function getStatusString(status: number): string {
	switch (status) {
		case 0: return 'stopped';
		case 1: return 'queued-verify';
		case 2: return 'verifying';
		case 3: return 'queued-download';
		case 4: return 'downloading';
		case 5: return 'queued-seed';
		case 6: return 'seeding';
		default: return 'unknown';
	}
}
