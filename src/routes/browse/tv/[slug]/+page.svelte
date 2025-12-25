<script lang="ts">
	import { getStatusLabel, getStatusColor, formatSize, calculateHealth, type TorrentHealth } from '$lib/types';

	let { data } = $props();

	let expandedSeasons = $state<Set<number>>(new Set([1]));

	function toggleSeason(seasonNum: number) {
		const newSet = new Set(expandedSeasons);
		if (newSet.has(seasonNum)) {
			newSet.delete(seasonNum);
		} else {
			newSet.add(seasonNum);
		}
		expandedSeasons = newSet;
	}

	function expandAll() {
		expandedSeasons = new Set(data.show.seasons.map(s => s.seasonNumber));
	}

	function collapseAll() {
		expandedSeasons = new Set();
	}

	function formatDate(date: Date | undefined): string {
		if (!date) return 'TBA';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getHealthColor(health: TorrentHealth): string {
		const colors = {
			excellent: 'bg-green-500',
			good: 'bg-green-400',
			moderate: 'bg-yellow-500',
			poor: 'bg-orange-500',
			dead: 'bg-red-500'
		};
		return colors[health];
	}

	function countSeasonTorrents(seasonNum: number): number {
		const season = data.show.seasons.find(s => s.seasonNumber === seasonNum);
		if (!season) return 0;
		return season.episodes.reduce((total, ep) => total + ep.torrents.length, 0);
	}

	function getTotalTorrents(): number {
		return data.show.seasons.reduce((total, season) =>
			total + season.episodes.reduce((epTotal, ep) => epTotal + ep.torrents.length, 0), 0);
	}
</script>

<svelte:head>
	<title>{data.show.title} - SeedX</title>
	<meta name="description" content={data.show.overview} />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm text-gray-400 mb-6">
		<a href="/" class="hover:text-white">Home</a>
		<span>/</span>
		<a href="/browse/tv" class="hover:text-white">TV Shows</a>
		<span>/</span>
		<span class="text-white">{data.show.title}</span>
	</div>

	<!-- Show Header -->
	<div class="flex flex-col lg:flex-row gap-8 mb-8">
		<!-- Poster -->
		<div class="flex-shrink-0 w-64">
			{#if data.show.posterUrl}
				<img
					src={data.show.posterUrl}
					alt={data.show.title}
					class="w-full rounded-lg shadow-xl"
				/>
			{:else}
				<div class="w-full aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center text-8xl text-gray-700">
					📺
				</div>
			{/if}
		</div>

		<!-- Info -->
		<div class="flex-1">
			<div class="flex items-start gap-4 mb-4">
				<h1 class="text-4xl font-bold text-white">{data.show.title}</h1>
				{#if data.show.imdbRating}
					<a
						href="https://www.imdb.com/title/{data.show.imdbId}"
						target="_blank"
						rel="noopener"
						class="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-black rounded font-bold text-lg hover:bg-yellow-400 transition-colors"
					>
						<span>★</span>
						{data.show.imdbRating.toFixed(1)}
					</a>
				{/if}
			</div>

			<!-- Status and Network -->
			<div class="flex flex-wrap items-center gap-4 mb-4">
				<span class="px-3 py-1 bg-gray-800 rounded-full text-sm font-medium {getStatusColor(data.show.status)}">
					{getStatusLabel(data.show.status)}
				</span>
				{#if data.show.network}
					<span class="text-gray-400">{data.show.network}</span>
				{/if}
				{#if data.show.runtime}
					<span class="text-gray-400">{data.show.runtime} min</span>
				{/if}
			</div>

			<!-- Genres -->
			{#if data.show.genres.length > 0}
				<div class="flex flex-wrap gap-2 mb-4">
					{#each data.show.genres as genre}
						<span class="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300">{genre}</span>
					{/each}
				</div>
			{/if}

			<!-- Overview -->
			<p class="text-gray-300 text-lg mb-6 leading-relaxed">{data.show.overview}</p>

			<!-- Air Dates -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
				<div class="bg-gray-800 rounded-lg p-4">
					<div class="text-sm text-gray-400 mb-1">First Aired</div>
					<div class="text-white font-medium">{formatDate(data.show.firstAired)}</div>
				</div>
				<div class="bg-gray-800 rounded-lg p-4">
					<div class="text-sm text-gray-400 mb-1">Last Aired</div>
					<div class="text-white font-medium">{formatDate(data.show.lastAired)}</div>
				</div>
				{#if data.show.status === 'returning' && data.show.nextAirDate}
					<div class="bg-gray-800 rounded-lg p-4 border border-green-600">
						<div class="text-sm text-green-400 mb-1">Next Episode</div>
						<div class="text-white font-medium">{formatDate(data.show.nextAirDate)}</div>
					</div>
				{/if}
				<div class="bg-gray-800 rounded-lg p-4">
					<div class="text-sm text-gray-400 mb-1">Total</div>
					<div class="text-white font-medium">{data.show.totalSeasons} Seasons • {data.show.totalEpisodes} Episodes</div>
				</div>
			</div>

			<!-- Torrent Stats -->
			<div class="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div>
						<span class="text-blue-300 font-medium">{getTotalTorrents()}</span>
						<span class="text-gray-400"> torrents available</span>
					</div>
					{#if getTotalTorrents() > 0}
						<span class="text-green-400 text-sm">Ready to download</span>
					{:else}
						<span class="text-gray-500 text-sm">No torrents uploaded yet</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Seasons & Episodes -->
	<div class="mb-8">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-2xl font-bold text-white">Seasons & Episodes</h2>
			<div class="flex gap-2">
				<button
					onclick={expandAll}
					class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
				>
					Expand All
				</button>
				<button
					onclick={collapseAll}
					class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
				>
					Collapse All
				</button>
			</div>
		</div>

		<div class="space-y-4">
			{#each data.show.seasons as season}
				{@const isExpanded = expandedSeasons.has(season.seasonNumber)}
				{@const torrentCount = countSeasonTorrents(season.seasonNumber)}
				<div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
					<!-- Season Header -->
					<button
						onclick={() => toggleSeason(season.seasonNumber)}
						class="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors"
					>
						<div class="flex items-center gap-4">
							<svg
								class="w-5 h-5 text-gray-400 transition-transform {isExpanded ? 'rotate-90' : ''}"
								fill="none" stroke="currentColor" viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
							</svg>
							<div class="text-left">
								<div class="text-lg font-semibold text-white">{season.name}</div>
								<div class="text-sm text-gray-400">
									{season.episodeCount} episodes
									{#if season.airDate}
										• {formatDate(season.airDate)}
									{/if}
								</div>
							</div>
						</div>
						<div class="flex items-center gap-4">
							{#if torrentCount > 0}
								<span class="px-2 py-1 bg-blue-600 rounded text-sm text-white">
									{torrentCount} torrent{torrentCount !== 1 ? 's' : ''}
								</span>
							{:else}
								<span class="px-2 py-1 bg-gray-700 rounded text-sm text-gray-400">
									No torrents
								</span>
							{/if}
						</div>
					</button>

					<!-- Episodes -->
					{#if isExpanded}
						<div class="border-t border-gray-700">
							{#each season.episodes as episode}
								{@const hasTorrents = episode.torrents.length > 0}
								<div class="border-b border-gray-700 last:border-b-0">
									<!-- Episode Row -->
									<div class="flex items-center gap-4 p-4 {hasTorrents ? 'bg-gray-750' : ''}">
										<div class="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-lg font-bold text-gray-400">
											{episode.episodeNumber}
										</div>
										<div class="flex-1 min-w-0">
											<div class="font-medium text-white truncate">
												S{String(episode.seasonNumber).padStart(2, '0')}E{String(episode.episodeNumber).padStart(2, '0')} - {episode.title}
											</div>
											{#if episode.airDate}
												<div class="text-sm text-gray-400">
													Aired: {formatDate(episode.airDate)}
													{#if episode.runtime}
														• {episode.runtime} min
													{/if}
												</div>
											{/if}
										</div>
										<div class="flex items-center gap-2">
											{#if episode.imdbRating}
												<span class="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">
													<span>★</span> {episode.imdbRating.toFixed(1)}
												</span>
											{/if}
											{#if hasTorrents}
												<span class="px-2 py-1 bg-green-600 rounded text-sm text-white">
													{episode.torrents.length} available
												</span>
											{:else}
												<span class="px-2 py-1 bg-gray-600 rounded text-sm text-gray-400">
													Not available
												</span>
											{/if}
										</div>
									</div>

									<!-- Torrent List for Episode -->
									{#if hasTorrents}
										<div class="bg-gray-900 px-4 py-3 space-y-2">
											{#each episode.torrents as torrentId}
												{@const torrent = data.torrentsMap[torrentId]}
												{#if torrent}
													{@const health = calculateHealth(torrent.seeders, torrent.leechers)}
													<div class="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
														<div class="flex-1 min-w-0">
															<div class="text-sm font-medium text-white truncate">{torrent.name}</div>
															<div class="flex items-center gap-3 text-xs text-gray-400 mt-1">
																<span>{formatSize(torrent.size)}</span>
																{#if torrent.quality}
																	<span class="px-1.5 py-0.5 bg-blue-900 rounded text-blue-300 uppercase">{torrent.quality}</span>
																{/if}
																<span class="flex items-center gap-1">
																	<span class="w-2 h-2 rounded-full {getHealthColor(health)}"></span>
																	<span class="text-green-400">{torrent.seeders}</span>/<span class="text-red-400">{torrent.leechers}</span>
																</span>
															</div>
														</div>
														<a
															href={torrent.magnetLink}
															class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white font-medium transition-colors"
														>
															Magnet
														</a>
													</div>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
