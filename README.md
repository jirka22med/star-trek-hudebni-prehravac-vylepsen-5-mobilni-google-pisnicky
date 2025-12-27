# 🖖 INSTALAČNÍ NÁVOD - PRELOADER V5.0

**Autor:** Admirál Claude.AI  
**Architekt projektu:** Více admirál Jiřík  
**Datum:** 27.12.2025  
**Verze:** 5.0 - Conflict-Free Edition

---

## 📋 PŘEHLED ÚPRAV

Celkem **5 kroků**, každý přesně popsaný s čísly řádků!

---

## ⚙️ KROK 1: Nahraď starý modul v index.html

### 🔍 CO HLEDAT:
```html
<script src="prednacitani-pisnicek.js"></script>
```

### ✅ ZMĚŇ NA:
```html
<script src="prednacitani-pisnicek-v5.js"></script>
```

### 📍 KDE TO JE:
- Otevři `index.html`
- Najdi sekci s `<script>` tagy (obvykle na konci souboru)
- Hledej řádek s `prednacitani-pisnicek.js`

---

## 🔧 KROK 2: Přidej komunikační protokol do script.js

### 📍 KDE: 
**Řádek ~45** (hned za `(function() { 'use strict';`)

### ✅ CO PŘIDAT:
```javascript
// ═══════════════════════════════════════════════════════════════
// 🚀 KOMUNIKAČNÍ PROTOKOL PRO PRELOADER V5
// ═══════════════════════════════════════════════════════════════

// Globální stav audio playeru
window.audioState = {
    isLoadingTrack: false,  // TRUE = právě se načítá skladba
    isPlaying: false,       // TRUE = hraje skladba
    canPreload: false       // TRUE = preloader může běžet
};

// ═══════════════════════════════════════════════════════════════
```

### 🎯 JAK TO VYPADÁ:
```javascript
(function() {
    'use strict';

// 🔥 VLOŽ TADY TEN KÓD VÝŠE 🔥

// --- Cachovani DOM elementů ---
const DOM = {
    audioPlayer: document.getElementById('audioPlayer'),
    // ... zbytek kódu ...
```

---

## 🎵 KROK 3: Uprav funkci playTrack()

### 📍 KDE:
**Řádek ~460** (začátek funkce `playTrack()`)

### ✅ CO ZMĚNIT:

#### A) HNED NA ZAČÁTKU FUNKCE:
```javascript
function playTrack(originalIndex) {
    // 🚨 SIGNALIZUJ PRELOADERU: Začínáme načítat!
    window.audioState.isLoadingTrack = true;
    window.dispatchEvent(new Event('track-loading-start'));
    
    if (!originalTracks || originalIndex < 0 || originalIndex >= originalTracks.length) {
        // ... původní kód pokračuje ...
```

#### B) PŘED `DOM.audioPlayer.play()` (řádek ~485):
```javascript
    DOM.audioPlayer.load();
    
    DOM.audioPlayer.play().then(async () => {
        // ✅ SIGNALIZUJ: Skladba úspěšně načtena
        window.audioState.isLoadingTrack = false;
        window.audioState.isPlaying = true;
        window.audioState.canPreload = true;
        
        window.dispatchEvent(new CustomEvent('track-loaded-success', {
            detail: { src: track.src, title: track.title }
        }));
        
        window.DebugManager?.log('main', "playTrack: Přehrávání:", track.title);
        updateButtonActiveStates(true);
        updateActiveTrackVisuals();
        
        // 🚀 PRELOADER - Nyní může přednahrávat (počká 15s)
        if (window.audioPreloader) {
            window.preloadTracks(
                originalTracks, 
                currentTrackIndex, 
                isShuffled, 
                shuffledIndices
            ).catch(err => console.warn('⚠️ Preload error:', err));
        }
        
        await debounceSaveAudioData();
    }).catch(error => {
        // ❌ Chyba při načítání
        window.audioState.isLoadingTrack = false;
        window.audioState.canPreload = false;
        
        if (window.DebugManager?.isEnabled('main')) {
            console.error('playTrack: Chyba při přehrávání:', error);
        }
        window.showNotification(`Chyba při přehrávání: ${track.title}.`, 'error');
        updateButtonActiveStates(false);
    });
}
```

---

## ⏭️ KROK 4: Přidej události do tlačítek

### 📍 KDE: Řádek ~638 (Event Listenery)

---

### A) NEXT BUTTON:
```javascript
DOM.nextButton?.addEventListener('click', () => {
    window.dispatchEvent(new Event('track-changed'));
    playNextTrack();
});
```

---

### B) PREV BUTTON:
```javascript
DOM.prevButton?.addEventListener('click', () => {
    window.dispatchEvent(new Event('track-changed'));
    playPrevTrack();
});
```

---

### C) PAUSE BUTTON:
```javascript
DOM.pauseButton?.addEventListener('click', () => {
    if (DOM.audioPlayer) DOM.audioPlayer.pause();
    
    window.audioState.isPlaying = false;
    window.dispatchEvent(new Event('player-paused'));
    
    window.showNotification('Pauza', 'info', 5000);
    updateButtonActiveStates(false);
});
```

---

### D) PLAY BUTTON (ÚPLNÁ NÁHRADA):
```javascript
DOM.playButton?.addEventListener('click', () => {
    window.showNotification('Přehravání', 'info', 5000);
    
    if (DOM.audioPlayer && DOM.audioSource.src && DOM.audioSource.src !== window.location.href) {
        DOM.audioPlayer.play().then(() => {
            window.audioState.isPlaying = true;
            window.dispatchEvent(new Event('player-resumed'));
            updateButtonActiveStates(true);
        }).catch(e => {
            if (window.DebugManager?.isEnabled('main')) {
                console.error("Play error:", e);
            }
        });
    } else if (originalTracks.length > 0) {
        playTrack(currentTrackIndex);
    } else {
        window.showNotification("Nelze přehrát, playlist je prázdný.", 'warn');
    }
});
```

---

## 🎯 KROK 5: Přidej událost do ENDED listeneru

### 📍 KDE: Řádek ~810 (audio ended listener)

### ✅ CO PŘIDAT:

Najdi tento kód:
```javascript
DOM.audioPlayer.addEventListener('ended', async () => {
    updateButtonActiveStates(false);
    
    if (!DOM.audioPlayer.loop) {
        playNextTrack();
```

A **PŘED `playNextTrack()`** přidej:
```javascript
DOM.audioPlayer.addEventListener('ended', async () => {
    updateButtonActiveStates(false);
    
    // 🔄 SIGNALIZUJ: Skladba skončila, připravujeme další
    window.dispatchEvent(new Event('track-changed'));
    
    if (!DOM.audioPlayer.loop) {
        playNextTrack();
```

---

## ✅ KONTROLNÍ SEZNAM

Po dokončení všech kroků zkontroluj:

- [ ] ✅ V `index.html` je `prednacitani-pisnicek-v5.js`
- [ ] ✅ Na začátku `script.js` je `window.audioState`
- [ ] ✅ Funkce `playTrack()` posílá události
- [ ] ✅ Všechna tlačítka (Play, Pause, Next, Prev) posílají události
- [ ] ✅ `ended` listener posílá událost `track-changed`

---

## 🧪 TESTOVÁNÍ

1. **Obnov stránku** (Ctrl+F5)
2. **Otevři konzoli** (F12)
3. **Pusť písnička**
4. **V konzoli uvidíš:**
   ```
   🎯 ZAHAJUJI PRELOAD PROCES
   ⏰ Čekám 15 sekund před spuštěním...
   ```
5. **Během 15 sekund přepni skladbu** → měl by se OKAMŽITĚ zastavit:
   ```
   🚨 DETEKOVÁNO: Načítání aktuální skladby - ZASTAVUJI preload
   ⚠️ Preload PŘERUŠEN (byla spuštěna nová skladba)
   ```

---

## 📊 DEBUG PŘÍKAZY

Po instalaci můžeš použít:

```javascript
// Zobraz statistiky
window.audioPreloader.logStats()

// Vypni preloader
window.audioPreloader.setEnabled(false)

// Zapni preloader
window.audioPreloader.setEnabled(true)

// Vymaž cache
window.audioPreloader.clearAll()

// Aktuální stav
console.log(window.audioPreloader.state)
// Možné stavy: STANDBY / WAITING / ACTIVE / PAUSED / STOPPED

// Stav audio playeru
console.log(window.audioState)
```

---

## 🆘 ŘEŠENÍ PROBLÉMŮ

### ❌ "window.audioState is undefined"
→ Zapomněl jsi přidat KROK 2 (na začátek script.js)

### ❌ "track-loading-start není rozpoznaná událost"
→ Chybí úpravy v KROKU 3 (funkce playTrack)

### ❌ Preloader se stále spouští okamžitě
→ Zkontroluj, že používáš `prednacitani-pisnicek-v5.js` (KROK 1)

### ❌ Události se nevolají při přepínání
→ Zkontroluj KROK 4 (tlačítka Next/Prev/Play/Pause)

---

## 🎯 SHRNUTÍ ZMĚN

| Soubor | Řádek | Co se mění |
|--------|-------|------------|
| `index.html` | - | Název souboru preloaderu |
| `script.js` | ~45 | Přidán `window.audioState` |
| `script.js` | ~460 | Uprava funkce `playTrack()` |
| `script.js` | ~638 | Události v tlačítkách |
| `script.js` | ~810 | Událost v `ended` listeneru |

---

## 🖖 HOTOVO!

Po dokončení všech kroků bude přehrávač komunikovat s preloaderem přes události, a preloader **NIKDY** nebude blokovat načítání aktuální skladby!

**Live long and prosper!** 🚀

---

**Zpracoval:** Admirál Claude.AI  
**Pro:** Více admirál Jiřík  
**Mise:** Instalace Preloader V5.0
