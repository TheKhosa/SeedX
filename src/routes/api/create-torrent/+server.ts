import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createTorrentFile } from '$lib/server/torrent-utils';
import { seedTorrent } from '$lib/server/seeder';
import { createTorrent } from '$lib/server/db';
import { addTorrentToSeedbox } from '$lib/server/seedbox';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const name = formData.get('name')?.toString() || '';
		const description = formData.get('description')?.toString() || '';
		const category = formData.get('category')?.toString() || 'other';
		const comment = formData.get('comment')?.toString() || '';
		const isPrivate = formData.get('private') === 'true';
		const autoSeed = formData.get('autoSeed') === 'true';

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Create the torrent file
		const buffer = Buffer.from(await file.arrayBuffer());
		const { torrentBuffer, info } = await createTorrentFile(buffer, {
			name: name || file.name,
			comment,
			isPrivate
		});

		// Create database entry
		const torrent = createTorrent({
			name: name || info.name,
			description: description || `Created from ${file.name}`,
			category: category as any,
			infoHash: info.infoHash,
			size: info.size,
			files: info.files,
			seeders: autoSeed ? 1 : 0,
			leechers: 0,
			uploadedBy: locals.user.username,
			magnetLink: info.magnetLink
		});

		// Auto-seed if requested
		if (autoSeed) {
			// Add to WebTorrent seeder
			const seedResult = await seedTorrent(torrentBuffer, torrent.id);
			if (!seedResult.success) {
				console.warn(`[Create] WebTorrent seeding failed: ${seedResult.error}`);
			}

			// Also add to Transmission seedbox
			const seedboxResult = await addTorrentToSeedbox(info.magnetLink);
			if (!seedboxResult.success) {
				console.warn(`[Create] Seedbox seeding failed: ${seedboxResult.error}`);
			}
		}

		// Return the torrent file for download
		return new Response(torrentBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/x-bittorrent',
				'Content-Disposition': `attachment; filename="${encodeURIComponent(info.name)}.torrent"`,
				'X-Torrent-Id': torrent.id,
				'X-Info-Hash': info.infoHash,
				'X-Magnet-Link': info.magnetLink
			}
		});
	} catch (error) {
		console.error('[API] Create torrent error:', error);
		return json({
			error: error instanceof Error ? error.message : 'Failed to create torrent'
		}, { status: 500 });
	}
};
