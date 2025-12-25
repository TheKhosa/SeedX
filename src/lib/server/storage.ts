import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), '.data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');
const TORRENTS_FILE = join(DATA_DIR, 'torrents.json');

// Ensure data directory exists
function ensureDataDir() {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}
}

// Generic JSON storage functions
function readJsonFile<T>(filePath: string, defaultValue: T): T {
	ensureDataDir();
	if (!existsSync(filePath)) {
		return defaultValue;
	}
	try {
		const data = readFileSync(filePath, 'utf-8');
		return JSON.parse(data, (key, value) => {
			// Revive Date objects
			if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
				return new Date(value);
			}
			return value;
		});
	} catch (error) {
		console.error(`Error reading ${filePath}:`, error);
		return defaultValue;
	}
}

function writeJsonFile<T>(filePath: string, data: T): void {
	ensureDataDir();
	try {
		writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
	} catch (error) {
		console.error(`Error writing ${filePath}:`, error);
	}
}

// User storage
export interface StoredUser {
	id: string;
	username: string;
	email: string;
	passwordHash: string;
	createdAt: Date;
}

export function loadUsers(): Map<string, StoredUser> {
	const users = readJsonFile<StoredUser[]>(USERS_FILE, []);
	return new Map(users.map(u => [u.id, u]));
}

export function saveUsers(users: Map<string, StoredUser>): void {
	writeJsonFile(USERS_FILE, Array.from(users.values()));
}

// Session storage
export interface StoredSession {
	id: string;
	userId: string;
	expiresAt: Date;
}

export function loadSessions(): Map<string, StoredSession> {
	const sessions = readJsonFile<StoredSession[]>(SESSIONS_FILE, []);
	// Filter out expired sessions
	const now = new Date();
	const validSessions = sessions.filter(s => new Date(s.expiresAt) > now);
	return new Map(validSessions.map(s => [s.id, s]));
}

export function saveSessions(sessions: Map<string, StoredSession>): void {
	writeJsonFile(SESSIONS_FILE, Array.from(sessions.values()));
}

// Torrent storage
export interface StoredTorrent {
	id: string;
	name: string;
	description: string;
	category: string;
	subcategory?: string;
	infoHash: string;
	size: number;
	files: { path: string; size: number }[];
	seeders: number;
	leechers: number;
	downloads: number;
	uploadedBy: string;
	uploadedAt: Date;
	magnetLink: string;
	showId?: string;
	seasonNumber?: number;
	episodeNumber?: number;
	quality?: string;
}

export function loadTorrents(): Map<string, StoredTorrent> {
	const torrents = readJsonFile<StoredTorrent[]>(TORRENTS_FILE, []);
	return new Map(torrents.map(t => [t.id, t]));
}

export function saveTorrents(torrents: Map<string, StoredTorrent>): void {
	writeJsonFile(TORRENTS_FILE, Array.from(torrents.values()));
}

// Check if we have any stored data
export function hasStoredData(): boolean {
	return existsSync(USERS_FILE) || existsSync(TORRENTS_FILE);
}
