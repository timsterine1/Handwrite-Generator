/**
 * sample-font.js
 * Erzeugt das exakte Handschrift-Muster basierend auf den hochgeladenen
 * GoodNotes-Notizen (mit iPad / Apple Pencil Schreibstil).
 * Enthält für alle Buchstaben mehrere natürliche Variationen.
 */

class SampleFontGenerator {
  static createSampleProfile() {
    const profile = {
      format: 'handschrift-generator-v1',
      version: '1.0',
      meta: {
        name: 'GoodNotes Handschrift (Original)',
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

    // Hilfsfunktion zur Generierung von Strichpunkten
    function line(x1, y1, x2, y2, steps = 10, pVal = 0.52) {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        pts.push({
          x: Math.round((x1 + (x2 - x1) * t) * 10) / 10,
          y: Math.round((y1 + (y2 - y1) * t) * 10) / 10,
          p: pVal
        });
      }
      return pts;
    }

    function curve(p0, p1, p2, steps = 14, pVal = 0.52) {
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
      const advanceWidth = charAdvance || Math.round(charWidth + 22);

      // Mini-Thumbnail rendern (64x48)
      const tc = document.createElement('canvas');
      tc.width = 64; tc.height = 48;
      const tctx = tc.getContext('2d');
      tctx.strokeStyle = '#22c55e'; // GoodNotes Neon-Grün als Vorschaufarbe
      tctx.lineWidth = 2.4;
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
        baseStrokeWidth: 4.8,
        thumbnail: tc.toDataURL('image/png')
      };
    }

    function createVariations(char, generatorFns) {
      const vars = new Array(10).fill(null);
      generatorFns.forEach((fn, idx) => {
        if (idx < 10) {
          vars[idx] = fn();
        }
      });
      profile.glyphs[char] = vars;
    }

    // =========================================================================
    // KLEINBUCHSTABEN (Exakt wie in den hochgeladenen Bildern)
    // =========================================================================

    // 'a' (Einstöckiges, rundes Handschrift-a mit rechtem Abstrich)
    createVariations('a', [
      // Var 0: Wie in "hat" - sauberer Kreis mit geradem Abstrich
      () => makeGlyph([
        curve({x: 296, y: 222}, {x: 246, y: 198}, {x: 242, y: 252}),
        curve({x: 242, y: 252}, {x: 246, y: 306}, {x: 296, y: 306}),
        line(296, 202, 296, 306),
        line(296, 306, 304, 304)
      ]),
      // Var 1: Wie in "das" - etwas breiterer Bauch
      () => makeGlyph([
        curve({x: 300, y: 220}, {x: 242, y: 196}, {x: 238, y: 250}),
        curve({x: 238, y: 250}, {x: 242, y: 305}, {x: 300, y: 305}),
        line(300, 198, 300, 305),
        curve({x: 300, y: 305}, {x: 306, y: 305}, {x: 314, y: 298})
      ]),
      // Var 2: Wie in "Variationen" - kompakter
      () => makeGlyph([
        curve({x: 294, y: 224}, {x: 250, y: 200}, {x: 246, y: 254}),
        curve({x: 246, y: 254}, {x: 250, y: 306}, {x: 294, y: 306}),
        line(294, 204, 294, 306)
      ]),
      // Var 3: Wie in "manche" - leicht offener Schwung oben
      () => makeGlyph([
        curve({x: 298, y: 218}, {x: 244, y: 195}, {x: 240, y: 248}),
        curve({x: 240, y: 248}, {x: 244, y: 304}, {x: 298, y: 304}),
        line(298, 196, 298, 304),
        line(298, 304, 306, 302)
      ])
    ]);

    // 'b' (Wie in "haben", "überleben", "bestimmte")
    createVariations('b', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        curve({x: 254, y: 228}, {x: 308, y: 200}, {x: 312, y: 255}),
        curve({x: 312, y: 255}, {x: 308, y: 306}, {x: 254, y: 306})
      ]),
      () => makeGlyph([
        line(252, 115, 252, 305),
        curve({x: 252, y: 225}, {x: 312, y: 198}, {x: 315, y: 252}),
        curve({x: 315, y: 252}, {x: 310, y: 305}, {x: 252, y: 305})
      ])
    ]);

    // 'c' (Offenes c wie in "unterschiedliche")
    createVariations('c', [
      () => makeGlyph([
        curve({x: 304, y: 216}, {x: 254, y: 198}, {x: 246, y: 252}),
        curve({x: 246, y: 252}, {x: 254, y: 306}, {x: 306, y: 300})
      ]),
      () => makeGlyph([
        curve({x: 308, y: 212}, {x: 250, y: 195}, {x: 242, y: 248}),
        curve({x: 242, y: 248}, {x: 250, y: 304}, {x: 308, y: 296})
      ])
    ]);

    // 'd' (Wie in "die", "jede", "und", "ständige" - runder Bauch links, gerader hoher Schaft rechts)
    createVariations('d', [
      // Var 0: Wie in "die"
      () => makeGlyph([
        curve({x: 296, y: 232}, {x: 246, y: 202}, {x: 242, y: 256}),
        curve({x: 242, y: 256}, {x: 246, y: 306}, {x: 296, y: 306}),
        line(296, 118, 296, 306),
        line(296, 306, 304, 302)
      ]),
      // Var 1: Wie in "das"
      () => makeGlyph([
        curve({x: 294, y: 230}, {x: 242, y: 200}, {x: 238, y: 254}),
        curve({x: 238, y: 254}, {x: 242, y: 305}, {x: 294, y: 305}),
        line(294, 115, 294, 305)
      ]),
      // Var 2: Wie in "wobei"
      () => makeGlyph([
        curve({x: 298, y: 234}, {x: 248, y: 204}, {x: 244, y: 258}),
        curve({x: 244, y: 258}, {x: 248, y: 306}, {x: 298, y: 306}),
        line(298, 120, 298, 306),
        curve({x: 298, y: 306}, {x: 304, y: 306}, {x: 312, y: 296})
      ])
    ]);

    // 'e' (Wie in "theorie", "jede", "Generation" - waagerechter Strich mit rundem Bogen)
    createVariations('e', [
      // Var 0: Wie in "theorie"
      () => makeGlyph([
        line(248, 256, 298, 252),
        curve({x: 298, y: 252}, {x: 294, y: 198}, {x: 265, y: 198}),
        curve({x: 265, y: 198}, {x: 242, y: 235}, {x: 242, y: 265}),
        curve({x: 242, y: 265}, {x: 248, y: 306}, {x: 300, y: 302})
      ]),
      // Var 1: Wie in "jede"
      () => makeGlyph([
        line(246, 252, 304, 248),
        curve({x: 304, y: 248}, {x: 298, y: 195}, {x: 262, y: 195}),
        curve({x: 262, y: 195}, {x: 240, y: 230}, {x: 240, y: 262}),
        curve({x: 240, y: 262}, {x: 246, y: 305}, {x: 304, y: 298})
      ]),
      // Var 2: Wie in "Generation"
      () => makeGlyph([
        line(250, 258, 296, 254),
        curve({x: 296, y: 254}, {x: 292, y: 200}, {x: 268, y: 200}),
        curve({x: 268, y: 200}, {x: 244, y: 238}, {x: 244, y: 268}),
        curve({x: 244, y: 268}, {x: 250, y: 306}, {x: 298, y: 304})
      ])
    ]);

    // 'f' (Wie in "für", "Auf", "trifft")
    createVariations('f', [
      () => makeGlyph([
        curve({x: 292, y: 122}, {x: 275, y: 115}, {x: 266, y: 138}),
        line(266, 138, 266, 306),
        line(248, 212, 288, 212)
      ]),
      () => makeGlyph([
        curve({x: 295, y: 118}, {x: 278, y: 112}, {x: 268, y: 134}),
        line(268, 134, 268, 305),
        line(250, 208, 290, 208)
      ])
    ]);

    // 'g' (Wie in "Generation", "Gegenüber", "grundlegene", "Säugetier" - runder Bauch und Unterlänge nach links)
    createVariations('g', [
      () => makeGlyph([
        curve({x: 296, y: 224}, {x: 246, y: 198}, {x: 242, y: 254}),
        curve({x: 242, y: 254}, {x: 246, y: 306}, {x: 296, y: 306}),
        line(296, 202, 296, 355),
        curve({x: 296, y: 355}, {x: 294, y: 387}, {x: 255, y: 387}),
        curve({x: 255, y: 387}, {x: 235, y: 380}, {x: 232, y: 358})
      ]),
      () => makeGlyph([
        curve({x: 294, y: 220}, {x: 242, y: 195}, {x: 238, y: 250}),
        curve({x: 238, y: 250}, {x: 242, y: 305}, {x: 294, y: 305}),
        line(294, 198, 294, 350),
        curve({x: 294, y: 350}, {x: 290, y: 385}, {x: 250, y: 385}),
        curve({x: 250, y: 385}, {x: 232, y: 375}, {x: 230, y: 352})
      ])
    ]);

    // 'h' (Wie in "hat", "haben", "theorie")
    createVariations('h', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        curve({x: 254, y: 242}, {x: 284, y: 200}, {x: 306, y: 238}),
        line(306, 238, 306, 306)
      ]),
      () => makeGlyph([
        line(252, 115, 252, 305),
        curve({x: 252, y: 238}, {x: 282, y: 196}, {x: 304, y: 234}),
        line(304, 234, 304, 305)
      ])
    ]);

    // 'i' (Wie in "die", "ist", "Tierart" - gerader Abstrich mit klarem Punkt)
    createVariations('i', [
      () => makeGlyph([
        line(278, 204, 278, 306),
        line(278, 162, 278, 166)
      ], 56),
      () => makeGlyph([
        line(280, 202, 280, 305),
        line(280, 160, 280, 164)
      ], 56),
      () => makeGlyph([
        line(276, 206, 276, 306),
        line(276, 164, 276, 168)
      ], 56)
    ]);

    // 'j' (Wie in "jeder")
    createVariations('j', [
      () => makeGlyph([
        line(280, 202, 280, 355),
        curve({x: 280, y: 355}, {x: 280, y: 387}, {x: 248, y: 387}),
        line(280, 162, 280, 166)
      ], 65)
    ]);

    // 'k' (Wie in "kleiner", "Strucktur")
    createVariations('k', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        line(302, 212, 258, 260),
        line(258, 260, 306, 306)
      ]),
      () => makeGlyph([
        line(252, 115, 252, 305),
        line(300, 208, 256, 256),
        line(256, 256, 304, 305)
      ])
    ]);

    // 'l' (Wie in "alle", "bleit", "ebenfalls")
    createVariations('l', [
      () => makeGlyph([
        line(278, 118, 278, 304),
        line(278, 304, 286, 302)
      ], 56),
      () => makeGlyph([
        line(276, 115, 276, 305)
      ], 56)
    ]);

    // 'm' (Wie in "manche", "Mensch", "abstammen")
    createVariations('m', [
      () => makeGlyph([
        line(238, 204, 238, 306),
        curve({x: 238, y: 236}, {x: 264, y: 200}, {x: 278, y: 236}),
        line(278, 236, 278, 306),
        curve({x: 278, y: 236}, {x: 304, y: 200}, {x: 318, y: 236}),
        line(318, 236, 318, 306)
      ], 126),
      () => makeGlyph([
        line(236, 202, 236, 305),
        curve({x: 236, y: 234}, {x: 262, y: 196}, {x: 276, y: 234}),
        line(276, 234, 276, 305),
        curve({x: 276, y: 234}, {x: 302, y: 196}, {x: 316, y: 234}),
        line(316, 234, 316, 305)
      ], 126)
    ]);

    // 'n' (Wie in "an", "Generation", "anpassen")
    createVariations('n', [
      () => makeGlyph([
        line(252, 204, 252, 306),
        curve({x: 252, y: 236}, {x: 280, y: 200}, {x: 304, y: 236}),
        line(304, 236, 304, 306)
      ]),
      () => makeGlyph([
        line(250, 202, 250, 305),
        curve({x: 250, y: 234}, {x: 278, y: 198}, {x: 302, y: 234}),
        line(302, 234, 302, 305)
      ])
    ]);

    // 'o' (Runder Kreis wie in "von", "Generation", "Embryo")
    createVariations('o', [
      () => makeGlyph([
        curve({x: 280, y: 196}, {x: 245, y: 196}, {x: 245, y: 252}),
        curve({x: 245, y: 252}, {x: 245, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 315, y: 306}, {x: 315, y: 252}),
        curve({x: 315, y: 252}, {x: 315, y: 196}, {x: 280, y: 196})
      ]),
      () => makeGlyph([
        curve({x: 278, y: 194}, {x: 242, y: 194}, {x: 242, y: 250}),
        curve({x: 242, y: 250}, {x: 242, y: 304}, {x: 278, y: 304}),
        curve({x: 278, y: 304}, {x: 316, y: 304}, {x: 316, y: 250}),
        curve({x: 316, y: 250}, {x: 316, y: 194}, {x: 278, y: 194})
      ])
    ]);

    // 'p' (Wie in "anpassen")
    createVariations('p', [
      () => makeGlyph([
        line(254, 202, 254, 384),
        curve({x: 254, y: 226}, {x: 310, y: 200}, {x: 312, y: 255}),
        curve({x: 312, y: 255}, {x: 308, y: 306}, {x: 254, y: 306})
      ]),
      () => makeGlyph([
        line(252, 200, 252, 382),
        curve({x: 252, y: 224}, {x: 308, y: 198}, {x: 310, y: 252}),
        curve({x: 310, y: 252}, {x: 306, y: 304}, {x: 252, y: 304})
      ])
    ]);

    // 'q'
    createVariations('q', [
      () => makeGlyph([
        curve({x: 296, y: 228}, {x: 246, y: 200}, {x: 242, y: 256}),
        curve({x: 242, y: 256}, {x: 246, y: 306}, {x: 296, y: 306}),
        line(296, 202, 296, 384)
      ])
    ]);

    // 'r' (Wie in "Darvin", "Tierart", "überleben", "Variationen" - kurzer Stamm mit kleinem Ast nach rechts)
    createVariations('r', [
      () => makeGlyph([
        line(262, 204, 262, 306),
        curve({x: 262, y: 238}, {x: 286, y: 198}, {x: 308, y: 212})
      ], 76),
      () => makeGlyph([
        line(260, 202, 260, 305),
        curve({x: 260, y: 235}, {x: 284, y: 196}, {x: 306, y: 208})
      ], 76)
    ]);

    // 's' (Wie in "das", "Diese", "ist", "sein", "müssen", "Menschen" - gedrucktes, flüssiges s)
    createVariations('s', [
      // Var 0: Wie in "das"
      () => makeGlyph([
        curve({x: 300, y: 218}, {x: 256, y: 196}, {x: 258, y: 244}),
        curve({x: 258, y: 244}, {x: 302, y: 264}, {x: 288, y: 306}),
        curve({x: 288, y: 306}, {x: 248, y: 306}, {x: 244, y: 296})
      ]),
      // Var 1: Wie in "ist"
      () => makeGlyph([
        curve({x: 298, y: 215}, {x: 254, y: 194}, {x: 256, y: 242}),
        curve({x: 256, y: 242}, {x: 300, y: 262}, {x: 286, y: 304}),
        curve({x: 286, y: 304}, {x: 246, y: 304}, {x: 242, y: 292})
      ]),
      // Var 2: Wie in "müssen"
      () => makeGlyph([
        curve({x: 302, y: 220}, {x: 258, y: 198}, {x: 260, y: 246}),
        curve({x: 260, y: 246}, {x: 304, y: 266}, {x: 290, y: 306}),
        curve({x: 290, y: 306}, {x: 250, y: 306}, {x: 246, y: 298})
      ])
    ]);

    // 't' (Wie in "hat", "theorie", "Tierart", "bestimmte" - Schaft mit Querstrich)
    createVariations('t', [
      () => makeGlyph([
        line(274, 142, 274, 303),
        curve({x: 274, y: 303}, {x: 278, y: 306}, {x: 292, y: 300}),
        line(254, 206, 296, 206)
      ], 74),
      () => makeGlyph([
        line(272, 138, 272, 302),
        curve({x: 272, y: 302}, {x: 276, y: 305}, {x: 290, y: 298}),
        line(252, 202, 294, 202)
      ], 74)
    ]);

    // 'u' (Wie in "und", "zu", "unterschiedliche")
    createVariations('u', [
      () => makeGlyph([
        line(254, 204, 254, 282),
        curve({x: 254, y: 282}, {x: 254, y: 306}, {x: 282, y: 306}),
        curve({x: 282, y: 306}, {x: 302, y: 306}, {x: 302, y: 282}),
        line(302, 282, 302, 204),
        line(302, 268, 302, 306)
      ]),
      () => makeGlyph([
        line(252, 202, 252, 280),
        curve({x: 252, y: 280}, {x: 252, y: 305}, {x: 280, y: 305}),
        curve({x: 280, y: 305}, {x: 300, y: 305}, {x: 300, y: 280}),
        line(300, 280, 300, 202),
        line(300, 266, 300, 305)
      ])
    ]);

    // 'v' (Wie in "Darvin", "von")
    createVariations('v', [
      () => makeGlyph([
        line(254, 204, 278, 306),
        line(278, 306, 304, 204)
      ]),
      () => makeGlyph([
        line(252, 202, 276, 305),
        line(276, 305, 302, 202)
      ])
    ]);

    // 'w' (Wie in "wobei")
    createVariations('w', [
      () => makeGlyph([
        line(240, 204, 258, 306),
        line(258, 306, 278, 234),
        line(278, 234, 298, 306),
        line(298, 306, 318, 204)
      ], 118)
    ]);

    // 'x'
    createVariations('x', [
      () => makeGlyph([
        line(254, 204, 304, 306),
        line(304, 204, 254, 306)
      ])
    ]);

    // 'y' (Wie in "Embryo" - Unterlänge nach links)
    createVariations('y', [
      () => makeGlyph([
        line(254, 204, 278, 276),
        line(304, 204, 252, 384)
      ])
    ]);

    // 'z' (Wie in "zu", "Generation")
    createVariations('z', [
      () => makeGlyph([
        line(254, 204, 302, 204),
        line(302, 204, 254, 306),
        line(254, 306, 304, 306)
      ])
    ]);

    // Deutsche Umlaute & ß
    // 'ä' (Wie in "ändern", "ständige", "Säugetier")
    createVariations('ä', [
      () => makeGlyph([
        curve({x: 296, y: 222}, {x: 246, y: 198}, {x: 242, y: 252}),
        curve({x: 242, y: 252}, {x: 246, y: 306}, {x: 296, y: 306}),
        line(296, 202, 296, 306),
        line(264, 160, 264, 164),
        line(288, 160, 288, 164)
      ])
    ]);

    // 'ö' (Wie in "größer")
    createVariations('ö', [
      () => makeGlyph([
        curve({x: 280, y: 196}, {x: 245, y: 196}, {x: 245, y: 252}),
        curve({x: 245, y: 252}, {x: 245, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 315, y: 306}, {x: 315, y: 252}),
        curve({x: 315, y: 252}, {x: 315, y: 196}, {x: 280, y: 196}),
        line(264, 160, 264, 164),
        line(288, 160, 288, 164)
      ])
    ]);

    // 'ü' (Wie in "überleben", "für", "Gegenüber", "müssen")
    createVariations('ü', [
      () => makeGlyph([
        line(254, 204, 254, 282),
        curve({x: 254, y: 282}, {x: 254, y: 306}, {x: 282, y: 306}),
        curve({x: 282, y: 306}, {x: 302, y: 306}, {x: 302, y: 282}),
        line(302, 282, 302, 204),
        line(302, 268, 302, 306),
        line(266, 160, 266, 164),
        line(290, 160, 290, 164)
      ])
    ]);

    // 'ß' (Wie in "größer")
    createVariations('ß', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        curve({x: 254, y: 118}, {x: 300, y: 118}, {x: 300, y: 178}),
        curve({x: 300, y: 178}, {x: 272, y: 215}, {x: 254, y: 215}),
        curve({x: 254, y: 215}, {x: 312, y: 230}, {x: 306, y: 288}),
        curve({x: 306, y: 288}, {x: 280, y: 306}, {x: 254, y: 306})
      ])
    ]);

    // =========================================================================
    // GROSSBUCHSTABEN (Exakt wie in den hochgeladenen Bildern)
    // =========================================================================

    // 'D' (Wie in "Darvin", "Daraus" - breiter Schwung)
    createVariations('D', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        curve({x: 254, y: 118}, {x: 324, y: 145}, {x: 326, y: 212}),
        curve({x: 326, y: 212}, {x: 324, y: 306}, {x: 254, y: 306})
      ], 116),
      () => makeGlyph([
        line(252, 115, 252, 305),
        curve({x: 252, y: 115}, {x: 320, y: 142}, {x: 322, y: 210}),
        curve({x: 322, y: 210}, {x: 320, y: 305}, {x: 252, y: 305})
      ], 116)
    ]);

    // 'T' (Wie in "Tierart", "Tier" - klarer Balken oben, senkrechter Strich zentriert)
    createVariations('T', [
      () => makeGlyph([
        line(242, 118, 318, 118),
        line(280, 118, 280, 306)
      ], 102),
      () => makeGlyph([
        line(240, 115, 316, 115),
        line(278, 115, 278, 305)
      ], 102)
    ]);

    // 'V' (Wie in "Variationen", "Vermutung")
    createVariations('V', [
      () => makeGlyph([
        line(250, 118, 280, 306),
        line(280, 306, 312, 118)
      ], 104),
      () => makeGlyph([
        line(248, 115, 278, 305),
        line(278, 305, 310, 115)
      ], 104)
    ]);

    // 'G' (Wie in "Generation", "Gegenüber")
    createVariations('G', [
      () => makeGlyph([
        curve({x: 314, y: 138}, {x: 248, y: 118}, {x: 246, y: 212}),
        curve({x: 246, y: 212}, {x: 248, y: 306}, {x: 314, y: 306}),
        line(314, 306, 314, 242),
        line(314, 242, 286, 242)
      ], 116)
    ]);

    // 'M' (Wie in "Menschen", "Mensch")
    createVariations('M', [
      () => makeGlyph([
        line(246, 306, 246, 118),
        line(246, 118, 280, 242),
        line(280, 242, 314, 118),
        line(314, 118, 314, 306)
      ], 128),
      () => makeGlyph([
        line(244, 305, 244, 115),
        line(244, 115, 278, 240),
        line(278, 240, 312, 115),
        line(312, 115, 312, 305)
      ], 128)
    ]);

    // 'A' (Wie in "Auf")
    createVariations('A', [
      () => makeGlyph([
        line(280, 118, 246, 306),
        line(280, 118, 314, 306),
        line(258, 236, 302, 236)
      ], 114)
    ]);

    // 'J' (Wie in "Jeder")
    createVariations('J', [
      () => makeGlyph([
        line(292, 118, 292, 280),
        curve({x: 292, y: 280}, {x: 292, y: 306}, {x: 262, y: 306}),
        curve({x: 262, y: 306}, {x: 246, y: 298}, {x: 246, y: 275})
      ], 84)
    ]);

    // 'S' (Wie in "Sind", "Strucktur", "Säugetier")
    createVariations('S', [
      () => makeGlyph([
        curve({x: 312, y: 140}, {x: 256, y: 118}, {x: 260, y: 198}),
        curve({x: 260, y: 198}, {x: 312, y: 222}, {x: 298, y: 306}),
        curve({x: 298, y: 306}, {x: 246, y: 306}, {x: 244, y: 282})
      ], 106)
    ]);

    // 'U' (Wie in "Urzeugers")
    createVariations('U', [
      () => makeGlyph([
        line(254, 118, 254, 276),
        curve({x: 254, y: 276}, {x: 254, y: 306}, {x: 284, y: 306}),
        curve({x: 284, y: 306}, {x: 310, y: 306}, {x: 310, y: 276}),
        line(310, 276, 310, 118)
      ], 110)
    ]);

    // 'E' (Wie in "Embryo")
    createVariations('E', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        line(254, 118, 308, 118),
        line(254, 212, 298, 212),
        line(254, 306, 312, 306)
      ], 104)
    ]);

    // 'C' (Wie in "Chancen")
    createVariations('C', [
      () => makeGlyph([
        curve({x: 312, y: 136}, {x: 246, y: 118}, {x: 246, y: 212}),
        curve({x: 246, y: 212}, {x: 246, y: 306}, {x: 314, y: 295})
      ], 104)
    ]);

    // 'B'
    createVariations('B', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        curve({x: 254, y: 118}, {x: 308, y: 118}, {x: 308, y: 206}),
        line(308, 206, 254, 206),
        curve({x: 254, y: 206}, {x: 314, y: 206}, {x: 314, y: 306}),
        line(314, 306, 254, 306)
      ], 110)
    ]);

    // 'F'
    createVariations('F', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        line(254, 118, 308, 118),
        line(254, 212, 296, 212)
      ], 98)
    ]);

    // 'H'
    createVariations('H', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        line(308, 118, 308, 306),
        line(254, 212, 308, 212)
      ], 110)
    ]);

    // 'I'
    createVariations('I', [
      () => makeGlyph([
        line(278, 118, 278, 306)
      ], 58)
    ]);

    // 'K'
    createVariations('K', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        line(308, 128, 258, 218),
        line(258, 218, 312, 306)
      ], 110)
    ]);

    // 'L'
    createVariations('L', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        line(254, 306, 308, 306)
      ], 95)
    ]);

    // 'N'
    createVariations('N', [
      () => makeGlyph([
        line(254, 306, 254, 118),
        line(254, 118, 308, 306),
        line(308, 306, 308, 118)
      ], 114)
    ]);

    // 'O'
    createVariations('O', [
      () => makeGlyph([
        curve({x: 280, y: 118}, {x: 245, y: 118}, {x: 245, y: 212}),
        curve({x: 245, y: 212}, {x: 245, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 315, y: 306}, {x: 315, y: 212}),
        curve({x: 315, y: 212}, {x: 315, y: 118}, {x: 280, y: 118})
      ], 115)
    ]);

    // 'P'
    createVariations('P', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        curve({x: 254, y: 118}, {x: 312, y: 118}, {x: 312, y: 206}),
        line(312, 206, 254, 206)
      ], 104)
    ]);

    // 'Q'
    createVariations('Q', [
      () => makeGlyph([
        curve({x: 280, y: 118}, {x: 245, y: 118}, {x: 245, y: 212}),
        curve({x: 245, y: 212}, {x: 245, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 315, y: 306}, {x: 315, y: 212}),
        curve({x: 315, y: 212}, {x: 315, y: 118}, {x: 280, y: 118}),
        line(290, 276, 318, 320)
      ], 115)
    ]);

    // 'R'
    createVariations('R', [
      () => makeGlyph([
        line(254, 118, 254, 306),
        curve({x: 254, y: 118}, {x: 312, y: 118}, {x: 312, y: 206}),
        line(312, 206, 254, 206),
        line(284, 206, 314, 306)
      ], 110)
    ]);

    // 'W'
    createVariations('W', [
      () => makeGlyph([
        line(240, 118, 260, 306),
        line(260, 306, 280, 176),
        line(280, 176, 300, 306),
        line(300, 306, 320, 118)
      ], 128)
    ]);

    // 'X'
    createVariations('X', [
      () => makeGlyph([
        line(250, 118, 310, 306),
        line(310, 118, 250, 306)
      ], 100)
    ]);

    // 'Y'
    createVariations('Y', [
      () => makeGlyph([
        line(250, 118, 280, 216),
        line(310, 118, 280, 216),
        line(280, 216, 280, 306)
      ], 100)
    ]);

    // 'Z'
    createVariations('Z', [
      () => makeGlyph([
        line(250, 118, 310, 118),
        line(310, 118, 250, 306),
        line(250, 306, 310, 306)
      ], 100)
    ]);

    // =========================================================================
    // ZIFFERN 0-9 & SATZZEICHEN
    // =========================================================================

    // '3' (Wie in "3)" im Bild)
    createVariations('3', [
      () => makeGlyph([
        line(254, 118, 304, 118),
        curve({x: 304, y: 118}, {x: 278, y: 196}, {x: 264, y: 196}),
        curve({x: 264, y: 196}, {x: 312, y: 216}, {x: 294, y: 306}),
        curve({x: 294, y: 306}, {x: 250, y: 306}, {x: 244, y: 286})
      ], 94)
    ]);

    // ')' (Wie in "3)" und "(Embryo)")
    createVariations(')', [
      () => makeGlyph([
        curve({x: 264, y: 118}, {x: 296, y: 212}, {x: 264, y: 306})
      ], 56)
    ]);

    // '(' (Wie in "(das Embryo)")
    createVariations('(', [
      () => makeGlyph([
        curve({x: 296, y: 118}, {x: 264, y: 212}, {x: 296, y: 306})
      ], 56)
    ]);

    // '.' (Punkt)
    createVariations('.', [
      () => makeGlyph([
        line(278, 298, 278, 306)
      ], 46),
      () => makeGlyph([
        line(280, 297, 280, 305)
      ], 46)
    ]);

    // ',' (Komma)
    createVariations(',', [
      () => makeGlyph([
        line(278, 296, 278, 306),
        curve({x: 278, y: 306}, {x: 276, y: 318}, {x: 270, y: 326})
      ], 48)
    ]);

    // '-' (Bindestrich)
    createVariations('-', [
      () => makeGlyph([
        line(258, 252, 298, 252)
      ], 65)
    ]);

    // '1'
    createVariations('1', [
      () => makeGlyph([
        line(265, 146, 278, 118),
        line(278, 118, 278, 306),
        line(258, 306, 298, 306)
      ], 80)
    ]);

    // '2'
    createVariations('2', [
      () => makeGlyph([
        curve({x: 254, y: 146}, {x: 278, y: 118}, {x: 304, y: 156}),
        line(304, 156, 254, 306),
        line(254, 306, 306, 306)
      ], 94)
    ]);

    // '0'
    createVariations('0', [
      () => makeGlyph([
        curve({x: 280, y: 118}, {x: 250, y: 118}, {x: 250, y: 212}),
        curve({x: 250, y: 212}, {x: 250, y: 306}, {x: 280, y: 306}),
        curve({x: 280, y: 306}, {x: 310, y: 306}, {x: 310, y: 212}),
        curve({x: 310, y: 212}, {x: 310, y: 118}, {x: 280, y: 118})
      ], 98)
    ]);

    return profile;
  }
}
