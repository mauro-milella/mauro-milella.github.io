if (typeof config === 'undefined') throw new Error("config.js missing");
if (typeof customCommands === 'undefined') console.warn("commands.js missing");

const THEMES = config.themes || ['tokyo', 'gruvbox', 'dracula', 'cyberpunk', 'latte'];
const COLORS = ['var(--green)', 'var(--blue)', 'var(--yellow)', 'var(--purple)', 'var(--red)', 'var(--cyan)', 'var(--orange)', 'var(--magenta)'];
const state = { currentFile: null, openBuffers: [], mode: 'NORMAL' };

window.THEMES = THEMES;

let asciiAnimId = null;
const asciiAngles = { A: 0, B: 0 };

const el = {
    output: document.getElementById('markdown-output'),
    scroll: document.getElementById('scroll-container'),
    tabContainer: document.getElementById('tab-container'),
    cmdInput: document.getElementById('cmd-input'),
    cmdDisplay: document.getElementById('cmd-display'),
    modeSeg: document.getElementById('mode-segment'),
    tree: document.getElementById('nvim-tree'),
    statusFile: document.getElementById('status-filename')
};

document.title = config.title;
initLightbox();
renderSidebar();
if (config.alpha?.enabled !== false) showAlpha();
else openFile(config.startPage);

// Uncomment to add a little paddle following your mouse
// initMouseTrackerBar();

// Add "archive" to sidebar only if posts exist
// notice that, in the original project from which this fork has been derived,
// the blog was called archive.
// I did not change the variable names, but only 
// the strings and arguments (from 'blog' to 'archive')
if (config.blog?.enabled !== false) {
    const manifestPath = config.blog?.manifestPath || 'posts/posts.json';
    fetch(manifestPath).then(r => r.ok ? r.json() : []).then(posts => {
        if (posts.length > 0 && !config.files.includes('archive')) {
            config.files.push('archive');
            renderSidebar();
        }
    }).catch(() => {});
}

function renderSidebar() {
    const container = document.getElementById('file-list-container');
    const linkContainer = document.getElementById('link-list-container');

    container.innerHTML = config.files.map((file, index) => {
        const color = COLORS[index % COLORS.length];
        return `<div class="file-node" id="node-${file}" onclick="openFile('${file}')"><i class="fab fa-markdown" style="color: ${color}"></i> ${file}.md</div>`;
    }).join('');

    linkContainer.innerHTML = config.links.map(link => `
        <div class="file-node" onclick="window.open('${link.url}')">
            <i class="${link.icon}" style="width:15px; text-align:center;"></i> ${link.label}
        </div>
    `).join('');
}

function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'info-circle';
    if (type === 'error') icon = 'exclamation-triangle';
    else if (type === 'success') icon = 'check-circle';

    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fade-out 0.3s ease forwards';
        setTimeout(() => toast.remove(), 600);
    }, 3000);
}

window.showToast = showToast;

function setTheme(themeName) {
    if (!THEMES.includes(themeName)) themeName = THEMES[0];
    const label = document.getElementById('theme-name');

    localStorage.setItem('theme', themeName);

    if (themeName === THEMES[0]) {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeName);
    }

    if (label) {
        THEMES.forEach(t => label.classList.remove(`theme-${t}`));
        label.classList.add(`theme-${themeName}`);
    }
}

const savedTheme = localStorage.getItem('theme') || config.defaultTheme || THEMES[0];
setTheme(savedTheme);

const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
    themeSwitch.addEventListener('click', () => {
        const current = localStorage.getItem('theme') || THEMES[0];
        const currentIndex = THEMES.indexOf(current);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        setTheme(THEMES[nextIndex]);
    });
}

window.setTheme = setTheme;

function parseIcons(html) {
    const codeBlocks = [];
    let safe = html.replace(/<(code|pre)[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
        codeBlocks.push(m);
        return `\x00CODE${codeBlocks.length - 1}\x00`;
    });
    safe = safe.replace(/:([a-z0-9- ]+):/g, (match, iconClass) => {
        if (iconClass.includes('fa') || iconClass.includes('brands')) {
            return `<i class="${iconClass}"></i>`;
        }
        return match;
    });
    return safe.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[i]);
}

function initLightbox() {
    if (!document.getElementById('lightbox')) {
        const lb = document.createElement('div');
        lb.id = 'lightbox';
        lb.onclick = () => {
            lb.classList.remove('active');
            setTimeout(() => lb.style.display = 'none', 300);
        };
        document.body.appendChild(lb);
    }
}

function runAlphaAction(cmd) {
    if (cmd.startsWith(':')) {
        executeCmd(cmd);
    } else {
        openFile(cmd);
    }
}

const alphaKeyMap = {};
if (config.alpha && config.alpha.actions) {
    config.alpha.actions.forEach(a => {
        alphaKeyMap[a.key] = () => runAlphaAction(a.cmd);
    });
}

function startAsciiDonut(container) {
    let canvas = container.querySelector('.alpha-donut-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'alpha-donut-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        container.insertBefore(canvas, container.firstChild);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    /* 
    // Keep this is you want a limited canva
    const W = 90, H= 28;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    */

    const W = Math.floor(window.innerWidth / 12), H = Math.floor(window.innerHeight / 18);
    const chars = ' .,-~:;=!*#$@';
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    // Keep this is the canvas is full screen in the CSS
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const cellW = canvas.width / W;
    const cellH = canvas.height / H;

    function render() {
        const b = new Array(W * H).fill(' ');
        const z = new Array(W * H).fill(0);
        const { A, B } = asciiAngles;

        for (let j = 0; j < 6.28; j += 0.07) {
            for (let i = 0; i < 6.28; i += 0.02) {
                const sA = Math.sin(A), cA = Math.cos(A);
                const sB = Math.sin(B), cB = Math.cos(B);
                const sj = Math.sin(j), cj = Math.cos(j);
                const si = Math.sin(i), ci = Math.cos(i);

                const h = cj + 2;
                const D = 1 / (si * h * sA + sj * cA + 5);
                const t = si * h * cA - sj * sA;

                const x = Math.floor(W / 2 + 30 * D * (ci * h * cB - t * sB));
                const y = Math.floor(H / 2 + 15 * D * (ci * h * sB + t * cB));
                const o = x + W * y;
                const N = Math.floor(8 * ((sj * sA - si * cj * cA) * cB - si * cj * sA - sj * cA - ci * cj * sB));

                if (y >= 0 && y < H && x >= 0 && x < W && D > z[o]) {
                    z[o] = D;
                    const shade = Math.max(0, Math.min(chars.length - 1, N));
                    b[o] = chars[shade];
                }
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--line-nr').trim() || '#3b4261';
        ctx.textBaseline = 'top';
        ctx.font = `${Math.floor(cellH * 0.95)}px "JetBrains Mono", monospace`;

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const ch = b[y * W + x];
                if (ch !== ' ') ctx.fillText(ch, x * cellW, y * cellH);
            }
        }

        asciiAngles.A += 0.02;
        asciiAngles.B += 0.01;
        asciiAnimId = requestAnimationFrame(render);
    }

    render();
}

function stopAsciiAnimation() {
    if (asciiAnimId) {
        cancelAnimationFrame(asciiAnimId);
        asciiAnimId = null;
    }
}

function startAsciiStarfield(container) {
    let canvas = container.querySelector('.alpha-donut-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'alpha-donut-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        container.insertBefore(canvas, container.firstChild);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    
    // const cssW = 900, cssH = 450;
    const cssW = window.innerWidth, cssH = window.innerHeight;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const numStars = 600;
    const stars = [];
    const starChars = '.+*@#°';

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: (Math.random() - 0.5) * W * 2,
            y: (Math.random() - 0.5) * H * 2,
            z: Math.random() * 1000
        });
    }

    const fontSize = 14 * dpr;
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    function render() {
        ctx.clearRect(0, 0, W, H);
        const color = getComputedStyle(document.documentElement).getPropertyValue('--line-nr').trim() || '#3b4261';

        for (let i = 0; i < numStars; i++) {
            const s = stars[i];
            s.z -= 2;
            if (s.z <= 0) {
                s.x = (Math.random() - 0.5) * W * 2;
                s.y = (Math.random() - 0.5) * H * 2;
                s.z = 1000;
            }

            const sx = cx + (s.x / s.z) * 200;
            const sy = cy + (s.y / s.z) * 200;

            if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;

            const brightness = 1 - s.z / 1000;
            const charIdx = Math.min(starChars.length - 1, Math.floor(brightness * starChars.length));
            ctx.globalAlpha = brightness * 0.8;
            ctx.fillStyle = color;
            ctx.fillText(starChars[charIdx], sx, sy);
        }

        ctx.globalAlpha = 1;
        asciiAnimId = requestAnimationFrame(render);
    }

    render();
}

function startAsciiCube(container) {
    let canvas = container.querySelector('.alpha-donut-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'alpha-donut-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        container.insertBefore(canvas, container.firstChild);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    // const cssW = 900, cssH = 450;
    const cssW = window.innerWidth, cssH = window.innerHeight;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    // const size = Math.min(W, H) * 0.25;
    const size = Math.min(W, H) * 0.25;

    const vertices = [
        [-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1],
        [-1,-1,1],  [1,-1,1],  [1,1,1],  [-1,1,1]
    ];
    const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7]
    ];

    const fontSize = 10 * dpr;
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    function project(v) {
        const { A, B } = asciiAngles;
        const sA = Math.sin(A), cA = Math.cos(A), sB = Math.sin(B), cB = Math.cos(B);
        let [x, y, z] = v;
        const y1 = y * cA - z * sA;
        const z1 = y * sA + z * cA;
        const x1 = x * cB - z1 * sB;
        const z2 = x * sB + z1 * cB;
        const scale = 3 / (3 + z2);
        return [cx + x1 * size * scale, cy + y1 * size * scale];
    }

    function render() {
        ctx.clearRect(0, 0, W, H);
        const color = getComputedStyle(document.documentElement).getPropertyValue('--line-nr').trim() || '#3b4261';
        ctx.fillStyle = color;

        for (const [a, b] of edges) {
            const [x1, y1] = project(vertices[a]);
            const [x2, y2] = project(vertices[b]);

            const dx = x2 - x1, dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.floor(dist / (fontSize * 0.6));

            for (let i = 0; i <= steps; i++) {
                const t = steps === 0 ? 0 : i / steps;
                const px = x1 + dx * t;
                const py = y1 + dy * t;
                ctx.fillText('.', px, py);
            }
        }

        for (const v of vertices) {
            const [px, py] = project(v);
            ctx.fillText('+', px, py);
        }

        asciiAngles.A += 0.015;
        asciiAngles.B += 0.01;
        asciiAnimId = requestAnimationFrame(render);
    }

    render();
}

function startAlphaAnimation(container) {
    const animType = config.alpha?.animation;
    if (animType === false) return;

    const animations = {
        donut: startAsciiDonut,
        starfield: startAsciiStarfield,
        cube: startAsciiCube
    };

    const fn = animations[animType] || animations.cube;
    fn(container);
}

function showAlpha() {
    const ac = config.alpha || {};
    let dash = document.getElementById('alpha-dashboard');

    if (!dash) {
        dash = document.createElement('div');
        dash.id = 'alpha-dashboard';
        dash.className = 'alpha-dashboard';

        const content = document.createElement('div');
        content.className = 'alpha-content';

        const logo = document.createElement('div');
        logo.className = 'alpha-logo';

        const titleText = ac.title || 'neovim-web';
        const accentText = ac.titleAccent || '';
        const titleColor = ac.titleColor || 'var(--blue)';
        const accentColor = ac.titleAccentColor || 'var(--comment)';
        const chars = (titleText + accentText).split('');
        const titleLen = titleText.length;

        chars.forEach((ch, i) => {
            const span = document.createElement('span');
            span.textContent = ch;
            span.className = 'alpha-char';
            span.style.setProperty('--i', i);
            span.style.setProperty('--char-color', i >= titleLen ? accentColor : titleColor);
            logo.appendChild(span);
        });

        const cursor = document.createElement('span');
        cursor.className = 'alpha-cursor';
        cursor.textContent = '_';
        cursor.style.setProperty('--i', chars.length);
        logo.appendChild(cursor);

        const subtitle = document.createElement('div');
        subtitle.className = 'alpha-subtitle';
        subtitle.textContent = ac.subtitle || '';
        if (ac.subtitleColor) subtitle.style.color = ac.subtitleColor;

        const buttons = document.createElement('div');
        buttons.className = 'alpha-buttons';

        (ac.actions || []).forEach((a, i) => {
            const btn = document.createElement('div');
            btn.className = 'alpha-btn';
            btn.style.setProperty('--i', i);
            btn.innerHTML = `<span class="alpha-key">${a.key}</span> <i class="${a.icon}"></i> ${a.label}`;
            btn.addEventListener('click', () => { hideAlpha(); runAlphaAction(a.cmd); });
            buttons.appendChild(btn);
        });

        const footer = document.createElement('div');
        footer.className = 'alpha-footer';
        footer.innerHTML = `<span>${titleText}${accentText}</span> &nbsp; ${config.files.length} files &nbsp; ${Object.keys(customCommands || {}).length} commands`;

        const themeSwitcher = document.createElement('div');
        themeSwitcher.className = 'alpha-theme-switcher';
        THEMES.forEach(t => {
            const dot = document.createElement('span');
            dot.className = 'alpha-theme-dot';
            dot.dataset.theme = t;
            dot.title = t;
            dot.addEventListener('click', () => {
                setTheme(t);
                themeSwitcher.querySelectorAll('.alpha-theme-dot').forEach(d => d.classList.toggle('active', d.dataset.theme === t));
            });
            const current = localStorage.getItem('theme') || THEMES[0];
            if (t === current) dot.classList.add('active');
            themeSwitcher.appendChild(dot);
        });

        content.appendChild(logo);
        content.appendChild(subtitle);
        content.appendChild(buttons);
        content.appendChild(footer);
        content.appendChild(themeSwitcher);
        dash.appendChild(content);
        startAlphaAnimation(dash);
        document.body.appendChild(dash);
    }

    dash.style.display = 'flex';
    requestAnimationFrame(() => dash.classList.add('active'));
    if (!asciiAnimId) startAlphaAnimation(dash);

    state.mode = 'ALPHA';
    el.modeSeg.innerText = 'ALPHA';
    el.modeSeg.className = 'segment mode-alpha';
}

function hideAlpha() {
    const dash = document.getElementById('alpha-dashboard');
    if (!dash) return;
    dash.classList.remove('active');
    stopAsciiAnimation();
    setTimeout(() => { dash.style.display = 'none'; }, 300);
    setMode('NORMAL');
}

window.showAlpha = showAlpha;

function goHome() {
    state.openBuffers = [];
    state.currentFile = null;
    el.output.innerHTML = '';
    el.statusFile.innerText = '[No Name]';
    updateUI();
    showAlpha();
}

window.goHome = goHome;

function initMouseTrackerBar() {
    if (document.getElementById('mouse-track-bar')) return;

    const statusLine = document.querySelector('.status-line');
    if (!statusLine || !statusLine.parentElement) return;

    const bar = document.createElement('div');
    bar.id = 'mouse-track-bar';
    bar.className = 'mouse-track-bar';
    bar.innerHTML = '<span id="mouse-track-indicator" class="mouse-track-indicator"></span>';
    statusLine.parentElement.insertBefore(bar, statusLine);

    const indicator = document.getElementById('mouse-track-indicator');
    if (!indicator) return;

    let currentX = 0;
    let targetX = 0;
    let velocityX = 0;
    let rafId = null;
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    function setFromClientX(clientX) {
        const rect = bar.getBoundingClientRect();
        targetX = clamp(clientX - rect.left, 0, rect.width);
        if (!currentX) currentX = targetX;
    }

    function onMouseMove(e) {
        setFromClientX(e.clientX);
    }

    let touchStartX = null;
    let touchStartY = null;
    let touchStartedOnBar = false;
    let lastTouchAt = 0;

    function onTouchStart(e) {
        const touch = e.touches && e.touches[0];
        if (!touch) return;
        const rect = bar.getBoundingClientRect();
        touchStartedOnBar = touch.clientY >= rect.top && touch.clientY <= rect.bottom;
        if (!touchStartedOnBar) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        setFromClientX(touch.clientX);
    }

    function onTouchEnd(e) {
        const touch = e.changedTouches && e.changedTouches[0];
        if (!touch || touchStartY === null || touchStartX === null || !touchStartedOnBar) return;
        const movedY = Math.abs(touch.clientY - touchStartY);
        const movedX = Math.abs(touch.clientX - touchStartX);
        if (movedY < 10 && movedX < 10) {
            setFromClientX(touch.clientX);
            pulseIndicator();
            lastTouchAt = Date.now();
        }
        touchStartX = null;
        touchStartY = null;
        touchStartedOnBar = false;
    }

    function onTouchCancel() {
        touchStartX = null;
        touchStartY = null;
        touchStartedOnBar = false;
    }

    function onPointerDown(e) {
        // Ignore synthetic mouse events emitted right after touch on mobile.
        if (Date.now() - lastTouchAt < 700) return;
        setFromClientX(e.clientX);
        pulseIndicator();
    }

    function pulseIndicator() {
        indicator.classList.remove('pulse');
        // Restart CSS keyframe cleanly for rapid consecutive clicks.
        void indicator.offsetWidth;
        indicator.classList.add('pulse');
    }

    function onResize() {
        const rect = bar.getBoundingClientRect();
        targetX = clamp(targetX, 0, rect.width);
        currentX = clamp(currentX, 0, rect.width);
        velocityX = 0;
    }

    function tick() {
        const delta = targetX - currentX;
        velocityX += delta * 0.045;
        velocityX *= 0.72;
        currentX += velocityX;
        indicator.style.left = `${Math.round(currentX)}px`;
        rafId = requestAnimationFrame(tick);
    }

    const rect = bar.getBoundingClientRect();
    currentX = rect.width * 0.5;
    targetX = currentX;
    indicator.style.left = `${Math.round(currentX)}px`;

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onPointerDown, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    window.addEventListener('resize', onResize);
    rafId = requestAnimationFrame(tick);
}

function attachImageListeners() {
    const images = el.output.querySelectorAll('img');
    const lb = document.getElementById('lightbox');

    images.forEach(img => {
        img.onclick = (e) => {
            e.stopPropagation();
            lb.innerHTML = '';
            const clone = document.createElement('img');
            clone.src = img.src;
            lb.appendChild(clone);
            lb.style.display = 'flex';
            setTimeout(() => lb.classList.add('active'), 10);
        };
    });
}

async function openFile(filename, force = false) {
    if (state.currentFile === filename && !force) return;
    try {
        const res = await fetch(`content/${filename}.md`);
        if (!res.ok) throw new Error("File not found");
        let text = await res.text();

        state.currentFile = filename;
        if (!state.openBuffers.includes(filename)) state.openBuffers.push(filename);

        el.output.innerHTML = parseIcons(marked.parse(text));

        el.output.querySelectorAll('a').forEach(a => {
            if (a.href && a.href.startsWith('http')) {
                a.target = '_blank';
            }
        });

        if (window.Prism) window.Prism.highlightAllUnder(el.output);
        attachImageListeners();
        updateUI();
        el.scroll.scrollTop = 0;
        if (window.innerWidth < 768) toggleTree(false);

        // if (filename === 'blog') loadBlogCards();
        if (filename === 'archive') loadBlogCards();

    } catch (e) {
        console.error(e);
        el.output.innerHTML = `<h1 style="color:var(--red)">Error 404: ${filename}.md not found</h1>`;
    }
}

function closeBuffer(filename) {
    state.openBuffers = state.openBuffers.filter(f => f !== filename);
    if (state.openBuffers.length === 0) {
        state.currentFile = null;
        el.output.innerHTML = "";
    } else if (state.currentFile === filename) {
        const fallback = state.openBuffers[state.openBuffers.length - 1];
        if (fallback.startsWith('blog:')) {
            openBlogPost(fallback.replace('blog:', ''));
        } else {
            openFile(fallback);
        }
    }
    updateUI();
}

function updateUI() {
    el.tabContainer.innerHTML = state.openBuffers.map(file => {
        const active = file === state.currentFile ? 'active' : '';
        const isBlog = file.startsWith('blog:');

        if (isBlog) {
            const meta = blogMeta[file] || {};
            const label = meta.title ? (meta.title.length > 25 ? meta.title.slice(0, 25) + '...' : meta.title) : file;
            const slug = meta.slug || file.replace(/^blog:/, '');
            return `
                <div class="tab ${active}" onclick="openBlogPost('${slug}')">
                    <i class="fas fa-pen-nib" style="color: var(--green)"></i> ${label}
                    <span class="tab-close" onclick="closeBufferEvent(event, '${file}')">&times;</span>
                </div>
            `;
        }

        const fileIndex = config.files.indexOf(file);
        const color = fileIndex > -1 ? COLORS[fileIndex % COLORS.length] : 'var(--blue)';
        return `
            <div class="tab ${active}" onclick="openFile('${file}')">
                <i class="fas fa-file-code" style="color: ${color}"></i> ${file}.md
                <span class="tab-close" onclick="closeBufferEvent(event, '${file}')">&times;</span>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.file-node').forEach(elem => elem.classList.remove('active'));

    // Note that, although "blog:" is changed to "archive:" in many places, 
    // we still name each individual file within an archive as "blog post".
    // It's just a nomenclature convention, but posts will potentially vary 
    // very much in their content and in their goal.
    if (state.currentFile && !state.currentFile.startsWith('blog:')) {
        document.getElementById(`node-${state.currentFile}`)?.classList.add('active');
    }
    if (state.currentFile) {
        // if (state.currentFile.startsWith('blog:'))
        if (state.currentFile.startsWith('archive:'))
            el.statusFile.innerText = `[archive] ${blogMeta[state.currentFile]?.slug || ''}`;
        else
            el.statusFile.innerText = `${state.currentFile}.md`;
    } else {
        el.statusFile.innerText = '[No Name]';
    }

    requestAnimationFrame(updateTabOverflow);
}

window.closeBufferEvent = (e, filename) => {
    e.stopPropagation();
    closeBuffer(filename);
};

let overflowBuffers = [];

function updateTabOverflow() {
    const container = el.tabContainer;
    const btn = document.getElementById('tab-overflow-btn');
    if (!container || !btn) return;

    const tabs = Array.from(container.querySelectorAll('.tab'));
    tabs.forEach(t => t.style.display = '');
    btn.classList.remove('visible');

    overflowBuffers = [];

    if (container.scrollWidth <= container.clientWidth) {
        const menu = document.getElementById('tab-overflow-menu');
        if (menu) menu.remove();
        return;
    }

    // Show button first so its width is accounted for when measuring
    btn.classList.add('visible');
    for (let i = tabs.length - 1; i >= 1; i--) {
        tabs[i].style.display = 'none';
        overflowBuffers.unshift(state.openBuffers[i]);
        if (container.scrollWidth <= container.clientWidth) break;
    }

    btn.textContent = `+${overflowBuffers.length}`;
}

function buildOverflowItem(file) {
    const item = document.createElement('div');
    const active = file === state.currentFile ? ' active' : '';
    item.className = 'tab-overflow-item' + active;

    const isBlog = file.startsWith('blog:');
    let icon, color, label;

    if (isBlog) {
        const meta = blogMeta[file] || {};
        icon = 'fas fa-pen-nib';
        color = 'var(--green)';
        label = meta.title ? (meta.title.length > 35 ? meta.title.slice(0, 35) + '...' : meta.title) : file;
    } else {
        const fileIndex = config.files.indexOf(file);
        icon = 'fas fa-file-code';
        color = fileIndex > -1 ? COLORS[fileIndex % COLORS.length] : 'var(--blue)';
        label = file + '.md';
    }

    const closeSpan = document.createElement('span');
    closeSpan.className = 'tab-close';
    closeSpan.innerHTML = '&times;';
    closeSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        closeBuffer(file);
    });

    const iconEl = document.createElement('i');
    iconEl.className = icon;
    iconEl.style.color = color;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;

    item.appendChild(iconEl);
    item.appendChild(labelSpan);
    item.appendChild(closeSpan);

    item.addEventListener('click', () => {
        const menu = document.getElementById('tab-overflow-menu');
        if (menu) menu.remove();
        if (isBlog) openBlogPost(file.replace('blog:', ''));
        else openFile(file);
    });

    return item;
}

function toggleTabOverflow() {
    let menu = document.getElementById('tab-overflow-menu');
    if (menu) { menu.remove(); return; }

    if (overflowBuffers.length === 0) return;

    const btn = document.getElementById('tab-overflow-btn');
    const rect = btn.getBoundingClientRect();

    menu = document.createElement('div');
    menu.id = 'tab-overflow-menu';
    menu.className = 'tab-overflow-menu';
    menu.style.top = rect.bottom + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';

    overflowBuffers.forEach(file => menu.appendChild(buildOverflowItem(file)));

    document.body.appendChild(menu);

    const closeHandler = (e) => {
        if (!menu.contains(e.target) && e.target !== btn) {
            menu.remove();
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
}

window.toggleTabOverflow = toggleTabOverflow;
window.addEventListener('resize', () => requestAnimationFrame(updateTabOverflow));

window.duckDB = null;
window.duckConn = null;

window.initDuckDB = async function(sys) {
    if (window.duckConn) return;

    sys.print(`<p style="color:var(--yellow)">> Downloading engine...</p>`);

    try {
        const duckdb = await import('https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/+esm');
        const cdn_base = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/";

        const bundles = {
            mvp: {
                mainModule: `${cdn_base}duckdb-mvp.wasm`,
                mainWorker: `${cdn_base}duckdb-browser-mvp.worker.js`,
            },
            eh: {
                mainModule: `${cdn_base}duckdb-eh.wasm`,
                mainWorker: `${cdn_base}duckdb-browser-eh.worker.js`,
            },
        };

        const bundle = await duckdb.selectBundle(bundles);
        const workerUrl = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        );

        const worker = new Worker(workerUrl);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);

        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        window.duckDB = db;
        window.duckConn = await db.connect();

        sys.print(`<p style="color:var(--blue)">> Ingesting site pages...</p>`);

        await window.duckConn.query(`
            CREATE TABLE pages (
                filename VARCHAR,
                word_count INTEGER,
                content VARCHAR
            );
        `);

        const inserts = config.files.map(async (file) => {
            try {
                const res = await fetch(`content/${file}.md`);
                if (!res.ok) return;
                const text = await res.text();

                const safeContent = text.replace(/'/g, "''").replace(/\n/g, " ");
                const wordCount = text.split(/\s+/).length;

                await window.duckConn.query(`
                    INSERT INTO pages VALUES ('${file}.md', ${wordCount}, '${safeContent}');
                `);
            } catch (e) {
                console.warn(`Skipped ${file}`, e);
            }
        });

        await Promise.all(inserts);
        window.showToast("DuckDB ready", "success");
    } catch (e) {
        console.error(e);
        sys.print(`<p style="color:var(--red)">Database error: ${e.message}</p>`);
    }
};


let telescopeState = null;

function fuzzyMatch(query, text) {
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
        if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length;
}

function highlightFuzzy(text, query) {
    if (!query) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    let result = '';
    let qi = 0;
    for (let i = 0; i < text.length; i++) {
        if (qi < lowerQuery.length && lowerText[i] === lowerQuery[qi]) {
            result += `<span class="telescope-match">${text[i]}</span>`;
            qi++;
        } else {
            result += text[i];
        }
    }
    return result;
}

function buildTelescopeItems() {
    const items = [];

    config.files.forEach((file, index) => {
        const color = COLORS[index % COLORS.length];
        items.push({
            section: 'Files',
            label: `${file}.md`,
            icon: 'fab fa-markdown',
            iconColor: color,
            desc: '',
            searchText: file,
            action: () => openFile(file)
        });
    });

    for (const [key, cmd] of Object.entries(customCommands)) {
        items.push({
            section: 'Commands',
            label: `:${key}`,
            icon: 'fas fa-terminal',
            iconColor: 'var(--cyan)',
            desc: cmd.desc,
            searchText: `${key} ${cmd.desc}`,
            action: () => executeCmd(`:${key}`)
        });
    }

    config.links.forEach(link => {
        items.push({
            section: 'Links',
            label: link.label,
            icon: link.icon,
            iconColor: 'var(--purple)',
            desc: link.url,
            searchText: `${link.label} ${link.url}`,
            action: () => window.open(link.url, '_blank')
        });
    });

    return items;
}

function openTelescope() {
    if (state.mode === 'TELESCOPE' || state.mode === 'ALPHA') return;

    state.mode = 'TELESCOPE';
    el.modeSeg.innerText = 'TELESCOPE';
    el.modeSeg.className = 'segment mode-telescope';

    const items = buildTelescopeItems();

    let overlay = document.getElementById('telescope-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'telescope-overlay';
        overlay.className = 'telescope-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeTelescope();
        });
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'telescope-panel';

    const header = document.createElement('div');
    header.className = 'telescope-header';

    const icon = document.createElement('span');
    icon.className = 'telescope-icon';
    icon.innerHTML = '<i class="fas fa-search"></i> Telescope';
    header.appendChild(icon);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'telescope-input';
    input.placeholder = 'Search files, commands, links...';
    input.autocomplete = 'off';
    input.spellcheck = false;
    header.appendChild(input);

    const results = document.createElement('div');
    results.className = 'telescope-results';

    panel.appendChild(header);
    panel.appendChild(results);
    overlay.appendChild(panel);

    let selectedIndex = 0;
    let filteredItems = [...items];

    function render() {
        results.innerHTML = '';
        if (filteredItems.length === 0) {
            results.innerHTML = '<div class="telescope-empty">No results found</div>';
            return;
        }

        let currentSection = '';
        filteredItems.forEach((item, i) => {
            if (item.section !== currentSection) {
                currentSection = item.section;
                const sectionEl = document.createElement('div');
                sectionEl.className = 'telescope-section';
                sectionEl.textContent = currentSection;
                results.appendChild(sectionEl);
            }

            const row = document.createElement('div');
            row.className = 'telescope-row' + (i === selectedIndex ? ' selected' : '');

            const highlighted = input.value ? highlightFuzzy(item.label, input.value) : item.label;
            const descHtml = item.desc ? `<span class="telescope-desc">${item.desc}</span>` : '';
            row.innerHTML = `<i class="${item.icon}" style="color: ${item.iconColor}; width: 18px; text-align: center;"></i>
                <span>${highlighted}</span>${descHtml}`;

            row.addEventListener('click', (e) => {
                e.stopPropagation();
                closeTelescope();
                item.action();
            });
            let rowTouchY;
            row.addEventListener('touchstart', (e) => { rowTouchY = e.touches[0].clientY; }, { passive: true });
            row.addEventListener('touchend', (e) => {
                if (Math.abs(e.changedTouches[0].clientY - rowTouchY) < 10) {
                    e.preventDefault();
                    closeTelescope();
                    item.action();
                }
            });
            results.appendChild(row);
        });

        const selectedRow = results.querySelector('.telescope-row.selected');
        if (selectedRow) selectedRow.scrollIntoView({ block: 'nearest' });
    }

    function search(query) {
        query = query.toLowerCase().trim();
        if (!query) {
            filteredItems = [...items];
        } else {
            filteredItems = items.filter(item => fuzzyMatch(query, item.searchText.toLowerCase()));
        }
        selectedIndex = 0;
        render();
    }

    input.addEventListener('input', () => search(input.value));

    telescopeState = {
        get selectedIndex() { return selectedIndex; },
        set selectedIndex(v) { selectedIndex = v; },
        get filteredItems() { return filteredItems; },
        render
    };

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));

    render();
    setTimeout(() => input.focus(), 50);
}

function closeTelescope() {
    const overlay = document.getElementById('telescope-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
    telescopeState = null;
    setMode('NORMAL');
}

function telescopeNav(delta) {
    if (!telescopeState || telescopeState.filteredItems.length === 0) return;
    telescopeState.selectedIndex = Math.max(0,
        Math.min(telescopeState.filteredItems.length - 1,
            telescopeState.selectedIndex + delta));
    telescopeState.render();
}

function telescopeSelect() {
    if (!telescopeState || telescopeState.filteredItems.length === 0) return;
    const item = telescopeState.filteredItems[telescopeState.selectedIndex];
    closeTelescope();
    item.action();
}

window.openTelescope = openTelescope;

function setMode(mode) {
    state.mode = mode;
    el.modeSeg.innerText = mode;
    el.modeSeg.className = mode === 'COMMAND' ? 'segment mode-command' : 'segment mode-normal';
    if (mode === 'COMMAND') {
        el.cmdDisplay.style.display = 'none';
        el.cmdInput.style.display = 'block';
        el.cmdInput.value = ':';
        el.cmdInput.focus();
    } else {
        el.cmdDisplay.style.display = 'block';
        el.cmdInput.style.display = 'none';
        el.scroll.focus();
    }
}

function executeCmd(val) {
    const raw = val.replace(':', '').trim();
    const parts = raw.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    if (typeof gtag === 'function') {
        gtag('event', 'command_execute', { 'command_name': cmd });
    }

    if (config.files.includes(cmd)) {
        openFile(cmd);
    } else if (customCommands && customCommands[cmd]) {
        const sys = {
            openFile: openFile,
            closeBuffer: () => closeBuffer(state.currentFile),
            print: (html) => {
                state.currentFile = null;
                el.output.innerHTML = html;
                el.statusFile.innerText = '[cmd out]';
                document.querySelectorAll('.file-node').forEach(elem => elem.classList.remove('active'));
            },
            alert: (msg) => showToast(msg, 'info'),
            error: (msg) => showToast(msg, 'error'),
            success: (msg) => showToast(msg, 'success')
        };
        customCommands[cmd].fn(args, sys);
    } else {
        showToast(`E492: Not an editor command: ${cmd}`, 'error');

        if (typeof gtag === 'function') {
            gtag('event', 'command_error', { 'invalid_input': cmd });
        }
    }

    setMode('NORMAL');
}

function toggleTree(force) {
    const isOpen = typeof force === 'boolean' ? force : !el.tree.classList.contains('open');
    el.tree.classList.toggle('open', isOpen);

    let backdrop = document.getElementById('tree-backdrop');
    if (isOpen) {
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'tree-backdrop';
            backdrop.className = 'tree-backdrop';
            backdrop.addEventListener('click', () => toggleTree(false));
            let backdropTouchY;
            backdrop.addEventListener('touchstart', (e) => { backdropTouchY = e.touches[0].clientY; }, { passive: true });
            backdrop.addEventListener('touchend', (e) => {
                if (Math.abs(e.changedTouches[0].clientY - backdropTouchY) < 10) {
                    e.preventDefault();
                    toggleTree(false);
                }
            });
            document.querySelector('.app-container').appendChild(backdrop);
        }
        backdrop.style.display = 'block';
    } else if (backdrop) {
        backdrop.style.display = 'none';
    }
}

const mobileCmdInput = document.getElementById('mobile-cmd-input');
const mobileCmdBtn = document.getElementById('mobile-cmd-btn');

function triggerMobileCmd() {
    const val = mobileCmdInput.value.toLowerCase();
    if (val.trim() !== '') {
        executeCmd(val);
        mobileCmdInput.value = '';
        mobileCmdInput.blur();
        toggleTree(false);
    }
}

if (mobileCmdInput && mobileCmdBtn) {
    mobileCmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerMobileCmd();
    });

    mobileCmdBtn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerMobileCmd();
    });

    mobileCmdBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        triggerMobileCmd();
    });
}

function updateClock() {
    const clock = document.getElementById('clock-widget');
    if (clock) {
        const now = new Date();
        clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
setInterval(updateClock, 1000);
updateClock();

const gitBranch = document.getElementById('git-branch');
if (gitBranch) {
    gitBranch.addEventListener('click', () => {
        if (config.repo?.url) window.open(config.repo.url, '_blank');
    });
}

document.addEventListener('keydown', e => {
    if (state.mode === 'ALPHA') {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (key === ':') { hideAlpha(); setMode('COMMAND'); return; }
        if (alphaKeyMap[key]) { hideAlpha(); alphaKeyMap[key](); return; }
        if (key !== 'shift' && key !== 'control' && key !== 'alt' && key !== 'meta') {
            hideAlpha();
            openFile(config.startPage);
        }
        return;
    }

    if (state.mode === 'TELESCOPE') {
        if (e.key === 'Escape') { e.preventDefault(); closeTelescope(); return; }
        if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); telescopeNav(1); return; }
        if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); telescopeNav(-1); return; }
        if (e.key === 'Enter') { e.preventDefault(); telescopeSelect(); return; }
        return;
    }

    if (state.mode === 'COMMAND') {
        if (e.key === 'Enter') executeCmd(el.cmdInput.value);
        if (e.key === 'Escape') setMode('NORMAL');
        return;
    }

    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

    if (e.key === 'j') el.scroll.scrollBy({ top: 50, behavior: 'smooth' });
    if (e.key === 'k') el.scroll.scrollBy({ top: -50, behavior: 'smooth' });
    if (e.key === ':') { e.preventDefault(); setMode('COMMAND'); }
    if (e.key === '/' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); openTelescope(); }
});

el.scroll.addEventListener('scroll', () => {
    const pct = Math.round((el.scroll.scrollTop / (el.scroll.scrollHeight - el.scroll.clientHeight)) * 100);
    document.getElementById('status-percent').innerText = isNaN(pct) ? 'TOP' : `${pct}%`;
});

const blogMeta = {};

async function openBlogPost(slug) {
    const bufferName = `blog:${slug}`;
    if (state.currentFile === bufferName) return;

    try {
        const postsDir = config.blog?.postsDir || 'posts';
        const res = await fetch(`${postsDir}/${slug}.md`);
        if (!res.ok) throw new Error('Post not found');
        const raw = await res.text();

        const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
        let title = slug, content = raw;
        if (fmMatch) {
            const fmBlock = fmMatch[1];
            content = fmMatch[2];
            const titleMatch = fmBlock.match(/^title:\s*(.+)/m);
            if (titleMatch) title = titleMatch[1].trim().replace(/^['"]|['"]$/g, '');
        }

        blogMeta[bufferName] = { slug, title };

        const fullMarkdown = `# ${title}\n\n${content}`;

        state.currentFile = bufferName;
        if (!state.openBuffers.includes(bufferName)) state.openBuffers.push(bufferName);

        el.output.innerHTML = parseIcons(marked.parse(fullMarkdown));

        el.output.querySelectorAll('a').forEach(a => {
            if (a.href && a.href.startsWith('http')) a.target = '_blank';
        });

        if (window.Prism) window.Prism.highlightAllUnder(el.output);
        attachImageListeners();
        updateUI();
        el.scroll.scrollTop = 0;
        if (window.innerWidth < 768) toggleTree(false);
    } catch (e) {
        console.error(e);
        el.output.innerHTML = `<h1 style="color:var(--red)">Error: Could not load blog post</h1>`;
    }
}

window.openBlogPost = openBlogPost;

async function loadBlogCards() {
    const grid = document.getElementById('blog-posts-grid');
    const empty = document.getElementById('blog-posts-empty');
    if (!grid) return;

    try {
        const res = await fetch(config.blog?.manifestPath || 'posts/posts.json');
        if (!res.ok) throw new Error('Could not load posts');
        const posts = await res.json();

        if (posts.length === 0) {
            if (empty) empty.style.display = 'block';
            return;
        }

        grid.innerHTML = posts.map(post => `
            <div class="blog-card" onclick="openBlogPost('${post.slug}')">
                ${post.image ? `<img src="${post.image}" onerror="this.style.display='none'">` : ''}
                <div class="blog-card-body">
                    <div class="blog-card-title">${post.title}</div>
                    <div class="blog-card-meta">
                        ${post.date} ${post.tags.map(t => `<span class="blog-tag">${t}</span>`).join(' ')}
                    </div>
                    <div class="blog-card-desc">${post.description}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p style="color:var(--comment)">Could not load posts.</p>';
    }
}

window.openFile = openFile;
window.toggleTree = toggleTree;
