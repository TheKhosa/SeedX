import parseTorrent, { toMagnetURI } from 'parse-torrent';
import createTorrent from 'create-torrent';
import { promisify } from 'util';
import { TRACKER_CONFIG } from './tracker';

const createTorrentAsync = promisify(createTorrent);

export interface ParsedTorrentInfo {
	name: string;
	infoHash: string;
	size: number;
	files: { path: string; size: number }[];
	magnetLink: string;
	announce?: string[];
	comment?: string;
	createdBy?: string;
	creationDate?: Date;
	isPrivate?: boolean;
}

/**
 * Parse a .torrent file buffer and extract metadata
 */
export async function parseTorrentFile(buffer: Buffer): Promise<ParsedTorrentInfo> {
	const parsed = await parseTorrent(buffer);

	if (!parsed || !parsed.infoHash) {
		throw new Error('Invalid torrent file');
	}

	const files = parsed.files?.map(f => ({
		path: f.path,
		size: f.length
	})) ?? [];

	const totalSize = files.reduce((sum, f) => sum + f.size, 0) || parsed.length || 0;

	// Generate magnet link with SeedX tracker
	const magnetLink = toMagnetURI({
		...parsed,
		announce: [TRACKER_CONFIG.announceUrl, ...(parsed.announce || [])]
	});

	return {
		name: parsed.name || 'Unknown',
		infoHash: parsed.infoHash,
		size: totalSize,
		files,
		magnetLink,
		announce: parsed.announce as string[] | undefined,
		comment: parsed.comment as string | undefined,
		createdBy: parsed.createdBy as string | undefined,
		creationDate: parsed.created as Date | undefined,
		isPrivate: parsed.private as boolean | undefined
	};
}

/**
 * Parse a magnet link and extract metadata
 */
export async function parseMagnetLink(magnetUri: string): Promise<ParsedTorrentInfo> {
	const parsed = await parseTorrent(magnetUri);

	if (!parsed || !parsed.infoHash) {
		throw new Error('Invalid magnet link');
	}

	// Try to get size from magnet (usually not available)
	const size = parsed.length || 0;

	// Re-generate magnet with SeedX tracker added
	const existingTrackers = parsed.announce || [];
	const announceUrl = TRACKER_CONFIG.announceUrl;
	const newAnnounce = existingTrackers.includes(announceUrl)
		? existingTrackers
		: [announceUrl, ...existingTrackers];

	const magnetLink = toMagnetURI({
		...parsed,
		announce: newAnnounce
	});

	return {
		name: parsed.name || 'Unknown',
		infoHash: parsed.infoHash,
		size,
		files: [],
		magnetLink,
		announce: parsed.announce as string[] | undefined
	};
}

export interface CreateTorrentOptions {
	name?: string;
	comment?: string;
	createdBy?: string;
	isPrivate?: boolean;
	pieceLength?: number;
}

/**
 * Create a .torrent file from a file path or buffer
 * Automatically adds SeedX tracker as primary announcer
 */
export async function createTorrentFile(
	input: string | Buffer,
	options: CreateTorrentOptions = {}
): Promise<{ torrentBuffer: Buffer; info: ParsedTorrentInfo }> {
	const announceUrl = TRACKER_CONFIG.announceUrl;

	const torrentBuffer = await createTorrentAsync(input, {
		name: options.name,
		comment: options.comment || 'Created with SeedX',
		createdBy: options.createdBy || 'SeedX Torrent Creator',
		private: options.isPrivate || false,
		pieceLength: options.pieceLength,
		announceList: [[announceUrl]]
	}) as Buffer;

	// Parse the created torrent to get info
	const info = await parseTorrentFile(torrentBuffer);

	return { torrentBuffer, info };
}

/**
 * Extract video quality from torrent name
 */
export function extractQualityFromName(name: string): string | undefined {
	const qualityPatterns = [
		{ pattern: /\b(2160p|4k|uhd)\b/i, quality: '4k' },
		{ pattern: /\b1080p\b/i, quality: '1080p' },
		{ pattern: /\b720p\b/i, quality: '720p' },
		{ pattern: /\b480p\b/i, quality: '480p' },
		{ pattern: /\bhdtv\b/i, quality: 'hdtv' },
		{ pattern: /\b(web-?dl|webrip)\b/i, quality: 'webrip' },
		{ pattern: /\bblu-?ray\b/i, quality: 'bluray' },
		{ pattern: /\bdvdrip\b/i, quality: 'dvdrip' }
	];

	for (const { pattern, quality } of qualityPatterns) {
		if (pattern.test(name)) {
			return quality;
		}
	}

	return undefined;
}

/**
 * Extract season and episode from TV show torrent name
 */
export function extractSeasonEpisode(name: string): { season?: number; episode?: number } {
	// Match patterns like S01E01, S1E1, 1x01, Season 1 Episode 1
	const patterns = [
		/S(\d{1,2})E(\d{1,2})/i,
		/(\d{1,2})x(\d{2})/i,
		/Season\s*(\d{1,2})\s*Episode\s*(\d{1,2})/i
	];

	for (const pattern of patterns) {
		const match = name.match(pattern);
		if (match) {
			return {
				season: parseInt(match[1], 10),
				episode: parseInt(match[2], 10)
			};
		}
	}

	// Match season pack patterns like "Season 1" or "S01"
	const seasonOnlyPatterns = [
		/\bSeason\s*(\d{1,2})\b/i,
		/\bS(\d{1,2})\b(?!E)/i
	];

	for (const pattern of seasonOnlyPatterns) {
		const match = name.match(pattern);
		if (match) {
			return {
				season: parseInt(match[1], 10),
				episode: undefined
			};
		}
	}

	return {};
}

/**
 * Guess category from torrent name and files
 */
export function guessCategory(name: string, files: { path: string }[]): string {
	const nameLower = name.toLowerCase();
	const allPaths = files.map(f => f.path.toLowerCase()).join(' ');
	const combined = `${nameLower} ${allPaths}`;

	// Check for TV patterns first (S01E01, 1x01, etc.)
	if (/\bS\d{1,2}E\d{1,2}\b/i.test(name) || /\d{1,2}x\d{2}/.test(name)) {
		return 'tv';
	}

	// Check for season/complete packs
	if (/\b(season|complete)\b/i.test(nameLower)) {
		return 'tv';
	}

	// Check file extensions
	const videoExtensions = /\.(mkv|mp4|avi|mov|wmv|m4v)$/i;
	const audioExtensions = /\.(mp3|flac|wav|aac|ogg|m4a)$/i;
	const bookExtensions = /\.(pdf|epub|mobi|azw3|djvu)$/i;
	const gameExtensions = /\.(iso|nsp|xci|pkg|vpk)$/i;
	const appExtensions = /\.(exe|msi|dmg|deb|rpm|appimage)$/i;

	const hasVideo = files.some(f => videoExtensions.test(f.path));
	const hasAudio = files.some(f => audioExtensions.test(f.path));
	const hasBook = files.some(f => bookExtensions.test(f.path));
	const hasGame = files.some(f => gameExtensions.test(f.path));
	const hasApp = files.some(f => appExtensions.test(f.path));

	// Check for movie/video indicators in name (works even without files)
	const hasVideoIndicator = /\b(1080p|720p|480p|2160p|4k|bluray|blu-ray|bdrip|brrip|dvdrip|hdtv|webrip|web-dl|webdl|hdrip|x264|x265|hevc|h\.?264|h\.?265)\b/i.test(nameLower);

	// If we have video files or video quality indicators, it's likely movies/tv
	if (hasVideo || hasVideoIndicator) {
		return 'movies';
	}

	if (hasAudio) return 'music';
	if (hasBook) return 'books';
	if (hasGame || /\b(repack|fitgirl|codex|skidrow|plaza|gog|steamrip)\b/i.test(combined)) return 'games';
	if (hasApp || /\b(portable|crack|keygen|patch)\b/i.test(combined)) return 'apps';

	return 'other';
}
