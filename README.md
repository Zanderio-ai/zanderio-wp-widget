# Zanderio AI Widget — Source Code

This repository contains the **human-readable source code** for the
[Zanderio AI](https://wordpress.org/plugins/zanderio-ai/) WordPress plugin's
chat widget (`assets/widget.js`).

It is published to satisfy the
[WordPress Plugin Directory guideline §4](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/#4-code-must-be-mostly-human-readable)
requiring that minified/compiled code have its source publicly available.

## Building from source

```bash
# 1. Clone this repo
git clone https://github.com/Zanderio-ai/zanderio-wp-widget.git
cd zanderio-wp-widget

# 2. Install dependencies
npm install

# 3. Build the WordPress widget bundle
npm run build:wordpress:prod
```

The compiled file is written to `sources/wordpress/assets/widget.js`.

## Tech stack

| Tool | Purpose |
|------|---------|
| [Vite](https://vitejs.dev/) | Build / bundler |
| [React](https://react.dev/) | UI framework |
| [Terser](https://terser.org/) | JavaScript minifier |
| [Socket.IO Client](https://socket.io/) | Real-time WebSocket transport |

## License

GPL-2.0-or-later — see [LICENSE](LICENSE).
