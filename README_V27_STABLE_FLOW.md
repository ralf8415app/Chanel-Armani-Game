# V27 Stable Flow Rebuild

Diese Fassung behebt den grundlegenden Übergangsfehler der Phase-2-Erweiterung.

## Ursache
Die Phase-2-Logik griff auf Speicher- und Startfunktionen zu, die in einem privaten JavaScript-Modul verborgen waren. Dadurch entstanden beim Memory-Weiter-Button Laufzeitfehler und widersprüchliche Übergänge.

## Korrekturen
- definierte öffentliche Schnittstelle für Spielstand, Freischaltung und Länderstart
- zentraler Memory-Übergang bleibt der einzige aktive Button-Handler
- vollständiger Reset vor jedem neuen Land
- korrekte Übergänge Italien bis Schweiz
- neue Offline-Cache-Version
- Versionskennzeichnung „Stable Flow Rebuild“
