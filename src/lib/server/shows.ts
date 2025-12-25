import type { TVShow, TVSeason, TVEpisode, ShowStatus } from '$lib/types';
import { randomUUID } from 'crypto';

// In-memory TV shows database
const shows: Map<string, TVShow> = new Map();
const showsBySlug: Map<string, string> = new Map();

// Show operations
export function createShow(data: Omit<TVShow, 'id'>): TVShow {
	const id = randomUUID();
	const show: TVShow = { ...data, id };
	shows.set(id, show);
	showsBySlug.set(data.slug, id);
	return show;
}

export function getShowById(id: string): TVShow | undefined {
	return shows.get(id);
}

export function getShowBySlug(slug: string): TVShow | undefined {
	const id = showsBySlug.get(slug);
	return id ? shows.get(id) : undefined;
}

export function getAllShows(): TVShow[] {
	return Array.from(shows.values()).sort((a, b) => a.title.localeCompare(b.title));
}

export function getShowsByStatus(status: ShowStatus): TVShow[] {
	return getAllShows().filter(s => s.status === status);
}

export function searchShows(query: string): TVShow[] {
	const lowerQuery = query.toLowerCase();
	return getAllShows().filter(s =>
		s.title.toLowerCase().includes(lowerQuery) ||
		s.overview.toLowerCase().includes(lowerQuery) ||
		s.genres.some(g => g.toLowerCase().includes(lowerQuery))
	);
}

export function getPopularShows(limit = 20): TVShow[] {
	// Sort by IMDB rating (shows with ratings first)
	return getAllShows()
		.filter(s => s.imdbRating)
		.sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0))
		.slice(0, limit);
}

export function getRecentlyAiredShows(limit = 20): TVShow[] {
	const now = new Date();
	return getAllShows()
		.filter(s => s.status === 'returning' && s.lastAired)
		.sort((a, b) => {
			const aDate = a.lastAired ? a.lastAired.getTime() : 0;
			const bDate = b.lastAired ? b.lastAired.getTime() : 0;
			return bDate - aDate;
		})
		.slice(0, limit);
}

export function addTorrentToEpisode(showId: string, seasonNum: number, episodeNum: number, torrentId: string): boolean {
	const show = shows.get(showId);
	if (!show) return false;

	const season = show.seasons.find(s => s.seasonNumber === seasonNum);
	if (!season) return false;

	const episode = season.episodes.find(e => e.episodeNumber === episodeNum);
	if (!episode) return false;

	if (!episode.torrents.includes(torrentId)) {
		episode.torrents.push(torrentId);
	}
	return true;
}

export function getEpisodeTorrents(showId: string, seasonNum: number, episodeNum: number): string[] {
	const show = shows.get(showId);
	if (!show) return [];

	const season = show.seasons.find(s => s.seasonNumber === seasonNum);
	if (!season) return [];

	const episode = season.episodes.find(e => e.episodeNumber === episodeNum);
	return episode?.torrents || [];
}
