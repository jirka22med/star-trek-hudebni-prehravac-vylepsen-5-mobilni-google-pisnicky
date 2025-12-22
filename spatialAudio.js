(function() {
    'use strict';

    // Konfigurace modulu
    const CONFIG = {
        buttonId: 'spatial-audio-toggle',
        defaultEnabled: false
    };

    // State management
    let state = {
        isActive: false,
        context: null,
        source: null,
        panner: null,
        bassFilter: null, // NOVÉ: Filtr pro odstranění dunění
        gain: null, 
        isGyroActive: false
    };

    // Elementy
    const DOM = {
        button: null,
        audio: null
    };

    // Inicializace
    function init() {
        DOM.button = document.getElementById(CONFIG.buttonId);
        DOM.audio = document.getElementById('audioPlayer');

        if (!DOM.button || !DOM.audio) {
            console.warn('SpatialAudio: Nenalezeno tlačítko nebo audio element.');
            return;
        }

        // Event listener na tlačítko
        DOM.button.addEventListener('click', toggleSpatialAudio);
        
        // Logování
        window.DebugManager?.log('spatial', 'Gemini Spatial Matrix: Inicializace (s filtrem basů) dokončena.');
    }

    // Nastavení Audio Contextu, Panneru a FILTRU
    function setupAudioGraph() {
        if (state.context) return true;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            state.context = window.sharedAudioContext || new AudioContext();
            
            if (!window.sharedAudioContext) {
                window.sharedAudioContext = state.context;
            }

            if (DOM.audio._mediaElementSource) {
                state.source = DOM.audio._mediaElementSource;
            } else {
                state.source = state.context.createMediaElementSource(DOM.audio);
                DOM.audio._mediaElementSource = state.source;
            }

            // 1. Vytvoření PannerNode (3D zvuk)
            state.panner = state.context.createPanner();
            state.panner.panningModel = 'HRTF';
            state.panner.distanceModel = 'inverse';
            state.panner.refDistance = 1;
            state.panner.maxDistance = 10000;
            state.panner.rolloffFactor = 1;
            state.panner.coneInnerAngle = 360;
            state.panner.coneOuterAngle = 0;
            state.panner.coneOuterGain = 0;
            state.panner.setPosition(0, 0, 1);

            // 2. NOVÉ: Filtr proti dunění (Low-shelf)
            // Stáhne basy pod 300Hz o 10 decibelů dolů
            state.bassFilter = state.context.createBiquadFilter();
            state.bassFilter.type = 'lowshelf'; 
            state.bassFilter.frequency.value = 300; // Frekvence (kde to začne tlumit)
            state.bassFilter.gain.value = -12;      // O kolik to ztlumit (dB) - uprav dle chuti (-15 je víc, -5 míň)

            // 3. GainNode (Hlasitost)
            state.gain = state.context.createGain();
            state.gain.gain.value = 1.4; // Trochu zesílíme, protože filtr ubral energii

            // 4. Listener
            const listener = state.context.listener;
            if (listener.forwardX) {
                listener.positionX.value = 0;
                listener.positionY.value = 0;
                listener.positionZ.value = 0;
                listener.forwardX.value = 0;
                listener.forwardY.value = 0;
                listener.forwardZ.value = -1;
                listener.upX.value = 0;
                listener.upY.value = 1;
                listener.upZ.value = 0;
            } else {
                listener.setPosition(0, 0, 0);
                listener.setOrientation(0, 0, -1, 0, 1, 0);
            }

            return true;

        } catch (e) {
            console.error('SpatialAudio: Chyba při inicializaci grafu:', e);
            window.showNotification?.('Chyba inicializace Gemini 3D zvuku.', 'error');
            return false;
        }
    }

    // Propojení grafu
    function updateConnections() {
        if (!state.context || !state.source) return;

        try {
            state.source.disconnect();
            state.panner.disconnect();
            state.bassFilter.disconnect(); // Odpojit i filtr
            state.gain.disconnect();
        } catch (e) {}

        if (state.isActive) {
            // NOVÁ CESTA: Zdroj -> Filtr (čistění) -> Panner (3D) -> Gain (hlasitost) -> Cíl
            state.source.connect(state.bassFilter);
            state.bassFilter.connect(state.panner);
            state.panner.connect(state.gain);
            state.gain.connect(state.context.destination);
            
            window.DebugManager?.log('spatial', 'Audio graf: 3D Matrice aktivní (Anti-Bass Filter zapnut).');
            startGyroscopeTracking();
        } else {
            // Stereo (Bypass)
            state.source.connect(state.context.destination);
            window.DebugManager?.log('spatial', 'Audio graf: Stereo (Bypass).');
            stopGyroscopeTracking();
        }
    }

    // Hlavní přepínací funkce
    async function toggleSpatialAudio() {
        if (!state.context) {
            const success = setupAudioGraph();
            if (!success) return;
        }

        if (state.context.state === 'suspended') {
            await state.context.resume();
        }

        state.isActive = !state.isActive;
        
        DOM.button.classList.toggle('active', state.isActive);
        DOM.button.textContent = state.isActive ? '🔊 3D ZAP' : '🔊 3D VYP';
        // OPRAVENÝ ŘÁDEK ZDE:
        DOM.button.title = state.isActive ? 'Deaktivovat Gemini 3D Spatial Audio' : 'Aktivovat Gemini 3D Spatial Audio';

        updateConnections();

        window.showNotification?.(
            state.isActive ? 'Gemini 3D: Prostorový zvuk (Clean)' : 'Návrat ke stereu', 
            'info'
        );
    }

    // --- Gyroskop Logic ---
    function handleOrientation(event) {
        if (!state.context) return;
        const alpha = event.alpha ? event.alpha * (Math.PI / 180) : 0;
        const x = Math.sin(alpha);
        const z = -Math.cos(alpha);

        const listener = state.context.listener;
        if (listener.forwardX) {
            listener.forwardX.value = x;
            listener.forwardZ.value = z;
        } else {
            listener.setOrientation(x, 0, z, 0, 1, 0);
        }
    }

    function startGyroscopeTracking() {
        if (window.DeviceOrientationEvent && !state.isGyroActive) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation);
                            state.isGyroActive = true;
                        }
                    })
                    .catch(console.error);
            } else {
                window.addEventListener('deviceorientation', handleOrientation);
                state.isGyroActive = true;
            }
        }
    }

    function stopGyroscopeTracking() {
        if (state.isGyroActive) {
            window.removeEventListener('deviceorientation', handleOrientation);
            state.isGyroActive = false;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

