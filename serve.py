#!/usr/bin/env python3
"""
Lokaler Server für den Handschrift-Generator.
Startet einen HTTP-Server und öffnet die Anwendung automatisch im Browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Cache-Header deaktivieren für beste Entwicklungs- und Nutzungserfahrung
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

def run_server():
    os.chdir(DIRECTORY)
    
    # Freien Port suchen falls 8080 belegt ist
    global PORT
    for p in range(PORT, PORT + 20):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                PORT = p
                url = f"http://localhost:{PORT}"
                print("=" * 60)
                print(f"✍️  Handschrift-Generator läuft unter:")
                print(f"👉  {url}")
                print("=" * 60)
                print("Drücke Strg+C im Terminal, um den Server zu beenden.\n")
                
                # Browser öffnen
                webbrowser.open(url)
                httpd.serve_forever()
                break
        except OSError:
            continue

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\nServer beendet. Auf Wiedersehen!")
        sys.exit(0)
