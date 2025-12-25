import type { PageServerLoad } from './$types';
import { getAllShows, searchShows } from '$lib/server/shows';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const sortBy = url.searchParams.get('sort') ?? 'name';

	let shows = query ? searchShows(query) : getAllShows();

	// Filter by status
	if (status) {
		shows = shows.filter(s => s.status === status);
	}

	// Sort shows
	shows = [...shows].sort((a, b) => {
		switch (sortBy) {
			case 'rating':
				return (b.imdbRating ?? 0) - (a.imdbRating ?? 0);
			case 'newest':
				return (b.firstAired?.getTime() ?? 0) - (a.firstAired?.getTime() ?? 0);
			case 'updated':
				return (b.lastAired?.getTime() ?? 0) - (a.lastAired?.getTime() ?? 0);
			default:
				return a.title.localeCompare(b.title);
		}
	});

	return {
		shows,
		query,
		status,
		sortBy
	};
};
