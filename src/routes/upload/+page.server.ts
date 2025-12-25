import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createTorrent } from '$lib/server/db';
import { addTrackerToMagnet } from '$lib/server/tracker';
import { addTorrentToSeedbox } from '$lib/server/seedbox';
import { seedTorrent } from '$lib/server/seeder';
import { getAllShows, addTorrentToEpisode } from '$lib/server/shows';
import type { TorrentCategory, TorrentSubcategory, VideoQuality } from '$lib/types';

export const load: PageServerLoad = async () => {
	const shows = getAllShows();
	return { shows };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString() ?? '';
		const description = data.get('description')?.toString() ?? '';
		const category = data.get('category')?.toString() as TorrentCategory ?? '';
		const subcategory = data.get('subcategory')?.toString() as TorrentSubcategory | undefined;
		const quality = data.get('quality')?.toString() as VideoQuality | undefined;
		const magnetLink = data.get('magnetLink')?.toString() ?? '';
		const size = parseInt(data.get('size')?.toString() ?? '0', 10);
		const seeders = parseInt(data.get('seeders')?.toString() ?? '1', 10);
		const legal = data.get('legal');

		// TV Show episode linking
		const showId = data.get('showId')?.toString() ?? '';
		const seasonNumber = parseInt(data.get('seasonNumber')?.toString() ?? '0', 10);
		const episodeNumber = parseInt(data.get('episodeNumber')?.toString() ?? '0', 10);

		if (!name || !description || !category || !magnetLink || !size) {
			return fail(400, {
				error: 'All fields are required',
				name, description, category, magnetLink, size: size.toString(), seeders: seeders.toString(),
				subcategory, quality, showId, seasonNumber: seasonNumber.toString(), episodeNumber: episodeNumber.toString()
			});
		}

		if (!magnetLink.startsWith('magnet:?')) {
			return fail(400, {
				error: 'Invalid magnet link format',
				name, description, category, magnetLink, size: size.toString(), seeders: seeders.toString(),
				subcategory, quality, showId, seasonNumber: seasonNumber.toString(), episodeNumber: episodeNumber.toString()
			});
		}

		if (!legal) {
			return fail(400, {
				error: 'You must confirm the content is legal to distribute',
				name, description, category, magnetLink, size: size.toString(), seeders: seeders.toString(),
				subcategory, quality, showId, seasonNumber: seasonNumber.toString(), episodeNumber: episodeNumber.toString()
			});
		}

		// Extract info hash from magnet link
		const infoHashMatch = magnetLink.match(/btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/);
		const infoHash = infoHashMatch ? infoHashMatch[1] : '';

		if (!infoHash) {
			return fail(400, {
				error: 'Could not extract info hash from magnet link',
				name, description, category, magnetLink, size: size.toString(), seeders: seeders.toString(),
				subcategory, quality, showId, seasonNumber: seasonNumber.toString(), episodeNumber: episodeNumber.toString()
			});
		}

		// Add SeedX tracker to the magnet link
		const magnetWithTracker = addTrackerToMagnet(magnetLink);

		const torrent = createTorrent({
			name,
			description,
			category,
			subcategory: subcategory || undefined,
			infoHash,
			size,
			files: [{ path: name, size }],
			seeders: Math.max(0, seeders),
			leechers: 0,
			uploadedBy: locals.user!.username,
			magnetLink: magnetWithTracker,
			// TV/Movie specific
			showId: showId || undefined,
			seasonNumber: seasonNumber || undefined,
			episodeNumber: episodeNumber || undefined,
			quality: quality || undefined
		});

		// Link torrent to episode if specified
		if (showId && seasonNumber && episodeNumber) {
			const linked = addTorrentToEpisode(showId, seasonNumber, episodeNumber, torrent.id);
			if (linked) {
				console.log(`[Upload] Linked torrent ${torrent.id} to ${showId} S${seasonNumber}E${episodeNumber}`);
			}
		}

		// Add to WebTorrent seeder
		const seederResult = await seedTorrent(magnetWithTracker, torrent.id);
		if (seederResult.success) {
			console.log(`[Upload] Torrent added to WebTorrent seeder: ${name}`);
		}

		// Add to Transmission seedbox for automatic seeding
		const seedboxResult = await addTorrentToSeedbox(magnetWithTracker);
		if (seedboxResult.success) {
			console.log(`[Upload] Torrent added to Transmission seedbox: ${name}`);
		}

		return { success: true };
	}
};
