# AGENTS.md

Personal portfolio of **Fatur** (a.k.a. rizzhold / rh-fatur) — Software Engineering
student based in Indonesia. Static site, **vanilla HTML/CSS/JS, no framework, no
build system, no dependencies, no tests**. 

> ⚠️ **UNIFIED REPOSITORY NOTICE**: This repository (`rh-fatur/rh-fatur`) serves 
> a dual purpose. The root `README.md` is a **GitHub profile README** (Pac-Man graph, stats), 
> while the rest of the repo is the **web portfolio** deployed via GitHub Pages. 
> We use GitHub Actions with strict path filtering to ensure they do not interfere with each other.

---

## 1. Commands

### Run locally

```bash
python3 local_test.py          # port 8000 (default)
python3 local_test.py 3000     # custom port if 8000 is taken
```

local_test.py is a thin wrapper around http.server with three improvements
over the built-in python3 -m http.server:

· Cache-Control: no-store → edits to style.css / script.js show up
  immediately without a hard refresh (Chrome/Safari aggressively cache .css
  and .js assets).
· allow_reuse_address = True → fast restarts, no "address already in use".
· Custom port via CLI + helpful error handling when a port is taken.

Do not use file:// — fetch(), Google Fonts, and any CDN dependency will
fail. Always serve over HTTP.

Deploy

Push to main → GitHub Actions auto-deploys.

· Web: deploy-web.yml triggers only if web files (index.html, assets/css, assets/js, etc.) change. Deploys to GitHub Pages (https://rh-fatur.github.io/rh-fatur/).
· Profile: pacman.yml triggers only if README.md or readme assets change, or every 24 hours via cron. Pushes SVGs to the output branch.

Build / test / lint

None exist. Verification is manual: open the browser, click around, watch
the console.

---

2. Architecture

2.1 Script load order (CRITICAL — do not change)

The <script> order at the end of <body> must be exactly this:

# File Role
1 assets/js/init.js Declares the empty global arrays (EXPERIENCE_DATA, CHANGELOG_DATA, PROJECT_DATA) + all renderer functions + a DOMContentLoaded listener that renders every section + syncs the SoundFX UI.
2 assets/js/data/changelog/*.js CHANGELOG_DATA.push({...}) per version
3 assets/js/data/experience/*.js EXPERIENCE_DATA.push({...}) per role
4 assets/js/data/projects/*.js PROJECT_DATA.push({...}) per project
5 assets/js/soundfx.js Web Audio engine, attached to window.SoundFX
6 assets/js/script.js UI logic (loader, navbar, scroll spy, typewriter, theme, modal)

Rule: init.js must load first (it declares the arrays). Data files
must finish loading before DOMContentLoaded fires — which means before
all scripts finish executing.

DO NOT convert these scripts to async or defer. init.js listens for
DOMContentLoaded; if data files become deferred, the listener can fire
before the data has been push()ed → empty sections.

2.2 Renderers (in init.js)

Function Source Target DOM Notes
renderExperienceRow(exp, i) EXPERIENCE_DATA #timelineRows Alternating left/right based on i % 2
renderChangelogCard(entry) CHANGELOG_DATA #changelogDock Inside the About Portfolio modal
renderProjectCard(project) PROJECT_DATA #projectsPreviewGrid + #projectsFullGrid Preview uses .slice(0, 3) (PREVIEW_LIMIT = 3)
bindCardInteractions(grid) — — Attaches flip-card listeners (toggles .active-detail + stopPropagation). Called once per grid after rendering.

Rendering happens exactly once, on DOMContentLoaded. There is no dynamic
re-render afterward.

2.3 Data flow (summary)

```
HTML sections (empty by design)
    ↓
init.js: DOMContentLoaded
    ↓
EXPERIENCE_DATA → renderExperienceRow() → #timelineRows.innerHTML
CHANGELOG_DATA  → renderChangelogCard() → #changelogDock.innerHTML
PROJECT_DATA    → renderProjectCard()   → #projectsPreviewGrid / #projectsFullGrid
                → bindCardInteractions() → attach click handlers
```

script.js does not touch the data arrays. Everything in script.js is UI
plumbing (loader, navbar, theme, modal, typewriter, scroll spy).

2.4 Section-by-section

Section ID In navbar? Content
Hero #home ✅ Static HTML, but #typing-text & #rotating-badge are filled by script.js
About Me #about ✅ Static. .typewriter-title animated by IntersectionObserver
Skills #skills ✅ Static
Experience #experience ✅ Dynamic from EXPERIENCE_DATA → #timelineRows
Projects #projects ✅ Dynamic from PROJECT_DATA → 2 grids (preview + full)
Footer / Contacts #contacts ❌ Static. Deliberately not in the navbar

Modal #portfolio-modal lives outside any section — triggered by
#about-portfolio-btn. #changelogDock inside that modal is filled from
CHANGELOG_DATA.

2.5 Navbar & mobile dock (v4.0 Redesign)

One markup, two modes via CSS media query:

· Desktop (> 767px): .navbar is a floating pill fixed at the top.
  #nav-dock is the sliding indicator (position/width set by updateDockPosition
  in JS). Elements (Logo, Dock, Hamburger) are scaled up and positioned closer together for a balanced look.
· Mobile (≤ 767px): .navbar { display: contents } — its children become
  individually fixed. The dock moves to the bottom
  (.nav-links { position: fixed; bottom: 14px }), logo top-left, theme/sound
  buttons top-right. The layout is fully responsive.

Dock drag gesture: only really usable on desktop-ish pointers. A drag can
only start if the pointer lands on the currently active nav item (that's
where the black pill is). Dragging left/right scrolls to the nearest section
and updates the active item. A dragMoved flag prevents unintended click
events after a drag completes.

2.6 Loader sequence

Timeline in script.js:

1. t=0: loader visible, #loader-greeting cycles through 6 languages every
   400 ms (Hello! → こんにちは! → 你好! → 안녕하세요! → Bonjour! → ¡Hola!)
2. t=150ms: #loader-bar starts sliding (transform: translateX(-100%) → 0,
   3 s duration)
3. t=3200ms: greeting loop stops, loader begins fading out (opacity 0, 800 ms)
4. Dispatch window.dispatchEvent(new Event('portfolio:ready')) — soundfx.js
   listens for this to play loaderDone (Welcome Sound).
   Note: If the user hasn't interacted with the page yet, the browser blocks audio. soundfx.js queues the Welcome Sound and plays it immediately upon the user's first click/scroll.
5. t=4000ms: loader display: none
6. t=3300ms: typingEffect() starts (types the hero subtitle)

Timing dependency: setTimeout(typingEffect, 3300) in script.js fires
100 ms after the loader fade-out begins. If you change the loader duration,
change the 3300 constant too.

Top of script.js:

```js
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
```

The page always starts at the top on reload. Don't remove without a reason.

2.7 Theme system

· Default = LIGHT. :root in style.css holds the light tokens;
  [data-theme="dark"] overrides them.
· index.html does not set data-theme on <html> — so the default light
  theme applies.
· Toggle: .theme-btn#theme-toggle → spawns a .theme-ripple div (scale
  animation from the click point), then after 300 ms calls
  setAttribute('data-theme', ...) and swaps the sun/moon icons.
· NOT PERSISTED. No localStorage write. Reloading reverts to light. This
  is a bug, not a feature.
· Mobile: theme button lives in the top-right pill. Desktop: in .nav-actions.

2.8 Typewriter & reveal

Section titles (.typewriter-title with data-title="..."):

· Animated by an IntersectionObserver (threshold 0.15,
  rootMargin: '0px 0px -100px 0px').
· Uses a token system (WeakMap + state.token): each time the observer
  fires, the previous typing session is invalidated, so fast scrolling back and
  forth does not race.
· Don't replace with a naive setInterval — it will type twice.
· .section-header h2 has min-height set — prevents layout shift as the
  title empties/fills.

Reveal sections (.reveal): opacity 0 + translateY(40px) + blur(10px) →
.active when scrolled into view.
document.querySelectorAll('.reveal').forEach(observe) runs once when
script.js loads. Any element added dynamically must be observe()d manually.

Hero subtitle (#typing-text): separate typewriter (not
IntersectionObserver-driven), loops through
["Frontend Developer", "Fullstack Developer", "UI/UX Enthusiast"], starts via
setTimeout(typingEffect, 3300) after the loader.

2.9 Sound engine (soundfx.js)

3 sound packs: soft, retro (default), mecha. Every pack exposes the
same methods: navHover, navClick, buttonHover, buttonClick,
themeToggle, modalOpen, modalClose, loaderDone, keyPress,
termExecute, termError, cardFlip.

Public API (window.SoundFX):

· .play(name) — no-op if disabled or not yet unlocked
· .isEnabled() / .setEnabled(bool) — persists to localStorage['rzh-sound']
· .getPack() / .setPack(name) — persists to localStorage['rzh-sound-pack-v2']
· .setVolume(val) / .getVolume() — controls master gain node (0.0 to 1.0). Persists to localStorage['rzh-sound-volume']
· .toggle() — flip on/off
· .getAnalyser() — AnalyserNode (for a visualizer, if you add one)

Autoplay policy: browsers (especially mobile) block audio before the first
user interaction. soundfx.js attaches a one-shot listener to
pointerdown / touchend / click / keydown → unlock() → removes the
listeners. Before unlock, every play() is a no-op. Testing in a headless
browser will not produce sound — that's expected.

Event delegation (not per-element):

· Hover (pointerover, only when pointerType === 'mouse') → navHover / buttonHover
· Click → themeToggle / navClick / buttonClick depending on target
· #sound-switch is special-cased in init.js (UI sync)
· Modal open/close → MutationObserver on .modal-overlay
· Card flip → MutationObserver on the project grids (detects .active-detail
  appearing)

---

3. Data schemas

All three arrays are declared in init.js with var. Data files push()
into those arrays.

3.1 EXPERIENCE_DATA

```js
EXPERIENCE_DATA.push({
  year:    "2024 — Now",       // free-form string, shown as .year
  title:   "Web Developer",    // h3 of the card
  company: "Freelance",        // .company subheading
  desc:    "...",              // paragraph
  tags:    ["HTML", "CSS", "JS"] // string array → chips
});
```

3.2 CHANGELOG_DATA

```js
CHANGELOG_DATA.push({
  id:      "v2-0",        // stable id, exposed as data-changelog-id (currently unused by any logic)
  version: "v2.0",        // rendered as "Changelogs v2.0"
  date:    "2026-01-15",  // free-form string (not parsed), shown top-right
  desc:    "Initial release..."  // paragraph
});
```

3.3 PROJECT_DATA (note: singular, not PROJECTS_DATA)

```js
PROJECT_DATA.push({
  id:            "nine-portfolio",
  name:          "Nine Portfolio",
  shortDesc:     "...",                  // front-of-card paragraph
  image:         "assets/.../nine.jpg",  // may be broken → fallback kicks in
  imageAlt:      "Nine Portfolio preview",
  fallbackColor: "purple",               // 'default' | 'purple' (see .project-img-fallback.<color> in CSS)
  fallbackLabel: "Nine",                 // text shown if the image is broken
  createdAt:     "Jan 2026",
  fullDesc:      "...",                  // back-of-card paragraph
  tech:          "HTML, CSS, JS",
  features:      ["Feature A", "Feature B"],  // check-mark list on the back
  repoUrl:       "https://github.com/...",
  launchUrl:     "https://..."
});
```

Adding a new fallback color = add a CSS rule .project-img-fallback.<name>
to style.css and use <name> in fallbackColor.

---

4. Storage keys

Key Values Used by
rzh-sound '0' / '1' soundfx.js (setEnabled)
rzh-sound-pack-v2 'soft' / 'retro' / 'mecha' soundfx.js (setPack)
rzh-sound-volume 0.0 - 1.0 soundfx.js (setVolume)

Theme is not stored (see gotcha #2).

---

5. Gotchas (read before editing)

1. PROJECT_DATA is singular

Not PROJECTS_DATA. Easy to typo when writing a new data file — writing
PROJECTS_DATA.push(...) in a fresh file will not error, it just silently
won't show up (because init.js reads PROJECT_DATA).

2. Theme is not persisted to localStorage

Toggling only calls setAttribute('data-theme', ...). Reload reverts to light.
This is a bug, not a feature. To fix: add
localStorage.setItem('theme', targetTheme) in the handler + read
localStorage.getItem('theme') in an inline <head> script (before <body>
renders, to avoid a flash).

3. Web vs README Assets

The assets/ folder is shared. Images for the profile README must be placed in assets/images/readme/ or assets/images/banner/. The deploy-web.yml workflow explicitly ignores these folders (!assets/images/readme/**) so updating your profile pics doesn't trigger a full website redeploy.

4. #timelineRows is empty in HTML by design

Do not fill it manually — init.js does innerHTML = ... and will overwrite
whatever you put there.

5. About Portfolio modal does NOT close via backdrop click

Only the X button (#modal-close-btn) closes it. There's an explicit comment in
script.js confirming this is intentional. Don't add a backdrop-click handler
without a reason.

6. .modal-close-btn CSS

The close button in the modal is now centered/right-aligned using flexbox (display: inline-flex; align-items: center; justify-content: center;). Ensure it stays perfectly centered if you change its SVG.

7. Sound effects require a first user interaction

Until a pointerdown / click / keydown happens, every play() is a no-op
(browser autoplay policy). Testing in a headless browser or automation = no
sound, which is expected.

8. No placeholder image fallback for hero & about

All <img> in the hero / about sections use
onerror="this.style.display='none'" — a broken image leaves a blank area.
Only project cards have a fallback (fallbackColor + fallbackLabel). If
you want it polished, add assets/images/placeholder.svg and swap the handler
on the hero / about images.

9. #theme-toggle must exist in the HTML

script.js calls
document.getElementById('theme-toggle').querySelector(...) without a null
guard. If you remove the theme button from index.html, everything after it
(including the About Portfolio modal setup) crashes.

10. Scroll spy selector is hardcoded

```js
const sections = document.querySelectorAll('#home, #about, #skills, #experience, #projects');
```

If you add a new section that should participate in the scroll spy, edit this
selector. Adding a .nav-item with data-target="..." alone is not enough.

11. history.scrollRestoration = 'manual'

At the top of script.js. Removing it changes back-button behavior (it may
restore scroll position).

12. Mobile vs desktop is a full layout swap

@media (max-width: 767px): .navbar { display: contents } — every child
becomes individually fixed, and the dock moves to the bottom. This is not a
small tweak, it's a layout swap. If you debug mobile, remember that
#skills.section { min-height: 100vh } on desktop is reset to min-height: 0
on mobile.

13. Typewriter titles use a token system

WeakMap + state.token to cancel old typing sessions during fast scroll. Don't
simplify it to setInterval — it will type twice.

14. Hero typing delay is 3300 ms

Deliberately setTimeout(typingEffect, 3300) — 100 ms after the loader fade-out
starts (3200 ms). Changing the loader duration means changing this number too.

15. Fonts come from Google Fonts, no local fallback

Plus Jakarta Sans, weights 400–800. Offline = falls back to the system
sans-serif.

16. No favicon

The browser will 404 on /favicon.ico. If you want it clean, add a
<link rel="icon" href="..."> in <head>.

---

6. Conventions

Adding a project

1. Create assets/js/data/projects/<slug>.js with PROJECT_DATA.push({...}).
2. Add <script src="assets/js/data/projects/<slug>.js"></script> to
   index.html, before soundfx.js (grouped with the other project data
   files).
3. If image may be broken, make sure fallbackColor & fallbackLabel are set.

Forgetting step 2 = the project silently doesn't appear, no error in the
console (the array just stays empty).

Adding a section that appears in the navbar

1. Add <section id="<id>"> to the HTML.
2. Add <a href="#<id>" class="nav-item" data-target="<id>">Label</a> inside
   .nav-links.
3. Edit const sections = document.querySelectorAll('#home, #about, ...') in
   script.js — add #<id>.
4. Add class .reveal to the section (if you want the entrance animation).

Adding a non-nav section (like the footer)

Just add HTML. No JS changes required.

Adding a section title with the typewriter effect

```html
<h2 class="typewriter-title" data-title="New Title"></h2>
```

Leave the element empty — JS fills it when the section scrolls into view.

Adding a changelog entry

Create assets/js/data/changelog/<slug>.js:

```js
CHANGELOG_DATA.push({ id, version, date, desc });
```

Then add the <script> in index.html inside the changelog group.

Adding an experience entry

Same pattern: new file under assets/js/data/experience/ + a <script> in
index.html.

Adding a hero badge card

HTML template inside .badges-stack, with inline CSS variables:

```html
<div class="badge-card">
  <div class="icon-box" style="--icon-color: #XXX; --icon-glow: rgba(..., 0.25);">
    <svg>...</svg>
  </div>
  <span>Label</span>
</div>
```

Adding a new GitHub Workflow

If you add a new workflow in .github/workflows/, you must add strict paths: filters under the on: push: trigger to prevent unnecessary executions and save GitHub Actions quota.

Commit messages

Free-form, no strict convention. Conventional commits are not used.

---

7. Known issues / TODO (not required to fix, just noted)

☐ Theme is not persisted to localStorage — reloads revert to light (bug, #2)
☐ No placeholder image fallback for hero & about (#8)
☐ No favicon (#16)
☐ Root README.md is the profile README, not project docs (can confuse new
  contributors)
☐ No sitemap.xml / robots.txt (optional)
☐ No tests / CI (not a priority for a static site)

---

8. Repo structure

```
/
├── .github/
│   └── workflows/
│       ├── deploy-web.yml    # Deploys index.html + assets (ignores readme)
│       └── pacman.yml        # Generates Pac-Man graph for README
├── index.html                # single page, all sections
├── local_test.py             # dev server (python3 local_test.py [port])
├── README.md                 # GitHub profile README (NOT project docs)
├── AGENTS.md                 # this file
├── assets/
│   ├── css/
│   │   └── style.css         # all styling + 2 themes in :root / [data-theme="dark"]
│   ├── js/
│   │   ├── init.js           # data arrays + renderers + DOMContentLoaded
│   │   ├── script.js         # UI: loader, navbar, scroll spy, typewriter, theme, modal
│   │   ├── soundfx.js        # Web Audio engine (3 packs)
│   │   └── data/
│   │       ├── changelog/
│   │       │   ├── v1-0.js
│   │       │   ├── v1-1.js
│   │       │   ├── v2-0.js
│   │       │   ├── v3-0.js
│   │       │   └── v4-0.js
│   │       ├── experience/
│   │       │   ├── web-dev-portfolio.js
│   │       │   └── android-rom-porter.js
│   │       └── projects/
│   │           ├── nine-portfolio.js
│   │           ├── smk-fiktif.js
│   │           └── dummy-project.js
│   └── images/
│       ├── profile.jpg       # Web portfolio assets
│       ├── about_profile.jpg
│       ├── readme/           # Profile README assets (Gojo, etc.)
│       └── banner/           # Profile README banners
└── (project images — paths come from the data files)
```

If you add a new important folder/file, update this tree.

```