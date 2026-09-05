/**
 * text-renderer.js
 * Intelligente Text-zu-Handschrift Engine:
 * - Wählt bei jedem Vorkommen eines Buchstabens dynamisch aus den bis zu 10 Variationen
 * - Verhindert aufeinanderfolgende gleiche Glyphen-Varianten
 * - Zeilenumbruch, Wortabstände und typografische Grundlinien-Ausrichtung
 * - Natürlicher Jitter (Linien- und Neigungs-Variationen)
 * - Realistische Papier-Hintergründe (Liniert mit Rand, Kariert, Collegeblock, Pergament, Blanko)
 */

class TextRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // DIN A4 Format bei hoher Auflösung
    this.pageWidth = 1240;
    this.pageHeight = 1754;
    this.canvas.width = this.pageWidth;
    this.canvas.height = this.pageHeight;

    // Cache für die zuletzt genutzte Variation jedes Zeichens (vermeidet Dubletten)
    this.lastVarIndexMap = {};

    // Standard-Parameter
    this.options = {
      fontSize: 28,
      lineHeight: 46,
      letterSpacing: 2,
      wordSpacing: 18,
      penColor: '#1b3f8b',
      penThickness: 1.2,
      jitterPos: 2,
      jitterRot: 1.5,
      alternateVars: true,
      paperStyle: 'lined',
      seed: Math.random()
    };
  }

  setOptions(opts) {
    this.options = { ...this.options, ...opts };
  }

  // Zeichnet den gewählten Papier-Hintergrund auf das Canvas
  drawPaperBackground(ctx, style, lineHeight, topMargin) {
    const w = this.pageWidth;
    const h = this.pageHeight;

    ctx.save();

    if (style === 'lined') {
      // Weißes Papier mit blauen Hilfslinien und rotem Rand
      ctx.fillStyle = '#fdfdfd';
      ctx.fillRect(0, 0, w, h);

      // Horizontale Linien
      ctx.strokeStyle = '#d4e0ee';
      ctx.lineWidth = 1.5;
      for (let y = topMargin; y < h - 80; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(w - 60, y);
        ctx.stroke();
      }

      // Roter Rand links
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(180, 0);
      ctx.lineTo(180, h);
      ctx.stroke();

      // Lochung links (3 Löcher)
      ctx.fillStyle = '#1e2530';
      const holeY = [h * 0.15, h * 0.5, h * 0.85];
      holeY.forEach(y => {
        ctx.beginPath();
        ctx.arc(40, y, 14, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (style === 'grid') {
      // 5mm Karopapier
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const gridSize = 24;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;

      for (let x = 60; x <= w - 60; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, h - 60);
        ctx.stroke();
      }
      for (let y = 60; y <= h - 60; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(w - 60, y);
        ctx.stroke();
      }

    } else if (style === 'yellow-pad') {
      // Collegeblock Gelb
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(0, 0, w, h);

      // Kopfleiste oben (dunkleres Lederband)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, w, 50);

      // Doppelte rote Randlinie links
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(160, 50); ctx.lineTo(160, h);
      ctx.moveTo(166, 50); ctx.lineTo(166, h);
      ctx.stroke();

      // Blaue Linien
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.2;
      for (let y = topMargin; y < h - 80; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(166, y);
        ctx.lineTo(w - 50, y);
        ctx.stroke();
      }

    } else if (style === 'vintage') {
      // Antikes Pergament
      const grad = ctx.createRadialGradient(w/2, h/2, 200, w/2, h/2, w);
      grad.addColorStop(0, '#fef6e4');
      grad.addColorStop(1, '#ebd4aa');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Dezente Vignette an den Rändern
      ctx.fillStyle = 'rgba(120, 53, 15, 0.04)';
      ctx.fillRect(0, 0, 40, h);
      ctx.fillRect(w - 40, 0, 40, h);

    } else {
      // Blanko Weiß
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  // Wählt für ein Zeichen eine Variation aus (rotierend / zufällig)
  pickGlyphVariation(char) {
    const vars = window.glyphStore.getVariations(char);
    const validVars = [];

    vars.forEach((v, idx) => {
      if (v && Array.isArray(v.strokes) && v.strokes.length > 0) {
        validVars.push({ glyph: v, slotIndex: idx });
      }
    });

    if (validVars.length === 0) {
      return null;
    }

    if (validVars.length === 1) {
      this.lastVarIndexMap[char] = validVars[0].slotIndex;
      return validVars[0].glyph;
    }

    // Wenn mehrere Variationen existieren: Vorherige vermeiden (sofern aktiviert)
    const lastIdx = this.lastVarIndexMap[char];
    let candidates = validVars;

    if (this.options.alternateVars && lastIdx !== undefined) {
      const filtered = validVars.filter(item => item.slotIndex !== lastIdx);
      if (filtered.length > 0) {
        candidates = filtered;
      }
    }

    // Zufällige Auswahl aus den Kandidaten
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.lastVarIndexMap[char] = chosen.slotIndex;
    return chosen.glyph;
  }

  // Haupt-Render-Methode
  render(text) {
    const ctx = this.ctx;
    const opt = this.options;

    // Reset der Variations-Historie für diesen Renderdurchlauf
    this.lastVarIndexMap = {};

    // Layout-Grenzen definieren
    const leftMargin = opt.paperStyle === 'lined' ? 200 : (opt.paperStyle === 'yellow-pad' ? 185 : 120);
    const rightMargin = 100;
    const topMargin = 160;
    const bottomMargin = 140;
    const contentWidth = this.pageWidth - leftMargin - rightMargin;

    // Hintergrund zeichnen
    this.drawPaperBackground(ctx, opt.paperStyle, opt.lineHeight, topMargin);

    if (!text || text.trim().length === 0) {
      return { totalChars: 0, variationsUsed: 0 };
    }

    // Skalierungsfaktor von den Canvas-Standardkoordinaten (Höhe 450, Baseline 306, Mean 189)
    // Differenz Baseline - MeanLine = 117px
    const refScale = opt.fontSize / 117;

    let cursorX = leftMargin;
    let cursorY = topMargin;
    let charsRendered = 0;
    let variationsCounter = 0;

    // Absätze aufteilen
    const paragraphs = text.split('\n');

    for (let p = 0; p < paragraphs.length; p++) {
      const para = paragraphs[p];

      // Wörter aufteilen
      const words = para.split(' ');

      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        if (word.length === 0) continue;

        // Wortbreite vorberechnen für automatischen Zeilenumbruch
        let wordWidth = 0;
        for (let c = 0; c < word.length; c++) {
          const char = word[c];
          const glyph = this.pickGlyphVariation(char);
          if (glyph) {
            wordWidth += (glyph.advanceWidth * refScale) + opt.letterSpacing;
          } else {
            wordWidth += (opt.fontSize * 0.6) + opt.letterSpacing;
          }
        }

        // Zeilenumbruch, falls das Wort nicht mehr in die aktuelle Zeile passt
        if (cursorX + wordWidth > leftMargin + contentWidth && cursorX > leftMargin) {
          cursorX = leftMargin;
          cursorY += opt.lineHeight;

          // Seitenende erreicht?
          if (cursorY > this.pageHeight - bottomMargin) {
            // Aktuelle Seite voll
            break;
          }
        }

        // Buchstaben des Wortes zeichnen
        for (let c = 0; c < word.length; c++) {
          const char = word[c];
          const glyph = this.pickGlyphVariation(char);

          // Zufälliges Rauschen (Jitter)
          const jitterY = (Math.random() - 0.5) * opt.jitterPos * 2;
          const jitterAngle = (Math.random() - 0.5) * (opt.jitterRot * (Math.PI / 180));
          const scaleWobble = 1 + (Math.random() - 0.5) * 0.04;
          const currentScale = refScale * scaleWobble;

          if (glyph && glyph.strokes) {
            variationsCounter++;
            this.drawVectorGlyph(
              ctx,
              glyph,
              cursorX,
              cursorY + jitterY,
              currentScale,
              jitterAngle,
              opt.penColor,
              opt.penThickness
            );
            cursorX += (glyph.advanceWidth * currentScale) + opt.letterSpacing;
          } else {
            // Fallback für nicht erfasste Zeichen (mit natürlicher Systemschrift)
            this.drawFallbackChar(
              ctx,
              char,
              cursorX,
              cursorY + jitterY,
              opt.fontSize,
              opt.penColor
            );
            cursorX += (opt.fontSize * 0.6) + opt.letterSpacing;
          }

          charsRendered++;
        }

        // Wortabstand addieren (mit leichtem Zufallsrauschen)
        const wordSpaceJitter = (Math.random() - 0.5) * 3;
        cursorX += Math.max(8, opt.wordSpacing + wordSpaceJitter);
      }

      // Zeilenumbruch nach Absatz
      cursorX = leftMargin;
      cursorY += opt.lineHeight;

      if (cursorY > this.pageHeight - bottomMargin) {
        break;
      }
    }

    return {
      totalChars: charsRendered,
      variationsUsed: variationsCounter
    };
  }

  // Rendert einen Vektor-Glyphen auf das Ziel-Canvas
  drawVectorGlyph(ctx, glyph, x, y, scale, angle, color, thicknessMultiplier) {
    ctx.save();

    // Verschiebung zur Grundlinie
    // Im Standard-Canvas ist die Baseline bei y = 306
    ctx.translate(x, y);
    if (angle !== 0) {
      ctx.rotate(angle);
    }

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const baseWidth = (glyph.baseStrokeWidth || 5) * scale * thicknessMultiplier;

    // Finde den linken Startpunkt des Zeichens (minX)
    const minX = glyph.bbox ? glyph.bbox.minX : 240;
    const baselineY = glyph.baseline || 306;

    for (const stroke of glyph.strokes) {
      if (!stroke || stroke.length === 0) continue;

      if (stroke.length === 1) {
        const pt = stroke[0];
        const px = (pt.x - minX) * scale;
        const py = (pt.y - baselineY) * scale;
        const r = Math.max(1, (baseWidth * (0.6 + (pt.p || 0.5) * 0.8)) / 2);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      for (let i = 1; i < stroke.length; i++) {
        const pPrev = stroke[i - 1];
        const pCurr = stroke[i];

        const x0 = (pPrev.x - minX) * scale;
        const y0 = (pPrev.y - baselineY) * scale;
        const x1 = (pCurr.x - minX) * scale;
        const y1 = (pCurr.y - baselineY) * scale;

        const w = Math.max(1, baseWidth * (0.6 + (((pPrev.p || 0.5) + (pCurr.p || 0.5)) / 2) * 0.8));
        ctx.lineWidth = w;

        ctx.beginPath();
        if (i === 1) {
          ctx.moveTo(x0, y0);
        } else {
          const pBefore = stroke[i - 2];
          const bx = (pBefore.x - minX) * scale;
          const by = (pBefore.y - baselineY) * scale;
          ctx.moveTo((bx + x0) / 2, (by + y0) / 2);
        }

        if (i === stroke.length - 1) {
          ctx.lineTo(x1, y1);
        } else {
          ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Fallback-Darstellung falls ein Zeichen noch nicht gezeichnet wurde
  drawFallbackChar(ctx, char, x, y, size, color) {
    ctx.save();
    ctx.font = `${Math.round(size * 1.1)}px 'Caveat', cursive, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(char, x, y);
    ctx.restore();
  }
}
