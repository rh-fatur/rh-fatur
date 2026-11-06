// Paksa posisi halaman ke paling atas saat pertama kali dibuka atau di-refresh
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Loading Screen Multibahasa
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-bar');
    const greetingEl = document.getElementById('loader-greeting');
    
    const greetings = [
        "Hello!",        // Inggris
        "こんにちは!",   // Jepang
        "你好!",         // Mandarin
        "안녕하세요!",   // Korea
        "Bonjour!",      // Prancis
        "¡Hola!"         // Spanyol
    ];
    let index = 0;

    const greetingInterval = setInterval(() => {
        index = (index + 1) % greetings.length;
        greetingEl.style.opacity = 0;
        greetingEl.style.transform = 'translateY(8px)';
        setTimeout(() => {
            greetingEl.textContent = greetings[index];
            greetingEl.style.opacity = 1;
            greetingEl.style.transform = 'translateY(0)';
        }, 150);
    }, 400);

    setTimeout(() => {
        loaderBar.style.transform = 'translateX(0)';
    }, 150);

    setTimeout(() => {
        clearInterval(greetingInterval);
        loader.style.opacity = '0';
        // Kabari soundfx.js bahwa loader selesai (memicu suara 'loaderDone')
        window.dispatchEvent(new Event('portfolio:ready'));
        setTimeout(() => {
            loader.style.display = 'none';
        }, 800);
    }, 3200);
});

// Dynamic Sliding Pill Navbar Indicator
const navItems = document.querySelectorAll('.nav-item');
const navDock = document.getElementById('nav-dock');

function updateDockPosition(activeElement) {
    if (!activeElement || !navDock) return;
    const itemLeft = activeElement.offsetLeft;
    const itemWidth = activeElement.offsetWidth;
    
    navDock.style.transform = `translateX(${itemLeft}px)`;
    navDock.style.width = `${itemWidth}px`;
}

window.addEventListener('DOMContentLoaded', () => {
    const activeItem = document.querySelector('.nav-item.active') || navItems[0];
    updateDockPosition(activeItem);
});

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        updateDockPosition(item);
    });
});

// Ukuran item bisa berubah setelah font selesai dimuat -> posisikan ulang pill dock
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        updateDockPosition(document.querySelector('.nav-item.active'));
    });
}
window.addEventListener('load', () => {
    updateDockPosition(document.querySelector('.nav-item.active'));
});

// Penanganan perpindahan halaman aktif berdasarkan Scroll (Tanpa Contacts)
const sections = document.querySelectorAll('#home, #about, #skills, #experience, #projects');
window.addEventListener('scroll', () => {
    let currentSectionId = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            currentSectionId = sectionId;
        }
    });

    if (currentSectionId) {
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === currentSectionId) {
                if (!item.classList.contains('active')) {
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                    updateDockPosition(item);
                }
            }
        });
    }

    // LOGIKA TIMELINE SCROLL PROGRESS & ACTIVE DOTS
    const timelineSection = document.getElementById('experience');
    const progressLine = document.getElementById('timeline-progress');
    const timelineDots = document.querySelectorAll('.timeline-dot');

    if (timelineSection && progressLine) {
        const rect = timelineSection.getBoundingClientRect();
        const sectionHeight = timelineSection.offsetHeight;
        const windowHeight = window.innerHeight;

        let scrollScored = windowHeight - rect.top;
        let percentage = (scrollScored / sectionHeight) * 100;

        percentage = Math.max(0, Math.min(100, percentage));
        progressLine.style.height = `${percentage}%`;

        timelineDots.forEach(dot => {
            const dotRect = dot.getBoundingClientRect();
            if (dotRect.top < windowHeight * 0.75) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
});

window.addEventListener('resize', () => {
    const activeItem = document.querySelector('.nav-item.active');
    if (activeItem) {
        updateDockPosition(activeItem);
    }
});

// Rotasi Badge Card Hero
const rotatingBadges = [
    {
        text: "Linguistics",
        color: "#F472B6",
        glow: "rgba(244, 114, 182, 0.25)",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
    },
    {
        text: "Designer",
        color: "#A78BFA",
        glow: "rgba(167, 139, 250, 0.25)",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>`
    }
];
let badgeIndex = 0;
const rotatingBadgeEl = document.getElementById('rotating-badge');

if (rotatingBadgeEl) {
    setInterval(() => {
        rotatingBadgeEl.style.opacity = 0;
        rotatingBadgeEl.style.transform = 'translateX(-10px)';
        setTimeout(() => {
            badgeIndex = (badgeIndex + 1) % rotatingBadges.length;
            rotatingBadgeEl.innerHTML = `
                <div class="icon-box" style="--icon-color: ${rotatingBadges[badgeIndex].color}; --icon-glow: ${rotatingBadges[badgeIndex].glow};">
                    ${rotatingBadges[badgeIndex].svg}
                </div>
                <span>${rotatingBadges[badgeIndex].text}</span>
            `;
            rotatingBadgeEl.style.opacity = 1;
            rotatingBadgeEl.style.transform = 'translateX(0)';
        }, 300);
    }, 3000);
}

// Efek Ketik Hero
const words = ["Frontend Developer", "Fullstack Developer", "UI/UX Enthusiast"];
let i = 0;

function typingEffect() {
    let word = words[i].split("");
    var loopTyping = function() {
        if (word.length > 0) {
            document.getElementById('typing-text').innerHTML += word.shift();
        } else {
            setTimeout(deletingEffect, 2000);
            return;
        }
        setTimeout(loopTyping, 100);
    };
    loopTyping();
}

function deletingEffect() {
    let word = words[i].split("");
    var loopDeleting = function() {
        if (word.length > 0) {
            word.pop();
            document.getElementById('typing-text').innerHTML = word.join("");
        } else {
            i = (i + 1) % words.length;
            setTimeout(typingEffect, 500);
            return;
        }
        setTimeout(loopDeleting, 50);
    };
    loopDeleting();
}

setTimeout(typingEffect, 3300);

// Efek Ketik Judul Section Saat Masuk Layar
// (pakai sistem token per-elemen biar gak race condition kalau scroll bolak-balik cepat:
//  setiap sesi ngetik baru otomatis membatalkan sesi lama yang masih berjalan)
const typewriterState = new WeakMap(); // element -> { token, timeoutId }

function getTypewriterState(element) {
    let state = typewriterState.get(element);
    if (!state) {
        state = { token: 0, timeoutId: null };
        typewriterState.set(element, state);
    }
    return state;
}

function stopTypewriter(element) {
    const state = getTypewriterState(element);
    clearTimeout(state.timeoutId);
    state.token++; // sesi lama jadi tidak valid, loop typeChar yang masih jalan akan berhenti sendiri
}

function triggerTypewriter(element) {
    if (element.classList.contains('typed')) return;
    element.classList.add('typed');

    const state = getTypewriterState(element);
    clearTimeout(state.timeoutId);
    state.token++;
    const myToken = state.token;

    const textToType = element.getAttribute('data-title');
    let charIndex = 0;
    element.textContent = "";

    function typeChar() {
        // Kalau sudah ada sesi ngetik baru yang mulai (token berubah), loop ini berhenti
        if (state.token !== myToken) return;

        if (charIndex < textToType.length) {
            element.textContent += textToType.charAt(charIndex);
            charIndex++;
            state.timeoutId = setTimeout(typeChar, 70);
        }
    }
    typeChar();
}

// Intersection Observer untuk efek Blur to Clear saat di-scroll
const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            const titleEl = entry.target.querySelector('.typewriter-title');
            if (titleEl) {
                triggerTypewriter(titleEl);
            }
        } else {
            entry.target.classList.remove('active');
            const titleEl = entry.target.querySelector('.typewriter-title');
            if (titleEl) {
                stopTypewriter(titleEl);
                titleEl.classList.remove('typed');
                titleEl.textContent = "";
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
});

// Fitur Ganti Tema (pilihan Terang / Gelap ada di panel hamburger)
const themeOptionBtns = document.querySelectorAll('[data-theme-option]');

function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

function syncThemeUI(theme) {
    themeOptionBtns.forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.themeOption === theme));
    });
}

function applyTheme(targetTheme, originEl) {
    if (targetTheme === currentTheme()) return;
    if (window.SoundFX) window.SoundFX.play('themeToggle');

    const rect = originEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Lingkaran membesar dari tombol sampai menutup seluruh layar
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const ripple = document.createElement('div');
    ripple.classList.add('theme-ripple');
    ripple.style.width = ripple.style.height = `${radius * 2}px`;
    ripple.style.left = `${x - radius}px`;
    ripple.style.top = `${y - radius}px`;
    ripple.style.backgroundColor = targetTheme === 'dark' ? '#0f172a' : '#f5f6fa';
    document.body.appendChild(ripple);

    // Ganti tema saat layar sudah hampir tertutup, lalu lingkaran memudar
    // (supaya background gradasi tema baru muncul halus, tanpa kedipan).
    setTimeout(() => {
        document.documentElement.setAttribute('data-theme', targetTheme);
        syncThemeUI(targetTheme);
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) updateDockPosition(activeItem);
    }, 470);

    setTimeout(() => {
        ripple.style.transition = 'opacity 0.35s ease';
        ripple.style.opacity = '0';
    }, 500);

    setTimeout(() => {
        ripple.remove();
    }, 900);
}

themeOptionBtns.forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeOption, btn));
});
syncThemeUI(currentTheme());

// HAMBURGER MENU: tombol bulat yang berubah (morph) jadi panel pengaturan
const menuWrap = document.getElementById('menu-wrap');
const menuBtn = document.getElementById('menu-toggle');
const menuContent = document.getElementById('menu-content');

function setMenu(open) {
    if (!menuWrap || !menuBtn || !menuContent) return;
    menuWrap.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Tutup menu pengaturan' : 'Buka menu pengaturan');
    menuContent.inert = !open;
    if (open) {
        // tinggi panel = tinggi isi (+2px border), supaya animasi height punya target pasti
        menuWrap.style.setProperty('--menu-h', `${menuContent.offsetHeight + 2}px`);
    }
}

if (menuWrap && menuBtn && menuContent) {
    menuBtn.addEventListener('click', () => {
        setMenu(!menuWrap.classList.contains('open'));
    });

    // Tutup kalau menyentuh di luar panel atau menekan Esc
    document.addEventListener('pointerdown', (e) => {
        if (menuWrap.classList.contains('open') && !menuWrap.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuWrap.classList.contains('open')) {
            setMenu(false);
            menuBtn.focus();
        }
    });
}

// KONTROL VOLUME SOUNDFX
// Slider ini memanggil window.SoundFX.setVolume(0..1) bila tersedia.
// Nilai terakhir disimpan di localStorage agar persisten antar sesi.
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');

function applyVolumeUI(rawValue) {
    const v = Math.max(0, Math.min(100, Number(rawValue) || 0));
    if (volumeValue) volumeValue.textContent = `${v}%`;
    if (volumeSlider) {
        volumeSlider.value = v;
        volumeSlider.style.setProperty('--vol-pct', `${v}%`);
        volumeSlider.setAttribute('aria-valuetext', `${v}%`);
    }
    if (window.SoundFX && typeof window.SoundFX.setVolume === 'function') {
        window.SoundFX.setVolume(v / 100);
    }
}

if (volumeSlider) {
    // Restore dari localStorage
    try {
        const savedVol = localStorage.getItem('portfolio:volume');
        if (savedVol !== null && savedVol !== '' && !Number.isNaN(Number(savedVol))) {
            volumeSlider.value = Number(savedVol);
        }
    } catch (err) { /* private mode: abaikan */ }

    volumeSlider.addEventListener('input', () => {
        applyVolumeUI(volumeSlider.value);
        try {
            localStorage.setItem('portfolio:volume', volumeSlider.value);
        } catch (err) { /* abaikan */ }
    });

    applyVolumeUI(volumeSlider.value);

    // Re-apply setelah semua resource selesai (jaga-jaga bila SoundFX di-init belakangan)
    window.addEventListener('load', () => {
        applyVolumeUI(volumeSlider.value);
    });
}

// LOGIKA MODAL POP-UP ABOUT PORTFOLIO (bertab)
const aboutPortfolioBtn = document.getElementById('about-portfolio-btn');
const portfolioModal = document.getElementById('portfolio-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');

const modalTabs = Array.from(document.querySelectorAll('.modal-tab'));
const modalPanels = Array.from(document.querySelectorAll('.modal-panel'));
const modalTabIndicator = document.getElementById('modal-tab-indicator');
const modalBody = document.querySelector('#portfolio-modal .modal-body');

function moveTabIndicator(tab) {
    if (!tab || !modalTabIndicator) return;
    modalTabIndicator.style.transform = `translateX(${tab.offsetLeft}px)`;
    modalTabIndicator.style.width = `${tab.offsetWidth}px`;
}

function selectModalTab(tab, focus) {
    modalTabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
    });
    modalPanels.forEach(panel => {
        panel.hidden = panel.dataset.panel !== tab.dataset.tab;
    });
    if (modalBody) modalBody.scrollTop = 0;
    moveTabIndicator(tab);
    if (focus) tab.focus();
}

modalTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectModalTab(tab));
    tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        selectModalTab(modalTabs[(i + dir + modalTabs.length) % modalTabs.length], true);
    });
});

window.addEventListener('resize', () => {
    moveTabIndicator(modalTabs.find(t => t.getAttribute('aria-selected') === 'true'));
});

if (aboutPortfolioBtn && portfolioModal && modalCloseBtn) {
    aboutPortfolioBtn.addEventListener('click', () => {
        if (modalTabs[0]) selectModalTab(modalTabs[0]);
        portfolioModal.classList.add('active');
    });

    modalCloseBtn.addEventListener('click', () => {
        portfolioModal.classList.remove('active');
    });

    // Catatan: modal ini sengaja TIDAK menutup saat area luar (overlay) diklik.
    // Menutup modal hanya bisa lewat tombol close (X).
}
// ========================================================= */
// LOGIKA INTERAKTIF KARTU PROYEK (VIEW MORE) telah dipindahkan */
// ke pages/projects/projects-render.js, karena card sekarang   */
// di-generate secara dinamis dari PROJECT_DATA, bukan statis   */
// di HTML lagi.                                                */
// ========================================================= */
