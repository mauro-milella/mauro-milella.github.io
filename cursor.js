// The cursor is just an illusion ; )
// A small planet (the dot) sticks to the pointer and a ring trails behind it.
// Over anything clickable the ring tightens and the planet orbits along it.
(() => {
    const cursor = document.getElementById('custom-cursor');
    // Only on devices with a real pointer; touch screens keep their native behaviour
    if (!cursor || window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    const root = document.documentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ring = cursor.querySelector('.cursor-ring');
    const circle = ring.querySelector('circle');
    const dot = cursor.querySelector('.cursor-dot');

    const INTERACTIVE = [
        'a[href]', 'button', 'input', 'select', 'textarea', 'label', 'summary', '[onclick]',
        '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="option"]', '[role="tab"]',
        // the editor pane is focusable only to scroll with the keyboard
        '[tabindex]:not([tabindex="-1"]):not(.content-scroll)',
    ].join(', ');
    const CLICKABLE_CURSORS = new Set(['pointer', 'zoom-in', 'zoom-out', 'grab', 'grabbing']);
    const RING_R = 16, RING_HOVER_R = 10, PRESS_SCALE = 0.75;
    const ORBIT_SPEED = Math.PI * 2 * 0.85; // radians per second

    // Hides the native cursor everywhere (see style.css)
    root.classList.add('custom-cursor-on');

    const mouse = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let r = RING_R, hover = 0, angle = -Math.PI / 2;
    let target = null, interactive = false, pressed = false, visible = false;
    let raf = 0, last = 0, frames = 0;

    function isInteractive(el) {
        if (!(el instanceof Element) || el === root || el === document.body) return false;
        if (el.closest(INTERACTIVE)) return true;
        // Anything styled as clickable counts too: peek at its authored cursor
        // by lifting the global cursor: none for a moment (no repaint happens in between)
        root.classList.remove('custom-cursor-on');
        const c = getComputedStyle(el).cursor;
        root.classList.add('custom-cursor-on');
        return CLICKABLE_CURSORS.has(c);
    }

    function retarget(el, force) {
        if (el === target && !force) return;
        target = el;
        interactive = isInteractive(el);
        cursor.classList.toggle('is-hover', interactive);
    }

    // Overlays open and close under a resting pointer, so look again after input
    function recheckSoon() {
        for (const ms of [60, 400]) {
            setTimeout(() => {
                if (!visible) return;
                retarget(document.elementFromPoint(mouse.x, mouse.y), true);
                wake();
            }, ms);
        }
    }

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (++frames % 15 === 0) retarget(document.elementFromPoint(mouse.x, mouse.y));

        const still = motion.matches;
        const ease = rate => (still ? 1 : 1 - Math.exp(-dt * rate));
        ringPos.x += (mouse.x - ringPos.x) * ease(14);
        ringPos.y += (mouse.y - ringPos.y) * ease(14);

        const rGoal = (interactive ? RING_HOVER_R : RING_R) * (pressed ? PRESS_SCALE : 1);
        r += (rGoal - r) * ease(12);
        hover += ((interactive ? 1 : 0) - hover) * ease(10);

        // The dot slides from the pointer onto the ring and circles it; with
        // reduced motion the ring just shrinks and the dot stays put
        const orbit = still ? 0 : hover;
        if (orbit > 0.001) angle += dt * ORBIT_SPEED;
        const dx = mouse.x + (ringPos.x + Math.cos(angle) * r - mouse.x) * orbit;
        const dy = mouse.y + (ringPos.y + Math.sin(angle) * r - mouse.y) * orbit;

        ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
        circle.setAttribute('r', r.toFixed(2));
        dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

        const settled = !interactive && hover < 0.001 && Math.abs(r - rGoal) < 0.01
            && Math.abs(mouse.x - ringPos.x) + Math.abs(mouse.y - ringPos.y) < 0.1;
        raf = settled ? 0 : requestAnimationFrame(frame);
    }

    function wake() {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
    }

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (!visible) {
            // Appear where the pointer is instead of flying in from the last exit
            visible = true;
            ringPos.x = mouse.x;
            ringPos.y = mouse.y;
            cursor.classList.add('is-visible');
        }
        retarget(e.target);
        wake();
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
        if (e.relatedTarget) return;
        visible = false;
        cursor.classList.remove('is-visible');
    });

    window.addEventListener('mousedown', () => { pressed = true; wake(); }, { passive: true });
    window.addEventListener('mouseup', () => { pressed = false; wake(); recheckSoon(); }, { passive: true });
    window.addEventListener('keydown', recheckSoon, { passive: true });
})();
