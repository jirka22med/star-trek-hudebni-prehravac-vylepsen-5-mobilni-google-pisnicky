// 🖖 OCHRANA PLAYLISTU - Zabraňuje přepsání Firestorem
window.PLAYLIST_SOURCE = 'myPlaylist.js';
window.PLAYLIST_VERSION = new Date().toISOString(); 
// Timestamp změny - generuje se při každém načtení, což je ok pro runtime identifikaci

// 🔇 Starý přepínač odstraněn - nyní řízeno přes DebugManager
// const DEBUG_PLAYLIST = false;

// Zde vlož svůj dlouhý seznam skladeb
window.tracks = [ 

    
    //google disk písničky
   { src: 'mp3/Louisiana-sobotni-noc-v.1.mp3', title: 'Louisiana sobotní noc v.01' },
    { src: 'mp3/Louisiana-sobotni-noc-v.2.mp3', title: 'Louisiana sobotní noc v.02' },
    { src: 'mp3/Louisiana-sobotni-noc-v.3.mp3', title: 'Louisiana sobotní noc v.03' },
    { src: 'mp3/Louisiana-sobotni-noc-v.4.mp3', title: 'Louisiana sobotní noc v.04' },
    { src: 'mp3/Louisiana-sobotni-noc-v.5.mp3', title: 'Louisiana sobotní noc v.05' },
    { src: 'mp3/Louisiana-sobotni-noc-v.6.mp3', title: 'Louisiana sobotní noc v.06' },
    { src: 'mp3/Louisiana-sobotni-noc-v.7.mp3', title: 'Louisiana sobotní noc v.07' },
    { src: 'mp3/Louisiana-sobotni-noc-v.8.mp3', title: 'Louisiana sobotní noc v.08' },
    { src: 'mp3/Louisiana-sobotni-noc-v.9.mp3', title: 'Louisiana sobotní noc v.09' },

    { src: 'mp3/Louisiana-sobotni-noc-v.10-top.1.mp3', title: 'Louisiana sobotní noc v.10-top.01' },
    { src: 'mp3/Louisiana-sobotni-noc-v.11-top.2.mp3', title: 'Louisiana sobotní noc v.11-top.02' },
    { src: 'mp3/Louisiana-sobotni-noc-v.12-top.3.mp3', title: 'Louisiana sobotní noc v.12-top.03' },
    { src: 'mp3/Louisiana-sobotni-noc-v.13-top.4.mp3', title: 'Louisiana sobotní noc v.13-top.04' },
    { src: 'mp3/Louisiana-sobotni-noc-v.14-top.5.mp3', title: 'Louisiana sobotní noc v.14-top.05' },
    { src: 'mp3/Louisiana-sobotni-noc-v.15-top.6.mp3', title: 'Louisiana sobotní noc v.15-top.06' },
    { src: 'mp3/Louisiana-sobotni-noc-v.16-top.7.mp3', title: 'Louisiana sobotní noc v.16-top.07' },
    { src: 'mp3/Louisiana-sobotni-noc-v.17-top.8.mp3', title: 'Louisiana sobotní noc v.17-top.08' },
    { src: 'mp3/Louisiana-sobotni-noc-v.18-top.9.mp3', title: 'Louisiana sobotní noc v.18-top.09' },
    { src: 'mp3/Louisiana-sobotni-noc-v.19-top.10.mp3', title: 'Louisiana sobotní noc v.19-top.10' },

    { src: 'mp3/HVEZDNA-FLOTILA-NAVZDY-v.1.mp3', title: 'HVĚZDNÁ FLOTILA NAVŽDY v.1' },
    { src: 'mp3/HVEZDNA-FLOTILA-NAVZDY-v.2.mp3', title: 'HVĚZDNÁ FLOTILA NAVŽDY v.2' },
    { src: 'mp3/HVEZDNA-FLOTILA-NAVZDY-v.3.mp3', title: 'HVĚZDNÁ FLOTILA NAVŽDY v.3' },
    { src: 'mp3/HVEZDNA-FLOTILA-NAVZDY-v.4.mp3', title: 'HVĚZDNÁ FLOTILA NAVŽDY v.4' },
    { src: 'mp3/HVEZDNA-FLOTILA-NAVZDY-v.5.mp3', title: 'HVĚZDNÁ FLOTILA NAVŽDY v.5' },
    { src: 'mp3/HVEZDNA-FLOTILA-NAVZDY-v.6.mp3', title: 'HVĚZDNÁ FLOTILA NAVŽDY v.6' },
    { src: 'mp3/HVEZDNA-FLOTILA-NAVZDY-v.7.mp3', title: 'HVĚZDNÁ FLOTILA NAVŽDY v.7' },
    { src: 'mp3/HVEZDNA-FLOTILA-NAVZDY-v.8.mp3', title: 'HVĚZDNÁ FLOTILA NAVŽDY v.8' },

    { src: 'mp3/Jardova-cesta-s-prateli-v.1.mp3', title: 'Jardova-cesta-s-prateli-v.1' },
    { src: 'mp3/Jardova-cesta-s-prateli-v.2.mp3', title: 'Jardova-cesta-s-prateli-v.2' },
    { src: 'mp3/Jardova-cesta-s-prateli-v.3.mp3', title: 'Jardova-cesta-s-prateli-v.3' },
    { src: 'mp3/Jardova-cesta-s-prateli-v.4.mp3', title: 'Jardova-cesta-s-prateli-v.4' },
    { src: 'mp3/Jardova-cesta-s-prateli-v.5-Top-1.mp3', title: 'Jardova-cesta-s-prateli-v.5-Top-1' },
     
    
];   

// Logování přes DebugManager
window.DebugManager?.log('playlist', `🖖 myPlaylist.js načten: ${window.tracks.length} skladeb (verze: ${window.PLAYLIST_VERSION})`);
 










