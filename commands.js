const customCommands = {

    'help': {
        desc: 'Show this help menu',
        fn: (args, sys) => {
            let html = `<h1>Available Commands</h1>`;
            html += `<p>Type <code>:command_name</code> to execute.</p>`;
            html += `<table>`;

            for (const [key, cmd] of Object.entries(customCommands)) {
                if (cmd.easterEgg) continue;

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
        easterEgg: true, // hide the recursive :telescope within telescope
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

    'cv': {
        desc: 'Download curriculum',
        fn: (args, sys) => {
            const cvPath = '/resources/cv.pdf'; 
            const link = document.createElement('a');
            link.href = cvPath;
            link.download = 'mauro_milella_cv.pdf';

            document.body.appendChild(link);
            link.click();
            link.remove();
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
        desc: 'Spawn a train',
        easterEgg: true,
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

            // Uh! So you are inspecting the source code ; )
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
};
