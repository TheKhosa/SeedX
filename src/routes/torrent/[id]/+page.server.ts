import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getTorrentById, incrementDownloads } from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const torrent = getTorrentById(params.id);

	if (!torrent) {
		throw error(404, 'Torrent not found');
	}

	return { torrent };
};

export const actions: Actions = {
	download: async ({ params }) => {
		incrementDownloads(params.id);
		return { success: true };
	}
};
