export interface User {
	id: string;
	username: string;
	email: string;
	passwordHash: string;
	createdAt: Date;
}

export interface Torrent {
	id: string;
	name: string;
	description: string;
	category: TorrentCategory;
	infoHash: string;
	size: number;
	files: TorrentFile[];
	seeders: number;
	leechers: number;
	downloads: number;
	uploadedBy: string;
	uploadedAt: Date;
	magnetLink: string;
}

export interface TorrentFile {
	path: string;
	size: number;
}

export type TorrentCategory =
	| 'software'
	| 'movies'
	| 'music'
	| 'games'
	| 'books'
	| 'other';

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
