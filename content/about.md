# :fas fa-circle-info: About neovim-web

**neovim-web** turns markdown files into a Neovim-themed website. No build step, no npm, no framework. Just edit and deploy.

---

## :fas fa-cubes: Features

- **Vim keybindings** - `j`/`k` scroll, `:` commands, `/` search
- **Telescope fuzzy finder** - search files, commands, and links
- **Alpha dashboard** - animated startup screen with ASCII art backgrounds
- **5 color themes** - Tokyo Night, Gruvbox, Dracula, Cyberpunk, Latte
- **DuckDB SQL** - query your own site content with SQL in the browser
- **Blog system** - markdown posts with frontmatter, auto-generated cards
- **Buffer tabs** - open multiple pages like Neovim buffers

## :fas fa-layer-group: Architecture

```
config.js  →  commands.js  →  engine.js
   ↑               ↑              ↑
Your site      Custom cmds    Core runtime
 config        (optional)    (don't touch)
```

Pages live in `content/` as plain markdown. The engine fetches and parses icons (`:fab fa-github:` syntax), renders HTML via **Marked.js**, and applies **Prism** syntax highlighting.

## :fas fa-database: SQL Demo

The `:sql` command gives you a full DuckDB console. Try:

```sql
SELECT filename, word_count FROM pages ORDER BY word_count DESC;
```

Every page in your site is queryable: content, word counts, filenames.

## :fas fa-code: Extending

### Add a page

Create `content/projects.md`, add `"projects"` to `config.files`. Done.

### Add a command

```js
// In commands.js
'hello': {
    desc: "Say hello",
    fn: (args, sys) => {
        sys.print('<p style="color:var(--green)">Hello, world!</p>');
    }
}
```

### Add a theme

Define CSS variables in `style.css` under `[data-theme="mytheme"]`, then add `'mytheme'` to `config.themes`.

## :fas fa-gears: Markdown Support

This page demonstrates the supported markdown features:

> Blockquotes work great for callouts and notes.

Here's some inline `code`, and a [link to GitHub](https://github.com).

- Unordered lists
- With **bold** and *italic* text
- And `:fas fa-check:` Font Awesome icons inline

1. Ordered lists
2. Work too
3. Obviously

---

*Built with vanilla JS, CSS, and HTML. No frameworks were harmed in the making of this website.*
