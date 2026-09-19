# neovim-web

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/vanilla-JS%2FCSS%2FHTML-yellow.svg)](#)

A **Neovim-themed personal website framework**. Zero build, zero npm, pure vanilla JS/CSS/HTML. Deploy on GitHub Pages in minutes.

Your entire site is configured through a single `config.js` file. Add pages by dropping markdown files. Built-in DuckDB SQL console, Telescope fuzzy finder, vim keybindings, 5 color themes, and fun easter eggs.

`neovim-web` is fully responsive and works great on mobile (yes, even the commands).

👉 **[Live Demo](https://vojay-dev.github.io/neovim-web/)**

![Neovim Web](doc/neovim-web-demo.gif)

![Alpha Dashboard](doc/screenshot-alpha.png)

![Home](doc/screenshot-home.png)

---

## Quick Start

```bash
git clone https://github.com/vojay-dev/neovim-web.git
cd neovim-web
```

Edit `config.js` with your info, then:

```bash
make run
# Open http://localhost:8000
```

Deploy to GitHub Pages. No build step needed, just push and go.

---

## Features

- **Vim keybindings** - `j`/`k` scroll, `:` commands, `/` search
- **Telescope fuzzy finder** - search files, commands, and links
- **Alpha dashboard** - animated startup screen with 3D ASCII art backgrounds
- **5 color themes** - Tokyo Night, Gruvbox, Dracula, Cyberpunk, Latte
- **DuckDB SQL** - query your own site content with SQL in the browser
- **Blog system** - markdown posts with frontmatter, auto-generated cards
- **Buffer tabs** - open multiple pages like Neovim buffers
- **Font Awesome icons** - inline icon syntax in markdown (`:fab fa-github:`)
- **Mobile friendly** - responsive layout with touch support
- **Easter eggs** - `:snake` (playable game!), `:matrix`, `:sl`

![Telescope](doc/screenshot-telescope.png)

![Blog](doc/screenshot-blog.png)

![Light Theme](doc/screenshot-light.png)

---

## Configuration

Everything lives in `config.js`:

```js
const config = {
    // Site title (shown in browser tab)
    title: 'my-site',

    // Default page loaded on visit
    startPage: 'home',

    // Pages: each entry maps to content/{name}.md
    files: ['home', 'about'],

    // Sidebar links (external)
    links: [
        { label: 'GitHub', url: 'https://github.com/you', icon: 'fab fa-github' },
    ],

    // Alpha dashboard (startup screen)
    alpha: {
        enabled: true,                     // set false to skip startup screen
        animation: 'cube',                 // 'donut', 'starfield', 'cube', or false
        title: 'your-name',               // animated typing text
        titleColor: 'var(--blue)',
        titleAccent: '.dev',               // dimmed suffix
        titleAccentColor: 'var(--comment)',
        subtitle: 'Your tagline here',
        subtitleColor: 'var(--comment)',
        actions: [                         // quick-launch buttons
            { key: 'h', icon: 'fas fa-home', label: 'Home', cmd: 'home' },
            // cmd: 'filename' opens a page, cmd: ':command' runs a command
        ]
    },

    // Contact email (used by :contact command)
    contact: { email: 'you@example.com' },

    // Google Analytics (optional)
    analytics: { enabled: false, googleId: '' },

    // Git repo link in status bar (optional)
    repo: { url: 'https://github.com/you/your-site', branch: 'main' },

    // Blog system
    blog: {
        enabled: true,
        manifestPath: 'posts/posts.json',
        postsDir: 'posts'
    },

    // Available themes and default
    themes: ['tokyo', 'gruvbox', 'dracula', 'cyberpunk', 'latte'],
    defaultTheme: 'tokyo',
};
```

---

## Adding Pages

1. Create `content/mypage.md`
2. Add `'mypage'` to `config.files`

Done. The page automatically gets:
- A sidebar entry
- A `:mypage` command
- Telescope search inclusion
- A DuckDB `pages` table row

### Markdown Features

- Standard markdown (rendered via [Marked.js](https://marked.js.org/))
- Syntax highlighting for code blocks (Python, Bash, Java, SQL, JSON, YAML, Ruby, TOML)
- Font Awesome icons inline: `:fab fa-github:` renders as a GitHub icon
- Images with click-to-lightbox

---

## Adding Blog Posts

1. Create a markdown file in `posts/`:

```
posts/2026-03-15-my-post.md
```

2. Add YAML frontmatter:

```yaml
---
title: My Post Title
date: 2026-03-15
description: A short summary shown on the blog card.
image: images/blog/cover.jpg
tags:
  - javascript
  - tutorial
---

Your content here...
```

3. Regenerate the manifest:

```bash
make posts
```

4. Cache bust before deploying:

```bash
make bust
```

The blog page appears in the sidebar automatically when posts exist.

---

## Built-in Commands

Type `:` to enter command mode.

| Command | Description |
|---------|-------------|
| `:help` | List all commands |
| `:theme` | Cycle through themes |
| `:sql` | DuckDB SQL console (queries your site content!) |
| `:contact` | Send email |
| `:socials` | Show social links |
| `:date` | Current date/time |
| `:whoami` | Device & location info |
| `:snake` | Play snake with vim keys |
| `:matrix` | Matrix rain effect |
| `:sl` | ASCII train animation |
| `:alpha` | Show startup dashboard |
| `:telescope` | Fuzzy finder |
| `:clear` | Clear output |
| `:q` | Close current buffer |

### Adding Custom Commands

Edit `commands.js`:

```js
const customCommands = {
    'mycommand': {
        desc: 'Description shown in :help',
        fn: (args, sys) => {
            // sys.openFile('pagename')  - open a page
            // sys.print('<p>HTML</p>')  - render HTML
            // sys.alert('message')      - info toast
            // sys.error('message')      - error toast
            // sys.success('message')    - success toast
        }
    },
    // ... existing commands
};
```

---

## Keybindings

| Key | Mode | Action |
|-----|------|--------|
| `j` / `k` | Normal | Scroll down / up |
| `:` | Normal | Enter command mode |
| `/` or `Ctrl+p` | Normal | Open Telescope |
| `Escape` | Command/Telescope | Return to normal |
| `Enter` | Command | Execute command |
| Arrow keys / `Ctrl+n/p` | Telescope | Navigate results |

---

## Themes

Five built-in themes:

| Theme | Style |
|-------|-------|
| **Tokyo Night** (default) | Soft blues and purples |
| **Gruvbox** | Warm retro tones |
| **Dracula** | Vibrant darks |
| **Cyberpunk** | Neon high-contrast |
| **Latte** | Light theme |

Switch with `:theme`, the palette icon in the status bar, or the dots on the Alpha dashboard.

### Adding a Custom Theme

1. Add CSS variables in `style.css`:

```css
[data-theme="mytheme"] {
    --bg: #1a1a2e;
    --bg-dark: #16162a;
    --fg: #eaeaea;
    --blue: #4fc1ff;
    --cyan: #56d6c2;
    --purple: #c792ea;
    --orange: #f78c6c;
    --yellow: #ffcb6b;
    --green: #c3e88d;
    --red: #ff5370;
    --magenta: #ff79c6;
    --comment: #546e7a;
    --line-nr: #3b4261;
    --selection: #2a2a4a;
    --status-bg: #16162a;
    --border: #2a2a4a;
    --badge-fg: #16162a;
    --seg-bg: #2a2a4a;
    --hover-bg: rgba(255,255,255,0.03);
    --shadow: rgba(0,0,0,0.3);
    --h1: var(--green);
    --h2: var(--blue);
    --h3: var(--purple);
}
```

2. Add the name to `config.themes`:

```js
themes: ['tokyo', 'gruvbox', 'dracula', 'cyberpunk', 'latte', 'mytheme'],
```

---

## Deployment (GitHub Pages)

1. Push your site to a GitHub repository
2. Go to **Settings > Pages**
3. Set source to **Deploy from a branch** > `main` / `root`
4. Your site will be live at `https://username.github.io/repo-name/`

For a custom domain, add a `CNAME` file with your domain name.

---

## Development

```bash
make run    # Start local server at http://localhost:8000
make bust   # Cache bust (bump ?v= on CSS/JS in index.html)
make posts  # Regenerate blog manifest from frontmatter
```

### File Structure

```
index.html      HTML shell, layout, meta tags, script loading
config.js       Your site configuration (edit this!)
commands.js     Command definitions (add custom commands here)
engine.js       Core runtime (modes, rendering, keybindings)
style.css       All styling + theme definitions
content/        Markdown pages
posts/          Blog posts with YAML frontmatter
```

### Script Load Order

```
config.js → commands.js → engine.js
```

`engine.js` reads from `config` and `customCommands` on load, so these must be loaded first.

---

## DuckDB SQL Console

Run `:sql` to launch an in-browser SQL engine powered by [DuckDB WASM](https://duckdb.org/docs/api/wasm/overview.html). Your site pages are automatically loaded into a `pages` table:

![SQL Console](doc/screenshot-sql-1.png)

![SQL Query Results](doc/screenshot-sql-2.png)

```sql
SELECT filename, word_count FROM pages ORDER BY word_count DESC;
```

```sql
SELECT filename FROM pages WHERE content LIKE '%javascript%';
```

The data is dynamically added on the first execution of the `:sql` command based on your content. Which means, this works out-of-the-box, even with new content you add to the site.

It is also safe as the database completely runs on client side. A nice feature, especially if you work in data 😉.

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Credits

Built on the architecture of [vojay.io](https://vojay.io) by [Volker Janz](https://github.com/vojay-dev).

## License

[MIT](LICENSE)
