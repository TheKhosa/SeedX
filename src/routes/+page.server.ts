import type { PageServerLoad } from './$types';
import { searchTorrents } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? 'all';

	const torrents = searchTorrents(query, category);

	return {
		torrents,
		query,
		category
	};
};
