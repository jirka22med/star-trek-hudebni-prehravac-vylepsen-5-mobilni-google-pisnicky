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
        gain: null, // Pro vyrovnání hlasitosti
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
        
        // Logování pro DebugManagera - S PODPISEM SPECIALISTY GEMINI
        window.DebugManager?.log('spatial', 'Gemini Spatial Matrix: Inicializace dokončena. Vítej v prostoru, admirále.');
    }

    // Nastavení Audio Contextu a Panneru
    function setupAudioGraph() {
        if (state.context) return true; // Již nastaveno

        try {
            // 1. Vytvoření nebo získání AudioContextu
            // Zkusíme využít existující context, pokud je definován jiným skriptem (např. vizualizérem)
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            state.context = window.sharedAudioContext || new AudioContext();
            
            // Sdílíme context globálně pro ostatní moduly (např. vizualizér)
            if (!window.sharedAudioContext) {
                window.sharedAudioContext = state.context;
            }

            // 2. Vytvoření zdroje (Source)
            // POZOR: MediaElementSource lze vytvořit jen jednou pro jeden element!
            // Ukládáme si referenci přímo na element, abychom ji mohli sdílet
            if (DOM.audio._mediaElementSource) {
                state.source = DOM.audio._mediaElementSource;
                window.DebugManager?.log('spatial', 'Použit existující MediaElementSource.');
            } else {
                state.source = state.context.createMediaElementSource(DOM.audio);
                DOM.audio._mediaElementSource = state.source; // Uložíme pro ostatní
            }

            // 3. Vytvoření PannerNode (3D zvuk)
            state.panner = state.context.createPanner();
            state.panner.panningModel = 'HRTF'; // Head-Related Transfer Function (klíčové pro 3D)
            state.panner.distanceModel = 'inverse';
            state.panner.refDistance = 1;
            state.panner.maxDistance = 10000;
            state.panner.rolloffFactor = 1;
            state.panner.coneInnerAngle = 360;
            state.panner.coneOuterAngle = 0;
            state.panner.coneOuterGain = 0;
            
            // Pozice zdroje (mírně před posluchačem)
            state.panner.setPosition(0, 0, 1);

            // 4. Nastavení GainNode (pro kompenzaci hlasitosti při HRTF)
            state.gain = state.context.createGain();
            state.gain.gain.value = 1.2; // HRTF může trochu snížit hlasitost

            // 5. Inicializace posluchače (Listener)
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
                // Deprecated verze pro starší prohlížeče
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

    // Propojení grafu (Connect/Disconnect)
    function updateConnections() {
        if (!state.context || !state.source) return;

        // Nejdřív vše odpojíme, abychom se vyhnuli zdvojení signálu
        try {
            state.source.disconnect();
            state.panner.disconnect();
            state.gain.disconnect();
        } catch (e) {
            // Ignorujeme chyby při odpojování (pokud nebylo připojeno)
        }

        if (state.isActive) {
            // Cesta: Zdroj -> Panner -> Gain -> Destination
            state.source.connect(state.panner);
            state.panner.connect(state.gain);
            state.gain.connect(state.context.destination);
            
            // Pokud existuje vizualizér, zkusíme ho připojit paralelně (pokud to architektura dovolí)
            // Většinou ale vizualizér potřebuje vlastní připojení. 
            // Díky tomu, že jsme odpojili 'source', musí se vizualizér připojit znovu, 
            // nebo musíme poslat signál i do něj. To je složité bez znalosti vizualizéru.
            // PROZATÍM: Toto řešení "krade" signál pro 3D efekt.
            
            window.DebugManager?.log('spatial', 'Audio graf: Gemini 3D Matrice aktivní.');
            startGyroscopeTracking();
        } else {
            // Cesta: Zdroj -> Destination (Normal)
            state.source.connect(state.context.destination);
            window.DebugManager?.log('spatial', 'Audio graf: Stereo (Bypass).');
            stopGyroscopeTracking();
        }
    }

    // Hlavní přepínací funkce
    async function toggleSpatialAudio() {
        // Nutné pro prohlížeče, které blokují AudioContext před interakcí
        if (!state.context) {
            const success = setupAudioGraph();
            if (!success) return;
        }

        if (state.context.state === 'suspended') {
            await state.context.resume();
        }

        state.isActive = !state.isActive;
        
        // Aktualizace UI
        DOM.button.classList.toggle('active', state.isActive);
        DOM.button.textContent = state.isActive ? '🔊 3D ZAP' : '🔊 3D VYP';
        DOM.button.title = state.isActive ? 'Deaktivovat Gemini 3D Spatial Audio' : 'Aktivovat Gemini 3D Spatial Audio';

        // Aktualizace zvuku
        updateConnections();

        window.showNotification?.(
            state.isActive ? 'Gemini 3D Matrice aktivována' : 'Návrat ke stereu', 
            'info'
        );
    }

    // --- Gyroskop Logic (Device Orientation) ---
    function handleOrientation(event) {
        if (!state.context) return;
        
        // Získání dat z gyroskopu
        const alpha = event.alpha ? event.alpha * (Math.PI / 180) : 0; // Z-axis rotation
        const beta = event.beta ? event.beta * (Math.PI / 180) : 0;   // X-axis rotation
        const gamma = event.gamma ? event.gamma * (Math.PI / 180) : 0; // Y-axis rotation

        const listener = state.context.listener;

        // Jednoduchá implementace rotace posluchače
        // Pro plnou 3D rotaci by to chtělo Quaterniony, ale pro efekt stačí sinus/kosinus
        const x = Math.sin(alpha);
        const z = -Math.cos(alpha);

        if (listener.forwardX) {
            listener.forwardX.value = x;
            listener.forwardZ.value = z;
        } else {
            listener.setOrientation(x, 0, z, 0, 1, 0);
        }
    }

    function startGyroscopeTracking() {
        if (window.DeviceOrientationEvent && !state.isGyroActive) {
            // Poptávka oprávnění pro iOS 13+
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
                // Android a starší iOS
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

    // Spuštění po načtení DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();