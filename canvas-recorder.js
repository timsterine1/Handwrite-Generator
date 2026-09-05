/**
 * canvas-recorder.js
 * Interaktives Zeichnen auf dem Canvas mit Strichglättung (Bézier-Interpolation),
 * Stylus/Touch-Druckerkennung, Hilfslinien-Abgleich und Vektorerfassung.
 */

class CanvasRecorder {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Referenz-Größen des internen Koordinatensystems
    this.width = this.canvas.width;   // 600
    this.height = this.canvas.height; // 450

    // Typografische Richtwerte (y-Koordinaten bei 450px Höhe)
    this.metrics = {
      ascender: Math.round(this.height * 0.15),   // ~68px
      capHeight: Math.round(this.height * 0.26),  // ~117px
      meanLine: Math.round(this.height * 0.42),   // ~189px
      baseline: Math.round(this.height * 0.68),   // ~306px
      descender: Math.round(this.height * 0.86)   // ~387px
    };

    // Zeichen-Status
    this.isDrawing = false;
    this.strokes = [];       // Array von Strichen: [ [ {x, y, p, t}, ... ], ... ]
    this.currentStroke = [];
    this.baseStrokeWidth = 5;
    this.penColor = '#111827';

    this.setupEvents();
  }

  setupEvents() {
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    window.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.handlePointerUp(e));

    // Kontextmenü auf Canvas deaktivieren für Stifte/Rechtsklick
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Ermittelt exakte Canvas-Koordinaten relativ zum Canvas-Element
  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;

    let pressure = e.pressure;
    // Wenn Maus oder keine Druckdaten vorhanden: Standardwert 0.5
    if (pressure === undefined || pressure === 0 && e.pointerType === 'mouse') {
      pressure = 0.5;
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      p: Math.max(0.15, Math.min(1.0, pressure)),
      t: performance.now()
    };
  }

  handlePointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Nur primäre Maustaste
    this.canvas.setPointerCapture(e.pointerId);
    this.isDrawing = true;

    const pt = this.getCanvasCoords(e);
    this.currentStroke = [pt];
    this.strokes.push(this.currentStroke);

    // Initialen Punkt zeichnen
    this.drawPoint(pt);
  }

  handlePointerMove(e) {
    if (!this.isDrawing) return;
    const pt = this.getCanvasCoords(e);
    this.currentStroke.push(pt);

    // Live-Zeichnen des neuen Segments mit Bézier-Glättung
    this.drawLatestSegment(this.currentStroke);
  }

  handlePointerUp(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    try {
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    // Einmal sauber neu rendern für perfekte Kanten
    this.redrawAll();
  }

  setStrokeWidth(w) {
    this.baseStrokeWidth = w;
    this.redrawAll();
  }

  drawPoint(pt) {
    const ctx = this.ctx;
    const r = (this.baseStrokeWidth * (0.6 + pt.p * 0.8)) / 2;
    ctx.fillStyle = this.penColor;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLatestSegment(stroke) {
    const len = stroke.length;
    if (len < 2) return;

    const ctx = this.ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.penColor;

    if (len === 2) {
      const p0 = stroke[0];
      const p1 = stroke[1];
      const w = this.baseStrokeWidth * (0.6 + ((p0.p + p1.p) / 2) * 0.8);
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      return;
    }

    // Bézier-Kurve zwischen Mittelpunkten
    const p0 = stroke[len - 3];
    const p1 = stroke[len - 2];
    const p2 = stroke[len - 1];

    const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    const w = this.baseStrokeWidth * (0.6 + p1.p * 0.8);
    ctx.lineWidth = w;

    ctx.beginPath();
    ctx.moveTo(mid1.x, mid1.y);
    ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
    ctx.stroke();
  }

  redrawAll() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const ctx = this.ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = this.penColor;

    for (const stroke of this.strokes) {
      if (!stroke || stroke.length === 0) continue;

      if (stroke.length === 1) {
        this.drawPoint(stroke[0]);
        continue;
      }

      for (let i = 1; i < stroke.length; i++) {
        const pPrev = stroke[i - 1];
        const pCurr = stroke[i];
        const w = this.baseStrokeWidth * (0.6 + ((pPrev.p + pCurr.p) / 2) * 0.8);

        ctx.lineWidth = w;
        ctx.beginPath();

        if (i === 1) {
          ctx.moveTo(pPrev.x, pPrev.y);
        } else {
          const pBefore = stroke[i - 2];
          ctx.moveTo((pBefore.x + pPrev.x) / 2, (pBefore.y + pPrev.y) / 2);
        }

        if (i === stroke.length - 1) {
          ctx.lineTo(pCurr.x, pCurr.y);
        } else {
          const mid = { x: (pCurr.x + pPrev.x) / 2, y: (pCurr.y + pPrev.y) / 2 };
          ctx.quadraticCurveTo(pPrev.x, pPrev.y, mid.x, mid.y);
        }
        ctx.stroke();
      }
    }
  }

  undo() {
    if (this.strokes.length > 0) {
      this.strokes.pop();
      this.redrawAll();
      return true;
    }
    return false;
  }

  clear() {
    this.strokes = [];
    this.currentStroke = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  hasContent() {
    return this.strokes.length > 0 && this.strokes.some(s => s.length > 0);
  }

  // Lädt existierende Striche eines Glyphen zum Anzeigen/Nachbearbeiten
  loadGlyph(glyphData) {
    this.clear();
    if (glyphData && Array.isArray(glyphData.strokes)) {
      // Tiefe Kopie der Striche
      this.strokes = glyphData.strokes.map(s => s.map(p => ({ ...p })));
      this.redrawAll();
    }
  }

  // Berechnet Bounding-Box, Ausrichtung und generiert ein Thumbnail
  exportGlyphData() {
    if (!this.hasContent()) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const stroke of this.strokes) {
      for (const pt of stroke) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    const pad = this.baseStrokeWidth;
    minX = Math.max(0, minX - pad);
    maxX = Math.min(this.width, maxX + pad);
    minY = Math.max(0, minY - pad);
    maxY = Math.min(this.height, maxY + pad);

    const charWidth = Math.max(12, maxX - minX);
    const charHeight = Math.max(12, maxY - minY);

    // Automatische Vorschubbreite (advanceWidth)
    // Bei schmalen Zeichen (i, l, Punkt, Komma) Mindestabstand garantieren
    const advanceWidth = Math.round(charWidth + Math.max(16, this.baseStrokeWidth * 3.5));

    // Thumbnail für den Slot-Button generieren (64x48)
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 64;
    thumbCanvas.height = 48;
    const thumbCtx = thumbCanvas.getContext('2d');
    
    // Transparent zeichnen
    thumbCtx.drawImage(
      this.canvas,
      0, 0, this.width, this.height,
      0, 0, 64, 48
    );
    const thumbnail = thumbCanvas.toDataURL('image/png');

    return {
      strokes: this.strokes.map(s => s.map(p => ({
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        p: Math.round(p.p * 100) / 100
      }))),
      bbox: {
        minX: Math.round(minX),
        maxX: Math.round(maxX),
        minY: Math.round(minY),
        maxY: Math.round(maxY),
        width: Math.round(charWidth),
        height: Math.round(charHeight)
      },
      baseline: this.metrics.baseline, // 306
      advanceWidth: advanceWidth,
      baseStrokeWidth: this.baseStrokeWidth,
      thumbnail: thumbnail,
      updatedAt: Date.now()
    };
  }
}
