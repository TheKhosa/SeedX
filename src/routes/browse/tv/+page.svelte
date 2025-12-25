<script lang="ts">
	import { goto } from '$app/navigation';
	import { getStatusLabel, getStatusColor, type ShowStatus } from '$lib/types';

	let { data } = $props();

	let searchQuery = $state(data.query);
	let selectedStatus = $state(data.status);
	let sortBy = $state(data.sortBy);

	const statusOptions: { value: ShowStatus | ''; label: string }[] = [
		{ value: '', label: 'All Status' },
		{ value: 'returning', label: 'Returning Series' },
		{ value: 'ended', label: 'Ended' },
		{ value: 'canceled', label: 'Canceled' },
		{ value: 'in_production', label: 'In Production' },
		{ value: 'upcoming', label: 'Upcoming' }
	];

	const sortOptions = [
		{ value: 'name', label: 'Name A-Z' },
		{ value: 'rating', label: 'IMDB Rating' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'updated', label: 'Recently Updated' }
	];

	function handleSearch(e: Event) {
		e.preventDefault();
		updateUrl();
	}

	function updateUrl() {
		const params = new URLSearchParams();
		if (searchQuery) params.set('q', searchQuery);
		if (selectedStatus) params.set('status', selectedStatus);
		if (sortBy && sortBy !== 'name') params.set('sort', sortBy);
		goto(`/browse/tv?${params.toString()}`);
	}

	function formatDate(date: Date | undefined): string {
		if (!date) return 'TBA';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function countTorrents(show: typeof data.shows[0]): number {
		return show.seasons.reduce((total, season) =>
			total + season.episodes.reduce((epTotal, ep) => epTotal + ep.torrents.length, 0), 0);
	}
</script>

<svelte:head>
	<title>TV Shows - SeedX</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-2 text-sm text-gray-400 mb-2">
			<a href="/" class="hover:text-white">Home</a>
			<span>/</span>
			<span class="text-white">TV Shows</span>
		</div>
		<h1 class="text-3xl font-bold mb-2">TV Shows</h1>
		<p class="text-gray-400">Browse TV series and download episodes by season</p>
	</div>

	<!-- Search and Filters -->
	<form onsubmit={handleSearch} class="mb-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
		<div class="flex flex-col lg:flex-row gap-4">
			<div class="flex-1">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search TV shows..."
					class="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<select
				bind:value={selectedStatus}
				onchange={updateUrl}
				class="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				{#each statusOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			<select
				bind:value={sortBy}
				onchange={updateUrl}
				class="px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				{#each sortOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			<button
				type="submit"
				class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
			>
				Search
			</button>
		</div>
	</form>

	<!-- Results Count -->
	<div class="mb-4 text-gray-400">
		{data.shows.length} show{data.shows.length !== 1 ? 's' : ''} found
		{#if data.query}
			for "{data.query}"
		{/if}
	</div>

	<!-- Shows Grid -->
	{#if data.shows.length === 0}
		<div class="text-center py-16 bg-gray-800 rounded-lg">
			<p class="text-gray-400 text-lg">No TV shows found</p>
			<p class="text-gray-500 mt-2">Try adjusting your search or filters</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each data.shows as show}
				{@const torrentCount = countTorrents(show)}
				<a
					href="/browse/tv/{show.slug}"
					class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-500 transition-all group"
				>
					<!-- Poster -->
					<div class="aspect-[2/3] bg-gray-900 relative overflow-hidden">
						{#if show.posterUrl}
							<img
								src={show.posterUrl}
								alt={show.title}
								class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center text-6xl text-gray-700">
								📺
							</div>
						{/if}

						<!-- IMDB Rating Badge -->
						{#if show.imdbRating}
							<div class="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded font-bold text-sm flex items-center gap-1">
								<span>★</span>
								{show.imdbRating.toFixed(1)}
							</div>
						{/if}

						<!-- Status Badge -->
						<div class="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-sm font-medium {getStatusColor(show.status)}">
							{getStatusLabel(show.status)}
						</div>

						<!-- Torrent Count Badge -->
						{#if torrentCount > 0}
							<div class="absolute bottom-2 right-2 px-2 py-1 bg-blue-600 rounded text-sm font-medium text-white">
								{torrentCount} torrent{torrentCount !== 1 ? 's' : ''}
							</div>
						{/if}
					</div>

					<!-- Info -->
					<div class="p-4">
						<h3 class="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
							{show.title}
						</h3>
						<div class="text-sm text-gray-400 mt-1">
							{show.totalSeasons} season{show.totalSeasons !== 1 ? 's' : ''} • {show.totalEpisodes} episodes
						</div>
						{#if show.network}
							<div class="text-sm text-gray-500 mt-1">{show.network}</div>
						{/if}
						{#if show.genres.length > 0}
							<div class="flex flex-wrap gap-1 mt-2">
								{#each show.genres.slice(0, 3) as genre}
									<span class="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">{genre}</span>
								{/each}
							</div>
						{/if}

						<!-- Air Date Info -->
						<div class="text-xs text-gray-500 mt-3 space-y-1">
							{#if show.firstAired}
								<div>First Aired: {formatDate(show.firstAired)}</div>
							{/if}
							{#if show.status === 'returning' && show.nextAirDate}
								<div class="text-green-400">Next Episode: {formatDate(show.nextAirDate)}</div>
							{:else if show.lastAired}
								<div>Last Aired: {formatDate(show.lastAired)}</div>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
