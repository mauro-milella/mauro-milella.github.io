const config = {
    title: 'Mauro Milella',
    startPage: 'about',

    files: [
        // 'home',
        'about',
        'archive'
    ],

    links: [
        { label: 'GitHub', url: 'https://github.com/mauro-milella', icon: 'fab fa-github' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mauro-milella/', icon: 'fab fa-linkedin' },
    ],

    alpha: {
        enabled: true,
        // 'field' (ASCII flow field, see alpha.js), 'starfield', 'donut', 'cube' or false
        animation: 'field',
        title: 'mauro',
        titleColor: 'var(--main)',
        titleAccent: 'milella',
        titleAccentColor: 'var(--comment)',
        // The prompt under the name types the subtitle, then cycles through the taglines
        subtitle: 'welcome to my website!',
        subtitleColor: 'var(--comment)',
        taglines: [
            'phd student in mathematics @ unife',
            // 'formal aspects of language modeling',
            // 'currently into formal verification',
            // 'obsessed with color themes (gruvbox)',
            // 'psst: a puzzle hides in about.md',
        ],
        // One is picked at random under the startup stats, like alpha-nvim's fortune
        fortunes: [
            // { quote: 'Beware of bugs in the above code; I have only proved it correct, not tried it.', author: 'Donald Knuth' },
            // { quote: 'Wir müssen wissen. Wir werden wissen.', author: 'David Hilbert' },
            // { quote: 'Mathematics is the art of giving the same name to different things.', author: 'Henri Poincaré' },
            // { quote: 'Program testing can be used to show the presence of bugs, but never to show their absence.', author: 'Edsger W. Dijkstra' },
        ],
        // cmd: a file name, a ':command', or a dashboard built-in ('@telescope',
        // '@theme', '@cv') that runs on top of the dashboard and keeps it open
        actions: [
            // { key: 'h', icon: 'fas fa-home',     label: 'Home',  cmd: 'home' },
            // The one way into the site: a click (or the Enter key while it is selected)
            { key: '↵', icon: 'fas fa-arrow-right-to-bracket', label: 'Enter', cmd: 'about', primary: true },
            { key: '/', icon: 'fas fa-magnifying-glass',  label: 'Find anything', cmd: '@telescope' },
            { key: 'c', icon: 'fas fa-envelope',          label: 'Contact',       cmd: ':contact' },
            { key: 'd', icon: 'fas fa-file-arrow-down',   label: 'Download CV',   cmd: '@cv' },
            { key: '?', icon: 'fas fa-terminal',          label: 'Help',          cmd: ':help' },
            // { key: 's', icon: 'fas fa-database', label: 'SQL',   cmd: ':sql' },
            // { key: 'g', icon: 'fas fa-gamepad',  label: 'Snake', cmd: ':snake' },
        ]
    },

    meta: {
        description: 'Mauro\'s website',
        ogImage: 'images/og-image.png',
        favicon: 'images/favicon.svg',
        favicon32: 'images/favicon-32.png',
    },

    analytics: {
        enabled: false,
        googleId: ''
    },

    contact: {
        email: 'mauro.milella@unife.it'
    },

    archive: {
        enabled: true,
        manifestPath: 'posts/posts.json',
        postsDir: 'posts'
    },

    themes: ['gruvbox', 'tokyo', 'dracula', 'cyberpunk', 'latte'],
    defaultTheme: 'gruvbox',
};
