import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const CONFIG_FILE = join(process.cwd(), '.tunnel-url');

export function setTunnelUrl(url: string): void {
	writeFileSync(CONFIG_FILE, url, 'utf-8');
}

export function getTunnelUrl(): string | null {
	if (existsSync(CONFIG_FILE)) {
		return readFileSync(CONFIG_FILE, 'utf-8').trim();
	}
	return null;
}
