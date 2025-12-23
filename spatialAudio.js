(function() {
    'use strict';

    // ====================================================================
    // 🎭 GEMINI SPATIAL AUDIO MATRIX - VARIANTA B (DUAL-CHANNEL 3D)
    // ====================================================================
    // Specialist: Admiral Claude AI (s podporou Gemini protokolu)
    // Datum: 24.12.2024
    // Popis: Dual-channel 3D spatial audio s HRTF a gyroskop trackingem
    // ====================================================================

    // Konfigurace modulu
    const CONFIG = {
        buttonId: 'spatial-audio-toggle',
        defaultEnabled: false,
        debugMode: true, // Vypni v produkci
        pannerDistance: 1.5, // Vzdálenost L/R kanálů od středu (1.5m)
        gainCompensation: 1.3, // Kompenzace hlasitosti pro HRTF
        gyroSensitivity: 1.0, // Citlivost gyroskopu (0.5 = poloviční, 2.0 = dvojnásobná)
        gyroDebugInterval: 500 // Debug výstup každých X ms
    };

    // State management
    let state = {
        isActive: false,
        context: null,
        source: null,
        splitter: null,  // ChannelSplitter (2 kanály)
        pannerL: null,   // Panner pro levý kanál
        pannerR: null,   // Panner pro pravý kanál
        merger: null,    // ChannelMerger (2 kanály)
        gain: null,      // Gain kompenzace
        isGyroActive: false,
        lastDebug: 0,
        listenerRotation: { x: 0, y: 0, z: -1 } // Forward vector
    };

    // Elementy
    const DOM = {
        button: null,
        audio: null
    };

    // ====================================================================
    // INICIALIZACE
    // ====================================================================
    function init() {
        DOM.button = document.getElementById(CONFIG.buttonId);
        DOM.audio = document.getElementById('audioPlayer');

        if (!DOM.button || !DOM.audio) {
            console.warn('🖖 SpatialAudio: Nenalezeno tlačítko nebo audio element.');
            return;
        }

        // Event listener na tlačítko
        DOM.button.addEventListener('click', toggleSpatialAudio);
        
        // Logging pro DebugManager
        window.DebugManager?.log('spatial', '🎭 Gemini Dual-Channel Matrix: Inicializace dokončena.');
        if (CONFIG.debugMode) {
            console.log('🖖 SpatialAudio: Modul připraven. Varianta B (Dual-Channel 3D)');
        }
    }

    // ====================================================================
    // NASTAVENÍ AUDIO GRAFU (DUAL-CHANNEL)
    // ====================================================================
    function setupAudioGraph() {
        if (state.context) return true; // Již nastaveno

        try {
            // 1. Vytvoření nebo získání AudioContextu
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            state.context = window.sharedAudioContext || new AudioContext();
            
            // Sdílíme context globálně pro ostatní moduly
            if (!window.sharedAudioContext) {
                window.sharedAudioContext = state.context;
            }

            // 2. Vytvoření zdroje (Source)
            if (DOM.audio._mediaElementSource) {
                state.source = DOM.audio._mediaElementSource;
                window.DebugManager?.log('spatial', '♻️ Použit existující MediaElementSource.');
            } else {
                state.source = state.context.createMediaElementSource(DOM.audio);
                DOM.audio._mediaElementSource = state.source;
                window.DebugManager?.log('spatial', '🆕 Vytvořen nový MediaElementSource.');
            }

            // 3. Channel Splitter (rozdělí stereo na L/R)
            state.splitter = state.context.createChannelSplitter(2);

            // 4. Dva samostatné PannerNodes (jeden pro L, jeden pro R)
            state.pannerL = createPannerNode();
            state.pannerR = createPannerNode();

            // 5. Pozice pannerů v 3D prostoru
            // L kanál: vlevo (-1.5m), před posluchačem (1m)
            state.pannerL.setPosition(-CONFIG.pannerDistance, 0, 1);
            // R kanál: vpravo (+1.5m), před posluchačem (1m)
            state.pannerR.setPosition(CONFIG.pannerDistance, 0, 1);

            // 6. Channel Merger (sloučí L/R zpět do sterea)
            state.merger = state.context.createChannelMerger(2);

            // 7. Gain kompenzace (HRTF snižuje hlasitost)
            state.gain = state.context.createGain();
            state.gain.gain.value = CONFIG.gainCompensation;

            // 8. Inicializace posluchače (Listener)
            setupListener();

            window.DebugManager?.log('spatial', '✅ Audio graf úspěšně vytvořen (Dual-Channel).');
            return true;

        } catch (e) {
            console.error('❌ SpatialAudio: Chyba při inicializaci grafu:', e);
            window.showNotification?.('Chyba inicializace Gemini 3D zvuku.', 'error');
            return false;
        }
    }

    // ====================================================================
    // VYTVOŘENÍ PANNER NODE S HRTF
    // ====================================================================
    function createPannerNode() {
        const panner = state.context.createPanner();
        
        // HRTF (Head-Related Transfer Function) pro realistický 3D zvuk
        panner.panningModel = 'HRTF';
        
        // Distance model (jak se mění hlasitost se vzdáleností)
        panner.distanceModel = 'inverse'; // Realistický útlum
        panner.refDistance = 1;           // Referenční vzdálenost (1m)
        panner.maxDistance = 10000;       // Maximální vzdálenost
        panner.rolloffFactor = 1;         // Rychlost útlumu
        
        // Cone (směrovost zdroje - zde 360°, všesměrový)
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 360;
        panner.coneOuterGain = 0;

        return panner;
    }

    // ====================================================================
    // NASTAVENÍ POSLUCHAČE (LISTENER)
    // ====================================================================
    function setupListener() {
        const listener = state.context.listener;

        if (listener.forwardX) {
            // Moderní API (AudioParam)
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
            // Deprecated API (pro starší prohlížeče)
            listener.setPosition(0, 0, 0);
            listener.setOrientation(0, 0, -1, 0, 1, 0);
        }
    }

    // ====================================================================
    // PROPOJENÍ GRAFU (CONNECT/DISCONNECT)
    // ====================================================================
    function updateConnections() {
        if (!state.context || !state.source) return;

        // Nejdřív vše odpojíme
        try {
            state.source.disconnect();
            state.splitter?.disconnect();
            state.pannerL?.disconnect();
            state.pannerR?.disconnect();
            state.merger?.disconnect();
            state.gain?.disconnect();
        } catch (e) {
            // Ignorujeme chyby při odpojování
        }

        if (state.isActive) {
            // ====================================================================
            // DUAL-CHANNEL 3D GRAF:
            // Source -> Splitter -> [PannerL, PannerR] -> Merger -> Gain -> Destination
            // ====================================================================
            
            // 1. Source -> Splitter
            state.source.connect(state.splitter);
            
            // 2. Splitter (output 0 = L) -> PannerL
            state.splitter.connect(state.pannerL, 0);
            
            // 3. Splitter (output 1 = R) -> PannerR
            state.splitter.connect(state.pannerR, 1);
            
            // 4. PannerL -> Merger (input 0 = L)
            state.pannerL.connect(state.merger, 0, 0);
            
            // 5. PannerR -> Merger (input 1 = R)
            state.pannerR.connect(state.merger, 0, 1);
            
            // 6. Merger -> Gain
            state.merger.connect(state.gain);
            
            // 7. Gain -> Destination (výstup)
            state.gain.connect(state.context.destination);
            
            window.DebugManager?.log('spatial', '🎭 Dual-Channel 3D aktivní (L/R oddělené).');
            startGyroscopeTracking();
        } else {
            // ====================================================================
            // BYPASS REŽIM (normální stereo):
            // Source -> Destination
            // ====================================================================
            state.source.connect(state.context.destination);
            
            window.DebugManager?.log('spatial', '🔊 Stereo bypass (3D vypnuto).');
            stopGyroscopeTracking();
        }
    }

    // ====================================================================
    // HLAVNÍ PŘEPÍNACÍ FUNKCE
    // ====================================================================
    async function toggleSpatialAudio() {
        // Nutné pro prohlížeče, které blokují AudioContext před interakcí
        if (!state.context) {
            const success = setupAudioGraph();
            if (!success) return;
        }

        // Resume context (pokud je suspended)
        if (state.context.state === 'suspended') {
            await state.context.resume();
        }

        // Toggle stavu
        state.isActive = !state.isActive;
        
        // Aktualizace UI
        DOM.button.classList.toggle('active', state.isActive);
        DOM.button.textContent = state.isActive ? '🔊 3D ZAP' : '🔊 3D VYP';
        DOM.button.title = state.isActive 
            ? 'Deaktivovat Gemini 3D Spatial Audio' 
            : 'Aktivovat Gemini 3D Spatial Audio';

        // Aktualizace zvukového grafu
        updateConnections();

        // Notifikace
        window.showNotification?.(
            state.isActive 
                ? '🎭 Gemini Dual-Channel Matrix aktivována' 
                : '🔊 Návrat ke stereu', 
            'info'
        );

        if (CONFIG.debugMode) {
            console.log(`🖖 SpatialAudio: ${state.isActive ? 'AKTIVNÍ' : 'VYPNUTO'}`);
        }
    }

    // ====================================================================
    // GYROSKOP TRACKING (Device Orientation)
    // ====================================================================
    function handleOrientation(event) {
        if (!state.context || !state.pannerL || !state.pannerR) return;
        
        // Získání dat z gyroskopu (v radiánech)
        const alpha = event.alpha ? (event.alpha * Math.PI / 180) : 0; // Z-axis (kompas)
        const beta = event.beta ? (event.beta * Math.PI / 180) : 0;   // X-axis (nahoru/dolů)
        const gamma = event.gamma ? (event.gamma * Math.PI / 180) : 0; // Y-axis (vlevo/vpravo)

        // Aplikace citlivosti
        const sensitivity = CONFIG.gyroSensitivity;
        const adjustedAlpha = alpha * sensitivity;

        // Výpočet forward vektoru posluchače (rotace kolem Y-osy)
        const x = Math.sin(adjustedAlpha);
        const z = -Math.cos(adjustedAlpha);

        // Uložení pro debug
        state.listenerRotation = { x, y: 0, z };

        // Aplikace na listener
        const listener = state.context.listener;
        if (listener.forwardX) {
            // Moderní API
            listener.forwardX.value = x;
            listener.forwardY.value = 0;
            listener.forwardZ.value = z;
        } else {
            // Deprecated API
            listener.setOrientation(x, 0, z, 0, 1, 0);
        }

        // Debug výstup (omezený throttlingem)
        if (CONFIG.debugMode && (!state.lastDebug || Date.now() - state.lastDebug > CONFIG.gyroDebugInterval)) {
            const alphaDeg = (event.alpha || 0).toFixed(1);
            const betaDeg = (event.beta || 0).toFixed(1);
            const gammaDeg = (event.gamma || 0).toFixed(1);
            
            window.DebugManager?.log('spatial', 
                `🧭 Gyro: α=${alphaDeg}° β=${betaDeg}° γ=${gammaDeg}° | Forward: (${x.toFixed(2)}, 0, ${z.toFixed(2)})`
            );
            
            state.lastDebug = Date.now();
        }
    }

    // ====================================================================
    // START GYROSCOPE TRACKING
    // ====================================================================
    function startGyroscopeTracking() {
        if (typeof DeviceOrientationEvent === 'undefined') {
            console.warn('🖖 SpatialAudio: DeviceOrientation API není dostupné.');
            window.showNotification?.('Gyroskop není podporován na tomto zařízení.', 'warn');
            return;
        }

        if (state.isGyroActive) return; // Již běží

        // Požádání o oprávnění (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                        state.isGyroActive = true;
                        window.DebugManager?.log('spatial', '✅ Gyroskop tracking aktivní (iOS).');
                    } else {
                        console.warn('🖖 SpatialAudio: Gyroskop oprávnění zamítnuto.');
                        window.showNotification?.('Gyroskop oprávnění zamítnuto.', 'warn');
                    }
                })
                .catch(err => {
                    console.error('❌ SpatialAudio: Chyba při žádosti o gyroskop:', err);
                });
        } else {
            // Android a starší iOS (automatické oprávnění)
            window.addEventListener('deviceorientation', handleOrientation);
            state.isGyroActive = true;
            window.DebugManager?.log('spatial', '✅ Gyroskop tracking aktivní (Android).');
        }
    }

    // ====================================================================
    // STOP GYROSCOPE TRACKING
    // ====================================================================
    function stopGyroscopeTracking() {
        if (state.isGyroActive) {
            window.removeEventListener('deviceorientation', handleOrientation);
            state.isGyroActive = false;
            window.DebugManager?.log('spatial', '⏸️ Gyroskop tracking zastaven.');
        }
    }

    // ====================================================================
    // VEŘEJNÉ API (pro debugging)
    // ====================================================================
    window.spatialAudioDebug = {
        getState: () => ({
            isActive: state.isActive,
            isGyroActive: state.isGyroActive,
            listenerRotation: state.listenerRotation,
            contextState: state.context?.state
        }),
        testRotation: (degrees) => {
            if (!state.context) return;
            const radians = degrees * Math.PI / 180;
            const x = Math.sin(radians);
            const z = -Math.cos(radians);
            const listener = state.context.listener;
            if (listener.forwardX) {
                listener.forwardX.value = x;
                listener.forwardZ.value = z;
            } else {
                listener.setOrientation(x, 0, z, 0, 1, 0);
            }
            console.log(`🧪 Test rotace: ${degrees}° → Forward: (${x.toFixed(2)}, 0, ${z.toFixed(2)})`);
        },
        toggleDebug: () => {
            CONFIG.debugMode = !CONFIG.debugMode;
            console.log(`🖖 Debug režim: ${CONFIG.debugMode ? 'ZAPNUTO' : 'VYPNUTO'}`);
        }
    };

    // ====================================================================
    // SPUŠTĚNÍ PO NAČTENÍ DOM
    // ====================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
