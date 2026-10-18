# Flagpie Flaggen-Verlauf

Userscript für [flagpie.net](https://flagpie.net/): Die geratenen Länder werden
als Flaggen-Verlauf rechts neben dem Spiel angezeigt. Normalerweise blendet das
Spiel die Flagge nach einem Tipp nur kurz über dem Kuchendiagramm ein.

- Falsche Tipps: roter Rahmen, in der Reihenfolge, in der sie geraten wurden
- Richtiger Tipp: grüner Rahmen, am Ende der Liste
- Schmale Fenster (≤ 900 px): Der Verlauf steht als Reihe unter „Your guesses“

## Installation

Bei installiertem Tampermonkey diese URL im Browser öffnen — der Installations-
Dialog geht dann von selbst auf:

<https://raw.githubusercontent.com/jagodzinska/flagpie-verlauf/main/flagpie-verlauf.user.js>

`@updateURL`/`@downloadURL` zeigen auf dieselbe Datei, Tampermonkey holt sich
Updates also automatisch von `main`. Dafür muss die `@version` im Header bei
jeder Änderung hochgezählt werden.
Danach `https://flagpie.net/` neu laden.

## Wie es funktioniert

Das Skript greift nicht in das Spiel ein, es liest nur die Seite mit:

- `#triedList` („Your guesses: Thailand, Costa Rica“) liefert die falschen Tipps.
- `#statusMessage` („Correct! It was Panama. …“) liefert den richtigen Tipp.
- Ein `MutationObserver` rendert den Verlauf bei jeder Änderung neu. Nach dem
  Neuladen stellt das Spiel die Liste selbst wieder her, deshalb bleibt der
  Verlauf erhalten.

Die Flaggen kommen aus denselben Quellen wie im Spiel: `countryCodes` der Seite
und `flagcdn.com`, bei Peru die Staatsflagge von Wikimedia.

Wenn flagpie die Texte ändert, müssen `PREFIX` und `WIN` im Skript angepasst
werden.
