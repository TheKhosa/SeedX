import type { User, Torrent, Session } from '$lib/types';
import { randomUUID } from 'crypto';

// In-memory database (replace with real database in production)
const users: Map<string, User> = new Map();
const sessions: Map<string, Session> = new Map();
const torrents: Map<string, Torrent> = new Map();

// Index for quick lookups
const usersByEmail: Map<string, string> = new Map();
const usersByUsername: Map<string, string> = new Map();

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
	return session;
}

export function getSession(id: string): Session | undefined {
	const session = sessions.get(id);
	if (!session) return undefined;
	if (session.expiresAt < new Date()) {
		sessions.delete(id);
		return undefined;
	}
	return session;
}

export function deleteSession(id: string): void {
	sessions.delete(id);
}

// Torrent operations
export function createTorrent(data: Omit<Torrent, 'id' | 'uploadedAt' | 'downloads'>): Torrent {
	const id = randomUUID();
	const torrent: Torrent = {
		...data,
		id,
		uploadedAt: new Date(),
		downloads: 0
	};
	torrents.set(id, torrent);
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

export function searchTorrents(query: string, category?: string): Torrent[] {
	const lowerQuery = query.toLowerCase();
	return getAllTorrents().filter(t => {
		const matchesQuery = !query ||
			t.name.toLowerCase().includes(lowerQuery) ||
			t.description.toLowerCase().includes(lowerQuery);
		const matchesCategory = !category || category === 'all' || t.category === category;
		return matchesQuery && matchesCategory;
	});
}

export function incrementDownloads(id: string): void {
	const torrent = torrents.get(id);
	if (torrent) {
		torrent.downloads++;
	}
}

export function updateTorrentStats(id: string, seeders: number, leechers: number): void {
	const torrent = torrents.get(id);
	if (torrent) {
		torrent.seeders = seeders;
		torrent.leechers = leechers;
	}
}

// Seed some demo data
function seedDemoData() {
	const demoTorrents: Omit<Torrent, 'id' | 'uploadedAt' | 'downloads'>[] = [
		{
			name: 'Ubuntu 24.04 LTS Desktop',
			description: 'Official Ubuntu 24.04 LTS Desktop ISO - Free and open source operating system',
			category: 'software',
			infoHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
			size: 5_100_000_000,
			files: [{ path: 'ubuntu-24.04-desktop-amd64.iso', size: 5_100_000_000 }],
			seeders: 1250,
			leechers: 450,
			uploadedBy: 'system',
			magnetLink: 'magnet:?xt=urn:btih:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6&dn=Ubuntu+24.04+LTS'
		},
		{
			name: 'Blender 4.0 - Open Source 3D Creation',
			description: 'Blender is a free and open source 3D creation suite for artists and developers',
			category: 'software',
			infoHash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
			size: 350_000_000,
			files: [{ path: 'blender-4.0-linux-x64.tar.xz', size: 350_000_000 }],
			seeders: 890,
			leechers: 120,
			uploadedBy: 'system',
			magnetLink: 'magnet:?xt=urn:btih:b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7&dn=Blender+4.0'
		},
		{
			name: 'Big Buck Bunny 4K',
			description: 'Big Buck Bunny is a short computer-animated comedy film by the Blender Institute - Creative Commons licensed',
			category: 'movies',
			infoHash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
			size: 2_500_000_000,
			files: [{ path: 'big_buck_bunny_4k.mp4', size: 2_500_000_000 }],
			seeders: 2100,
			leechers: 890,
			uploadedBy: 'system',
			magnetLink: 'magnet:?xt=urn:btih:c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8&dn=Big+Buck+Bunny+4K'
		},
		{
			name: 'Sintel - Open Movie',
			description: 'Sintel is an independently produced short film by the Blender Institute - Creative Commons',
			category: 'movies',
			infoHash: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9',
			size: 1_800_000_000,
			files: [{ path: 'sintel_4k.mkv', size: 1_800_000_000 }],
			seeders: 560,
			leechers: 230,
			uploadedBy: 'system',
			magnetLink: 'magnet:?xt=urn:btih:d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9&dn=Sintel'
		},
		{
			name: 'Free Music Archive Collection',
			description: 'A curated collection of Creative Commons licensed music from various artists',
			category: 'music',
			infoHash: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
			size: 850_000_000,
			files: [
				{ path: 'track01.mp3', size: 8_500_000 },
				{ path: 'track02.mp3', size: 9_200_000 }
			],
			seeders: 340,
			leechers: 89,
			uploadedBy: 'system',
			magnetLink: 'magnet:?xt=urn:btih:e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0&dn=FMA+Collection'
		},
		{
			name: 'Project Gutenberg eBooks Bundle',
			description: 'Classic literature from Project Gutenberg - Public domain books in multiple formats',
			category: 'books',
			infoHash: 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
			size: 2_100_000_000,
			files: [{ path: 'gutenberg_classics.zip', size: 2_100_000_000 }],
			seeders: 180,
			leechers: 45,
			uploadedBy: 'system',
			magnetLink: 'magnet:?xt=urn:btih:f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1&dn=Gutenberg+Classics'
		},
		{
			name: 'LibreOffice 24.2',
			description: 'Free and powerful office suite - Compatible with Microsoft Office formats',
			category: 'software',
			infoHash: 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
			size: 420_000_000,
			files: [{ path: 'LibreOffice_24.2_Linux_x86-64.tar.gz', size: 420_000_000 }],
			seeders: 45,
			leechers: 12,
			uploadedBy: 'system',
			magnetLink: 'magnet:?xt=urn:btih:g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2&dn=LibreOffice+24.2'
		},
		{
			name: 'Tears of Steel 4K',
			description: 'Tears of Steel is a short science fiction film by the Blender Institute - Creative Commons',
			category: 'movies',
			infoHash: 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3',
			size: 3_200_000_000,
			files: [{ path: 'tears_of_steel_4k.mkv', size: 3_200_000_000 }],
			seeders: 2,
			leechers: 15,
			uploadedBy: 'system',
			magnetLink: 'magnet:?xt=urn:btih:h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3&dn=Tears+of+Steel'
		}
	];

	demoTorrents.forEach(t => createTorrent(t));
}

seedDemoData();
