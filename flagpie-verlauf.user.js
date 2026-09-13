// ==UserScript==
// @name         Flagpie Flaggen-Verlauf
// @namespace    https://github.com/jagodzinska/flagpie-verlauf
// @version      1.0.0
// @description  Zeigt auf flagpie.net die bereits geratenen Flaggen dauerhaft als Verlauf rechts neben dem Spiel an, statt sie nur kurz über dem Kuchendiagramm einzublenden.
// @author       jago/claude
// @license      MIT
// @match        https://flagpie.net/*
// @icon         https://flagpie.net/favicon.png
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  if (window.top !== window.self) return; // nicht in den Werbe-iframes laufen

  const tried = document.getElementById('triedList');
  const status = document.getElementById('statusMessage');
  if (!tried) return; // Draw, Archiv-Übersicht usw.

  // Das Spiel schreibt die falschen Tipps nur als Text in #triedList
  // ("Your guesses: Thailand, Costa Rica"). Der richtige Tipp steht dort nie,
  // er taucht nur in der Statuszeile auf ("Correct! It was Panama. ...").
  const PREFIX = 'Your guesses: ';
  const WIN = /^Correct! It was (.+?)\. Solved/;

  // countryCodes ist eine top-level const aus countryCodes.js – mit
  // @grant none läuft das Skript im Seitenkontext und sieht sie direkt.
  // Falls Tampermonkey doch isoliert, holen wir die Datei selbst.
  let codes = null;
  function loadCodes() {
    try {
      // eslint-disable-next-line no-undef
      if (typeof countryCodes === 'object') return Promise.resolve(countryCodes);
    } catch (e) { /* nicht sichtbar */ }
    return fetch('/countryCodes.js')
      .then(r => r.text())
      .then(src => {
        const map = {};
        for (const m of src.matchAll(/"([^"]+)":\s*"([a-z]{2})"/gi)) map[m[1]] = m[2];
        return map;
      });
  }

  // Dieselben Quellen wie das Spiel (showGuessFlash), inkl. Sonderfall Peru.
  function flagSrc(name) {
    if (name === 'Peru') return 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Peru_(state).svg';
    const code = codes && codes[name];
    return code ? `https://flagcdn.com/w160/${code.toLowerCase()}.png` : null;
  }

  const css = document.createElement('style');
  css.textContent = `
    #fpv-panel {
      position: fixed;
      top: 130px;
      left: calc(69% + 24px);
      width: min(220px, calc(31% - 48px));
      max-height: calc(100vh - 160px);
      overflow-y: auto;
      padding: 14px;
      background: #4a4843;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      color: #e8e6e1;
      font-family: inherit;
      z-index: 50;
    }
    #fpv-panel[hidden] { display: none; }
    #fpv-panel h4 {
      margin: 0 0 10px;
      font-size: 0.9rem;
      color: #f0b429;
    }
    .fpv-item { margin-bottom: 12px; text-align: center; }
    .fpv-item img {
      display: block;
      width: 100%;
      border-radius: 6px;
      border: 3px solid #b03030;
      box-sizing: border-box;
      background: #333;
    }
    .fpv-item.fpv-correct img { border-color: #2e9a55; }
    .fpv-item span { display: block; margin-top: 4px; font-size: 0.8rem; }
    /* Einspaltiges Layout der Seite: Verlauf unter die Tippliste setzen */
    @media (max-width: 900px) {
      #fpv-panel {
        position: static;
        width: auto;
        max-height: none;
        margin: 8px 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      }
      #fpv-panel h4 { flex-basis: 100%; margin: 0; }
      .fpv-item { width: 90px; margin: 0; }
    }
  `;
  document.head.appendChild(css);

  const panel = document.createElement('aside');
  panel.id = 'fpv-panel';
  panel.hidden = true;
  tried.insertAdjacentElement('afterend', panel);

  let lastKey = '';
  function render() {
    const text = tried.textContent.trim();
    const wrong = text.startsWith(PREFIX) ? text.slice(PREFIX.length).split(', ').filter(Boolean) : [];
    const win = status && WIN.exec(status.textContent.trim());
    const entries = wrong.map(name => ({ name, correct: false }));
    if (win) entries.push({ name: win[1], correct: true });

    const key = JSON.stringify(entries);
    if (key === lastKey) return; // Observer feuert auch bei eigenen Änderungen
    lastKey = key;

    panel.replaceChildren();
    panel.hidden = entries.length === 0;
    if (!entries.length) return;

    const h = document.createElement('h4');
    h.textContent = 'Deine Tipps';
    panel.appendChild(h);
    for (const { name, correct } of entries) {
      const item = document.createElement('div');
      item.className = 'fpv-item' + (correct ? ' fpv-correct' : '');
      const src = flagSrc(name);
      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = name;
        item.appendChild(img);
      }
      const label = document.createElement('span');
      label.textContent = name;
      item.appendChild(label);
      panel.appendChild(item);
    }
  }

  loadCodes()
    .catch(() => ({})) // ohne Codes gibt's wenigstens die Namen
    .then(map => {
      codes = map;
      const obs = new MutationObserver(render);
      for (const el of [tried, status].filter(Boolean)) {
        obs.observe(el, { childList: true, characterData: true, subtree: true });
      }
      render(); // Spielstand nach Neuladen ist evtl. schon gerendert
    });
})();
