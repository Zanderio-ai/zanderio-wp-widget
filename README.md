# Widget WordPress

Human-readable source package for the WordPress-distributed Zanderio AI chat widget.

`README.md` is the canonical service-local reference for this package. There is no separate service-local markdown docs set.

## Quick Start

```bash
cd widget/wordpress
npm install
npm run dev
```

## Build

```bash
npm run build:wordpress:prod
```

The compiled file is written to `sources/wordpress/assets/widget.js`.

## Quality

```bash
npm test
npm run lint
```

## Tech Stack

| Tool                                   | Purpose                       |
| -------------------------------------- | ----------------------------- |
| [Vite](https://vitejs.dev/)            | Build / bundler               |
| [React](https://react.dev/)            | UI framework                  |
| [Terser](https://terser.org/)          | JavaScript minifier           |
| [Socket.IO Client](https://socket.io/) | Real-time WebSocket transport |

## License

GPL-2.0-or-later — see [LICENSE](LICENSE).
