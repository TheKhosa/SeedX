import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getShowBySlug } from '$lib/server/shows';
import { getTorrentById } from '$lib/server/db';
import type { Torrent } from '$lib/types';

export const load: PageServerLoad = async ({ params }) => {
	const show = getShowBySlug(params.slug);

	if (!show) {
		throw error(404, 'Show not found');
	}

	// Collect all torrent IDs from all episodes
	const torrentIds = new Set<string>();
	for (const season of show.seasons) {
		for (const episode of season.episodes) {
			for (const torrentId of episode.torrents) {
				torrentIds.add(torrentId);
			}
		}
	}

	// Fetch torrent details
	const torrentsMap: Record<string, Torrent> = {};
	for (const id of torrentIds) {
		const torrent = getTorrentById(id);
		if (torrent) {
			torrentsMap[id] = torrent;
		}
	}

	return {
		show,
		torrentsMap
	};
};
