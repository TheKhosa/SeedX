# SeedX

A modern, self-hosted torrent directory and tracker built with SvelteKit.

## Features

### Torrent Directory
- Browse and search torrents by category (Movies, TV, Music, Games, Apps, Books)
- Sort by seeders, leechers, size, date, downloads, or name
- Filter by subcategory and quality
- Health indicators for each torrent
- Magnet link support

### Upload & Create Torrents
- **Upload existing torrents**: Drop a `.torrent` file or paste a magnet link
  - Auto-extracts metadata from DHT/peers (name, size, files)
  - Auto-detects category, quality, season/episode from torrent names
- **Create new torrents**: Generate `.torrent` files from your files
  - Automatically adds SeedX tracker
  - Option for auto-seeding via integrated WebTorrent client

### TV Show Integration
- Auto-detect TV shows using TVMaze API (free, no API key required)
- Display show info, episode details, and air dates
- Link torrents to specific episodes
- Browse shows by series with episode grids

### Built-in Seeding
- Integrated WebTorrent client for seeding
- Transmission seedbox integration (optional)
- Real-time stats tracking (upload/download speed, peers)

### User System
- User registration and login
- Persistent user data (survives server restarts)
- User stats and upload history

### Cloudflare Tunnel
- Built-in Cloudflare tunnel support for external access
- Dynamic tracker URL updates

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: Tailwind CSS 4
- **Torrent**: WebTorrent, parse-torrent, create-torrent
- **Database**: JSON file-based persistence
- **APIs**: TVMaze (TV show metadata)

## Getting Started

### Prerequisites
- Node.js 22.12+ (required by dependencies)
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd SeedX

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development with Cloudflare Tunnel

To expose your local dev server externally:

```bash
npm run dev:tunnel
```

This starts the dev server and creates a Cloudflare tunnel, updating the tracker URL automatically.

## Project Structure

```
src/
├── lib/
│   ├── server/          # Server-side modules
│   │   ├── db.ts        # Database operations
│   │   ├── seeder.ts    # WebTorrent client
│   │   ├── tvmaze.ts    # TV show API
│   │   ├── tracker.ts   # Tracker configuration
│   │   └── storage.ts   # JSON persistence
│   └── types.ts         # TypeScript types
├── routes/
│   ├── +page.svelte     # Home/browse page
│   ├── upload/          # Upload torrent
│   ├── create-torrent/  # Create new torrent
│   ├── torrent/[id]/    # Torrent details
│   ├── browse/tv/       # TV show browser
│   └── api/             # API endpoints
└── app.html
```

## API Endpoints

- `POST /api/parse-torrent` - Parse .torrent file or magnet link
- `POST /api/create-torrent` - Create new .torrent file
- `GET /api/tv-search` - Search TV shows (TVMaze)
- `GET /api/seeder-stats` - Get WebTorrent seeder stats

## Data Storage

User data, sessions, and torrents are persisted to JSON files in the `.data/` directory. This directory is gitignored.

## License

MIT
