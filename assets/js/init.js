// ============================================================
// INIT.JS - Data-Driven Engine (Receiver & Renderer)
// ============================================================

// ============================================================
// 1. DATA ARRAYS (Wadah Penerima)
// ============================================================
var EXPERIENCE_DATA = [];
var CHANGELOG_DATA = [];
var PROJECT_DATA = [];


// ============================================================
// 2. RENDER FUNCTIONS (Mesin Render)
// ============================================================

// --- 2.1 Render Experience Timeline ---
function renderExperienceRow(exp, index) {
    const side = index % 2 === 0 ? 'left' : 'right';
    const tagsHtml = (exp.tags || []).map(t => `<span>${t}</span>`).join('');
    const content = `
        <div class="timeline-content card">
            <span class="year">${exp.year}</span>
            <h3>${exp.title}</h3>
            <p class="company">${exp.company}</p>
            <p class="desc">${exp.desc}</p>
            <div class="tags">${tagsHtml}</div>
        </div>`;
    const dot = `<div class="timeline-dot"></div>`;
    
    if (side === 'left') {
        return `<div class="timeline-row left">${content}${dot}</div>`;
    }
    return `<div class="timeline-row right">${dot}${content}</div>`;
}

// --- 2.2 Render Changelog Dock ---
function renderChangelogCard(entry) {
    return `
    <div class="changelog-card" data-changelog-id="${entry.id}">
        <div class="changelog-card-header">
            <span class="changelog-version">Changelogs ${entry.version}</span>
            <span class="changelog-date">${entry.date}</span>
        </div>
        <p class="changelog-desc">${entry.desc}</p>
    </div>`;
}

// --- 2.3 Render Projects ---
const arrowSvg = (arrClass) => `
    <svg xmlns="http://www.w3.org/2000/svg" class="${arrClass}" viewBox="0 0 24 24">
        <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
    </svg>`;
const checkIcon = `<svg class="silhouette-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const githubIcon = `<svg class="silhouette-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`;
const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>`;

function renderProjectCard(project) {
    const fallbackClass = project.fallbackColor && project.fallbackColor !== 'default' 
        ? `project-img-fallback ${project.fallbackColor}` : 'project-img-fallback';
    const featuresHtml = (project.features || []).map(f => `<li>${checkIcon}${f}</li>`).join('\n');
    
    return `
    <div class="project-card" data-project-id="${project.id}">
        <div class="project-front">
            <div class="project-img-container">
                <img src="${project.image}" alt="${project.imageAlt}" class="project-preview-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="${fallbackClass}">${project.fallbackLabel}</div>
            </div>
            <div class="project-info">
                <h3>${project.name}</h3>
                <p>${project.shortDesc}</p>
                <div class="project-action-area">
                    <button class="view-more-btn more-btn" type="button">
                        ${arrowSvg('arr-2')}<span class="text">More</span>${arrowSvg('arr-1')}
                    </button>
                </div>
            </div>
        </div>
        <div class="project-back">
            <button class="modal-close-btn project-close-btn" aria-label="Tutup">${closeIcon}</button>
            <div class="project-back-content">
                <span class="proj-created">Created At: ${project.createdAt}</span>
                <p class="proj-desc">${project.fullDesc}</p>
                <p class="proj-tech"><strong>Technologies Used:</strong> ${project.tech}</p>
                <div class="proj-features">
                    <strong>Feature:</strong>
                    <ul>${featuresHtml}</ul>
                </div>
            </div>
            <div class="project-back-actions">
                <a href="${project.repoUrl}" target="_blank" class="btn-outline repo-btn">${githubIcon}Repository</a>
                <a href="${project.launchUrl}" target="_blank" class="btn-primary launch-btn">Launch</a>
            </div>
        </div>
    </div>`;
}

function bindCardInteractions(gridEl) {
    const projectCards = gridEl.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const viewMoreBtn = card.querySelector('.view-more-btn');
        const closeBtn = card.querySelector('.project-close-btn');
        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                projectCards.forEach(otherCard => { if (otherCard !== card) otherCard.classList.remove('active-detail'); });
                card.classList.toggle('active-detail');
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => { e.stopPropagation(); card.classList.remove('active-detail'); });
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.project-card')) { projectCards.forEach(card => card.classList.remove('active-detail')); }
    });
}


// ============================================================
// 3. LAYOUT STABILIZATION
// ============================================================
function stabilizeLayout() {
    void document.documentElement.offsetHeight;

    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && typeof window.updateDockPosition === 'function') {
        window.updateDockPosition(activeNav);
    }

    const activeTab = document.querySelector('.modal-tab[aria-selected="true"]');
    if (activeTab && typeof window.moveTabIndicator === 'function') {
        window.moveTabIndicator(activeTab);
    }
}

function scheduleStabilize() {
    requestAnimationFrame(() => {
        requestAnimationFrame(stabilizeLayout);
    });
}

window.addEventListener('load', () => {
    scheduleStabilize();
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleStabilize);
    }
});

const mobileBreakpoint = window.matchMedia('(max-width: 767px)');
if (mobileBreakpoint.addEventListener) {
    mobileBreakpoint.addEventListener('change', scheduleStabilize);
} else if (mobileBreakpoint.addListener) {
    mobileBreakpoint.addListener(scheduleStabilize);
}

let resizeTimer = null;
function onViewportChange() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(stabilizeLayout, 120);
}
window.addEventListener('resize', onViewportChange);
window.addEventListener('orientationchange', () => {
    setTimeout(stabilizeLayout, 250);
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleStabilize();
});


// ============================================================
// 4. INITIALIZATION (Trigger Render saat DOM Siap)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Render Experience
    const rowsContainer = document.getElementById('timelineRows');
    if (rowsContainer && EXPERIENCE_DATA.length > 0) {
        rowsContainer.innerHTML = EXPERIENCE_DATA.map(renderExperienceRow).join('\n');
    }
    
    // Render Changelog
    const dock = document.getElementById('changelogDock');
    if (dock && CHANGELOG_DATA.length > 0) {
        dock.innerHTML = CHANGELOG_DATA.map(renderChangelogCard).join('\n');
    }
    
    // Render Projects
    const previewGrid = document.getElementById('projectsPreviewGrid');
    const fullGrid = document.getElementById('projectsFullGrid');
    
    if (previewGrid && fullGrid && PROJECT_DATA.length > 0) {
        const PREVIEW_LIMIT = 3;
        previewGrid.innerHTML = PROJECT_DATA.slice(0, PREVIEW_LIMIT).map(renderProjectCard).join('\n');
        fullGrid.innerHTML = PROJECT_DATA.map(renderProjectCard).join('\n');
        
        bindCardInteractions(previewGrid);
        bindCardInteractions(fullGrid);
        
        const previewView = document.getElementById('projectsPreviewView');
        const fullView = document.getElementById('projectsFullView');
        const viewMoreBtn = document.getElementById('viewMoreProjectsBtn');
        const backBtn = document.getElementById('backToProjectsBtn');
        const projectsSection = document.getElementById('projects');
        
        if (viewMoreBtn && backBtn && previewView && fullView) {
            viewMoreBtn.addEventListener('click', () => {
                previewView.hidden = true; fullView.hidden = false;
                if (projectsSection) projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            backBtn.addEventListener('click', () => {
                fullView.hidden = true; previewView.hidden = false;
                if (projectsSection) projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    // ============================================================
    // 5. LOGIKA PENGATURAN SUARA (Volume, Pack, & Switch)
    // ============================================================
    if (window.SoundFX) {
        // --- 5.1 Sound Switch (On/Off) ---
        const soundSwitch = document.getElementById('sound-switch');
        if (soundSwitch) {
            const isEnabled = window.SoundFX.isEnabled();
            soundSwitch.setAttribute('aria-checked', String(isEnabled));
            document.documentElement.classList.toggle('sound-on', isEnabled);

            soundSwitch.addEventListener('click', () => {
                const newState = !window.SoundFX.isEnabled();
                window.SoundFX.setEnabled(newState);
                soundSwitch.setAttribute('aria-checked', String(newState));
            });
        }

        // --- 5.2 Sound Pack Chips (Soft/Retro/Mecha) ---
        const packChips = document.querySelectorAll('.pack-chip');
        if (packChips.length > 0) {
            const updatePackUI = (pack) => {
                packChips.forEach(chip => {
                    chip.setAttribute('aria-pressed', String(chip.dataset.pack === pack));
                });
                window.SoundFX.setPack(pack);
            };

            // Set UI awal sesuai pack yang tersimpan
            updatePackUI(window.SoundFX.getPack());

            packChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    // Abaikan kalau suara lagi mati
                    if (!window.SoundFX.isEnabled()) return; 
                    
                    updatePackUI(chip.dataset.pack);
                    
                    // Bunyiin suara klik biar user langsung denger perbedaannya
                    setTimeout(() => window.SoundFX.play('buttonClick'), 50);
                });
            });
        }

        // --- 5.3 Volume Slider ---
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');

        if (volumeSlider) {
            const applyVolumeUI = (rawValue) => {
                const v = Math.max(0, Math.min(100, Number(rawValue) || 0));
                
                if (volumeValue) volumeValue.textContent = `${v}%`;
                
                if (volumeSlider) {
                    volumeSlider.value = v;
                    volumeSlider.style.setProperty('--vol-pct', `${v}%`);
                    volumeSlider.setAttribute('aria-valuetext', `${v}%`);
                }
                
                window.SoundFX.setVolume(v / 100);
            };

            let initialVol = 100; 
            if (typeof window.SoundFX.getVolume === 'function') {
                initialVol = window.SoundFX.getVolume() * 100;
            }
            
            applyVolumeUI(initialVol);

            volumeSlider.addEventListener('input', () => {
                applyVolumeUI(volumeSlider.value);
            });
        }
    }

    scheduleStabilize();
});
