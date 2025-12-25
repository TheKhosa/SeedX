import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	searchShows,
	getShowEpisodes,
	detectTVShow,
	stripHtml
} from '$lib/server/tvmaze';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	const showId = url.searchParams.get('showId');
	const torrentName = url.searchParams.get('torrent');

	try {
		// Auto-detect from torrent name
		if (torrentName) {
			const result = await detectTVShow(torrentName);

			if (!result.show) {
				return json({
					success: false,
					error: 'No TV show found matching this torrent'
				});
			}

			return json({
				success: true,
				data: {
					show: {
						id: result.show.id,
						name: result.show.name,
						premiered: result.show.premiered,
						status: result.show.status,
						genres: result.show.genres,
						rating: result.show.rating?.average,
						image: result.show.image?.medium,
						summary: stripHtml(result.show.summary),
						network: result.show.network?.name || result.show.webChannel?.name
					},
					episode: result.episode
						? {
								id: result.episode.id,
								name: result.episode.name,
								season: result.episode.season,
								number: result.episode.number,
								airdate: result.episode.airdate,
								summary: stripHtml(result.episode.summary)
							}
						: null,
					season: result.season,
					episodeNumber: result.episodeNumber,
					confidence: result.confidence
				}
			});
		}

		// Get episodes for a specific show
		if (showId) {
			const episodes = await getShowEpisodes(parseInt(showId, 10));

			// Group by season
			const seasons: Record<
				number,
				{ season: number; episodes: { number: number; name: string; airdate: string }[] }
			> = {};

			for (const ep of episodes) {
				if (!seasons[ep.season]) {
					seasons[ep.season] = { season: ep.season, episodes: [] };
				}
				seasons[ep.season].episodes.push({
					number: ep.number,
					name: ep.name,
					airdate: ep.airdate
				});
			}

			return json({
				success: true,
				data: {
					seasons: Object.values(seasons).sort((a, b) => a.season - b.season)
				}
			});
		}

		// Search for shows
		if (query) {
			const results = await searchShows(query);

			return json({
				success: true,
				data: {
					shows: results.slice(0, 10).map((r) => ({
						id: r.show.id,
						name: r.show.name,
						premiered: r.show.premiered,
						status: r.show.status,
						genres: r.show.genres,
						rating: r.show.rating?.average,
						image: r.show.image?.medium,
						network: r.show.network?.name || r.show.webChannel?.name,
						score: r.score
					}))
				}
			});
		}

		return json({ error: 'Missing query parameter' }, { status: 400 });
	} catch (error) {
		console.error('[API] TV search error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to search TV shows'
			},
			{ status: 500 }
		);
	}
};
