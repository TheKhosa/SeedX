import { spawn } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let PORT = 5173;
let tunnelStarted = false;
let viteProcess = null;
let tunnelInstance = null;

// Write tunnel URL to config file for server to read
function setTunnelUrl(url) {
	const configFile = join(__dirname, '..', '.tunnel-url');
	writeFileSync(configFile, url, 'utf-8');
	console.log(`  📡 Tracker Announce: ${url}/announce`);
}

// Start the cloudflare tunnel
async function startTunnel() {
	if (tunnelStarted) return;
	tunnelStarted = true;

	console.log(`\n🚀 Starting Cloudflare tunnel for port ${PORT}...\n`);

	try {
		const { Tunnel } = await import('cloudflared');
		tunnelInstance = Tunnel.quick(`http://localhost:${PORT}`);

		let urlPrinted = false;

		function handleTunnelUrl(url) {
			if (urlPrinted) return;
			urlPrinted = true;
			console.log('');
			console.log('═'.repeat(60));
			console.log('');
			console.log('  🌐 TUNNEL URL:', url);
			console.log('');
			// Notify the server of the tunnel URL for dynamic tracker
			setTunnelUrl(url);
			console.log('');
			console.log('═'.repeat(60));
			console.log('');
		}

		// Listen for all output to extract URL
		tunnelInstance.on('stdout', (output) => {
			const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
			if (match && !match[0].includes('api.')) {
				handleTunnelUrl(match[0]);
			}
		});

		tunnelInstance.on('stderr', (output) => {
			const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
			if (match && !match[0].includes('api.')) {
				handleTunnelUrl(match[0]);
			}
		});

		tunnelInstance.on('url', (url) => {
			if (url.includes('api.trycloudflare.com')) return;
			handleTunnelUrl(url);
		});

		tunnelInstance.on('error', (err) => {
			console.error('Tunnel error:', err.message);
		});

	} catch (err) {
		console.error('Failed to start tunnel:', err);
	}
}

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
	viteProcess = spawn('npx', ['vite', 'dev'], {
		stdio: ['inherit', 'pipe', 'pipe'],
		shell: true
	});

	viteProcess.stdout.on('data', (data) => {
		const output = data.toString();
		process.stdout.write(data);

		// Strip ANSI escape codes for parsing
		const cleanOutput = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

		// Detect the port Vite is using
		const portMatch = cleanOutput.match(/localhost:(\d+)/);
		if (portMatch && !tunnelStarted) {
			const detectedPort = parseInt(portMatch[1], 10);
			PORT = detectedPort;
			// Start tunnel once we know the port
			startTunnel();
		}
	});

	viteProcess.stderr.on('data', (data) => {
		process.stderr.write(data);
	});

	// Handle cleanup
	process.on('SIGINT', () => {
		console.log('\nShutting down...');
		if (tunnelInstance) tunnelInstance.stop();
		if (viteProcess) viteProcess.kill();
		process.exit();
	});
}

main().catch(console.error);
