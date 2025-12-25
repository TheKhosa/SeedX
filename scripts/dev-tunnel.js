import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 5173;

async function main() {
	// Check if cloudflared binary exists and install if needed
	const cloudflaredBin = join(__dirname, '../node_modules/cloudflared/bin/cloudflared');

	if (!existsSync(cloudflaredBin)) {
		console.log('📦 Installing cloudflared binary...\n');
		const { install } = await import('cloudflared/lib/install.js');
		await install(cloudflaredBin);
		console.log('✅ Cloudflared installed successfully\n');
	}

	// Start vite dev server
	const vite = spawn('npx', ['vite', 'dev'], {
		stdio: ['inherit', 'pipe', 'pipe'],
		shell: true
	});

	vite.stdout.on('data', (data) => {
		process.stdout.write(data);
	});

	vite.stderr.on('data', (data) => {
		process.stderr.write(data);
	});

	// Wait for vite to start, then create tunnel
	setTimeout(async () => {
		console.log('\n🚀 Starting Cloudflare tunnel...\n');

		try {
			const { Tunnel } = await import('cloudflared');
			const tunnel = Tunnel.quick(`http://localhost:${PORT}`);

			let urlPrinted = false;

			// Listen for all output to extract URL
			tunnel.on('stdout', (output) => {
				// Look for the trycloudflare.com URL in the output
				const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
				if (match && !match[0].includes('api.') && !urlPrinted) {
					urlPrinted = true;
					console.log('');
					console.log('═'.repeat(60));
					console.log('');
					console.log('  🌐 TUNNEL URL:', match[0]);
					console.log('');
					console.log('═'.repeat(60));
					console.log('');
				}
			});

			tunnel.on('stderr', (output) => {
				// Look for the trycloudflare.com URL in stderr
				const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
				if (match && !match[0].includes('api.') && !urlPrinted) {
					urlPrinted = true;
					console.log('');
					console.log('═'.repeat(60));
					console.log('');
					console.log('  🌐 TUNNEL URL:', match[0]);
					console.log('');
					console.log('═'.repeat(60));
					console.log('');
				}
			});

			tunnel.on('url', (url) => {
				// Filter out API URLs, only show actual tunnel URLs
				if (url.includes('api.trycloudflare.com') || urlPrinted) return;
				urlPrinted = true;
				console.log('');
				console.log('═'.repeat(60));
				console.log('');
				console.log('  🌐 TUNNEL URL:', url);
				console.log('');
				console.log('═'.repeat(60));
				console.log('');
			});

			tunnel.on('error', (err) => {
				console.error('Tunnel error:', err.message);
			});

			// Handle cleanup
			process.on('SIGINT', () => {
				console.log('\nShutting down...');
				tunnel.stop();
				vite.kill();
				process.exit();
			});

		} catch (err) {
			console.error('Failed to start tunnel:', err);
		}
	}, 4000);
}

main().catch(console.error);
