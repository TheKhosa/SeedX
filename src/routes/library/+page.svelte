<script lang="ts">
	import { formatSize, formatSpeed, formatRatio, calculateHealth } from '$lib/types';

	let { data } = $props();

	function getHealthColor(health: string): string {
		switch (health) {
			case 'excellent': return 'text-green-400';
			case 'good': return 'text-green-300';
			case 'moderate': return 'text-yellow-400';
			case 'poor': return 'text-orange-400';
			case 'dead': return 'text-red-400';
			default: return 'text-gray-400';
		}
	}

	function getHealthBg(health: string): string {
		switch (health) {
			case 'excellent': return 'bg-green-500/20';
			case 'good': return 'bg-green-400/20';
			case 'moderate': return 'bg-yellow-500/20';
			case 'poor': return 'bg-orange-500/20';
			case 'dead': return 'bg-red-500/20';
			default: return 'bg-gray-500/20';
		}
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>My Library - SeedX</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">My Library</h1>
		<p class="text-gray-400">Your uploaded torrents and seeding activity</p>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
		<div class="bg-gray-800 rounded-lg p-4">
			<div class="text-gray-400 text-sm mb-1">Uploaded Torrents</div>
			<div class="text-2xl font-bold text-white">{data.stats.uploadedTorrents}</div>
		</div>
		<div class="bg-gray-800 rounded-lg p-4">
			<div class="text-gray-400 text-sm mb-1">Total Seeded</div>
			<div class="text-2xl font-bold text-green-400">{formatSize(data.stats.totalUploaded)}</div>
		</div>
		<div class="bg-gray-800 rounded-lg p-4">
			<div class="text-gray-400 text-sm mb-1">Total Leeched</div>
			<div class="text-2xl font-bold text-red-400">{formatSize(data.stats.totalDownloaded)}</div>
		</div>
		<div class="bg-gray-800 rounded-lg p-4">
			<div class="text-gray-400 text-sm mb-1">Ratio</div>
			<div class="text-2xl font-bold {data.stats.ratio >= 1 ? 'text-green-400' : 'text-red-400'}">
				{formatRatio(data.stats.ratio)}
			</div>
		</div>
		<div class="bg-gray-800 rounded-lg p-4">
			<div class="text-gray-400 text-sm mb-1">Avg Speed</div>
			<div class="text-2xl font-bold text-blue-400">{formatSpeed(data.stats.avgSpeed)}</div>
		</div>
	</div>

	<!-- Torrents List -->
	<div class="bg-gray-800 rounded-lg overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-700">
			<h2 class="text-lg font-semibold">Your Uploads</h2>
		</div>

		{#if data.torrents.length === 0}
			<div class="px-6 py-12 text-center">
				<p class="text-gray-400 mb-4">You haven't uploaded any torrents yet.</p>
				<a
					href="/upload"
					class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
				>
					Upload Your First Torrent
				</a>
			</div>
		{:else}
			<div class="divide-y divide-gray-700">
				{#each data.torrents as torrent}
					{@const health = calculateHealth(torrent.seeders, torrent.leechers)}
					<a href="/torrent/{torrent.id}" class="block px-6 py-4 hover:bg-gray-700/50 transition-colors">
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center space-x-3">
									<h3 class="text-white font-medium truncate">{torrent.name}</h3>
									<span class="px-2 py-0.5 text-xs rounded-full {getHealthBg(health)} {getHealthColor(health)} capitalize">
										{health}
									</span>
								</div>
								<div class="flex items-center space-x-4 mt-1 text-sm text-gray-400">
									<span>{formatSize(torrent.size)}</span>
									<span class="capitalize">{torrent.category}</span>
									<span>{formatDate(torrent.uploadedAt)}</span>
								</div>
							</div>
							<div class="flex items-center space-x-6 text-sm">
								<div class="text-center">
									<div class="text-green-400 font-medium">{torrent.seeders}</div>
									<div class="text-gray-500 text-xs">Seeders</div>
								</div>
								<div class="text-center">
									<div class="text-red-400 font-medium">{torrent.leechers}</div>
									<div class="text-gray-500 text-xs">Leechers</div>
								</div>
								<div class="text-center">
									<div class="text-blue-400 font-medium">{torrent.downloads}</div>
									<div class="text-gray-500 text-xs">Downloads</div>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
