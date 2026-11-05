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
const navLinksContainer = document.getElementById('nav-links-container');

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

let dragMoved = false; // penanda gesture terakhir itu drag dock, bukan klik biasa

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        if (dragMoved) {
            // Gesture terakhir adalah drag dock (bukan klik biasa) -> abaikan,
            // karena state active & scroll udah ke-handle sama logic drag di bawah.
            dragMoved = false;
            e.preventDefault();
            return;
        }
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        updateDockPosition(item);
    });
});

// ==========================================================
// FITUR: Drag/Geser Dock Navigasi (ala Liquid Glass Apple)
// Dock hitam bisa disentuh & digeser, halaman ikut pindah
// section mengikuti item terdekat yang dilewati dock saat drag.
// ==========================================================
if (navDock && navLinksContainer) {
    let isDragging = false;
    let dockStartX = 0;
    let dockStartLeft = 0;
    let dragWidth = 0;
    let lastActiveIndex = -1;

    function getNavItemPositions() {
        return Array.from(navItems).map((item, index) => ({
            item,
            index,
            left: item.offsetLeft,
            width: item.offsetWidth,
            center: item.offsetLeft + item.offsetWidth / 2
        }));
    }

    function getClosestNavItem(dockCenterX, positions) {
        let closest = positions[0];
        let minDist = Infinity;
        positions.forEach(pos => {
            const dist = Math.abs(pos.center - dockCenterX);
            if (dist < minDist) {
                minDist = dist;
                closest = pos;
            }
        });
        return closest;
    }

    function setActiveNavItemWhileDragging(targetItem) {
        navItems.forEach(nav => nav.classList.remove('active'));
        targetItem.classList.add('active');
        if (window.SoundFX) window.SoundFX.play('navClick');
        const targetId = targetItem.getAttribute('data-target');
        const section = document.getElementById(targetId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    navLinksContainer.addEventListener('pointerdown', (e) => {
        const target = e.target.closest('.nav-item');
        // Cuma mulai drag kalau yang disentuh itu item yang LAGI AKTIF
        // (area itu yang secara visual ditempati dock hitam).
        if (!target || !target.classList.contains('active')) return;

        isDragging = true;
        dragMoved = false;
        navDock.classList.add('dragging');
        navLinksContainer.classList.add('dock-dragging');
        navLinksContainer.setPointerCapture(e.pointerId);

        dockStartX = e.clientX;
        // Posisi awal = posisi item aktif. (navDock.offsetLeft selalu 0 karena
        // dock digeser pakai transform, sehingga dock sempat "melompat" ke kiri.)
        dockStartLeft = target.offsetLeft;
        dragWidth = navDock.offsetWidth;

        const positions = getNavItemPositions();
        lastActiveIndex = positions.findIndex(p => p.item === target);

        e.preventDefault();
    });

    navLinksContainer.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dockStartX;
        if (Math.abs(deltaX) > 3) {
            dragMoved = true;
        }

        // Batas geser: dari tepi kiri item pertama sampai tepi kanan item terakhir
        // (memperhitungkan padding dock di tampilan mobile).
        const firstItem = navItems[0];
        const lastItem = navItems[navItems.length - 1];
        const minLeft = firstItem.offsetLeft;
        const maxLeft = lastItem.offsetLeft + lastItem.offsetWidth - dragWidth;
        let newLeft = dockStartLeft + deltaX;
        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));

        navDock.style.transform = `translateX(${newLeft}px)`;

        const positions = getNavItemPositions();
        const dockCenterX = newLeft + dragWidth / 2;
        const closest = getClosestNavItem(dockCenterX, positions);

        // Cuma ganti section aktif & scroll kalau item terdekat BERUBAH
        // (biar gak scroll berkali-kali tiap pixel gerak).
        if (closest.index !== lastActiveIndex) {
            lastActiveIndex = closest.index;
            setActiveNavItemWhileDragging(closest.item);
        }
    });

    function endDockDrag() {
        if (!isDragging) return;
        isDragging = false;
        navDock.classList.remove('dragging');
        navLinksContainer.classList.remove('dock-dragging');

        // Snap dock pas ke posisi & lebar item aktif terakhir
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) {
            updateDockPosition(activeItem);
        }
    }

    navLinksContainer.addEventListener('pointerup', endDockDrag);
    navLinksContainer.addEventListener('pointercancel', endDockDrag);
}

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

// Fitur Ganti Tema
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = themeToggle.querySelector('.sun-icon');
const moonIcon = themeToggle.querySelector('.moon-icon');

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const ripple = document.createElement('div');
    ripple.classList.add('theme-ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.backgroundColor = targetTheme === 'dark' ? '#0f172a' : '#ffffff';
    document.body.appendChild(ripple);

    setTimeout(() => {
        document.documentElement.setAttribute('data-theme', targetTheme);
        if (targetTheme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) updateDockPosition(activeItem);
    }, 300);

    setTimeout(() => {
        ripple.remove();
    }, 650);
});

// LOGIKA MODAL POP-UP ABOUT PORTFOLIO
const aboutPortfolioBtn = document.getElementById('about-portfolio-btn');
const portfolioModal = document.getElementById('portfolio-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');

if (aboutPortfolioBtn && portfolioModal && modalCloseBtn) {
    aboutPortfolioBtn.addEventListener('click', () => {
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
