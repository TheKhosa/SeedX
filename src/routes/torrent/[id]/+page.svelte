<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatSize, calculateHealth, type TorrentHealth } from '$lib/types';

	let { data } = $props();
	const torrent = data.torrent;
	const health = calculateHealth(torrent.seeders, torrent.leechers);

	function getHealthColor(h: TorrentHealth): string {
		const colors = {
			excellent: 'bg-green-500',
			good: 'bg-green-400',
			moderate: 'bg-yellow-500',
			poor: 'bg-orange-500',
			dead: 'bg-red-500'
		};
		return colors[h];
	}

	function getHealthTextColor(h: TorrentHealth): string {
		const colors = {
			excellent: 'text-green-500',
			good: 'text-green-400',
			moderate: 'text-yellow-500',
			poor: 'text-orange-500',
			dead: 'text-red-500'
		};
		return colors[h];
	}

	function getHealthLabel(h: TorrentHealth): string {
		return h.charAt(0).toUpperCase() + h.slice(1);
	}

	function getCategoryLabel(category: string): string {
		const labels: Record<string, string> = {
			software: 'Software',
			movies: 'Movies',
			music: 'Music',
			games: 'Games',
			books: 'Books',
			other: 'Other'
		};
		return labels[category] ?? 'Other';
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<svelte:head>
	<title>{torrent.name} - SeedX</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
	<!-- Breadcrumb -->
	<nav class="mb-6">
		<a href="/" class="text-blue-500 hover:text-blue-400 transition-colors">Browse</a>
		<span class="text-gray-500 mx-2">/</span>
		<span class="text-gray-400">{torrent.name}</span>
	</nav>

	<!-- Main Card -->
	<div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
		<!-- Header -->
		<div class="p-6 border-b border-gray-700">
			<div class="flex items-start justify-between gap-4">
				<div>
					<span class="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full mb-3">
						{getCategoryLabel(torrent.category)}
					</span>
					<h1 class="text-2xl font-bold text-white mb-2">{torrent.name}</h1>
					<p class="text-gray-400">{torrent.description}</p>
				</div>
				<div class="flex items-center gap-2">
					<span class="w-4 h-4 rounded-full {getHealthColor(health)}"></span>
					<span class="{getHealthTextColor(health)} font-medium">{getHealthLabel(health)}</span>
				</div>
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-700">
			<div class="text-center">
				<div class="text-2xl font-bold text-green-400">{torrent.seeders}</div>
				<div class="text-sm text-gray-400">Seeders</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold text-red-400">{torrent.leechers}</div>
				<div class="text-sm text-gray-400">Leechers</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold text-white">{formatSize(torrent.size)}</div>
				<div class="text-sm text-gray-400">Size</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold text-white">{torrent.downloads}</div>
				<div class="text-sm text-gray-400">Downloads</div>
			</div>
		</div>

		<!-- Details -->
		<div class="p-6 border-b border-gray-700 space-y-4">
			<h2 class="text-lg font-semibold text-white mb-4">Details</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-400">Uploaded by</span>
					<span class="text-white">{torrent.uploadedBy}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Upload date</span>
					<span class="text-white">{formatDate(torrent.uploadedAt)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Info hash</span>
					<span class="text-white font-mono text-xs">{torrent.infoHash}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Files</span>
					<span class="text-white">{torrent.files.length} file{torrent.files.length !== 1 ? 's' : ''}</span>
				</div>
			</div>
		</div>

		<!-- Files -->
		{#if torrent.files.length > 0}
			<div class="p-6 border-b border-gray-700">
				<h2 class="text-lg font-semibold text-white mb-4">Files</h2>
				<div class="space-y-2">
					{#each torrent.files as file}
						<div class="flex justify-between items-center py-2 px-3 bg-gray-900 rounded text-sm">
							<span class="text-gray-300 font-mono truncate">{file.path}</span>
							<span class="text-gray-400 ml-4 flex-shrink-0">{formatSize(file.size)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Magnet Link -->
		<div class="p-6 border-b border-gray-700">
			<h2 class="text-lg font-semibold text-white mb-4">Magnet Link</h2>
			<div class="flex gap-2">
				<input
					type="text"
					readonly
					value={torrent.magnetLink}
					class="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-gray-300 font-mono text-sm overflow-hidden"
				/>
				<button
					onclick={() => copyToClipboard(torrent.magnetLink)}
					class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
				>
					Copy
				</button>
			</div>
		</div>

		<!-- Download Actions -->
		<div class="p-6">
			<div class="flex flex-col sm:flex-row gap-4">
				<form method="POST" action="?/download" use:enhance class="flex-1">
					<a
						href={torrent.magnetLink}
						class="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
						</svg>
						Download via Magnet
					</a>
				</form>
				<a
					href="/"
					class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
				>
					Back to Directory
				</a>
			</div>
		</div>
	</div>
</div>
