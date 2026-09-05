/**
 * app.js
 * Haupt-Steuerung der Handschrift-Generator Webanwendung.
 * Verbindet UI-Elemente, Canvas-Recorder, Glyphen-Store und Text-Renderer.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Komponenten initialisieren
  const recorder = new CanvasRecorder('paint-canvas');
  const renderer = new TextRenderer('render-canvas');
  const store = window.glyphStore;

  await store.init();

  // Anwendungszustand
  let state = {
    activeCategory: 'lowercase',
    activeChar: 'a',
    activeSlotIndex: 0, // 0 bis 9 (entspricht Variation 1 bis 10)
    autoAdvance: true,
    showGhost: true
  };

  // UI-Elemente referenzieren
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  const charGrid = document.getElementById('char-grid');
  const categoryPills = document.getElementById('category-pills');
  const variationSlotsContainer = document.getElementById('variation-slots');
  const statsTotalRecorded = document.getElementById('stats-total-recorded');

  const activeCharDisplay = document.getElementById('active-char-display');
  const activeCharTitle = document.getElementById('active-char-title');
  const activeCharDesc = document.getElementById('active-char-desc');
  const activeCharVarCount = document.getElementById('active-char-var-count');
  const ghostGuide = document.getElementById('ghost-guide');

  const btnPrevChar = document.getElementById('btn-prev-char');
  const btnNextChar = document.getElementById('btn-next-char');
  const btnSaveSlot = document.getElementById('btn-save-slot');
  const btnDeleteSlot = document.getElementById('btn-delete-slot');
  const btnUndo = document.getElementById('btn-undo');
  const btnClear = document.getElementById('btn-clear');
  const chkAutoAdvance = document.getElementById('chk-auto-advance');
  const chkShowGhost = document.getElementById('chk-show-ghost');
  const inputStrokeWidth = document.getElementById('input-stroke-width');
  const strokeWidthVal = document.getElementById('stroke-width-val');

  // Generator UI-Elemente
  const inputText = document.getElementById('input-text');
  const btnInsertSampleText = document.getElementById('btn-insert-sample-text');
  const btnRerollVars = document.getElementById('btn-reroll-variations');
  const btnExportImage = document.getElementById('btn-export-image');
  const btnPrintPage = document.getElementById('btn-print-page');
  const btnZoomFit = document.getElementById('btn-zoom-fit');
  const renderStats = document.getElementById('render-stats');

  const sliderFontSize = document.getElementById('slider-font-size');
  const valFontSize = document.getElementById('val-font-size');
  const sliderLineHeight = document.getElementById('slider-line-height');
  const valLineHeight = document.getElementById('val-line-height');
  const sliderLetterSpacing = document.getElementById('slider-letter-spacing');
  const valLetterSpacing = document.getElementById('val-letter-spacing');
  const sliderWordSpacing = document.getElementById('slider-word-spacing');
  const valWordSpacing = document.getElementById('val-word-spacing');
  const sliderPenThickness = document.getElementById('slider-pen-thickness');
  const valPenThickness = document.getElementById('val-pen-thickness');
  const sliderNeatness = document.getElementById('slider-neatness');
  const valNeatness = document.getElementById('val-neatness');
  const sliderJitterPos = document.getElementById('slider-jitter-pos');
  const valJitterPos = document.getElementById('val-jitter-pos');
  const sliderJitterRot = document.getElementById('slider-jitter-rot');
  const valJitterRot = document.getElementById('val-jitter-rot');
  const chkAlternateVars = document.getElementById('chk-alternate-vars');

  const penColorDots = document.querySelectorAll('.color-dot');
  const customPenColor = document.getElementById('custom-pen-color');
  const paperBtns = document.querySelectorAll('.paper-btn');

  // Header Actions
  const btnLoadSample = document.getElementById('btn-load-sample');
  const btnExportProfile = document.getElementById('btn-export-profile');
  const fileImportProfile = document.getElementById('file-import-profile');
  const toastEl = document.getElementById('toast');

  // Wenn noch keine Glyphen gespeichert sind oder altes Profil: Neue GoodNotes Handschrift laden
  if (store.getTotalRecordedCharsCount() === 0 || store.profileMeta.name === 'Natürliche Schreibschrift (Beispiel)') {
    await loadSampleFont(false);
  }

  // Standard-Einstellungen passend zum GoodNotes iPad-Stil setzen
  renderer.setOptions({
    paperStyle: 'dark-grid',
    penColor: '#22c55e',
    fontSize: 27,
    lineHeight: 44,
    neatness: 75
  });

  // ================= TABS =================
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      if (btn.dataset.tab === 'tab-generate') {
        renderGeneratedText();
      }
    });
  });

  // ================= TOAST BENACHRICHTIGUNG =================
  function showToast(msg, duration = 2500) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, duration);
  }

  // ================= KATEGORIEN & BUCHSTABEN-GRID =================
  function updateCategoryPills() {
    const pills = categoryPills.querySelectorAll('.pill');
    pills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.cat === state.activeCategory);
    });
  }

  categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    state.activeCategory = pill.dataset.cat;
    updateCategoryPills();

    // Ersten Buchstaben der neuen Kategorie auswählen
    const chars = store.categories[state.activeCategory] || [];
    if (chars.length > 0) {
      selectChar(chars[0]);
    }
    renderCharGrid();
  });

  function renderCharGrid() {
    charGrid.innerHTML = '';
    const chars = store.categories[state.activeCategory] || [];

    chars.forEach(char => {
      const count = store.getVariationCount(char);
      const card = document.createElement('div');
      card.className = `char-card ${char === state.activeChar ? 'active' : ''} ${count > 0 ? 'has-variation' : ''} ${count >= 8 ? 'complete' : ''}`;
      card.dataset.char = char;

      card.innerHTML = `
        <span class="char-glyph">${escapeHtml(char)}</span>
        <span class="char-badge-count">${count}/10</span>
      `;

      card.addEventListener('click', () => {
        selectChar(char);
      });

      charGrid.appendChild(card);
    });

    // Zähler aktualisieren
    const total = store.getTotalRecordedCharsCount();
    statsTotalRecorded.textContent = `${total} Zeichen erfasst`;
  }

  // ================= BUCHSTABEN-AUSWAHL =================
  function selectChar(char) {
    state.activeChar = char;
    state.activeSlotIndex = 0; // Standardmäßig Slot 1

    activeCharDisplay.textContent = char;
    activeCharTitle.textContent = `Buchstabe „${char}“`;
    ghostGuide.textContent = char;

    updateActiveCharMeta();
    renderVariationSlots();
    loadCurrentSlotIntoCanvas();
    renderCharGrid();
  }

  function updateActiveCharMeta() {
    const count = store.getVariationCount(state.activeChar);
    activeCharVarCount.textContent = `${count} von 10`;

    let catName = 'Zeichen';
    if (/[a-z]/.test(state.activeChar)) catName = 'Kleinbuchstabe';
    else if (/[A-Z]/.test(state.activeChar)) catName = 'Großbuchstabe';
    else if (/[0-9]/.test(state.activeChar)) catName = 'Ziffer';
    else if (/[äöüßÄÖÜ]/.test(state.activeChar)) catName = 'Umlaut / Sonderzeichen';
    else catName = 'Satzzeichen';

    activeCharDesc.innerHTML = `${catName} &bull; <span id="active-char-var-count">${count} von 10</span> Variationen`;
  }

  // Vorheriger / Nächster Buchstabe
  function getFlatCharList() {
    return [
      ...store.categories.lowercase,
      ...store.categories.uppercase,
      ...store.categories.umlauts,
      ...store.categories.digits,
      ...store.categories.punctuation
    ];
  }

  function prevChar() {
    const list = getFlatCharList();
    const idx = list.indexOf(state.activeChar);
    if (idx > 0) {
      const nextCharVal = list[idx - 1];
      syncCategoryForChar(nextCharVal);
      selectChar(nextCharVal);
    }
  }

  function nextChar() {
    const list = getFlatCharList();
    const idx = list.indexOf(state.activeChar);
    if (idx >= 0 && idx < list.length - 1) {
      const nextCharVal = list[idx + 1];
      syncCategoryForChar(nextCharVal);
      selectChar(nextCharVal);
    }
  }

  function syncCategoryForChar(char) {
    for (const [cat, chars] of Object.entries(store.categories)) {
      if (chars.includes(char)) {
        state.activeCategory = cat;
        updateCategoryPills();
        break;
      }
    }
  }

  btnPrevChar.addEventListener('click', prevChar);
  btnNextChar.addEventListener('click', nextChar);

  // ================= 10 VARIATION SLOTS =================
  function renderVariationSlots() {
    variationSlotsContainer.innerHTML = '';
    const vars = store.getVariations(state.activeChar);

    for (let i = 0; i < 10; i++) {
      const glyphData = vars[i];
      const slotBtn = document.createElement('div');
      const isFilled = glyphData && glyphData.strokes && glyphData.strokes.length > 0;

      slotBtn.className = `slot-btn ${i === state.activeSlotIndex ? 'active' : ''} ${isFilled ? 'filled' : 'empty'}`;
      slotBtn.dataset.index = i;
      slotBtn.title = `Variation ${i + 1}${isFilled ? ' (vorhanden)' : ' (leer)'}`;

      if (isFilled && glyphData.thumbnail) {
        slotBtn.innerHTML = `
          <span class="slot-index-num">${i + 1}</span>
          <img class="slot-thumb" src="${glyphData.thumbnail}" alt="Var ${i + 1}">
        `;
      } else {
        slotBtn.innerHTML = `
          <span class="slot-index-num">${i + 1}</span>
          <div class="slot-indicator"></div>
        `;
      }

      slotBtn.addEventListener('click', () => {
        selectSlot(i);
      });

      variationSlotsContainer.appendChild(slotBtn);
    }
  }

  function selectSlot(index) {
    state.activeSlotIndex = index;
    renderVariationSlots();
    loadCurrentSlotIntoCanvas();
  }

  function loadCurrentSlotIntoCanvas() {
    const glyphData = store.getVariation(state.activeChar, state.activeSlotIndex);
    if (glyphData) {
      recorder.loadGlyph(glyphData);
    } else {
      recorder.clear();
    }
  }

  // ================= ZEICHENPAD-STEUERUNG =================
  // Variation speichern
  btnSaveSlot.addEventListener('click', saveCurrentSlot);

  async function saveCurrentSlot() {
    if (!recorder.hasContent()) {
      showToast('⚠️ Bitte zeichne zuerst den Buchstaben auf das Zeichenfeld!');
      return;
    }

    const glyphData = recorder.exportGlyphData();
    if (!glyphData) return;

    await store.saveVariation(state.activeChar, state.activeSlotIndex, glyphData);
    showToast(`✅ Variation ${state.activeSlotIndex + 1} für „${state.activeChar}“ gespeichert!`);

    updateActiveCharMeta();
    renderCharGrid();

    // Automatisch zum nächsten Slot oder nächsten Buchstaben weitergehen
    if (state.autoAdvance) {
      if (state.activeSlotIndex < 9) {
        selectSlot(state.activeSlotIndex + 1);
      } else {
        // Alle 10 Slots für diesen Buchstaben voll -> zum nächsten Buchstaben!
        showToast(`🎉 Großartig! Alle 10 Variationen für „${state.activeChar}“ erfasst!`);
        nextChar();
      }
    } else {
      renderVariationSlots();
    }
  }

  // Variation löschen
  btnDeleteSlot.addEventListener('click', async () => {
    if (confirm(`Möchtest du Variation ${state.activeSlotIndex + 1} für „${state.activeChar}“ wirklich löschen?`)) {
      await store.deleteVariation(state.activeChar, state.activeSlotIndex);
      recorder.clear();
      updateActiveCharMeta();
      renderVariationSlots();
      renderCharGrid();
      showToast(`Variation ${state.activeSlotIndex + 1} gelöscht.`);
    }
  });

  // Undo & Clear
  btnUndo.addEventListener('click', () => recorder.undo());
  btnClear.addEventListener('click', () => recorder.clear());

  // Strichstärke
  inputStrokeWidth.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    strokeWidthVal.textContent = `${val}px`;
    recorder.setStrokeWidth(val);
  });

  // Auto-Advance Checkbox
  chkAutoAdvance.addEventListener('change', (e) => {
    state.autoAdvance = e.target.checked;
  });

  // Hilfs-Buchstabe (Ghost Guide)
  chkShowGhost.addEventListener('change', (e) => {
    ghostGuide.style.display = e.target.checked ? 'flex' : 'none';
  });

  // Tastenkombinationen (wenn nicht in einem Eingabefeld getippt wird)
  window.addEventListener('keydown', (e) => {
    const isEditingText = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
    if (isEditingText) return;

    if (e.key === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      saveCurrentSlot();
    } else if (e.key === 'ArrowLeft') {
      prevChar();
    } else if (e.key === 'ArrowRight') {
      nextChar();
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      recorder.undo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      recorder.clear();
    }
  });

  // ================= TAB 2: TEXT-ZU-HANDSCHRIFT GENERATOR =================
  const defaultText = `3) Darwin hat die theorie das jede Tierart unterschiedliche Variationen haben und das sich bestimmte Variationen zu jeder Generation ändern.
Diese ständige änderungen von eigenschaften ist bei jedem Tier für sein überleben notwendig, da alle Tiere sich an seine Gegenüber ebenfalls anpassen müssen.
Auf den Menschen trifft das ebenfalls zu. Jeder Mensch hat unterschiedliche Variationen, manche sind größer manche sind kleiner, wobei die grundlegene Strucktur (das Embryo) bei jedem Säugetier gleich bleit.
Daraus stellt er die Vermutung auf dass jedes (Säuge-) tier von einem sehr alten Urzeugers abstammen muss.`;

  inputText.value = defaultText;

  btnInsertSampleText.addEventListener('click', () => {
    inputText.value = defaultText;
    renderGeneratedText();
  });

  // Live Rendering bei Texteingabe (debounced)
  let renderDebounceTimer = null;
  inputText.addEventListener('input', () => {
    clearTimeout(renderDebounceTimer);
    renderDebounceTimer = setTimeout(renderGeneratedText, 150);
  });

  // Slider Events
  function bindSlider(slider, labelEl, suffix, optKey, transform = (v) => v) {
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      labelEl.textContent = `${val}${suffix}`;
      renderer.setOptions({ [optKey]: transform(val) });
      renderGeneratedText();
    });
  }

  bindSlider(sliderFontSize, valFontSize, 'px', 'fontSize');
  bindSlider(sliderLineHeight, valLineHeight, 'px', 'lineHeight');
  bindSlider(sliderLetterSpacing, valLetterSpacing, 'px', 'letterSpacing');
  bindSlider(sliderWordSpacing, valWordSpacing, 'px', 'wordSpacing');
  bindSlider(sliderPenThickness, valPenThickness, 'x', 'penThickness');

  // Schreib-Ordentlichkeit Slider
  function getNeatnessLabel(val) {
    if (val >= 95) return `Perfekte Schönschrift (${val}%)`;
    if (val >= 75) return `Sehr ordentlich (${val}%)`;
    if (val >= 55) return `Natürlich / Ausgewogen (${val}%)`;
    if (val >= 35) return `Locker / Schwungvoll (${val}%)`;
    if (val >= 15) return `Zügig / Alltag (${val}%)`;
    return `Eilig / Flüchtig (${val}%)`;
  }

  if (sliderNeatness && valNeatness) {
    sliderNeatness.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      valNeatness.textContent = getNeatnessLabel(val);
      renderer.setOptions({ neatness: val });
      renderGeneratedText();
    });
  }
  bindSlider(sliderJitterPos, valJitterPos, '', 'jitterPos', (v) => {
    valJitterPos.textContent = v === 0 ? 'Aus' : (v <= 2 ? 'Dezent' : 'Stark');
    return v;
  });
  bindSlider(sliderJitterRot, valJitterRot, '°', 'jitterRot', (v) => {
    valJitterRot.textContent = v === 0 ? 'Aus' : (v <= 2 ? 'Leicht' : 'Stark');
    return v;
  });

  chkAlternateVars.addEventListener('change', (e) => {
    renderer.setOptions({ alternateVars: e.target.checked });
    renderGeneratedText();
  });

  // Stiftfarben Presets
  penColorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      penColorDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      const color = dot.dataset.color;
      customPenColor.value = color;
      renderer.setOptions({ penColor: color });
      renderGeneratedText();
    });
  });

  customPenColor.addEventListener('input', (e) => {
    penColorDots.forEach(d => d.classList.remove('active'));
    renderer.setOptions({ penColor: e.target.value });
    renderGeneratedText();
  });

  // Papier-Presets
  paperBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      paperBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderer.setOptions({ paperStyle: btn.dataset.paper });
      renderGeneratedText();
    });
  });

  // Variationen neu würfeln
  btnRerollVars.addEventListener('click', () => {
    renderer.setOptions({ seed: Math.random() });
    renderGeneratedText();
    showToast('🎲 Alle Buchstaben-Variationen neu gewürfelt!');
  });

  // Text rendern
  function renderGeneratedText() {
    const text = inputText.value;
    const stats = renderer.render(text);

    if (stats.variationsUsed > 0) {
      renderStats.textContent = `${stats.variationsUsed} Zeichen mit Variationen gerendert`;
    } else {
      renderStats.textContent = `Vorschau aktiv`;
    }
  }

  // Zoom Fit
  let isZoomedFit = true;
  btnZoomFit.addEventListener('click', () => {
    const canvas = document.getElementById('render-canvas');
    if (isZoomedFit) {
      canvas.style.width = '1000px';
      btnZoomFit.textContent = 'Original (100%)';
      isZoomedFit = false;
    } else {
      canvas.style.width = '620px';
      btnZoomFit.textContent = 'Ansicht anpassen';
      isZoomedFit = true;
    }
  });

  // Bild Export (PNG)
  btnExportImage.addEventListener('click', () => {
    const canvas = document.getElementById('render-canvas');
    const link = document.createElement('a');
    link.download = 'meine-handschrift-dokument.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('📥 Hochauflösendes PNG-Bild erfolgreich heruntergeladen!');
  });

  // Drucken / PDF
  btnPrintPage.addEventListener('click', () => {
    window.print();
  });

  // ================= BEISPIEL & PROFIL IMPORT/EXPORT =================
  // Beispiel-Handschrift laden
  btnLoadSample.addEventListener('click', () => {
    if (confirm('Möchtest du das vollständige Beispiel-Handschrift-Muster mit mehreren Variationen laden? Vorhandene Zeichnungen werden ergänzt.')) {
      loadSampleFont(true);
    }
  });

  async function loadSampleFont(notify = true) {
    const sampleProfile = SampleFontGenerator.createSampleProfile();
    await store.importProfile(JSON.stringify(sampleProfile));
    renderCharGrid();
    renderVariationSlots();
    loadCurrentSlotIntoCanvas();
    renderGeneratedText();
    if (notify) {
      showToast('✨ Beispiel-Handschrift mit mehreren Variationen erfolgreich geladen!');
    }
  }

  // Profil Exportieren
  btnExportProfile.addEventListener('click', () => {
    const jsonStr = store.exportProfile();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'meine-handschrift-profil.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast('💾 Handschrift-Profil als JSON exportiert!');
  });

  // Profil Importieren
  fileImportProfile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        await store.importProfile(evt.target.result);
        renderCharGrid();
        renderVariationSlots();
        loadCurrentSlotIntoCanvas();
        renderGeneratedText();
        showToast('📂 Profil erfolgreich importiert!');
      } catch (err) {
        alert('Fehler beim Laden der Datei: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  });

  // Initialer Aufbau
  updateCategoryPills();
  selectChar('a');
  renderGeneratedText();

  // Hilfsfunktion: HTML Escaping
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
