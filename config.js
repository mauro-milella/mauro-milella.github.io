const config = {
    title: 'Mauro Milella',
    startPage: 'home',

    files: [
        'home',
        'about'
    ],

    links: [
        { label: 'GitHub', url: 'https://github.com/m0rr13', icon: 'fab fa-github' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mauro-milella/', icon: 'fab fa-linkedin' },
    ],

    alpha: {
        enabled: true,
        animation: 'starfield',
        title: 'mauro',
        titleColor: 'var(--blue)',
        titleAccent: 'milella',
        titleAccentColor: 'var(--comment)',
        subtitle: 'Welcome to my neovim-themed personal website',
        subtitleColor: 'var(--comment)',
        actions: [
            { key: 'h', icon: 'fas fa-home',     label: 'Home',  cmd: 'home' },
            { key: 'a', icon: 'fas fa-user',     label: 'About', cmd: 'about' },
            { key: '?', icon: 'fas fa-terminal', label: 'Help',  cmd: ':help' },
            // { key: 's', icon: 'fas fa-database', label: 'SQL',   cmd: ':sql' },
            // { key: 'g', icon: 'fas fa-gamepad',  label: 'Snake', cmd: ':snake' },
        ]
    },

    meta: {
        description: 'Mauro\'s personal website',
        ogImage: 'images/og-image.png',
        favicon: 'images/favicon.svg',
        favicon32: 'images/favicon-32.png',
    },

    analytics: {
        enabled: false,
        googleId: ''
    },

    // repo: {
    //     url: '',
    //     branch: 'main'
    // },

    contact: {
        email: 'mauro.milella@unife.it'
    },

    blog: {
        enabled: true,
        manifestPath: 'posts/posts.json',
        postsDir: 'posts'
    },

    themes: ['gruvbox', 'tokyo', 'dracula', 'cyberpunk', 'latte'],
    defaultTheme: 'gruvbox',
};
