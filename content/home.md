
![image info](./images/dodecahedron.png)

## :fas fa-terminal fa-beat: neovim-web

A **Neovim-themed website framework**. Zero build, pure vanilla JS/CSS/HTML.

---

## :fas fa-rocket: Quick Start

```bash
git clone https://github.com/vojay-dev/neovim-web.git
cd neovim-web
make run
# → http://localhost:8000
```

Edit `config.js` to customize title, pages, links, themes and more.

## :fas fa-keyboard: Keybindings

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll down / up |
| `:` | Enter command mode |
| `/` or `Ctrl+p` | Open Telescope fuzzy finder |
| `Escape` | Return to normal mode |

## :fas fa-terminal: Commands

Type `:` then try these:

| Command | What it does |
|---------|-------------|
| `:help` | List all commands |
| `:theme` | Cycle through 5 themes |
| `:sql` | DuckDB SQL console |
| `:snake` | Play snake with vim keys! |
| `:contact` | Send an email |
| `:socials` | Show social links |

## :fas fa-palette: Themes

Five built-in color schemes: **Tokyo Night**, **Gruvbox**, **Dracula**, **Cyberpunk**, and **Latte** (light). Click the palette icon in the status bar or run `:theme`.

## :fas fa-file-alt: Adding Pages

1. Create `content/mypage.md`
2. Add `"mypage"` to `config.files` in `config.js`

That gives you a sidebar entry, a `:mypage` command, and Telescope search. Automatically.

## :fab fa-github: Open Source

neovim-web is MIT licensed. Fork it, customize it, make it yours.
