// 🖖 OCHRANA PLAYLISTU - Zabraňuje přepsání Firestorem
window.PLAYLIST_SOURCE = 'myPlaylist.js';
window.PLAYLIST_VERSION = new Date().toISOString(); 
// Timestamp změny - generuje se při každém načtení, což je ok pro runtime identifikaci

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager
// const DEBUG_PLAYLIST = false;

// Zde vlož svůj dlouhý seznam skladeb
window.tracks = [ 

    
    //google disk písničky
  { src: 'https://drive.google.com/uc?export=download&id=1vdNRFazQrF_KVfZSOfRHFp25LFjx2skk', title: 'hvezdne-plameny-nova-verze-v.4-top.1' },  
    
     
    
];   

// Logování přes DebugManager
window.DebugManager?.log('playlist', `🖖 myPlaylist.js načten: ${window.tracks.length} skladeb (verze: ${window.PLAYLIST_VERSION})`);
 







