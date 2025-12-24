<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { enhance } from '$app/forms';

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
						<a href="/upload" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
							Upload
						</a>
					</div>
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-gray-400 text-sm">Welcome, <span class="text-white font-medium">{data.user.username}</span></span>
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
