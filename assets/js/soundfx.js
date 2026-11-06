/* SOUND EFFECTS ENGINE. */

/* ============================================================
   SOUNDFX.JS — Web Audio Engine · 3 Packs (soft / retro / mecha)
   ============================================================ */
(function () {
    'use strict';

    const KEY_ON   = 'rzh-sound';
    const KEY_PACK = 'rzh-sound-pack-v2'; // Kunci baru biar reset ke Retro
    const KEY_VOL  = 'rzh-sound-volume'; 
    const DEFAULT_PACK = 'retro'; // DEFAULT RETRO

    let ctx = null;
    let enabled = true;
    let currentPack = DEFAULT_PACK;
    let currentVolume = 1.0; // Default 100%

    try {
        const savedOn = localStorage.getItem(KEY_ON);
        enabled = savedOn === '0' ? false : true;
        
        const saved = localStorage.getItem(KEY_PACK);
        if (saved) currentPack = saved;

        const savedVol = localStorage.getItem(KEY_VOL);
        if (savedVol !== null) currentVolume = parseFloat(savedVol);
    } catch (e) {
        enabled = true;
    }

    function getCtx() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    let outBus = null, analyser = null;
    function getOut(c) {
        if (!outBus) {
            outBus = c.createGain();
            outBus.gain.value = currentVolume; 
            try {
                analyser = c.createAnalyser();
                analyser.fftSize = 64;
                analyser.smoothingTimeConstant = 0.6;
                outBus.connect(analyser);
            } catch (e) { analyser = null; }
            outBus.connect(c.destination);
        }
        return outBus;
    }

    function tone(opts) {
        const c = getCtx(); if (!c) return;
        const {
            freq = 440, sweepTo = null, sweepTime = 0.05,
            type = 'sine', attack = 0.003, decay = 0.08, peak = 0.1,
            detune = 0,
            harmonics = null
        } = opts;
        const t0 = c.currentTime;
        const total = attack + decay + 0.03;
        const partials = harmonics || [{ mult: 1, gain: 1 }];

        partials.forEach(p => {
            const o = c.createOscillator();
            const g = c.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq * p.mult, t0);
            if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo * p.mult, t0 + sweepTime);
            if (detune) o.detune.value = detune;

            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(peak * p.gain, t0 + attack);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);

            o.connect(g).connect(getOut(c));
            o.start(t0);
            o.stop(t0 + total);
        });
    }

    function noise(opts) {
        const c = getCtx(); if (!c) return;
        const {
            duration = 0.03, peak = 0.08,
            filterFreq = 4000, filterType = 'highpass',
            curve = 3
        } = opts;
        const t0 = c.currentTime;
        const size = Math.max(1, Math.floor(c.sampleRate * duration));
        const buffer = c.createBuffer(1, size, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, curve);
        }
        const src = c.createBufferSource();
        src.buffer = buffer;
        const f = c.createBiquadFilter();
        f.type = filterType;
        f.frequency.value = filterFreq;
        const g = c.createGain();
        g.gain.setValueAtTime(peak, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        src.connect(f).connect(g).connect(getOut(c));
        src.start(t0);
    }

    const PACKS = {
        soft: {
            navHover: () => tone({ freq: 1400, type: 'sine', attack: 0.002, decay: 0.06, peak: 0.025,
                harmonics: [{ mult: 1, gain: 1 }, { mult: 2.76, gain: 0.15 }] }),
            navClick: () => tone({ freq: 660, type: 'sine', attack: 0.002, decay: 0.16, peak: 0.1,
                sweepTo: 550, sweepTime: 0.06,
                harmonics: [{ mult: 1, gain: 1 }, { mult: 2, gain: 0.35 }, { mult: 3.5, gain: 0.1 }] }),
            buttonHover: () => tone({ freq: 900, type: 'sine', attack: 0.002, decay: 0.05, peak: 0.025 }),
            buttonClick: () => {
                tone({ freq: 520, type: 'sine', attack: 0.002, decay: 0.2, peak: 0.11,
                    sweepTo: 440, sweepTime: 0.08,
                    harmonics: [{ mult: 1, gain: 1 }, { mult: 2, gain: 0.4 }, { mult: 3.5, gain: 0.12 }] });
                noise({ duration: 0.008, peak: 0.04, filterFreq: 5000, curve: 4 });
            },
            themeToggle: () => {
                tone({ freq: 523, type: 'sine', attack: 0.002, decay: 0.18, peak: 0.08,
                    harmonics: [{ mult: 1, gain: 1 }, { mult: 2, gain: 0.3 }] });
                setTimeout(() => tone({ freq: 784, type: 'sine', attack: 0.002, decay: 0.28, peak: 0.07,
                    harmonics: [{ mult: 1, gain: 1 }, { mult: 2.76, gain: 0.3 }, { mult: 5.4, gain: 0.08 }] }), 90);
            },
            modalOpen: () => {
                [392, 523, 659, 784].forEach((f, i) => {
                    setTimeout(() => tone({ freq: f, type: 'sine', attack: 0.003, decay: 0.35, peak: 0.07,
                        harmonics: [{ mult: 1, gain: 1 }, { mult: 2, gain: 0.3 }] }), i * 45);
                });
            },
            modalClose: () => {
                [784, 659, 523, 392].forEach((f, i) => {
                    setTimeout(() => tone({ freq: f, type: 'sine', attack: 0.003, decay: 0.25, peak: 0.06,
                        harmonics: [{ mult: 1, gain: 1 }, { mult: 2, gain: 0.25 }] }), i * 40);
                });
            },
            loaderDone: () => {
                [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                    setTimeout(() => tone({ freq: f, type: 'sine', attack: 0.003, decay: 0.4, peak: 0.09,
                        harmonics: [{ mult: 1, gain: 1 }, { mult: 2.76, gain: 0.2 }, { mult: 5.4, gain: 0.05 }] }), i * 80);
                });
            },
            keyPress: () => tone({ freq: 900 + Math.random() * 300, type: 'triangle', attack: 0.001, decay: 0.025, peak: 0.025 }),
            termExecute: () => {
                tone({ freq: 660, type: 'triangle', attack: 0.002, decay: 0.1, peak: 0.08,
                    harmonics: [{ mult: 1, gain: 1 }, { mult: 2, gain: 0.3 }] });
                setTimeout(() => tone({ freq: 990, type: 'triangle', attack: 0.002, decay: 0.12, peak: 0.06,
                    harmonics: [{ mult: 1, gain: 1 }, { mult: 2, gain: 0.3 }] }), 75);
            },
            termError: () => tone({ freq: 220, type: 'sine', attack: 0.003, decay: 0.25, peak: 0.08,
                sweepTo: 180, sweepTime: 0.2, harmonics: [{ mult: 1, gain: 1 }, { mult: 1.5, gain: 0.2 }] }),
            cardFlip: () => {
                noise({ duration: 0.04, peak: 0.04, filterFreq: 4000 });
                tone({ freq: 400, type: 'sine', attack: 0.003, decay: 0.15, peak: 0.06,
                    sweepTo: 600, sweepTime: 0.1, harmonics: [{ mult: 1, gain: 1 }, { mult: 2, gain: 0.3 }] });
            }
        },
        retro: {
            navHover: () => tone({ freq: 1200, type: 'square', attack: 0.001, decay: 0.025, peak: 0.02 }),
            navClick: () => tone({ freq: 880, type: 'square', attack: 0.001, decay: 0.06, peak: 0.05,
                sweepTo: 660, sweepTime: 0.04 }),
            buttonHover: () => tone({ freq: 1000, type: 'square', attack: 0.001, decay: 0.02, peak: 0.018 }),
            buttonClick: () => {
                tone({ freq: 988, type: 'square', attack: 0.001, decay: 0.05, peak: 0.06 });
                setTimeout(() => tone({ freq: 1319, type: 'square', attack: 0.001, decay: 0.1, peak: 0.05 }), 45);
            },
            themeToggle: () => {
                [523, 659, 784, 1046, 1318].forEach((f, i) => {
                    setTimeout(() => tone({ freq: f, type: 'square', attack: 0.001, decay: 0.08, peak: 0.05 }), i * 45);
                });
            },
            modalOpen: () => tone({ freq: 300, sweepTo: 1200, sweepTime: 0.22, type: 'square',
                attack: 0.002, decay: 0.25, peak: 0.06 }),
            modalClose: () => tone({ freq: 1200, sweepTo: 300, sweepTime: 0.2, type: 'square',
                attack: 0.002, decay: 0.22, peak: 0.06 }),
            loaderDone: () => {
                [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => {
                    setTimeout(() => tone({ freq: f, type: 'square', attack: 0.001, decay: 0.12, peak: 0.06 }), i * 70);
                });
            },
            keyPress: () => tone({ freq: 1400 + Math.random() * 600, type: 'square', attack: 0.001, decay: 0.012, peak: 0.02 }),
            termExecute: () => {
                tone({ freq: 660, type: 'square', attack: 0.001, decay: 0.06, peak: 0.06 });
                setTimeout(() => tone({ freq: 660, type: 'square', attack: 0.001, decay: 0.08, peak: 0.05 }), 65);
            },
            termError: () => {
                tone({ freq: 220, type: 'square', attack: 0.002, decay: 0.1, peak: 0.07 });
                setTimeout(() => tone({ freq: 165, type: 'square', attack: 0.002, decay: 0.15, peak: 0.07 }), 100);
            },
            cardFlip: () => tone({ freq: 400, sweepTo: 800, sweepTime: 0.1, type: 'square',
                attack: 0.002, decay: 0.14, peak: 0.05 })
        },
        mecha: {
            navHover: () => noise({ duration: 0.008, peak: 0.03, filterFreq: 7000, curve: 4 }),
            navClick: () => {
                noise({ duration: 0.01, peak: 0.08, filterFreq: 5000, curve: 4 });
                setTimeout(() => noise({ duration: 0.02, peak: 0.05, filterFreq: 2000, curve: 3 }), 10);
                tone({ freq: 180, type: 'sine', attack: 0.001, decay: 0.03, peak: 0.05, sweepTo: 130, sweepTime: 0.03 });
            },
            buttonHover: () => noise({ duration: 0.006, peak: 0.02, filterFreq: 8000, curve: 5 }),
            buttonClick: () => {
                noise({ duration: 0.012, peak: 0.12, filterFreq: 6000, curve: 5 });
                setTimeout(() => noise({ duration: 0.025, peak: 0.07, filterFreq: 2500, curve: 3 }), 12);
                tone({ freq: 200, type: 'sine', attack: 0.001, decay: 0.05, peak: 0.07, sweepTo: 140, sweepTime: 0.05 });
            },
            themeToggle: () => {
                noise({ duration: 0.02, peak: 0.12, filterFreq: 4000, curve: 3 });
                setTimeout(() => noise({ duration: 0.03, peak: 0.1, filterFreq: 1500, curve: 3 }), 30);
                setTimeout(() => noise({ duration: 0.02, peak: 0.08, filterFreq: 3000, curve: 3 }), 60);
            },
            modalOpen: () => {
                noise({ duration: 0.03, peak: 0.1, filterFreq: 5000, curve: 3 });
                setTimeout(() => noise({ duration: 0.06, peak: 0.12, filterFreq: 2000, curve: 3 }), 40);
                tone({ freq: 140, type: 'sine', attack: 0.002, decay: 0.15, peak: 0.07, sweepTo: 90, sweepTime: 0.15 });
            },
            modalClose: () => {
                noise({ duration: 0.03, peak: 0.1, filterFreq: 3000, curve: 3 });
                setTimeout(() => noise({ duration: 0.05, peak: 0.1, filterFreq: 1500, curve: 3 }), 40);
                tone({ freq: 180, type: 'sine', attack: 0.002, decay: 0.12, peak: 0.06, sweepTo: 100, sweepTime: 0.12 });
            },
            loaderDone: () => {
                [0, 80, 160].forEach((delay, i) => {
                    setTimeout(() => {
                        noise({ duration: 0.01, peak: 0.09, filterFreq: 5000, curve: 4 });
                        tone({ freq: [440, 660, 880][i], type: 'sine', attack: 0.002, decay: 0.15, peak: 0.05 });
                    }, delay);
                });
                setTimeout(() => tone({ freq: 1320, type: 'sine', attack: 0.003, decay: 0.4, peak: 0.08,
                    harmonics: [{ mult: 1, gain: 1 }, { mult: 2.76, gain: 0.2 }] }), 250);
            },
            keyPress: () => {
                const jitter = Math.random() * 0.006;
                noise({ duration: 0.008 + jitter, peak: 0.04 + Math.random() * 0.02,
                    filterFreq: 6000 + Math.random() * 2000, curve: 4 });
            },
            termExecute: () => {
                noise({ duration: 0.015, peak: 0.12, filterFreq: 4000, curve: 4 });
                setTimeout(() => noise({ duration: 0.03, peak: 0.1, filterFreq: 1500, curve: 3 }), 15);
                tone({ freq: 160, type: 'sine', attack: 0.002, decay: 0.08, peak: 0.08, sweepTo: 110, sweepTime: 0.06 });
            },
            termError: () => {
                tone({ freq: 180, type: 'sawtooth', attack: 0.002, decay: 0.15, peak: 0.07 });
                noise({ duration: 0.03, peak: 0.06, filterFreq: 1200, curve: 3 });
            },
            cardFlip: () => {
                noise({ duration: 0.015, peak: 0.1, filterFreq: 5000, curve: 4 });
                setTimeout(() => noise({ duration: 0.04, peak: 0.08, filterFreq: 2000, curve: 3 }), 20);
                tone({ freq: 300, type: 'sine', attack: 0.002, decay: 0.1, peak: 0.05, sweepTo: 500, sweepTime: 0.08 });
            }
        }
    };

    let unlocked = false;
    let pendingWelcome = false;
    const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'click', 'keydown'];

    function unlock() {
        if (unlocked) return;
        if (!getCtx()) return;
        unlocked = true;
        UNLOCK_EVENTS.forEach(ev => document.removeEventListener(ev, unlock, true));
        
        // Kalau user nge-klik pas loading, pas selesai loading langsung bunyi sambutan
        if (pendingWelcome) {
            pendingWelcome = false;
            play('loaderDone');
        }
    }
    UNLOCK_EVENTS.forEach(ev => document.addEventListener(ev, unlock, true));

    function play(name) {
        if (!enabled || !unlocked) return;
        const pack = PACKS[currentPack] || PACKS[DEFAULT_PACK];
        const fn = pack[name];
        if (typeof fn === 'function') {
            try { fn(); } catch (e) { /* silent */ }
        }
    }

    window.SoundFX = {
        play,
        isEnabled: () => enabled,
        getAnalyser: () => analyser,
        getPack: () => currentPack,
        
        getVolume: () => currentVolume,
        setVolume(val) {
            currentVolume = Math.max(0, Math.min(1, val));
            if (outBus && ctx) {
                outBus.gain.setTargetAtTime(currentVolume, ctx.currentTime, 0.05);
            }
            try { localStorage.setItem(KEY_VOL, currentVolume); } catch (e) {}
        },

        setEnabled(val) {
            enabled = !!val;
            try { localStorage.setItem(KEY_ON, enabled ? '1' : '0'); } catch (e) {}
            document.documentElement.classList.toggle('sound-on', enabled);
            const btn = document.getElementById('sound-toggle') || document.getElementById('sound-switch');
            if (btn) btn.setAttribute('aria-pressed', String(enabled));
            if (enabled) {
                getCtx();
                setTimeout(() => play('buttonClick'), 30);
            }
        },
        setPack(name) {
            if (!PACKS[name]) return;
            currentPack = name;
            try { localStorage.setItem(KEY_PACK, name); } catch (e) {}
            document.documentElement.dataset.soundPack = name;
        },
        toggle() { window.SoundFX.setEnabled(!enabled); }
    };

    document.documentElement.classList.toggle('sound-on', enabled);
    document.documentElement.dataset.soundPack = currentPack;

    function throttle(fn, ms) {
        let last = 0;
        return function () {
            const now = Date.now();
            if (now - last < ms) return;
            last = now;
            fn.apply(this, arguments);
        };
    }

    // Daftar lengkap elemen yang bisa diklik/hover
    const BTN_SELECTOR = '.btn-primary, .btn-outline, .view-all-btn, .connect-box a, .menu-btn, .modal-tab, .pack-chip, .seg-btn, .project-close-btn, .repo-btn, .launch-btn';

    document.addEventListener('DOMContentLoaded', () => {

        const navHover = throttle(() => play('navHover'), 70);
        const btnHover = throttle(() => play('buttonHover'), 110);
        
        document.addEventListener('pointerover', (e) => {
            if (e.pointerType !== 'mouse') return;
            const t = e.target;
            if (!(t instanceof Element)) return;

            const nav = t.closest('.nav-item');
            if (nav) {
                if (!nav.contains(e.relatedTarget)) navHover();
                return;
            }
            const btn = t.closest(BTN_SELECTOR + ', .more-btn');
            if (btn && !btn.contains(e.relatedTarget)) btnHover();
        });

        document.addEventListener('click', (e) => {
            const t = e.target;
            if (!(t instanceof Element)) return;

            // Tombol mute punya suara sendiri
            if (t.closest('#sound-toggle, #sound-switch')) return;

            // Suara khusus
            if (t.closest('[data-theme-option]')) { play('themeToggle'); return; }
            if (t.closest('.nav-item, .nav-logo')) { play('navClick'); return; }

            // Dihandle oleh MutationObserver biar nggak dobel
            if (t.closest('#about-portfolio-btn')) return;
            if (t.closest('.modal-header .modal-close-btn')) return;
            if (t.closest('.more-btn')) return;

            // Semua tombol interaktif lainnya
            if (t.closest(BTN_SELECTOR)) {
                play('buttonClick');
                return;
            }
        }, true); 

        // --- Modal Observer ---
        const modal = document.getElementById('portfolio-modal');
        if (modal) {
            let prev = false;
            new MutationObserver(() => {
                const active = modal.classList.contains('active');
                if (active !== prev) {
                    prev = active;
                    play(active ? 'modalOpen' : 'modalClose');
                }
            }).observe(modal, { attributes: true, attributeFilter: ['class'] });
        }

        // --- Welcome Sound Logic ---
        window.addEventListener('portfolio:ready', () => {
            if (unlocked) {
                play('loaderDone');
            } else {
                pendingWelcome = true;
            }
        });

        // --- Card Flip Observer ---
        document.querySelectorAll('#projectsPreviewGrid, #projectsFullGrid').forEach(grid => {
            new MutationObserver((muts) => {
                muts.forEach(m => {
                    if (m.attributeName === 'class' &&
                        m.target.classList &&
                        m.target.classList.contains('project-card') &&
                        m.target.classList.contains('active-detail') &&
                        !(m.oldValue || '').includes('active-detail')) {
                        play('cardFlip');
                    }
                });
            }).observe(grid, { attributes: true, subtree: true, attributeFilter: ['class'], attributeOldValue: true });
        });

        // --- Terminal Observer ---
        const termInput = document.getElementById('termInput');
        if (termInput) {
            termInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') play('termExecute');
                else if (e.key.length === 1 || e.key === 'Backspace') play('keyPress');
            });
        }
        const termScreen = document.getElementById('termScreen');
        if (termScreen) {
            new MutationObserver((muts) => {
                muts.forEach(m => m.addedNodes.forEach(n => {
                    if (n.nodeType === 1 && n.classList && n.classList.contains('t-err')) {
                        play('termError');
                    }
                }));
            }).observe(termScreen, { childList: true, subtree: true });
        }
    });
})();
