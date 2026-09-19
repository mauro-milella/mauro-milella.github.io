const customCommands = {

    'help': {
        desc: 'Show this help menu',
        fn: (args, sys) => {
            let html = `<h1>Available Commands</h1>`;
            html += `<p>Type <code>:command_name</code> to execute.</p>`;
            html += `<table>`;

            for (const [key, cmd] of Object.entries(customCommands)) {
                html += `<tr>
                    <td style="color: var(--cyan); font-weight:bold; padding-right:20px">:${key}</td>
                    <td style="color: var(--fg);">${cmd.desc}</td>
                </tr>`;
            }

            html += `</table>`;
            html += `<br><p>You can also type filenames like <code>:about</code>.</p>`;

            sys.print(html);
        }
    },

    'startup': {
        desc: 'Show startup dashboard',
        fn: (args, sys) => {
            setTimeout(() => window.showAlpha(), 0);
        }
    },

    'telescope': {
        desc: 'Fuzzy finder for files, commands, and links',
        fn: (args, sys) => {
            setTimeout(() => window.openTelescope(), 0);
        }
    },

    'q': {
        desc: 'Close current buffer',
        fn: (args, sys) => {
            sys.closeBuffer();
        }
    },

    'contact': {
        desc: 'Send a mail',
        fn: (args, sys) => {
            const email = config.contact?.email || 'mauro.milella@.com';
            sys.print(`<p>Initiating transmission to <strong style="color:var(--green)">${email}</strong>...</p>`);

            setTimeout(() => {
                window.location.href = `mailto:${email}`;
            }, 800);
        }
    },

    'theme': {
        desc: 'Cycle through themes',
        fn: (args, sys) => {
            const themes = window.THEMES || ['tokyo', 'gruvbox'];

            const current = localStorage.getItem('theme') || themes[0];
            const currentIndex = themes.indexOf(current);
            const nextIndex = (currentIndex + 1) % themes.length;
            const nextTheme = themes[nextIndex];

            window.setTheme(nextTheme);
            sys.print(`<p>System theme updated: <strong style="color:var(--blue)">${nextTheme.toUpperCase()}</strong></p>`);
        }
    },

    'sl': {
        desc: 'Don\'t mistype ls',
        fn: (args, sys) => {
            const train = document.createElement('pre');
            train.style.position = 'fixed';
            train.style.top = 'calc(50% - 100px)';
            train.style.left = '100vw';
            train.style.zIndex = '10000';
            train.style.color = 'var(--fg)';
            train.style.fontFamily = 'monospace';
            train.style.fontWeight = 'bold';
            train.style.fontSize = '12px';
            train.style.lineHeight = '12px';
            train.style.pointerEvents = 'none';
            train.style.transition = 'transform 6s linear';

            train.innerText = `
      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|     _________________
   /     |  |   H  |  |     |   |         ||_|   |_|   /                |
  |      |  |   H  |__--------------------| [___] |   =|                |
  | ________|___H__/__|_____/[][]~\\_______|       |   -|                |
  |/ |   |-----------I_____I [][] []  D   |=======|____|________________|_
__/ =| o |=-~~\\  /~\\  /~\\  /~\\ ____Y___________|__|_________________|
 |/-=|___|=O=====O=====O=====O   |_____/~\\___/          |_D__D__D_|  D
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/   \\_/
            `;

            document.body.appendChild(train);

            requestAnimationFrame(() => {
                const distance = window.innerWidth + 600;
                train.style.transform = `translateX(-${distance}px)`;
            });

            setTimeout(() => {
                document.body.removeChild(train);
            }, 6000);
        }
    },

    /* Disabled (but interesting) ideas

    'date': {
        desc: 'Display current system time',
        fn: (args, sys) => {
            const now = new Date();
            sys.print(`
                <h1>System Status</h1>
                <ul>
                    <li><strong>Date:</strong> ${now.toLocaleDateString()}</li>
                    <li><strong>Time:</strong> ${now.toLocaleTimeString()}</li>
                    <li><strong>Timezone:</strong> ${Intl.DateTimeFormat().resolvedOptions().timeZone}</li>
                </ul>
            `);
        }
    },

    'socials': {
        desc: 'List social media links',
        fn: (args, sys) => {
            let html = `<h1>Social Links</h1><ul>`;

            config.links.forEach(link => {
                html += `<li><i class="${link.icon}"></i> <a href="${link.url}">${link.label}</a></li>`;
            });

            html += `</ul>`;
            sys.print(html);
        }
    },

    'whoami': {
        desc: 'Identify current user session',
        fn: async (args, sys) => {
            sys.print(`<p style="color:var(--comment)">Scanning network nodes... <span class="cursor">|</span></p>`);

            const width = window.screen.width;
            const height = window.screen.height;
            const lang = navigator.language.toUpperCase();
            const platform = navigator.platform;
            const cores = navigator.hardwareConcurrency || "?";

            const ua = navigator.userAgent;
            let os = "Unknown OS";
            if (ua.indexOf("Win") !== -1) os = "Windows";
            if (ua.indexOf("Mac") !== -1) os = "macOS";
            if (ua.indexOf("Linux") !== -1) os = "Linux";
            if (ua.indexOf("Android") !== -1) os = "Android";
            if (ua.indexOf("like Mac") !== -1) os = "iOS";

            let ip = "127.0.0.1";
            let city = "Unknown";
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                ip = data.ip;
                city = `${data.city}, ${data.country_code}`;
            } catch (e) {
                ip = "Hidden/VPN";
            }

            const html = `
                <h1>Session Established</h1>
                <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px; background: rgba(0,0,0,0.2); padding: 20px; border: 1px solid var(--line-nr);">

                    <div style="color:var(--blue)">USER</div>
                    <div>visitor@${ip}</div>

                    <div style="color:var(--purple)">LOCATION</div>
                    <div>${city}</div>

                    <div style="color:var(--green)">SYSTEM</div>
                    <div>${os} (${platform})</div>

                    <div style="color:var(--yellow)">DISPLAY</div>
                    <div>${width}x${height}px</div>

                    <div style="color:var(--orange)">HARDWARE</div>
                    <div>${cores} Cores</div>

                    <div style="color:var(--red)">LOCALE</div>
                    <div>${lang}</div>
                </div>
                <br>
                <p style="color:var(--comment)">// Agent: ${ua}</p>
                <p>> Access level: <span style="color:var(--green)">GUEST</span> (Read Only)</p>
            `;

            sys.print(html);
        }
    },

    'matrix': {
        desc: 'Wake up, Neo...',
        fn: (args, sys) => {
            const getThemeColor = (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

            const bgHex = getThemeColor('--bg');
            const fgHex = getThemeColor('--blue');

            const canvas = document.createElement('canvas');
            Object.assign(canvas.style, {
                position: 'fixed', top: '0', left: '0',
                width: '100vw', height: '100vh', zIndex: '99999',
                background: 'var(--bg)',
                transition: 'opacity 1s'
            });
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const fontSize = 16;
            const columns = canvas.width / fontSize;
            const drops = Array(Math.floor(columns)).fill(1);

            let animationId;
            const draw = () => {
                ctx.globalAlpha = 0.1;
                ctx.fillStyle = bgHex;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.globalAlpha = 1.0;
                ctx.fillStyle = fgHex;
                ctx.font = fontSize + 'px monospace';

                for(let i = 0; i < drops.length; i++) {
                    const text = chars.charAt(Math.floor(Math.random() * chars.length));
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                }
                animationId = requestAnimationFrame(draw);
            };
            draw();

            setTimeout(() => {
                canvas.style.opacity = '0';
                setTimeout(() => {
                    cancelAnimationFrame(animationId);
                    document.body.removeChild(canvas);
                }, 1000);
            }, 5000);
        }
    },

    'snake': {
        desc: 'Play snake',
        fn: (args, sys) => {
            const container = document.getElementById('markdown-output');
            const width = Math.min(container.clientWidth, window.innerWidth - 40);
            const height = 400;

            container.innerHTML = `
                <div id="snake-ui" style="text-align:center; margin-bottom:10px;">
                    <h2 style="margin:0; color:var(--green)">VIM SNAKE</h2>
                    <p class="desktop-only" style="color:var(--comment)">h, j, k, l or arrows to move, q to quit</p>
                    <div>Score: <span id="score" style="color:var(--yellow)">0</span> | High: <span id="highscore" style="color:var(--purple)">0</span></div>
                </div>
                <canvas id="snake-game" width="${width}" height="${height}" style="border:2px solid var(--line-nr); background:var(--bg-dark); display:block; margin:0 auto; max-width:100%;"></canvas>

                <div id="snake-controls">
                    <div class="snake-btn" id="btn-quit">Q</div>
                    <div class="snake-btn" id="btn-up">▲</div>
                    <div class="snake-btn" id="btn-left">◀</div>
                    <div class="snake-btn" id="btn-down">▼</div>
                    <div class="snake-btn" id="btn-right">▶</div>
                </div>
            `;

            document.body.classList.add('game-active');

            const canvas = document.getElementById('snake-game');
            const ctx = canvas.getContext('2d');
            const scoreEl = document.getElementById('score');
            const highEl = document.getElementById('highscore');

            const gridSize = 20;
            const tileCountX = Math.floor(width / gridSize);
            const tileCountY = Math.floor(height / gridSize);
            let score = 0;
            let highScore = localStorage.getItem('snake_highscore') || 0;
            highEl.innerText = highScore;

            let x = 10, y = 10, dx = 0, dy = 0;
            let trail = [], tail = 5;
            let foodX = 15, foodY = 15;
            let gameInterval, isRunning = true;

            function game() {
                if (!isRunning) return;
                x += dx; y += dy;

                if (x < 0) x = tileCountX - 1;
                if (x > tileCountX - 1) x = 0;
                if (y < 0) y = tileCountY - 1;
                if (y > tileCountY - 1) y = 0;

                const getCol = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
                ctx.fillStyle = getCol('--bg-dark');
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = getCol('--blue');
                for (let i = 0; i < trail.length; i++) {
                    ctx.fillRect(trail[i].x * gridSize, trail[i].y * gridSize, gridSize - 2, gridSize - 2);
                    if (trail[i].x === x && trail[i].y === y && (dx !== 0 || dy !== 0)) {
                        tail = 5; score = 0; scoreEl.innerText = score; dx = 0; dy = 0;
                    }
                }
                trail.push({ x: x, y: y });
                while (trail.length > tail) trail.shift();

                ctx.fillStyle = getCol('--red');
                ctx.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);

                if (x === foodX && y === foodY) {
                    tail++; score++; scoreEl.innerText = score;
                    if (score > highScore) { highScore = score; localStorage.setItem('snake_highscore', highScore); highEl.innerText = highScore; }
                    foodX = Math.floor(Math.random() * tileCountX);
                    foodY = Math.floor(Math.random() * tileCountY);
                }
            }

            function move(dir) {
                if (!isRunning) return;
                if (dir === 'left' && dx !== 1) { dx = -1; dy = 0; }
                if (dir === 'up' && dy !== 1) { dx = 0; dy = -1; }
                if (dir === 'right' && dx !== -1) { dx = 1; dy = 0; }
                if (dir === 'down' && dy !== -1) { dx = 0; dy = 1; }
            }

            function keyPush(evt) {
                switch (evt.key) {
                    case 'h': case 'ArrowLeft':  move('left'); break;
                    case 'k': case 'ArrowUp':    move('up'); break;
                    case 'l': case 'ArrowRight': move('right'); break;
                    case 'j': case 'ArrowDown':  move('down'); break;
                    case 'q': quitGame(); break;
                }
            }

            function quitGame() {
                isRunning = false;
                clearInterval(gameInterval);

                document.removeEventListener('keydown', keyPush);
                document.body.classList.remove('game-active');

                container.innerHTML = "";
                sys.openFile(config.startPage, true);
            }

            document.addEventListener('keydown', keyPush);

            document.getElementById('btn-up').addEventListener('touchstart', (e) => { e.preventDefault(); move('up'); });
            document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); move('down'); });
            document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); move('left'); });
            document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); move('right'); });
            document.getElementById('btn-quit').addEventListener('touchstart', (e) => { e.preventDefault(); quitGame(); });

            gameInterval = setInterval(game, 1000 / 15);
        }
    },

    'sql': {
        desc: 'Query this website using DuckDB',
        fn: async (args, sys) => {
            if (!window.duckConn) {
                await window.initDuckDB(sys);

                if (!window.duckConn) {
                    sys.print(`<p style="color:var(--red)">Error: Database failed to initialize.</p>`);
                    return;
                }
            }

            const query = args.join(" ");
            if (!query || query.trim() === "") {
                sys.print(`
                    <h1>DuckDB SQL Console</h1>
                    <p>Enter a standard SQL query.</p>
                    <p>Tables: <code>pages</code></p>
                    <p style="margin-bottom:10px">Examples:</p>
                    <ul>
                        <li><code>:sql SELECT * FROM pages</code></li>
                        <li><code>:sql SELECT filename, word_count FROM pages ORDER BY 2 DESC</code></li>
                    </ul>
                `);
                return;
            }

            try {
                const arrowResult = await window.duckConn.query(query);
                const result = arrowResult.toArray().map((row) => row.toJSON());

                if (result.length === 0) {
                    sys.print(`<p>Query executed successfully. 0 rows returned.</p>`);
                    return;
                }

                const columns = Object.keys(result[0]);

                let html = `<div style="overflow-x:auto; margin-top:15px; border:1px solid var(--line-nr);">
                    <table style="width:100%; border-collapse: collapse; font-family:monospace; font-size:0.8rem;">
                        <tr style="background:var(--bg-dark); color:var(--blue);">`;

                columns.forEach(col => {
                    html += `<th style="padding:10px; border-bottom:1px solid var(--line-nr); text-align:left;">${col}</th>`;
                });
                html += `</tr>`;

                const escapeHtml = (unsafe) => {
                    return String(unsafe)
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                }

                result.forEach(row => {
                    html += `<tr>`;
                    columns.forEach(col => {
                        let val = row[col];

                        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                        if (typeof val === 'string') {
                            if (val.length > 100) val = val.substring(0, 100) + "...";
                            val = escapeHtml(val);
                        }

                        html += `<td style="padding:8px; border-bottom:1px solid var(--line-nr); border-right:1px solid var(--line-nr);">${val}</td>`;
                    });
                    html += `</tr>`;
                });


                html += `</table></div>
                         <p style="color:var(--comment); font-size:0.8rem; margin-top:5px;">${result.length} rows returned.</p>`;

                sys.print(html);

            } catch (err) {
                sys.print(`<p style="color:var(--red)">SQL Error: ${err.message}</p>`);
            }
        }
    },

    'clear': {
        desc: 'Clear current buffer',
        fn: (args, sys) => {
            sys.print("");
        }
    },

    */
};
