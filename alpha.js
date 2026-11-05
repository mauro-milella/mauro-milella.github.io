/*
 * Effects for the alpha startup dashboard (built by showAlpha in engine.js).
 *
 *   field  an ASCII vector field driven by 3D simplex noise, with logic glyphs
 *          drifting along it; the pointer stirs a vortex, clicks drop ripples
 *   name   the title set in figlet's "ANSI Shadow" font. The web font ships no
 *          box-drawing glyphs, so every cell is drawn on a canvas: it looks the
 *          same everywhere, spirals in, dodges the mouse and glitches sometimes
 *   typer  the typewriter prompt under the name
 *
 * The field is the whole site's backdrop: it lives in #site-bg behind the
 * editor too, and only calms down (dimmer, quieter behind the page text) when
 * a page is open. Colours come from the active theme's CSS variables. Nothing
 * runs while the tab is in the background, and prefers-reduced-motion gets a
 * single still frame.
 */
const AlphaFX = (() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => motion.matches;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const FONT = '"JetBrains Mono", monospace';
    const LOGIC = Array.from('∀∃∄λ⊢⊨⊩¬∧∨→↦⇒⇔⊤⊥∈∉⊂⊆∪∩∅≡≈≠≤≥∑∏∫∮∂∇∞√πφεδθμσωΓΔΦΨΩℕℤℚℝℂ□◇⊕⊗∘∴ℵ');

    let dash = null, content = null, running = false, mounted = false;
    let useField = false, raf = 0, last = 0;
    // The field stays on behind the pages; `calm` eases from 0 (dashboard) to 1 (page open)
    let backdrop = false, calm = 0, exiting = false, exitUntil = 0;
    const PAGE_GAIN = 0.6, PAGE_FLOOR = 0.3;
    const pointer = { x: -1e4, y: -1e4, inside: false, mouse: false, presence: 0 };

    // --- THEME ---

    let probe = null, colors = null;

    // Any CSS colour expression (var(--blue), #fff, ...) to [r, g, b] in the current theme
    function resolveColor(expr) {
        if (!probe) {
            probe = document.createElement('span');
            probe.style.display = 'none';
            document.body.appendChild(probe);
        }
        probe.style.color = '';
        probe.style.color = expr;
        const m = getComputedStyle(probe).color.match(/[\d.]+/g) || [128, 128, 128];
        return [+m[0], +m[1], +m[2]];
    }

    const css = c => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

    function palette() {
        if (colors) return colors;
        const v = name => resolveColor(`var(--${name})`);
        const ac = config.alpha || {};
        const bg = v('bg');
        const words = [ac.titleColor || 'var(--main)', ac.titleAccentColor || 'var(--comment)'].map(resolveColor);
        const luma = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
        colors = {
            bg: css(bg),
            // The same alpha reads much stronger on a light background
            fieldGain: luma > 0.5 ? 0.7 : 1,
            fg: css(v('fg')),
            tiers: ['comment', 'main', 'yellow'].map(n => css(v(n))),
            accents: ['blue', 'cyan', 'green', 'yellow', 'orange', 'purple', 'red'].map(n => css(v(n))),
            glitch: ['red', 'cyan'].map(n => css(v(n))),
            // ANSI Shadow's box-drawing "shadow" is the word colour sunk towards the background
            words: words.map(c => ({ block: css(c), line: css(mix(c, bg, 0.45)) })),
        };
        return colors;
    }

    // --- NOISE ---

    // 3D simplex noise (after Stefan Gustavson's public-domain reference), roughly in [-1, 1]
    function simplex3(seed) {
        const p = new Uint8Array(256).map((_, i) => i);
        let s = seed >>> 0 || 1;
        for (let i = 255; i > 0; i--) {
            s = (s * 1664525 + 1013904223) >>> 0;
            const j = s % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        const perm = new Uint8Array(512).map((_, i) => p[i & 255]);
        const G = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1];
        const F3 = 1 / 3, G3 = 1 / 6;

        function corner(x, y, z, h) {
            let t = 0.6 - x * x - y * y - z * z;
            if (t < 0) return 0;
            const g = (h % 12) * 3;
            t *= t;
            return t * t * (G[g] * x + G[g + 1] * y + G[g + 2] * z);
        }

        return (x, y, z) => {
            const s = (x + y + z) * F3;
            const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
            const t = (i + j + k) * G3;
            const x0 = x - i + t, y0 = y - j + t, z0 = z - k + t;
            let i1, j1, k1, i2, j2, k2;
            if (x0 >= y0) {
                if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
                else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
                else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
            } else {
                if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
                else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
                else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            }
            const ii = i & 255, jj = j & 255, kk = k & 255;
            return 32 * (
                corner(x0, y0, z0, perm[ii + perm[jj + perm[kk]]]) +
                corner(x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3, perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]]) +
                corner(x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3, perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]]) +
                corner(x0 - 1 + 3 * G3, y0 - 1 + 3 * G3, z0 - 1 + 3 * G3, perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]])
            );
        };
    }

    // --- FIELD ---

    // The background is a 2D incompressible flow given by a stream function
    // psi (time-varying simplex noise). Its level sets are the streamlines: they
    // are drawn as ASCII contours, every glyph tangent to its line, and the logic
    // glyphs drift along them with velocity (d psi/dy, -d psi/dx). The pointer adds a
    // Gaussian vortex to psi, a click a travelling ring.
    const field = (() => {
        const GLYPHS = ['·', '-', '\\', '|', '/'];
        const FREQ = 0.0019, LEVELS = 3.8, FLOW = 3800, MAX_SPEED = 60;
        const VORTEX = 0.4, RIPPLE_AMP = 1, RIPPLE_MS = 900;
        const noise = simplex3(Math.random() * 2 ** 32);
        let canvas, ctx, dpr = 1, W = 0, H = 0, cw = 0, ch = 0, sw = 0, sh = 0, cols = 0, rows = 0;
        let atlas = null, vortexR = 200;
        let psi, gxs, gys, tiers, att;
        let particles = [], ripples = [];

        function mount() {
            if (canvas) return;
            let host = document.getElementById('site-bg');
            if (!host) {
                host = document.createElement('div');
                host.id = 'site-bg';
                document.body.insertBefore(host, document.body.firstChild);
            }
            canvas = document.createElement('canvas');
            canvas.className = 'alpha-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            host.appendChild(canvas);
            ctx = canvas.getContext('2d');
        }

        function layout() {
            dpr = Math.min(2, window.devicePixelRatio || 1);
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            canvas.style.width = `${W}px`;
            canvas.style.height = `${H}px`;

            const small = W < 768;
            sw = Math.round((small ? 13 : 16) * dpr);
            sh = Math.round((small ? 19 : 22) * dpr);
            cw = sw / dpr;
            ch = sh / dpr;
            cols = Math.ceil(W / cw);
            rows = Math.ceil(H / ch);
            vortexR = clamp(Math.max(W, H) * 0.16, 110, 220);
            atlas = null;
            const n = cols * rows;
            psi = new Float32Array(n);
            gxs = new Float32Array(n);
            gys = new Float32Array(n);
            tiers = new Uint8Array(n);
            att = new Float32Array(n).fill(1);

            const want = clamp(Math.round(W * H / 11000), 30, 130);
            while (particles.length < want) particles.push(spawn({}, true));
            particles.length = want;
            particles.forEach(p => { if (p.x > W || p.y > H) spawn(p, true); });
        }

        // Pre-render the field glyphs once per theme: drawImage is much cheaper than fillText
        function buildAtlas() {
            const colors = palette().tiers;
            atlas = document.createElement('canvas');
            atlas.width = sw * GLYPHS.length;
            atlas.height = sh * colors.length;
            const a = atlas.getContext('2d');
            a.font = `${Math.round(sh * 0.62)}px ${FONT}`;
            a.textAlign = 'center';
            a.textBaseline = 'middle';
            colors.forEach((color, t) => {
                a.fillStyle = color;
                GLYPHS.forEach((g, i) => a.fillText(g, i * sw + sw / 2, t * sh + sh / 2));
            });
        }

        // Dim the field behind the dashboard or page text so it stays readable
        function avoid(rects, floor = 0.14) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = (c + 0.5) * cw, y = (r + 0.5) * ch;
                    let a = 1;
                    for (const b of rects) {
                        const qx = Math.abs(x - b.cx) - b.hw, qy = Math.abs(y - b.cy) - b.hh;
                        const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
                        a = Math.min(a, floor + (1 - floor) * smoothstep(-6, 42, d));
                    }
                    att[r * cols + c] = a;
                }
            }
        }

        const cellAt = (x, y) => clamp(Math.floor(y / ch), 0, rows - 1) * cols + clamp(Math.floor(x / cw), 0, cols - 1);

        function spawn(p, scatter) {
            p.x = Math.random() * W;
            p.y = Math.random() * H;
            p.vx = 0;
            p.vy = 0;
            p.g = pick(LOGIC);
            p.c = Math.floor(Math.random() * 7);
            p.life = 10 + Math.random() * 12;
            p.age = scatter ? Math.random() * p.life : 0;
            p.big = Math.random() < 0.3;
            return p;
        }

        function ripple(x, y, now) {
            ripples.push({ x, y, t0: now });
            if (ripples.length > 4) ripples.shift();

        }

        // psi on the grid, plus which colour tier each cell gets
        function sample(now) {
            const z = now * 0.00002;
            const pres = pointer.presence, px = pointer.x, py = pointer.y;
            const sig2 = 2 * (vortexR * 0.42) ** 2, reach2 = (vortexR * 1.3) ** 2;
            for (let r = 0, i = 0; r < rows; r++) {
                const y = (r + 0.5) * ch;
                for (let c = 0; c < cols; c++, i++) {
                    const x = (c + 0.5) * cw;
                    let v = noise(x * FREQ, y * FREQ, z), t = 0;
                    if (pres > 0.01) {
                        const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
                        if (d2 < reach2) {
                            const b = VORTEX * pres * Math.exp(-d2 / sig2);
                            v += b;
                            if (b > 0.1) t = 1;
                        }
                    }
                    for (let k = 0; k < ripples.length; k++) {
                        const rp = ripples[k], age = Math.max(0, now - rp.t0);
                        const d = Math.hypot(x - rp.x, y - rp.y);
                        const w = RIPPLE_AMP * Math.exp(-(((d - age * 0.5) / 36) ** 2)) * (1 - age / RIPPLE_MS);
                        // Light only: the ring highlights the lines it crosses without bending them
                        if (w > 0.35) t = 2;
                    }
                    psi[i] = v;
                    tiers[i] = t;
                }
            }
        }

        function frame(now, dt) {
            if (!atlas) buildAtlas();
            ripples = ripples.filter(r => now - r.t0 < RIPPLE_MS);
            sample(now);

            ctx.globalAlpha = 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const gain = palette().fieldGain * (1 - (1 - PAGE_GAIN) * calm);

            for (let r = 0, i = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++, i++) {
                    // Central differences (one-sided at the borders), per pixel
                    const l = c > 0 ? 1 : 0, rt = c < cols - 1 ? 1 : 0, u = r > 0 ? cols : 0, dn = r < rows - 1 ? cols : 0;
                    const gx = (psi[i + rt] - psi[i - l]) / ((l + rt) * cw);
                    const gy = (psi[i + dn] - psi[i - u]) / ((u + dn) / cols * ch);
                    gxs[i] = gx;
                    gys[i] = gy;

                    // Distance (in px) from the cell centre to the nearest contour
                    const g = Math.hypot(gx, gy) + 1e-9;
                    const lv = psi[i] * LEVELS, level = Math.round(lv);
                    const dist = Math.abs(lv - level) / (g * LEVELS);
                    const half = 0.5 * (Math.abs(gx) * cw + Math.abs(gy) * ch) / g;
                    const I = 1 - smoothstep(0.3 * half, 0.7 * half, dist);
                    const tier = tiers[i];

                    let alpha, glyph = 0;
                    if (I > 0.02) {
                        // Every fourth contour is an "index contour", like on a topographic map
                        alpha = tier ? 0.25 + 0.4 * I : (level % 3 === 0 ? 0.36 : 0.2) * I;
                        // Lines are undirected: fold the tangent angle into [0, pi) and pick - \ | /
                        const a = Math.atan2(gy, gx) + Math.PI / 2;
                        glyph = 1 + (Math.round((((a % Math.PI) + Math.PI) % Math.PI) / (Math.PI / 4)) & 3);
                    } else if (r % 2 === 0 && c % 3 === 0) {
                        alpha = 0.05; // sparse graph-paper dots between the lines
                    } else {
                        continue;
                    }
                    alpha *= att[i] * gain;
                    if (alpha < 0.02) continue;
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(atlas, glyph * sw, tier * sh, sw, sh, c * sw, r * sh, sw, sh);
                }
            }

            const accents = palette().accents;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (const big of [false, true]) {
                ctx.font = `${Math.round((big ? 19 : 13) * dpr)}px ${FONT}`;
                for (const p of particles) {
                    if (p.big !== big) continue;
                    if (dt) {
                        p.age += dt;
                        if (p.age > p.life || p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) spawn(p);
                        const i = cellAt(p.x, p.y);
                        let vx = gys[i] * FLOW, vy = -gxs[i] * FLOW;
                        const s = Math.hypot(vx, vy);
                        if (s > MAX_SPEED) { vx *= MAX_SPEED / s; vy *= MAX_SPEED / s; }
                        p.x += (vx + p.vx) * dt;
                        p.y += (vy + p.vy) * dt;
                        const damp = Math.exp(-dt * 3.5);
                        p.vx *= damp;
                        p.vy *= damp;
                    }
                    const fade = clamp(Math.min(p.age / 1.2, (p.life - p.age) / 1.2), 0, 1);
                    const alpha = fade * (big ? 0.6 : 0.42) * att[cellAt(p.x, p.y)] * (1 - (1 - PAGE_GAIN) * calm);
                    if (alpha < 0.02) continue;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = accents[p.c];
                    ctx.fillText(p.g, p.x * dpr, p.y * dpr);
                }
            }
            ctx.globalAlpha = 1;
        }

        return { mount, layout, avoid, frame, ripple, retheme: () => { atlas = null; } };
    })();

    // --- NAME ---

    // figlet's "ANSI Shadow" font, only the letters the title needs: add more
    // from the font if you change config.alpha.title (missing letters fall back
    // to the plain typed logo)
    const ANSI_SHADOW = {
        a: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
        e: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '███████╗', '╚══════╝'],
        i: ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
        l: ['██╗     ', '██║     ', '██║     ', '██║     ', '███████╗', '╚══════╝'],
        m: ['███╗   ███╗', '████╗ ████║', '██╔████╔██║', '██║╚██╔╝██║', '██║ ╚═╝ ██║', '╚═╝     ╚═╝'],
        o: [' ██████╗ ', '██╔═══██╗', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
        r: ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔══██╗', '██║  ██║', '╚═╝  ╚═╝'],
        u: ['██╗   ██╗', '██║   ██║', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
    };
    // Box-drawing corners as [horizontal, vertical] arm directions (+1 = right/down)
    const CORNERS = { '╔': [1, 1], '╗': [-1, 1], '╚': [1, -1], '╝': [-1, -1] };
    const CELL_RATIO = 2.1; // terminal cells are about twice as tall as wide

    const canDraw = words => words.length > 0 && words.every(w => [...w.toLowerCase()].every(ch => ANSI_SHADOW[ch]));

    const name = (() => {
        let canvas, ctx, slot = null, words = [], dpr = 1;
        let cells = [], cols = 0, rows = 0, cw = 0, chh = 0, ox = 0, oy = 0;
        let mode = 'in', t0 = 0, flightEnd = 0, dirty = true;
        let glitch = null, nextGlitch = 0;

        function mount(parent) {
            canvas = document.createElement('canvas');
            canvas.className = 'alpha-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            parent.insertBefore(canvas, parent.querySelector('.alpha-content'));
            ctx = canvas.getContext('2d');
        }

        function compose(stacked) {
            const widths = words.map(w => [...w].reduce((n, ch) => n + ANSI_SHADOW[ch][0].length, 0));
            const GAP = 3;
            const out = [];
            const total = stacked ? Math.max(...widths) : widths.reduce((a, b) => a + b, 0) + GAP * (words.length - 1);
            let x0 = 0;
            words.forEach((w, wi) => {
                let x = stacked ? Math.floor((total - widths[wi]) / 2) : x0;
                const y = stacked ? wi * 7 : 0;
                for (const letter of w) {
                    const glyph = ANSI_SHADOW[letter];
                    glyph.forEach((line, r) => [...line].forEach((chr, c) => {
                        if (chr !== ' ') out.push({ r: y + r, c: x + c, chr, word: wi });
                    }));
                    x += glyph[0].length;
                }
                x0 += widths[wi] + GAP;
            });
            return { cells: out, cols: total, rows: stacked ? words.length * 7 - 1 : 6 };
        }

        // One line on wide screens, one word per line when that is noticeably bigger
        function fit() {
            const W = window.innerWidth, H = window.innerHeight;
            const availW = Math.min(W - 32, 1100), availH = H * (W < 768 ? 0.26 : 0.3);
            const size = g => Math.min(availW / g.cols, availH / (g.rows * CELL_RATIO));
            const wide = compose(false);
            if (words.length < 2) return { ...wide, cw: size(wide) };
            const tall = compose(true);
            const g = size(wide) >= 8 || size(wide) >= size(tall) ? wide : tall;
            return { ...g, cw: size(g) };
        }

        function layout() {
            if (!slot) return;
            dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.round(window.innerWidth * dpr);
            canvas.height = Math.round(window.innerHeight * dpr);
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;

            const g = fit();
            cw = Math.max(2, Math.floor(g.cw * dpr));
            chh = Math.round(cw * CELL_RATIO);
            cols = g.cols;
            rows = g.rows;
            const old = cells;
            cells = g.cells.map((cell, i) => Object.assign(cell, {
                glyph: pick(LOGIC), ox: 0, oy: 0, vx: 0, vy: 0,
                phi: old[i]?.phi ?? 0, r0: old[i]?.r0 ?? 0, spin: old[i]?.spin ?? 0,
                delay: old[i]?.delay ?? 0, dur: old[i]?.dur ?? 1,
            }));
            slot.style.width = `${cols * cw / dpr}px`;
            slot.style.height = `${rows * chh / dpr}px`;
            dirty = true;
        }

        function place() {
            if (!slot) return;
            const r = slot.getBoundingClientRect();
            ox = Math.round(r.left * dpr);
            oy = Math.round(r.top * dpr);
            dirty = true;
        }

        // Every cell spirals in from somewhere on screen, sweeping left to right
        function intro(now) {
            const reach = Math.max(window.innerWidth, window.innerHeight) * 0.6 * dpr;
            for (const cell of cells) {
                cell.r0 = (0.35 + Math.random() * 0.65) * reach;
                cell.phi = Math.random() * Math.PI * 2;
                cell.spin = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 1.6);
                cell.delay = 80 + (cell.c / cols) * 420 + Math.random() * 160;
                cell.dur = 560 + Math.random() * 260;
            }
            start('in', now);
            nextGlitch = now + 3500 + Math.random() * 3000;
        }

        // Clicking the name blows it apart around the click and lets it fall back together
        function bloom(x, y, now) {
            const X = x * dpr, Y = y * dpr;
            for (const cell of cells) {
                const dx = ox + (cell.c + 0.5) * cw - X, dy = oy + (cell.r + 0.5) * chh - Y;
                cell.phi = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
                cell.r0 = (40 + Math.random() * 200) * dpr * (1 - Math.min(0.6, Math.hypot(dx, dy) / (cols * cw)));
                cell.spin = (Math.random() - 0.5) * 2;
                cell.delay = Math.random() * 80;
                cell.dur = 700 + Math.random() * 350;
            }
            start('bloom', now);
        }

        // Leaving the dashboard: every cell spirals away from the name's centre and fades
        function scatter(now) {
            const reach = Math.max(window.innerWidth, window.innerHeight) * 0.7 * dpr;
            const mx = cols / 2, my = rows / 2;
            for (const cell of cells) {
                cell.phi = Math.atan2((cell.r - my) * chh, (cell.c - mx) * cw) + (Math.random() - 0.5) * 0.9;
                cell.r0 = (0.45 + Math.random() * 0.55) * reach;
                cell.spin = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.8);
                cell.delay = Math.abs(cell.c - mx) / cols * 140 + Math.random() * 90;
                cell.dur = 420 + Math.random() * 200;
            }
            start('out', now);
        }

        const settled = now => !slot || !cells.length || mode !== 'in' || now - t0 >= flightEnd;

        function start(m, now) {
            mode = m;
            t0 = now;
            flightEnd = Math.max(0, ...cells.map(c => c.delay + c.dur)) + 260;
            glitch = null;
            dirty = true;
        }

        function finish() {
            t0 = -1e9;
            glitch = null;
            dirty = true;
        }

        // Cells near the mouse are pushed away and spring back
        function springs() {
            const near = pointer.mouse && pointer.presence > 0.05;
            const R = 90 * dpr, push = 16 * dpr * pointer.presence;
            const px = pointer.x * dpr, py = pointer.y * dpr;
            let moving = false;
            for (const cell of cells) {
                let tx = 0, ty = 0;
                if (near) {
                    const dx = ox + (cell.c + 0.5) * cw - px, dy = oy + (cell.r + 0.5) * chh - py;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < R * R) {
                        const d = Math.sqrt(d2) || 1, f = (1 - d / R) ** 2;
                        tx = dx / d * f * push;
                        ty = dy / d * f * push;
                    }
                }
                cell.vx = (cell.vx + (tx - cell.ox) * 0.18) * 0.72;
                cell.vy = (cell.vy + (ty - cell.oy) * 0.18) * 0.72;
                cell.ox += cell.vx;
                cell.oy += cell.vy;
                if (Math.abs(cell.vx) + Math.abs(cell.vy) > 0.02 || Math.abs(tx - cell.ox) + Math.abs(ty - cell.oy) > 0.1) moving = true;
            }
            return moving;
        }

        function drawGeometry(cell, x, y, color) {
            if (cell.chr === '█') {
                ctx.fillStyle = color.block;
                ctx.fillRect(x, y, cw, chh);
                return;
            }
            ctx.fillStyle = color.line;
            const lw = Math.max(1, Math.round(cw * 0.12)), g = Math.max(1, Math.round(cw * 0.2)), h = lw >> 1;
            const cx = x + (cw >> 1), cy = y + (chh >> 1);
            const hor = (yy, xa, xb) => ctx.fillRect(Math.min(xa, xb), yy - h, Math.abs(xb - xa), lw);
            const ver = (xx, ya, yb) => ctx.fillRect(xx - h, Math.min(ya, yb), lw, Math.abs(yb - ya));
            if (cell.chr === '═') {
                hor(cy - g, x, x + cw);
                hor(cy + g, x, x + cw);
            } else if (cell.chr === '║') {
                ver(cx - g, y, y + chh);
                ver(cx + g, y, y + chh);
            } else if (CORNERS[cell.chr]) {
                // Double-line corner: an outer and an inner L, both open towards the arms
                const [sx, sy] = CORNERS[cell.chr];
                const ex = sx > 0 ? x + cw : x, ey = sy > 0 ? y + chh : y;
                for (const s of [-1, 1]) {
                    const px = cx + s * sx * g, py = cy + s * sy * g;
                    hor(py, px - sx * h, ex);
                    ver(px, py - sy * h, ey);
                }
            }
        }

        function drawGlyph(cell, x, y, color, alpha) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color.block;
            ctx.fillText(cell.glyph, x + cw / 2, y + chh / 2);
            ctx.globalAlpha = 1;
        }

        function frame(now, force) {
            if (!slot || !cells.length) return;
            const t = now - t0;
            const flying = t < flightEnd;
            const moving = !reduced() && springs();

            if (!reduced() && !flying && now > nextGlitch) {
                const h = 1 + Math.floor(Math.random() * 2), r0 = Math.floor(Math.random() * (rows - h + 1));
                glitch = {
                    r0, r1: r0 + h, until: now + 120 + Math.random() * 120,
                    shift: (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3)),
                    swaps: new Set(Array.from({ length: 6 }, () => Math.floor(Math.random() * cells.length))),
                };
                nextGlitch = now + 4500 + Math.random() * 6500;
            }
            if (glitch && now > glitch.until) { glitch = null; dirty = true; }

            if (mode === 'out' && !flying) {
                if (dirty) ctx.clearRect(0, 0, canvas.width, canvas.height);
                dirty = false;
                return;
            }
            if (!flying && !moving && !dirty && !glitch && !force) return;
            dirty = false;

            const pal = palette();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${Math.round(chh * 0.62)}px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const pos = cell => {
                let x = ox + cell.c * cw + cell.ox, y = oy + cell.r * chh + cell.oy, morph = 1;
                const p = flying ? clamp((t - cell.delay) / cell.dur, 0, 1) : 1;
                // A cell that has finished flying away stays gone
                if (mode === 'out' && p >= 1) return { x, y, morph: -1, landed: Infinity };
                if (p < 1) {
                    if (mode === 'in') {
                        const e = 1 - (1 - p) ** 3, rad = cell.r0 * (1 - e), ang = cell.phi + cell.spin * (1 - e);
                        x += Math.cos(ang) * rad;
                        y += Math.sin(ang) * rad;
                        morph = p < 0.8 ? 0 : (p - 0.8) / 0.2;
                        if (p === 0) morph = -1;
                    } else if (mode === 'out') {
                        // The intro played backwards: accelerating away, turning back into glyphs
                        const e = p ** 2.2, rad = cell.r0 * e, ang = cell.phi + cell.spin * e;
                        x += Math.cos(ang) * rad;
                        y += Math.sin(ang) * rad;
                        morph = p > 0.15 ? 0 : 1;
                    } else {
                        const q = 1 - (1 - p) ** 2, s = Math.sin(Math.PI * q);
                        x += Math.cos(cell.phi + cell.spin * s) * cell.r0 * s;
                        y += Math.sin(cell.phi + cell.spin * s) * cell.r0 * s;
                        morph = s > 0.45 ? 0 : 1;
                    }
                }
                if (glitch && cell.r >= glitch.r0 && cell.r < glitch.r1) x += glitch.shift * cw;
                return { x: Math.round(x), y: Math.round(y), morph, landed: flying && mode === 'in' ? t - cell.delay - cell.dur : Infinity };
            };

            // Chromatic ghosts of the glitched band
            if (glitch) {
                ctx.globalAlpha = 0.5;
                cells.forEach(cell => {
                    if (cell.r < glitch.r0 || cell.r >= glitch.r1 || cell.chr !== '█') return;
                    const { x, y } = pos(cell);
                    pal.glitch.forEach((color, k) => {
                        ctx.fillStyle = color;
                        ctx.fillRect(x + (k ? 2 : -2) * dpr * 2, y, cw, chh);
                    });
                });
                ctx.globalAlpha = 1;
            }

            // Shadows first, then blocks, so block edges win where they touch
            for (const blocks of [false, true]) {
                cells.forEach((cell, i) => {
                    if ((cell.chr === '█') !== blocks) return;
                    const color = pal.words[cell.word] || pal.words[0];
                    const { x, y, morph, landed } = pos(cell);
                    if (morph < 0) return;
                    if (glitch?.swaps.has(i) || morph === 0) {
                        const fade = mode === 'out'
                            ? 1 - clamp((t - cell.delay) / cell.dur, 0, 1) ** 1.5
                            : clamp((t - cell.delay) / 120, 0, 1);
                        drawGlyph(cell, x, y, color, glitch?.swaps.has(i) ? 1 : fade);
                        return;
                    }
                    if (morph < 1) {
                        drawGlyph(cell, x, y, color, 1 - morph);
                        ctx.globalAlpha = morph;
                    }
                    drawGeometry(cell, x, y, color);
                    ctx.globalAlpha = 1;
                    // A brief flash as each cell lands
                    if (landed >= 0 && landed < 260 && blocks) {
                        ctx.globalAlpha = 0.7 * (1 - landed / 260);
                        ctx.fillStyle = pal.fg;
                        ctx.fillRect(x, y, cw, chh);
                        ctx.globalAlpha = 1;
                    }
                });
            }
        }

        function setup(parent, nameSlot, nameWords) {
            slot = nameSlot;
            words = nameWords.map(w => w.toLowerCase());
            if (!canvas) mount(parent);
            canvas.style.display = slot ? '' : 'none';
            cells = [];
        }

        return {
            setup, layout, place, intro, bloom, scatter, settled, finish, frame,
            retheme: () => { dirty = true; },
            contains: el => !!slot && slot.contains(el),
        };
    })();

    // --- TYPER ---

    const typer = (() => {
        let el = null, lines = [], i = 0, n = 0, phase = 'type', timer = null, firstDone = false;

        function schedule(ms) { timer = setTimeout(tick, ms); }

        function tick() {
            if (document.hidden) return schedule(500);
            const line = lines[i];
            const prompt = el.parentElement;
            if (phase === 'type') {
                el.textContent = line.slice(0, ++n);
                prompt.classList.add('typing');
                if (n < line.length) return schedule(35 + Math.random() * 70);
                prompt.classList.remove('typing');
                firstDone = true;
                if (lines.length < 2) return;
                phase = 'erase';
                return schedule(2600);
            }
            el.textContent = line.slice(0, --n);
            prompt.classList.add('typing');
            if (n > 0) return schedule(18);
            prompt.classList.remove('typing');
            phase = 'type';
            i = (i + 1) % lines.length;
            schedule(380);
        }

        function start(target, all) {
            stop();
            el = target;
            lines = all;
            firstDone = !el || !lines.length || reduced();
            if (!el || !lines.length) return;
            i = 0;
            n = 0;
            phase = 'type';
            if (reduced()) {
                el.textContent = lines[0];
                return;
            }
            el.textContent = '';
            schedule(900);
        }

        function stop() {
            clearTimeout(timer);
            el?.parentElement?.classList.remove('typing');
        }

        return { start, stop, firstLineDone: () => firstDone };
    })();

    // --- LOOP & WIRING ---

    function loop(now) {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        pointer.presence += ((pointer.inside ? 1 : 0) - pointer.presence) * Math.min(1, dt * 6);
        calm += ((running ? 0 : 1) - calm) * Math.min(1, dt * 3);
        if (backdrop) field.frame(now, dt);
        if (running || exiting) name.frame(now);
        if (exiting && now > exitUntil) exiting = false;
        if (!running && !backdrop && !exiting) pause();
    }

    function play() {
        if (raf || !(running || backdrop || exiting) || document.hidden) return;
        if (reduced()) return still();
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }

    function pause() {
        cancelAnimationFrame(raf);
        raf = 0;
    }

    function still() {
        const now = performance.now();
        pointer.presence = 0;
        calm = running ? 0 : 1;
        if (backdrop) field.frame(now, 0);
        if (!running) return;
        name.finish();
        name.frame(now, true);
    }

    // With a page open, quiet the field behind the text column
    function pageRects() {
        const out = document.getElementById('markdown-output');
        const box = out?.getBoundingClientRect();
        if (!box || !box.width) return [];
        const view = document.getElementById('scroll-container')?.getBoundingClientRect() || box;
        const top = Math.max(box.top, view.top), bottom = Math.min(box.bottom, view.bottom);
        if (bottom <= top) return [];
        return [{ cx: box.left + box.width / 2, cy: (top + bottom) / 2, hw: box.width / 2, hh: (bottom - top) / 2 }];
    }

    function refreshRects() {
        if (!running) {
            if (!backdrop) return;
            field.avoid(pageRects(), PAGE_FLOOR);
            if (reduced()) still();
            return;
        }
        name.place();
        if (useField) {
            const rects = [...content.children]
                .filter(el => el.getClientRects().length && !el.classList.contains('sr-only'))
                .map(el => {
                    const r = el.getBoundingClientRect();
                    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, hw: r.width / 2, hh: r.height / 2 };
                });
            field.avoid(rects);
        }
        if (reduced()) still();
    }

    function relayout() {
        if (!running && !backdrop) return;
        if (backdrop) field.layout();
        if (running) name.layout();
        refreshRects();
    }

    let relayoutQueued = false;
    function queueRelayout() {
        if (relayoutQueued) return;
        relayoutQueued = true;
        requestAnimationFrame(() => { relayoutQueued = false; relayout(); });
    }

    function mount() {
        mounted = true;
        window.addEventListener('resize', queueRelayout);
        document.fonts?.ready.then(() => { field.retheme(); queueRelayout(); });
        new ResizeObserver(() => running && refreshRects()).observe(content);
        dash.addEventListener('scroll', () => running && refreshRects(), { passive: true });

        // Pages: follow the text column as it scrolls, grows and changes
        const out = document.getElementById('markdown-output');
        if (out) {
            new ResizeObserver(() => !running && refreshRects()).observe(out);
            document.getElementById('scroll-container')
                ?.addEventListener('scroll', () => !running && refreshRects(), { passive: true });
        }

        document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
        motion.addEventListener('change', () => {
            if (!running) return;
            pause();
            play();
        });
        new MutationObserver(() => {
            colors = null;
            field.retheme();
            name.retheme();
            if (running && reduced()) still();
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        const setTouch = e => {
            const t = e.touches[0];
            if (!t) return;
            pointer.x = t.clientX;
            pointer.y = t.clientY;
            pointer.inside = true;
            pointer.mouse = false;
        };
        // The pointer stirs the field everywhere, not only on the dashboard
        window.addEventListener('mousemove', e => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            pointer.inside = true;
            pointer.mouse = true;
        }, { passive: true });
        document.documentElement.addEventListener('mouseleave', () => { pointer.inside = false; });
        window.addEventListener('touchstart', setTouch, { passive: true });
        window.addEventListener('touchmove', setTouch, { passive: true });
        window.addEventListener('touchend', () => { pointer.inside = false; }, { passive: true });
        const NO_RIPPLE = 'a, button, input, textarea, select, [onclick], [role="button"], .alpha-btn, .alpha-theme-dot,'
            + ' .file-node, .tab, .segment, .telescope-overlay, .markdown-body';
        window.addEventListener('pointerdown', e => {
            if (!(running || backdrop) || reduced() || e.target.closest(NO_RIPPLE)) return;
            const now = performance.now();
            if (running && name.contains(e.target)) name.bloom(e.clientX, e.clientY, now);
            if (backdrop) field.ripple(e.clientX, e.clientY, now);
        });
    }

    function start(d, opts = {}) {
        dash = d;
        content = d.querySelector('.alpha-content');
        useField = !!opts.field;
        if (useField) {
            field.mount();
            backdrop = true;
        }
        name.setup(d, d.querySelector('.alpha-name'), opts.words || []);
        if (!mounted) mount();

        running = true;
        relayout();
        name.intro(performance.now());
        typer.start(d.querySelector('.alpha-typed'), opts.lines || []);
        play();
    }

    // Leaving the dashboard: the name and typer stop, the backdrop keeps going
    function stop() {
        running = false;
        typer.stop();
        if (!backdrop) {
            pointer.inside = false;
            pointer.presence = 0;
            pause();
            return;
        }
        queueRelayout();
    }

    // Closing the dashboard with a flourish: the name spirals away while the backdrop calms
    function leave() {
        const wasRunning = running;
        exiting = false;
        stop();
        if (!wasRunning || reduced()) return;
        const now = performance.now();
        name.scatter(now);
        exiting = true;
        exitUntil = now + 1100;
        if (!raf) play();
    }

    // The intro is over once the name has landed and the first line is typed
    const introDone = () => name.settled(performance.now()) && typer.firstLineDone();

    return { start, stop, leave, introDone, canDraw };
})();
