/**
 * sample-font.js
 * Erzeugt ein vollständiges, natürliches Vektor-Handschrift-Muster mit
 * MEHREREN VARIATIONEN pro Buchstabe für sofortige Tests der Generator-Funktion.
 */

class SampleFontGenerator {
  static createSampleProfile() {
    const profile = {
      format: 'handschrift-generator-v1',
      version: '1.0',
      meta: {
        name: 'Natürliche Schreibschrift (Beispiel)',
        updatedAt: Date.now()
      },
      glyphs: {}
    };

    // Standard-Höhen (Canvas: 600x450, Baseline: 306, Mean: 189, Cap: 117, Asc: 68, Desc: 387)
    const base = 306;
    const mean = 189;
    const cap = 117;
    const desc = 387;
    const asc = 68;
    const midX = 300;

    // Hilfsfunktion zur Generierung von interpolierten Bézier-Punkten
    function line(x1, y1, x2, y2, steps = 10, pStart = 0.5, pEnd = 0.6) {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        pts.push({
          x: Math.round((x1 + (x2 - x1) * t) * 10) / 10,
          y: Math.round((y1 + (y2 - y1) * t) * 10) / 10,
          p: Math.round((pStart + (pEnd - pStart) * t) * 100) / 100
        });
      }
      return pts;
    }

    function curve(p0, p1, p2, steps = 14, pVal = 0.55) {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const inv = 1 - t;
        const x = inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x;
        const y = inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y;
        pts.push({
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          p: pVal
        });
      }
      return pts;
    }

    // Erzeugt ein Glyphen-Objekt aus Strichen
    function makeGlyph(strokes, charAdvance = null) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      for (const s of strokes) {
        for (const pt of s) {
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        }
      }
      if (minX === Infinity) {
        minX = 260; maxX = 340; minY = mean; maxY = base;
      }
      const charWidth = Math.max(16, maxX - minX);
      const advanceWidth = charAdvance || Math.round(charWidth + 24);

      // Mini-Thumbnail rendern
      const tc = document.createElement('canvas');
      tc.width = 64; tc.height = 48;
      const tctx = tc.getContext('2d');
      tctx.strokeStyle = '#111827';
      tctx.lineWidth = 2.5;
      tctx.lineCap = 'round';
      tctx.lineJoin = 'round';
      
      const scale = Math.min(50 / (maxX - minX + 20), 38 / (maxY - minY + 20));
      const offX = 32 - ((minX + maxX) / 2) * scale;
      const offY = 24 - ((minY + maxY) / 2) * scale;

      for (const s of strokes) {
        if (s.length === 0) continue;
        tctx.beginPath();
        tctx.moveTo(s[0].x * scale + offX, s[0].y * scale + offY);
        for (let i = 1; i < s.length; i++) {
          tctx.lineTo(s[i].x * scale + offX, s[i].y * scale + offY);
        }
        tctx.stroke();
      }

      return {
        strokes,
        bbox: {
          minX: Math.round(minX),
          maxX: Math.round(maxX),
          minY: Math.round(minY),
          maxY: Math.round(maxY),
          width: Math.round(charWidth),
          height: Math.round(maxY - minY)
        },
        baseline: base,
        advanceWidth,
        baseStrokeWidth: 5,
        thumbnail: tc.toDataURL('image/png')
      };
    }

    // Vorlagen-Generator für Buchstaben mit mehreren Variationen
    function createVariations(char, generatorFns) {
      const vars = new Array(10).fill(null);
      generatorFns.forEach((fn, idx) => {
        if (idx < 10) {
          vars[idx] = fn();
        }
      });
      profile.glyphs[char] = vars;
    }

    // === KLEINBUCHSTABEN MIT JE 3 BIS 4 ECHTEN VARIATIONEN ===

    // 'a'
    createVariations('a', [
      // Var 0: Klassisches rundes a mit kleinem Schwung
      () => makeGlyph([
        curve({x: 310, y: 215}, {x: 245, y: 185}, {x: 245, y: 255}),
        curve({x: 245, y: 255}, {x: 245, y: 306}, {x: 305, y: 306}),
        line(305, 195, 305, 306),
        curve({x: 305, y: 306}, {x: 312, y: 306}, {x: 322, y: 298})
      ]),
      // Var 1: Leicht ovaleres, geneigtes a
      () => makeGlyph([
        curve({x: 305, y: 210}, {x: 240, y: 190}, {x: 240, y: 260}),
        curve({x: 240, y: 260}, {x: 240, y: 304}, {x: 298, y: 304}),
        line(298, 190, 298, 304),
        curve({x: 298, y: 304}, {x: 306, y: 305}, {x: 318, y: 292})
      ]),
      // Var 2: Flotteres a mit weiter geöffnetem Bauch
      () => makeGlyph([
        curve({x: 315, y: 220}, {x: 250, y: 192}, {x: 250, y: 258}),
        curve({x: 250, y: 258}, {x: 250, y: 305}, {x: 310, y: 305}),
        line(310, 200, 310, 305),
        line(310, 305, 325, 302)
      ]),
      // Var 3: Kompakteres a
      () => makeGlyph([
        curve({x: 300, y: 212}, {x: 248, y: 188}, {x: 248, y: 255}),
        curve({x: 248, y: 255}, {x: 248, y: 303}, {x: 295, y: 303}),
        line(295, 192, 295, 303)
      ])
    ]);

    // 'b'
    createVariations('b', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        curve({x: 255, y: 225}, {x: 315, y: 195}, {x: 315, y: 260}),
        curve({x: 315, y: 260}, {x: 315, y: 306}, {x: 255, y: 306})
      ]),
      () => makeGlyph([
        line(252, 110, 252, 305),
        curve({x: 252, y: 220}, {x: 318, y: 190}, {x: 318, y: 255}),
        curve({x: 318, y: 255}, {x: 318, y: 305}, {x: 252, y: 305})
      ]),
      () => makeGlyph([
        line(258, 120, 258, 306),
        curve({x: 258, y: 230}, {x: 312, y: 200}, {x: 312, y: 265}),
        curve({x: 312, y: 265}, {x: 312, y: 306}, {x: 258, y: 306})
      ])
    ]);

    // 'c'
    createVariations('c', [
      () => makeGlyph([
        curve({x: 308, y: 212}, {x: 250, y: 188}, {x: 250, y: 255}),
        curve({x: 250, y: 255}, {x: 250, y: 306}, {x: 308, y: 300})
      ]),
      () => makeGlyph([
        curve({x: 312, y: 208}, {x: 255, y: 185}, {x: 255, y: 250}),
        curve({x: 255, y: 250}, {x: 255, y: 305}, {x: 314, y: 295})
      ]),
      () => makeGlyph([
        curve({x: 305, y: 215}, {x: 248, y: 192}, {x: 248, y: 258}),
        curve({x: 248, y: 258}, {x: 248, y: 306}, {x: 305, y: 304})
      ])
    ]);

    // 'd'
    createVariations('d', [
      () => makeGlyph([
        curve({x: 300, y: 225}, {x: 245, y: 195}, {x: 245, y: 260}),
        curve({x: 245, y: 260}, {x: 245, y: 306}, {x: 300, y: 306}),
        line(300, 115, 300, 306),
        curve({x: 300, y: 306}, {x: 308, y: 306}, {x: 318, y: 298})
      ]),
      () => makeGlyph([
        curve({x: 295, y: 220}, {x: 240, y: 190}, {x: 240, y: 255}),
        curve({x: 240, y: 255}, {x: 240, y: 305}, {x: 295, y: 305}),
        line(295, 110, 295, 305),
        curve({x: 295, y: 305}, {x: 302, y: 305}, {x: 314, y: 292})
      ])
    ]);

    // 'e'
    createVariations('e', [
      () => makeGlyph([
        line(248, 255, 305, 255),
        curve({x: 305, y: 255}, {x: 305, y: 188}, {x: 265, y: 188}),
        curve({x: 265, y: 188}, {x: 245, y: 230}, {x: 245, y: 265}),
        curve({x: 245, y: 265}, {x: 245, y: 306}, {x: 305, y: 302})
      ]),
      () => makeGlyph([
        line(246, 250, 310, 250),
        curve({x: 310, y: 250}, {x: 310, y: 185}, {x: 262, y: 185}),
        curve({x: 262, y: 185}, {x: 244, y: 225}, {x: 244, y: 260}),
        curve({x: 244, y: 260}, {x: 244, y: 305}, {x: 312, y: 298})
      ]),
      () => makeGlyph([
        line(250, 258, 302, 258),
        curve({x: 302, y: 258}, {x: 302, y: 192}, {x: 268, y: 192}),
        curve({x: 268, y: 192}, {x: 248, y: 235}, {x: 248, y: 268}),
        curve({x: 248, y: 268}, {x: 248, y: 306}, {x: 302, y: 305})
      ])
    ]);

    // 'f'
    createVariations('f', [
      () => makeGlyph([
        curve({x: 295, y: 110}, {x: 275, y: 105}, {x: 268, y: 130}),
        line(268, 130, 268, 306),
        line(250, 205, 290, 205)
      ]),
      () => makeGlyph([
        curve({x: 298, y: 108}, {x: 278, y: 103}, {x: 270, y: 125}),
        line(270, 125, 270, 305),
        line(252, 200, 292, 200)
      ])
    ]);

    // 'g' (Unterlänge!)
    createVariations('g', [
      () => makeGlyph([
        curve({x: 305, y: 215}, {x: 245, y: 185}, {x: 245, y: 255}),
        curve({x: 245, y: 255}, {x: 245, y: 306}, {x: 305, y: 306}),
        line(305, 195, 305, 350),
        curve({x: 305, y: 350}, {x: 305, y: 387}, {x: 260, y: 387}),
        curve({x: 260, y: 387}, {x: 240, y: 380}, {x: 235, y: 355})
      ]),
      () => makeGlyph([
        curve({x: 300, y: 210}, {x: 240, y: 182}, {x: 240, y: 250}),
        curve({x: 240, y: 250}, {x: 240, y: 304}, {x: 300, y: 304}),
        line(300, 190, 300, 345),
        curve({x: 300, y: 345}, {x: 300, y: 385}, {x: 255, y: 385}),
        curve({x: 255, y: 385}, {x: 238, y: 378}, {x: 232, y: 350})
      ])
    ]);

    // 'h'
    createVariations('h', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        curve({x: 255, y: 235}, {x: 290, y: 195}, {x: 310, y: 235}),
        line(310, 235, 310, 306)
      ]),
      () => makeGlyph([
        line(252, 110, 252, 305),
        curve({x: 252, y: 230}, {x: 288, y: 190}, {x: 308, y: 230}),
        line(308, 230, 308, 305)
      ])
    ]);

    // 'i'
    createVariations('i', [
      () => makeGlyph([
        line(280, 200, 280, 306),
        line(280, 160, 280, 162) // Punkt
      ], 60),
      () => makeGlyph([
        line(282, 198, 282, 305),
        line(282, 158, 282, 160)
      ], 60),
      () => makeGlyph([
        line(278, 202, 278, 306),
        line(278, 162, 278, 164)
      ], 60)
    ]);

    // 'j'
    createVariations('j', [
      () => makeGlyph([
        line(280, 198, 280, 350),
        curve({x: 280, y: 350}, {x: 280, y: 387}, {x: 245, y: 387}),
        line(280, 160, 280, 162)
      ], 70)
    ]);

    // 'k'
    createVariations('k', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        line(305, 200, 258, 255),
        line(258, 255, 310, 306)
      ]),
      () => makeGlyph([
        line(252, 110, 252, 305),
        line(302, 195, 255, 250),
        line(255, 250, 308, 305)
      ])
    ]);

    // 'l'
    createVariations('l', [
      () => makeGlyph([
        line(280, 115, 280, 304),
        curve({x: 280, y: 304}, {x: 285, y: 306}, {x: 295, y: 302})
      ], 60),
      () => makeGlyph([
        line(278, 110, 278, 305),
        curve({x: 278, y: 305}, {x: 282, y: 306}, {x: 292, y: 300})
      ], 60)
    ]);

    // 'm'
    createVariations('m', [
      () => makeGlyph([
        line(240, 200, 240, 306),
        curve({x: 240, y: 230}, {x: 265, y: 195}, {x: 280, y: 230}),
        line(280, 230, 280, 306),
        curve({x: 280, y: 230}, {x: 305, y: 195}, {x: 320, y: 230}),
        line(320, 230, 320, 306)
      ], 130),
      () => makeGlyph([
        line(238, 198, 238, 305),
        curve({x: 238, y: 228}, {x: 262, y: 192}, {x: 278, y: 228}),
        line(278, 228, 278, 305),
        curve({x: 278, y: 228}, {x: 302, y: 192}, {x: 318, y: 228}),
        line(318, 228, 318, 305)
      ], 130),
      () => makeGlyph([
        line(242, 202, 242, 306),
        curve({x: 242, y: 232}, {x: 268, y: 198}, {x: 282, y: 232}),
        line(282, 232, 282, 306),
        curve({x: 282, y: 232}, {x: 308, y: 198}, {x: 322, y: 232}),
        line(322, 232, 322, 306)
      ], 130)
    ]);

    // 'n'
    createVariations('n', [
      () => makeGlyph([
        line(255, 200, 255, 306),
        curve({x: 255, y: 230}, {x: 285, y: 195}, {x: 308, y: 230}),
        line(308, 230, 308, 306)
      ]),
      () => makeGlyph([
        line(252, 198, 252, 305),
        curve({x: 252, y: 228}, {x: 282, y: 192}, {x: 305, y: 228}),
        line(305, 228, 305, 305)
      ]),
      () => makeGlyph([
        line(258, 202, 258, 306),
        curve({x: 258, y: 232}, {x: 288, y: 198}, {x: 310, y: 232}),
        line(310, 232, 310, 306)
      ])
    ]);

    // 'o'
    createVariations('o', [
      () => makeGlyph([
        curve({x: 280, y: 192}, {x: 245, y: 192}, {x: 245, y: 250}),
        curve({x: 245, y: 250}, {x: 245, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 315, y: 306}, {x: 315, y: 250}),
        curve({x: 315, y: 250}, {x: 315, y: 192}, {x: 280, y: 192})
      ]),
      () => makeGlyph([
        curve({x: 278, y: 190}, {x: 242, y: 190}, {x: 242, y: 248}),
        curve({x: 242, y: 248}, {x: 242, y: 304}, {x: 278, y: 304}),
        curve({x: 278, y: 304}, {x: 318, y: 304}, {x: 318, y: 248}),
        curve({x: 318, y: 248}, {x: 318, y: 190}, {x: 278, y: 190})
      ]),
      () => makeGlyph([
        curve({x: 282, y: 195}, {x: 248, y: 195}, {x: 248, y: 252}),
        curve({x: 248, y: 252}, {x: 248, y: 306}, {x: 282, y: 306}),
        curve({x: 282, y: 306}, {x: 312, y: 306}, {x: 312, y: 252}),
        curve({x: 312, y: 252}, {x: 312, y: 195}, {x: 282, y: 195})
      ])
    ]);

    // 'p' (Unterlänge!)
    createVariations('p', [
      () => makeGlyph([
        line(255, 195, 255, 387),
        curve({x: 255, y: 220}, {x: 315, y: 195}, {x: 315, y: 255}),
        curve({x: 315, y: 255}, {x: 315, y: 306}, {x: 255, y: 306})
      ]),
      () => makeGlyph([
        line(252, 192, 252, 385),
        curve({x: 252, y: 218}, {x: 312, y: 192}, {x: 312, y: 252}),
        curve({x: 312, y: 252}, {x: 312, y: 304}, {x: 252, y: 304})
      ])
    ]);

    // 'q'
    createVariations('q', [
      () => makeGlyph([
        curve({x: 300, y: 225}, {x: 245, y: 195}, {x: 245, y: 260}),
        curve({x: 245, y: 260}, {x: 245, y: 306}, {x: 300, y: 306}),
        line(300, 195, 300, 387)
      ])
    ]);

    // 'r'
    createVariations('r', [
      () => makeGlyph([
        line(265, 200, 265, 306),
        curve({x: 265, y: 235}, {x: 290, y: 195}, {x: 315, y: 210})
      ], 80),
      () => makeGlyph([
        line(262, 198, 262, 305),
        curve({x: 262, y: 232}, {x: 288, y: 192}, {x: 312, y: 206})
      ], 80)
    ]);

    // 's'
    createVariations('s', [
      () => makeGlyph([
        curve({x: 305, y: 212}, {x: 255, y: 190}, {x: 260, y: 245}),
        curve({x: 260, y: 245}, {x: 308, y: 265}, {x: 290, y: 306}),
        curve({x: 290, y: 306}, {x: 250, y: 306}, {x: 245, y: 295})
      ]),
      () => makeGlyph([
        curve({x: 302, y: 208}, {x: 252, y: 188}, {x: 258, y: 242}),
        curve({x: 258, y: 242}, {x: 305, y: 262}, {x: 288, y: 304}),
        curve({x: 288, y: 304}, {x: 248, y: 304}, {x: 242, y: 292})
      ])
    ]);

    // 't'
    createVariations('t', [
      () => makeGlyph([
        line(275, 135, 275, 304),
        curve({x: 275, y: 304}, {x: 280, y: 306}, {x: 295, y: 300}),
        line(255, 205, 295, 205)
      ], 75),
      () => makeGlyph([
        line(272, 130, 272, 303),
        curve({x: 272, y: 303}, {x: 278, y: 305}, {x: 292, y: 298}),
        line(252, 200, 292, 200)
      ], 75)
    ]);

    // 'u'
    createVariations('u', [
      () => makeGlyph([
        line(255, 200, 255, 280),
        curve({x: 255, y: 280}, {x: 255, y: 306}, {x: 285, y: 306}),
        curve({x: 285, y: 306}, {x: 305, y: 306}, {x: 305, y: 280}),
        line(305, 280, 305, 200),
        line(305, 270, 305, 306)
      ]),
      () => makeGlyph([
        line(252, 198, 252, 278),
        curve({x: 252, y: 278}, {x: 252, y: 305}, {x: 282, y: 305}),
        curve({x: 282, y: 305}, {x: 302, y: 305}, {x: 302, y: 278}),
        line(302, 278, 302, 198),
        line(302, 268, 302, 305)
      ])
    ]);

    // 'v'
    createVariations('v', [
      () => makeGlyph([
        line(255, 200, 280, 306),
        line(280, 306, 305, 200)
      ]),
      () => makeGlyph([
        line(252, 198, 278, 305),
        line(278, 305, 302, 198)
      ])
    ]);

    // 'w'
    createVariations('w', [
      () => makeGlyph([
        line(240, 200, 260, 306),
        line(260, 306, 280, 230),
        line(280, 230, 300, 306),
        line(300, 306, 320, 200)
      ], 120),
      () => makeGlyph([
        line(238, 198, 258, 305),
        line(258, 305, 278, 228),
        line(278, 228, 298, 305),
        line(298, 305, 318, 198)
      ], 120)
    ]);

    // 'x'
    createVariations('x', [
      () => makeGlyph([
        line(255, 200, 305, 306),
        line(305, 200, 255, 306)
      ])
    ]);

    // 'y' (Unterlänge!)
    createVariations('y', [
      () => makeGlyph([
        line(255, 200, 280, 280),
        line(305, 200, 250, 387)
      ]),
      () => makeGlyph([
        line(252, 198, 278, 278),
        line(302, 198, 248, 385)
      ])
    ]);

    // 'z'
    createVariations('z', [
      () => makeGlyph([
        line(255, 200, 305, 200),
        line(305, 200, 255, 306),
        line(255, 306, 305, 306)
      ]),
      () => makeGlyph([
        line(252, 198, 302, 198),
        line(302, 198, 252, 305),
        line(252, 305, 302, 305)
      ])
    ]);

    // Deutsche Umlaute & ß
    createVariations('ä', [
      () => makeGlyph([
        curve({x: 310, y: 215}, {x: 245, y: 185}, {x: 245, y: 255}),
        curve({x: 245, y: 255}, {x: 245, y: 306}, {x: 305, y: 306}),
        line(305, 195, 305, 306),
        line(265, 155, 265, 157),
        line(290, 155, 290, 157)
      ])
    ]);

    createVariations('ö', [
      () => makeGlyph([
        curve({x: 280, y: 192}, {x: 245, y: 192}, {x: 245, y: 250}),
        curve({x: 245, y: 250}, {x: 245, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 315, y: 306}, {x: 315, y: 250}),
        curve({x: 315, y: 250}, {x: 315, y: 192}, {x: 280, y: 192}),
        line(265, 155, 265, 157),
        line(290, 155, 290, 157)
      ])
    ]);

    createVariations('ü', [
      () => makeGlyph([
        line(255, 200, 255, 280),
        curve({x: 255, y: 280}, {x: 255, y: 306}, {x: 285, y: 306}),
        curve({x: 285, y: 306}, {x: 305, y: 306}, {x: 305, y: 280}),
        line(305, 280, 305, 200),
        line(305, 270, 305, 306),
        line(265, 155, 265, 157),
        line(290, 155, 290, 157)
      ])
    ]);

    createVariations('ß', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        curve({x: 255, y: 115}, {x: 305, y: 115}, {x: 305, y: 175}),
        curve({x: 305, y: 175}, {x: 275, y: 210}, {x: 255, y: 210}),
        curve({x: 255, y: 210}, {x: 315, y: 225}, {x: 310, y: 285}),
        curve({x: 310, y: 285}, {x: 285, y: 306}, {x: 255, y: 306})
      ])
    ]);

    // === GROSSBUCHSTABEN (A-Z) ===
    createVariations('A', [
      () => makeGlyph([
        line(280, 115, 245, 306),
        line(280, 115, 315, 306),
        line(258, 235, 302, 235)
      ], 115),
      () => makeGlyph([
        line(278, 110, 242, 305),
        line(278, 110, 312, 305),
        line(255, 232, 298, 232)
      ], 115)
    ]);

    createVariations('B', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        curve({x: 255, y: 115}, {x: 310, y: 115}, {x: 310, y: 205}),
        line(310, 205, 255, 205),
        curve({x: 255, y: 205}, {x: 315, y: 205}, {x: 315, y: 306}),
        line(315, 306, 255, 306)
      ], 110)
    ]);

    createVariations('C', [
      () => makeGlyph([
        curve({x: 315, y: 135}, {x: 245, y: 115}, {x: 245, y: 210}),
        curve({x: 245, y: 210}, {x: 245, y: 306}, {x: 315, y: 295})
      ], 105)
    ]);

    createVariations('D', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        curve({x: 255, y: 115}, {x: 320, y: 115}, {x: 320, y: 210}),
        curve({x: 320, y: 210}, {x: 320, y: 306}, {x: 255, y: 306})
      ], 115)
    ]);

    createVariations('E', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        line(255, 115, 310, 115),
        line(255, 210, 300, 210),
        line(255, 306, 315, 306)
      ], 105)
    ]);

    createVariations('F', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        line(255, 115, 310, 115),
        line(255, 210, 298, 210)
      ], 100)
    ]);

    createVariations('G', [
      () => makeGlyph([
        curve({x: 315, y: 135}, {x: 245, y: 115}, {x: 245, y: 210}),
        curve({x: 245, y: 210}, {x: 245, y: 306}, {x: 315, y: 306}),
        line(315, 306, 315, 240),
        line(315, 240, 285, 240)
      ], 115)
    ]);

    createVariations('H', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        line(310, 115, 310, 306),
        line(255, 210, 310, 210)
      ], 110)
    ]);

    createVariations('I', [
      () => makeGlyph([
        line(280, 115, 280, 306)
      ], 60),
      () => makeGlyph([
        line(278, 110, 278, 305)
      ], 60)
    ]);

    createVariations('J', [
      () => makeGlyph([
        line(290, 115, 290, 280),
        curve({x: 290, y: 280}, {x: 290, y: 306}, {x: 260, y: 306}),
        curve({x: 260, y: 306}, {x: 245, y: 300}, {x: 245, y: 275})
      ], 80)
    ]);

    createVariations('K', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        line(310, 125, 258, 215),
        line(258, 215, 315, 306)
      ], 110)
    ]);

    createVariations('L', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        line(255, 306, 310, 306)
      ], 95)
    ]);

    createVariations('M', [
      () => makeGlyph([
        line(245, 306, 245, 115),
        line(245, 115, 280, 250),
        line(280, 250, 315, 115),
        line(315, 115, 315, 306)
      ], 130),
      () => makeGlyph([
        line(242, 305, 242, 110),
        line(242, 110, 278, 248),
        line(278, 248, 312, 110),
        line(312, 110, 312, 305)
      ], 130)
    ]);

    createVariations('N', [
      () => makeGlyph([
        line(255, 306, 255, 115),
        line(255, 115, 310, 306),
        line(310, 306, 310, 115)
      ], 115)
    ]);

    createVariations('O', [
      () => makeGlyph([
        curve({x: 280, y: 115}, {x: 245, y: 115}, {x: 245, y: 210}),
        curve({x: 245, y: 210}, {x: 245, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 315, y: 306}, {x: 315, y: 210}),
        curve({x: 315, y: 210}, {x: 315, y: 115}, {x: 280, y: 115})
      ], 115)
    ]);

    createVariations('P', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        curve({x: 255, y: 115}, {x: 315, y: 115}, {x: 315, y: 205}),
        line(315, 205, 255, 205)
      ], 105)
    ]);

    createVariations('Q', [
      () => makeGlyph([
        curve({x: 280, y: 115}, {x: 245, y: 115}, {x: 245, y: 210}),
        curve({x: 245, y: 210}, {x: 245, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 315, y: 306}, {x: 315, y: 210}),
        curve({x: 315, y: 210}, {x: 315, y: 115}, {x: 280, y: 115}),
        line(290, 275, 320, 320)
      ], 115)
    ]);

    createVariations('R', [
      () => makeGlyph([
        line(255, 115, 255, 306),
        curve({x: 255, y: 115}, {x: 315, y: 115}, {x: 315, y: 205}),
        line(315, 205, 255, 205),
        line(285, 205, 315, 306)
      ], 110)
    ]);

    createVariations('S', [
      () => makeGlyph([
        curve({x: 315, y: 140}, {x: 255, y: 115}, {x: 260, y: 195}),
        curve({x: 260, y: 195}, {x: 315, y: 220}, {x: 300, y: 306}),
        curve({x: 300, y: 306}, {x: 245, y: 306}, {x: 245, y: 280})
      ], 105)
    ]);

    createVariations('T', [
      () => makeGlyph([
        line(245, 115, 315, 115),
        line(280, 115, 280, 306)
      ], 100)
    ]);

    createVariations('U', [
      () => makeGlyph([
        line(255, 115, 255, 275),
        curve({x: 255, y: 275}, {x: 255, y: 306}, {x: 285, y: 306}),
        curve({x: 285, y: 306}, {x: 310, y: 306}, {x: 310, y: 275}),
        line(310, 275, 310, 115)
      ], 110)
    ]);

    createVariations('V', [
      () => makeGlyph([
        line(250, 115, 280, 306),
        line(280, 306, 310, 115)
      ], 100)
    ]);

    createVariations('W', [
      () => makeGlyph([
        line(240, 115, 260, 306),
        line(260, 306, 280, 175),
        line(280, 175, 300, 306),
        line(300, 306, 320, 115)
      ], 130)
    ]);

    createVariations('X', [
      () => makeGlyph([
        line(250, 115, 310, 306),
        line(310, 115, 250, 306)
      ], 100)
    ]);

    createVariations('Y', [
      () => makeGlyph([
        line(250, 115, 280, 215),
        line(310, 115, 280, 215),
        line(280, 215, 280, 306)
      ], 100)
    ]);

    createVariations('Z', [
      () => makeGlyph([
        line(250, 115, 310, 115),
        line(310, 115, 250, 306),
        line(250, 306, 310, 306)
      ], 100)
    ]);

    // Ziffern 0-9
    createVariations('0', [
      () => makeGlyph([
        curve({x: 280, y: 115}, {x: 250, y: 115}, {x: 250, y: 210}),
        curve({x: 250, y: 210}, {x: 250, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 310, y: 306}, {x: 310, y: 210}),
        curve({x: 310, y: 210}, {x: 310, y: 115}, {x: 280, y: 115})
      ], 100)
    ]);

    createVariations('1', [
      () => makeGlyph([
        line(265, 145, 280, 115),
        line(280, 115, 280, 306),
        line(260, 306, 300, 306)
      ], 80)
    ]);

    createVariations('2', [
      () => makeGlyph([
        curve({x: 255, y: 145}, {x: 280, y: 115}, {x: 305, y: 155}),
        line(305, 155, 255, 306),
        line(255, 306, 308, 306)
      ], 95)
    ]);

    createVariations('3', [
      () => makeGlyph([
        line(255, 115, 305, 115),
        curve({x: 305, y: 115}, {x: 280, y: 195}, {x: 265, y: 195}),
        curve({x: 265, y: 195}, {x: 315, y: 215}, {x: 295, y: 306}),
        curve({x: 295, y: 306}, {x: 250, y: 306}, {x: 245, y: 285})
      ], 95)
    ]);

    // Satzzeichen
    createVariations('.', [
      () => makeGlyph([
        line(280, 298, 280, 306)
      ], 50),
      () => makeGlyph([
        line(282, 297, 282, 305)
      ], 50)
    ]);

    createVariations(',', [
      () => makeGlyph([
        line(280, 295, 280, 305),
        curve({x: 280, y: 305}, {x: 278, y: 318}, {x: 272, y: 325})
      ], 50)
    ]);

    createVariations('!', [
      () => makeGlyph([
        line(280, 115, 280, 260),
        line(280, 298, 280, 306)
      ], 60)
    ]);

    createVariations('?', [
      () => makeGlyph([
        curve({x: 255, y: 140}, {x: 280, y: 115}, {x: 305, y: 150}),
        curve({x: 305, y: 150}, {x: 300, y: 200}, {x: 280, y: 220}),
        line(280, 220, 280, 255),
        line(280, 298, 280, 306)
      ], 85)
    ]);

    createVariations('-', [
      () => makeGlyph([
        line(260, 250, 300, 250)
      ], 70),
      () => makeGlyph([
        line(258, 248, 302, 252)
      ], 70)
    ]);

    return profile;
  }
}
