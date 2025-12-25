import type { User, Torrent, Session, UserStats } from '$lib/types';
import { randomUUID } from 'crypto';
import { addTrackerToMagnet } from './tracker';
import {
	loadUsers, saveUsers,
	loadSessions, saveSessions,
	loadTorrents, saveTorrents,
	hasStoredData,
	type StoredUser, type StoredSession, type StoredTorrent
} from './storage';

// Load persisted data or initialize empty maps
const users: Map<string, User> = loadUsers() as Map<string, User>;
const sessions: Map<string, Session> = loadSessions() as Map<string, Session>;
const torrents: Map<string, Torrent> = loadTorrents() as Map<string, Torrent>;
const userStats: Map<string, UserStats> = new Map();

// Index for quick lookups - rebuild from loaded users
const usersByEmail: Map<string, string> = new Map();
const usersByUsername: Map<string, string> = new Map();

// Rebuild indexes from loaded users
for (const user of users.values()) {
	usersByEmail.set(user.email.toLowerCase(), user.id);
	usersByUsername.set(user.username.toLowerCase(), user.id);
}

console.log(`[DB] Loaded ${users.size} users, ${sessions.size} sessions, ${torrents.size} torrents from storage`);

// User operations
export function createUser(username: string, email: string, passwordHash: string): User {
	const id = randomUUID();
	const user: User = {
		id,
		username,
		email,
		passwordHash,
		createdAt: new Date()
	};
	users.set(id, user);
	usersByEmail.set(email.toLowerCase(), id);
	usersByUsername.set(username.toLowerCase(), id);

	// Persist to storage
	saveUsers(users as Map<string, StoredUser>);

	return user;
}

export function getUserById(id: string): User | undefined {
	return users.get(id);
}

export function getUserByEmail(email: string): User | undefined {
	const id = usersByEmail.get(email.toLowerCase());
	return id ? users.get(id) : undefined;
}

export function getUserByUsername(username: string): User | undefined {
	const id = usersByUsername.get(username.toLowerCase());
	return id ? users.get(id) : undefined;
}

// Session operations
export function createSession(userId: string): Session {
	const id = randomUUID();
	const session: Session = {
		id,
		userId,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
	};
	sessions.set(id, session);

	// Persist to storage
	saveSessions(sessions as Map<string, StoredSession>);

	return session;
}

export function getSession(id: string): Session | undefined {
	const session = sessions.get(id);
	if (!session) return undefined;
	if (session.expiresAt < new Date()) {
		sessions.delete(id);
		saveSessions(sessions as Map<string, StoredSession>);
		return undefined;
	}
	return session;
}

export function deleteSession(id: string): void {
	sessions.delete(id);
	saveSessions(sessions as Map<string, StoredSession>);
}

// Torrent operations
export function createTorrent(data: Omit<Torrent, 'id' | 'uploadedAt' | 'downloads'>): Torrent {
	const id = randomUUID();
	const torrent: Torrent = {
		...data,
		id,
		// Ensure SeedX tracker is added to the magnet link
		magnetLink: addTrackerToMagnet(data.magnetLink),
		uploadedAt: new Date(),
		downloads: 0
	};
	torrents.set(id, torrent);

	// Persist to storage
	saveTorrents(torrents as Map<string, StoredTorrent>);

	return torrent;
}

export function getTorrentById(id: string): Torrent | undefined {
	return torrents.get(id);
}

export function getAllTorrents(): Torrent[] {
	return Array.from(torrents.values()).sort(
		(a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
	);
}

export type SortField = 'date' | 'seeders' | 'leechers' | 'size' | 'downloads' | 'name';
export type SortOrder = 'asc' | 'desc';

export function searchTorrents(
	query: string,
	category?: string,
	subcategory?: string,
	sortBy: SortField = 'date',
	sortOrder: SortOrder = 'desc'
): Torrent[] {
	const lowerQuery = query.toLowerCase();
	let results = getAllTorrents().filter(t => {
		const matchesQuery = !query ||
			t.name.toLowerCase().includes(lowerQuery) ||
			t.description.toLowerCase().includes(lowerQuery);
		const matchesCategory = !category || category === 'all' || t.category === category;
		const matchesSubcategory = !subcategory || t.subcategory === subcategory || t.quality === subcategory;
		return matchesQuery && matchesCategory && matchesSubcategory;
	});

	// Sort results
	results.sort((a, b) => {
		let comparison = 0;
		switch (sortBy) {
			case 'seeders':
				comparison = a.seeders - b.seeders;
				break;
			case 'leechers':
				comparison = a.leechers - b.leechers;
				break;
			case 'size':
				comparison = a.size - b.size;
				break;
			case 'downloads':
				comparison = a.downloads - b.downloads;
				break;
			case 'name':
				comparison = a.name.localeCompare(b.name);
				break;
			case 'date':
			default:
				comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
				break;
		}
		return sortOrder === 'desc' ? -comparison : comparison;
	});

	return results;
}

export function incrementDownloads(id: string): void {
	const torrent = torrents.get(id);
	if (torrent) {
		torrent.downloads++;
		saveTorrents(torrents as Map<string, StoredTorrent>);
	}
}

export function updateTorrentStats(id: string, seeders: number, leechers: number): void {
	const torrent = torrents.get(id);
	if (torrent) {
		torrent.seeders = seeders;
		torrent.leechers = leechers;
		saveTorrents(torrents as Map<string, StoredTorrent>);
	}
}

// User stats operations
export function getUserStats(username: string): UserStats {
	const existing = userStats.get(username.toLowerCase());
	if (existing) return existing;

	// Calculate stats from torrents
	const userTorrents = getTorrentsByUser(username);
	const stats: UserStats = {
		uploadedTorrents: userTorrents.length,
		totalUploaded: userTorrents.reduce((sum, t) => sum + t.size * t.seeders, 0),
		totalDownloaded: userTorrents.reduce((sum, t) => sum + t.size * t.leechers, 0),
		ratio: 0,
		avgSpeed: 0
	};
	stats.ratio = stats.totalDownloaded > 0 ? stats.totalUploaded / stats.totalDownloaded : Infinity;
	stats.avgSpeed = userTorrents.length > 0 ? 1_500_000 : 0; // Simulated avg speed

	userStats.set(username.toLowerCase(), stats);
	return stats;
}

export function updateUserStats(username: string, uploaded: number, downloaded: number): void {
	const stats = getUserStats(username);
	stats.totalUploaded += uploaded;
	stats.totalDownloaded += downloaded;
	stats.ratio = stats.totalDownloaded > 0 ? stats.totalUploaded / stats.totalDownloaded : Infinity;
	userStats.set(username.toLowerCase(), stats);
}

export function getTorrentsByUser(username: string): Torrent[] {
	return Array.from(torrents.values())
		.filter(t => t.uploadedBy.toLowerCase() === username.toLowerCase())
		.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}

