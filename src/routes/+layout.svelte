<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { enhance } from '$app/forms';
	import { formatSize, formatSpeed, formatRatio } from '$lib/types';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<nav class="bg-gray-800 border-b border-gray-700">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center space-x-8">
					<a href="/" class="text-2xl font-bold text-blue-500">SeedX</a>
					<div class="hidden md:flex space-x-4">
						<a href="/" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
							Browse
						</a>
						<a href="/library" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
							My Library
						</a>
						<a href="/upload" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
							Upload
						</a>
					</div>
				</div>
				<div class="flex items-center space-x-6">
					{#if data.stats}
						<div class="hidden lg:flex items-center space-x-4 text-xs">
							<div class="flex items-center space-x-1">
								<span class="text-green-400">↑</span>
								<span class="text-gray-400">{formatSize(data.stats.totalUploaded)}</span>
							</div>
							<div class="flex items-center space-x-1">
								<span class="text-red-400">↓</span>
								<span class="text-gray-400">{formatSize(data.stats.totalDownloaded)}</span>
							</div>
							<div class="flex items-center space-x-1">
								<span class="text-blue-400">⚡</span>
								<span class="text-gray-400">{formatSpeed(data.stats.avgSpeed)}</span>
							</div>
							<div class="px-2 py-1 rounded bg-gray-700">
								<span class="text-gray-400">Ratio: </span>
								<span class={data.stats.ratio >= 1 ? 'text-green-400' : 'text-red-400'}>
									{formatRatio(data.stats.ratio)}
								</span>
							</div>
							<div class="px-2 py-1 rounded bg-gray-700">
								<span class="text-gray-400">Uploads: </span>
								<span class="text-white">{data.stats.uploadedTorrents}</span>
							</div>
						</div>
					{/if}
					<span class="text-gray-400 text-sm">
						<span class="text-white font-medium">{data.user.username}</span>
					</span>
					<form method="POST" action="/logout" use:enhance>
						<button
							type="submit"
							class="text-gray-400 hover:text-white text-sm font-medium transition-colors"
						>
							Logout
						</button>
					</form>
				</div>
			</div>
		</div>
	</nav>
{/if}

{@render children()}
