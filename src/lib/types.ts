export interface User {
	id: string;
	username: string;
	email: string;
	passwordHash: string;
	createdAt: Date;
}

export interface UserStats {
	uploadedTorrents: number;
	totalUploaded: number;    // bytes uploaded (seeded)
	totalDownloaded: number;  // bytes downloaded (leeched)
	ratio: number;            // upload/download ratio
	avgSpeed: number;         // average speed in bytes/sec
}

export interface Torrent {
	id: string;
	name: string;
	description: string;
	category: TorrentCategory;
	subcategory?: TorrentSubcategory;
	infoHash: string;
	size: number;
	files: TorrentFile[];
	seeders: number;
	leechers: number;
	downloads: number;
	uploadedBy: string;
	uploadedAt: Date;
	magnetLink: string;
	// TV/Movie specific
	showId?: string;
	seasonNumber?: number;
	episodeNumber?: number;
	quality?: VideoQuality;
}

export interface TorrentFile {
	path: string;
	size: number;
}

// Main categories
export type TorrentCategory = 'tv' | 'movies' | 'games' | 'apps' | 'music' | 'books' | 'other';

// Subcategories by main category
export type TorrentSubcategory =
	// Video quality
	| 'uhd' | '4k' | '1080p' | '720p' | 'hdtv' | 'webrip' | 'bluray' | 'dvdrip' | 'cam'
	// Games platforms
	| 'pc' | 'xbox' | 'playstation' | 'nintendo' | 'mobile'
	// Apps platforms
	| 'windows' | 'macos' | 'linux' | 'android' | 'ios';

export type VideoQuality = '4k' | '2160p' | '1080p' | '720p' | '480p' | 'hdtv' | 'webrip' | 'bluray' | 'dvdrip';

// Category configuration
export const CATEGORIES: Record<TorrentCategory, {
	label: string;
	icon: string;
	subcategories: { value: TorrentSubcategory; label: string }[];
}> = {
	tv: {
		label: 'TV Shows',
		icon: '📺',
		subcategories: [
			{ value: 'uhd', label: 'UHD/4K' },
			{ value: '1080p', label: '1080p' },
			{ value: '720p', label: '720p' },
			{ value: 'hdtv', label: 'HDTV' },
			{ value: 'webrip', label: 'WEB-DL/WEBRip' }
		]
	},
	movies: {
		label: 'Movies',
		icon: '🎬',
		subcategories: [
			{ value: 'uhd', label: 'UHD/4K' },
			{ value: 'bluray', label: 'BluRay' },
			{ value: '1080p', label: '1080p' },
			{ value: '720p', label: '720p' },
			{ value: 'dvdrip', label: 'DVDRip' },
			{ value: 'cam', label: 'CAM/TS' }
		]
	},
	games: {
		label: 'Games',
		icon: '🎮',
		subcategories: [
			{ value: 'pc', label: 'PC' },
			{ value: 'xbox', label: 'Xbox' },
			{ value: 'playstation', label: 'PlayStation' },
			{ value: 'nintendo', label: 'Nintendo' },
			{ value: 'mobile', label: 'Mobile' }
		]
	},
	apps: {
		label: 'Applications',
		icon: '💻',
		subcategories: [
			{ value: 'windows', label: 'Windows' },
			{ value: 'macos', label: 'macOS' },
			{ value: 'linux', label: 'Linux' },
			{ value: 'android', label: 'Android' },
			{ value: 'ios', label: 'iOS' }
		]
	},
	music: {
		label: 'Music',
		icon: '🎵',
		subcategories: []
	},
	books: {
		label: 'Books',
		icon: '📚',
		subcategories: []
	},
	other: {
		label: 'Other',
		icon: '📦',
		subcategories: []
	}
};

// TV Show types
export type ShowStatus = 'returning' | 'ended' | 'canceled' | 'in_production' | 'upcoming';

export interface TVShow {
	id: string;
	title: string;
	slug: string;
	overview: string;
	status: ShowStatus;
	imdbId?: string;
	imdbRating?: number;
	tmdbId?: number;
	posterUrl?: string;
	backdropUrl?: string;
	genres: string[];
	network?: string;
	firstAired?: Date;
	lastAired?: Date;
	nextAirDate?: Date;
	runtime?: number; // in minutes
	totalSeasons: number;
	totalEpisodes: number;
	seasons: TVSeason[];
}

export interface TVSeason {
	seasonNumber: number;
	name: string;
	overview?: string;
	posterUrl?: string;
	airDate?: Date;
	episodeCount: number;
	episodes: TVEpisode[];
}

export interface TVEpisode {
	episodeNumber: number;
	seasonNumber: number;
	title: string;
	overview?: string;
	airDate?: Date;
	runtime?: number;
	stillUrl?: string;
	imdbRating?: number;
	torrents: string[]; // torrent IDs
}

export function getStatusLabel(status: ShowStatus): string {
	switch (status) {
		case 'returning': return 'Returning Series';
		case 'ended': return 'Ended';
		case 'canceled': return 'Canceled';
		case 'in_production': return 'In Production';
		case 'upcoming': return 'Upcoming';
	}
}

export function getStatusColor(status: ShowStatus): string {
	switch (status) {
		case 'returning': return 'text-green-400';
		case 'ended': return 'text-gray-400';
		case 'canceled': return 'text-red-400';
		case 'in_production': return 'text-blue-400';
		case 'upcoming': return 'text-yellow-400';
	}
}

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
}

export type TorrentHealth = 'excellent' | 'good' | 'moderate' | 'poor' | 'dead';

export function calculateHealth(seeders: number, leechers: number): TorrentHealth {
	if (seeders === 0) return 'dead';
	const ratio = seeders / (leechers + 1);
	if (seeders >= 50 && ratio >= 2) return 'excellent';
	if (seeders >= 10 && ratio >= 1) return 'good';
	if (seeders >= 3) return 'moderate';
	return 'poor';
}

export function formatSize(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let size = bytes;
	let unitIndex = 0;
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}
	return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatSpeed(bytesPerSec: number): string {
	return `${formatSize(bytesPerSec)}/s`;
}

export function formatRatio(ratio: number): string {
	if (ratio === Infinity || isNaN(ratio)) return '∞';
	return ratio.toFixed(2);
}
