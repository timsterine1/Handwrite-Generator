# ✍️ Handschrift-Generator Studio

Eine vollständige Webanwendung, um deine persönliche Handschrift mit **bis zu 10 Variationen pro Buchstabe** digital zu erfassen und beliebige Texte automatisch in täuschend echte Handschrift umzuwandeln.

---

## 🚀 Schnellstart

Du hast zwei einfache Möglichkeiten, die Anwendung zu starten:

### Möglichkeit 1: Mit lokalem Python-Server (empfohlen)
Öffne ein Terminal im Projektordner und führe folgenden Befehl aus:
```bash
python serve.py
```
*Die Anwendung startet sofort und öffnet sich automatisch in deinem Standardbrowser unter `http://localhost:8080`.*

### Möglichkeit 2: Direkt im Browser
Doppelklicke einfach auf die Datei `index.html`, um sie direkt im Browser (Edge, Chrome, Firefox, Safari) zu öffnen.

---

## ✨ Funktionen & Highlights

### 1. Handschrift erfassen (Template Studio)
- **Bis zu 10 Variationen pro Buchstabe**:
  - Zeichne z. B. 10 verschiedene „a“s, damit dein geschriebener Text lebendig und abwechslungsreich wirkt.
  - Slot-Übersicht mit Mini-Vorschau für jede Variation.
- **Natürliches Zeichenpad**:
  - Unterstützt Touchscreen, Maus, Stylus & Apple Pencil mit Drucksensitivität.
  - Automatische Bézier-Glättung für organische, saubere Striche ohne eckige Kanten.
  - Hilfslinien: Oberlänge, Großbuchstaben, Mittellinie (x-Höhe), Grundlinie (Baseline) und Unterlänge.
  - Deaktivierbarer Hilfs-Wasserzeichen-Buchstabe im Hintergrund.
- **Workflow & Shortcuts**:
  - `Leertaste` oder `Enter`: Speichert die aktuelle Variation und springt automatisch zum nächsten Slot (`Auto-Weiter`).
  - `Pfeiltasten links/rechts`: Zum vorherigen/nächsten Buchstaben wechseln.
  - `Strg + Z`: Letzten Strich rückgängig machen.
  - `Entf` oder `Backspace`: Zeichenfläche leeren.

### 2. Text umwandeln (Generator Studio)
- **Mehrfach-Variations-Engine**:
  - Bei der Texterzeugung wählt das System bei jedem Buchstaben zufällig eine der gezeichneten Variationen aus.
  - Verhindert das direkte Wiederholen gleicher Variationen bei aufeinanderfolgenden Buchstaben (z. B. bei „Banane“ oder „Mama“).
- **Natürliche Schreib-Effekte**:
  - Einstellbare Linien-Abweichung (Jitter): Leichtes Tanzen auf der Grundlinie.
  - Neigungs-Variation: Zufällige Neigungswinkel wie bei menschlicher Handschrift.
- **Stifte & Tinten**:
  - Füllfederhalter (Königsblau), Kugelschreiber (Dunkelblau), Tintenschwarz, Bleistift (Grau), Roter Korrekturstift oder freie Farbwahl.
  - Schieberegler für Strichstärke, Schriftgröße, Zeilenabstand, Buchstabenabstand und Wortabstand.
- **Realistische Papiermuster**:
  - Liniert (Schulheft-Stil mit roter Randlinie und Lochung)
  - Kariert (5mm Mathe-Raster)
  - Blanko (Weißes Dokument)
  - Pergament (Warmes Vintage-Papier mit Vignette)
  - Collegeblock (Gelbes Notizpapier)
- **Export & Druck**:
  - **Als Bild herunterladen (PNG)** in gestochen scharfer DIN-A4-Auflösung.
  - **Drucken / Als PDF speichern** mit sauber formatiertem DIN-A4-Drucklayout.

### 3. Profile & Datensicherheit
- Alle Zeichnungen werden automatisch im Browser gespeichert (`IndexedDB` & `localStorage`).
- **Profil exportieren**: Lade deine gesamte Handschrift als `.json`-Datei herunter, um sie zu sichern oder auf einem anderen Gerät zu nutzen.
- **Profil laden**: Importiere eine bestehende `.json`-Profildatei jederzeit wieder.
- **Beispiel laden**: Klicke auf `✨ Beispiel laden`, um sofort mit einer vollständigen, vorinstallierten Mehrfach-Variations-Handschrift zu experimentieren.
