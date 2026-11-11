/* ══════════════════════════════════════════════════════════════════════════
   CLUB-SELECT — los menús y las casillas con la cara del Club

   Diego: «En los check list no quiero que sean de sistema, quiero que el
   diseño sea de la misma página web». Los <select> abrían la ruleta del
   iPhone o la lista gris del navegador. Esto los convierte, sin tocar el
   código de cada página:

     · el campo se ve igual que antes (copia el aspecto que le dio la página)
     · al tocarlo se abre una lista propia: azul del Club, palomita dorada
     · el <select> de verdad sigue ahí, escondido: guarda el valor, manda su
       «change» y cualquier código que le cambie el valor lo ve reflejado
     · las casillas y los botones de opción que aún se veían de sistema
       pasan a la casilla dorada del Club (las que ya tenían diseño propio
       no se tocan)

   Se carga solo en cada página (club-select.js) y vigila lo que se pinte
   después: las listas que se arman con JS también quedan cubiertas.
   Para dejar uno como estaba: data-nativo en el <select> o en su contenedor.

   Las listas largas (el panel, con cientos de filas) no usan <select>: abren
   la misma lista con ClubSelect.menu(boton, opciones, valor, alElegir).
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.__CLUB_SELECT__) return;
  window.__CLUB_SELECT__ = true;

  const ESTILO = `
    .cs{position:relative;display:inline-flex;min-width:0;vertical-align:middle;
      padding:0!important;border:0!important;background:none!important;box-shadow:none!important;
      outline:0!important;height:auto!important;min-height:0!important;-webkit-appearance:none!important;appearance:none!important}
    .cs.cs-ancho{display:flex;width:100%}
    select.cs-oculto{position:absolute!important;opacity:0!important;pointer-events:none!important;
      width:1px!important;height:1px!important;min-width:0!important;max-width:1px!important;margin:0!important;
      padding:0!important;border:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;flex:none!important}
    .cs-btn{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;
      min-width:0;cursor:pointer;text-align:left;font:inherit;line-height:1.25;
      -webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent;
      touch-action:manipulation;transition:border-color .15s,background-color .15s}
    .cs-btn .cs-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .cs-btn .cs-flecha{flex:none;width:15px;height:15px;color:#d9b977;transition:transform .18s}
    .cs-btn[aria-expanded="true"] .cs-flecha{transform:rotate(180deg)}
    .cs-btn[aria-expanded="true"]{border-color:rgba(201,160,64,.6)!important}
    .cs-btn:disabled{opacity:.5;cursor:default}
    .cs-btn:focus-visible{outline:2px solid rgba(201,160,64,.6);outline-offset:2px}
    .cs-lista{position:fixed;z-index:2147483000;min-width:150px;max-height:320px;overflow-y:auto;
      overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:6px;border-radius:14px;
      background:#0d1730;border:1px solid rgba(201,160,64,.32);color:#dbe5f5;text-align:left;
      box-shadow:0 18px 44px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.03) inset;
      font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;
      animation:csEntra .14s ease-out both}
    .cs-lista.arriba{animation-name:csEntraArriba}
    @keyframes csEntra{from{opacity:0;transform:translateY(-4px) scale(.98)}to{opacity:1;transform:none}}
    @keyframes csEntraArriba{from{opacity:0;transform:translateY(4px) scale(.98)}to{opacity:1;transform:none}}
    .cs-op{display:flex;align-items:center;gap:10px;min-height:42px;padding:9px 12px;border-radius:10px;
      font-size:14px;line-height:1.3;color:#dbe5f5;cursor:pointer;-webkit-tap-highlight-color:transparent;
      touch-action:manipulation;user-select:none;-webkit-user-select:none}
    .cs-op .cs-palomita{flex:none;width:16px;height:16px;color:#e8c46a;visibility:hidden}
    .cs-op[aria-selected="true"]{color:#f3d998;font-weight:700;
      background:linear-gradient(90deg,rgba(201,160,64,.2),rgba(201,160,64,.05));
      box-shadow:inset 2px 0 0 #c9a040}
    .cs-op[aria-selected="true"] .cs-palomita{visibility:visible}
    .cs-op.cs-activa{background:rgba(120,150,200,.12)}
    .cs-op[aria-selected="true"].cs-activa{background:linear-gradient(90deg,rgba(201,160,64,.26),rgba(201,160,64,.08))}
    @media(hover:hover){ .cs-op:not([aria-disabled="true"]):hover{background:rgba(120,150,200,.12)}
      .cs-op[aria-selected="true"]:hover{background:linear-gradient(90deg,rgba(201,160,64,.26),rgba(201,160,64,.08))} }
    .cs-op[aria-disabled="true"]{opacity:.4;cursor:default}
    .cs-grupo{padding:9px 12px 4px;font:700 10.5px/1.2 'Space Grotesk',Inter,sans-serif;
      letter-spacing:.14em;text-transform:uppercase;color:#d9b977}
    @media(prefers-reduced-motion:reduce){.cs-lista{animation:none}}

    /* las casillas y opciones que aún se veían de sistema (con :where para
       que cualquier regla de la página mande sobre tamaño y márgenes) */
    :where(input.cs-check,input.cs-radio){-webkit-appearance:none;appearance:none;width:20px;height:20px;
      flex:none;display:inline-grid;place-items:center;vertical-align:middle;cursor:pointer;margin:0 4px 0 0;
      border:1.6px solid rgba(201,160,64,.55);background:rgba(10,18,38,.85);border-radius:6px;
      transition:background .15s,border-color .15s;-webkit-tap-highlight-color:transparent}
    :where(input.cs-radio){border-radius:50%}
    :where(input.cs-check:checked){background:linear-gradient(135deg,#f0d78f,#c9a040);border-color:transparent}
    :where(input.cs-check:checked)::after{content:"";width:9px;height:5px;margin-top:-2px;
      border:2.4px solid #1a1200;border-top:0;border-right:0;transform:rotate(-45deg)}
    :where(input.cs-radio:checked){border-color:#c9a040}
    :where(input.cs-radio:checked)::after{content:"";width:10px;height:10px;border-radius:50%;
      background:linear-gradient(135deg,#f0d78f,#c9a040)}
    :where(input.cs-check,input.cs-radio):focus-visible{outline:2px solid rgba(201,160,64,.6);outline-offset:2px}
    :where(input.cs-check,input.cs-radio):disabled{opacity:.45;cursor:default}`;
  const hoja = document.createElement("style");
  hoja.id = "club-select-css";
  hoja.textContent = ESTILO;
  (document.head || document.documentElement).appendChild(hoja);

  const FLECHA = '<svg class="cs-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const PALOMITA = '<svg class="cs-palomita" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ⚠️ Si el código de la página le cambia el valor al <select> («vuelve a
     Alumno», por ejemplo), el campo propio tiene que enterarse. Se envuelven
     `value` y `selectedIndex` para avisar; el resto se queda igual. */
  const P = HTMLSelectElement.prototype;
  ["value", "selectedIndex"].forEach(prop => {
    const d = Object.getOwnPropertyDescriptor(P, prop);
    if (!d || !d.set || d.set.__cs) return;
    const set = function (v) { d.set.call(this, v); if (this.__cs) this.__cs.sync(); };
    set.__cs = true;
    Object.defineProperty(P, prop, { configurable: true, enumerable: d.enumerable,
      get: function () { return d.get.call(this); }, set });
  });

  /* lo que el <select> heredaba de la página (fondo, borde, letra…) pasa al botón */
  const COPIA = ["backgroundColor", "backgroundImage", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle", "borderTopColor",
    "borderRightColor", "borderBottomColor", "borderLeftColor", "borderTopLeftRadius", "borderTopRightRadius",
    "borderBottomLeftRadius", "borderBottomRightRadius", "paddingTop", "paddingBottom", "paddingLeft",
    "fontSize", "fontWeight", "fontFamily", "color", "letterSpacing", "boxShadow"];

  /* Se mide TODO primero y se escribe después: medir y tocar el DOM por
     turnos obligaba al navegador a recalcular la página por cada menú. */
  const valeLaPena = sel => !(sel.__cs || sel.multiple || sel.size > 1 ||
    sel.hasAttribute("data-nativo") || sel.closest("[data-nativo]"));
  function mide(sel) {
    const cs = getComputedStyle(sel);
    const r = sel.getBoundingClientRect();
    if (!r.width && !r.height) return { sel, oculto: true };       // aún no se ve: cuando se vea
    const padre = sel.parentElement;
    let anchoPadre = 0;
    if (padre) {
      const cp = getComputedStyle(padre);
      anchoPadre = padre.getBoundingClientRect().width - parseFloat(cp.paddingLeft || 0) - parseFloat(cp.paddingRight || 0);
    }
    const visual = {};
    COPIA.forEach(k => { visual[k] = cs[k]; });
    /* nunca más bajito que el campo que reemplaza */
    visual.minHeight = Math.max(parseFloat(cs.minHeight) || 0, Math.round(r.height)) + "px";
    return {
      sel, ancho: r.width, alto: r.height, visual,
      lleno: cs.display === "block" || (anchoPadre > 0 && Math.abs(r.width - anchoPadre) < 3),
      flex: cs.flexGrow && cs.flexGrow !== "0" ? cs.flex : "",
      margen: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft],
    };
  }

  const espera = typeof ResizeObserver === "function" ? new ResizeObserver(es => {
    const listos = es.filter(e => e.contentRect.width || e.contentRect.height).map(e => e.target);
    listos.forEach(s => espera.unobserve(s));
    if (listos.length) mejora(listos);
  }) : null;

  function mejora(selects) {
    const lista = selects.filter(valeLaPena);
    if (!lista.length) return;
    /* ⚠️ Sin la apariencia del sistema ANTES de medir: en el iPhone, un
       <select> nativo ignora el relleno y el redondeo que le da la página
       (salía con 5 px de esquina y el texto pegado al borde). Así se lee el
       diseño que de verdad le pusieron. */
    lista.forEach(s => {
      s.style.setProperty("-webkit-appearance", "none", "important");
      s.style.setProperty("appearance", "none", "important");
    });
    const medidas = lista.map(mide).filter(Boolean);
    medidas.forEach(m => {
      if (m.oculto) { if (espera && !m.sel.__csEspera) { m.sel.__csEspera = true; espera.observe(m.sel); } return; }
      monta(m);
    });
  }

  function monta(m) {
    const sel = m.sel;
    if (sel.__cs) return;
    const caja = document.createElement("span");
    caja.className = "cs " + sel.className;            // las reglas de la página por clase (ancho, flex…)
    if (m.lleno) caja.classList.add("cs-ancho");
    else caja.style.width = Math.round(m.ancho) + "px";
    if (m.flex) caja.style.flex = m.flex;
    caja.style.margin = m.margen.join(" ");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cs-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    const lab = sel.id && document.querySelector('label[for="' + (window.CSS && window.CSS.escape ? window.CSS.escape(sel.id) : sel.id) + '"]');
    const nombre = sel.getAttribute("aria-label") || (lab && lab.textContent);
    if (nombre) btn.setAttribute("aria-label", String(nombre).trim());
    Object.keys(m.visual).forEach(k => { if (m.visual[k]) btn.style[k] = m.visual[k]; });
    /* el fondo de flecha que algunas páginas le ponían al select: aquí ya hay una */
    if (/url\(/.test(m.visual.backgroundImage || "")) btn.style.backgroundImage = "none";
    btn.style.paddingRight = "12px";
    btn.style.width = "100%";
    btn.innerHTML = '<span class="cs-txt"></span>' + FLECHA;
    caja.appendChild(btn);
    sel.after(caja);
    sel.classList.add("cs-oculto");
    sel.setAttribute("tabindex", "-1");
    sel.setAttribute("aria-hidden", "true");

    const sync = () => {
      const op = sel.options[sel.selectedIndex];
      btn.querySelector(".cs-txt").textContent = op ? op.text : "";
      btn.disabled = !!sel.disabled;
    };
    sel.__cs = { sync, caja, btn };
    sync();
    sel.addEventListener("change", sync);
    /* opciones que llegan después, o el select que se desactiva */
    new MutationObserver(sync).observe(sel, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled"] });
    /* una <label for> enfoca el select escondido: se pasa al botón */
    sel.addEventListener("focus", () => btn.focus());

    const abreSel = () => {
      const ops = [];
      [...sel.children].forEach(n => {
        if (n.tagName === "OPTGROUP") {
          ops.push({ grupo: n.label });
          [...n.children].forEach(o => ops.push({ v: o.index, t: o.text, off: o.disabled }));
        } else if (n.tagName === "OPTION" && !n.hidden) ops.push({ v: n.index, t: n.text, off: n.disabled });
      });
      abreLista(btn, ops, sel.selectedIndex, idx => {
        if (idx === sel.selectedIndex) return;
        sel.selectedIndex = idx;
        sel.dispatchEvent(new Event("input", { bubbles: true }));
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      });
    };
    btn.addEventListener("click", e => {
      e.preventDefault();
      if (abierta && abierta.btn === btn) return cierra();
      abreSel();
    });
    btn.addEventListener("keydown", e => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); abreSel(); }
    });
  }

  /* ── la lista desplegada (una sola a la vez) ──
     ops: [{v, t, off}] o {grupo:"Título"}; actual: el v elegido ahora */
  let abierta = null;
  function abreLista(btn, ops, actual, alElegir) {
    cierra();
    if (!btn || btn.disabled) return;
    const lista = document.createElement("div");
    lista.className = "cs-lista";
    lista.setAttribute("role", "listbox");
    const elegibles = [];
    lista.innerHTML = ops.map(o => {
      if (o.grupo !== undefined) return '<div class="cs-grupo">' + esc(o.grupo) + "</div>";
      elegibles.push(o);
      return '<div class="cs-op" role="option" data-k="' + (elegibles.length - 1) + '" aria-selected="' +
        (String(o.v) === String(actual) ? "true" : "false") + '"' + (o.off ? ' aria-disabled="true"' : "") + ">" +
        PALOMITA + "<span>" + esc(o.t) + "</span></div>";
    }).join("");
    document.body.appendChild(lista);

    /* dónde: debajo del campo si cabe; si no, encima. Nunca fuera de pantalla */
    const r = btn.getBoundingClientRect();
    const vv = window.visualViewport;
    const altoVista = vv ? vv.height : innerHeight;
    const ancho = Math.max(r.width, 160);
    lista.style.width = ancho + "px";
    lista.style.left = Math.max(8, Math.min(r.left, innerWidth - ancho - 8)) + "px";
    const alto = Math.min(lista.scrollHeight, 320);
    const abajo = altoVista - r.bottom - 10, arriba = r.top - 10;
    if (abajo >= alto || abajo >= arriba) {
      lista.style.top = (r.bottom + 6) + "px";
      lista.style.maxHeight = Math.max(120, Math.min(320, abajo - 6)) + "px";
    } else {
      lista.classList.add("arriba");
      const h = Math.min(alto, arriba - 6);
      lista.style.maxHeight = Math.max(120, Math.min(320, arriba - 6)) + "px";
      lista.style.top = Math.max(8, r.top - 6 - h) + "px";
    }
    btn.setAttribute("aria-expanded", "true");

    const filas = lista.querySelectorAll(".cs-op");
    let activa = Math.max(0, elegibles.findIndex(o => String(o.v) === String(actual)));
    const marca = n => {
      activa = n;
      filas.forEach((el, k) => el.classList.toggle("cs-activa", k === n));
      if (filas[n]) filas[n].scrollIntoView({ block: "nearest" });
    };
    marca(activa);
    const elige = k => {
      const o = elegibles[k];
      if (!o || o.off) return;
      cierra();
      try { btn.focus({ preventScroll: true }); } catch (e) {}
      alElegir(o.v);
    };
    lista.addEventListener("click", e => {
      e.stopPropagation();
      const op = e.target.closest(".cs-op");
      if (op) elige(+op.dataset.k);
    });
    /* escribir salta a la opción: «m» → México (como la lista del sistema) */
    const limpio = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/^[^a-z0-9]+/i, "").toLowerCase();
    let tecleado = "", relojTecla = 0;
    const teclas = e => {
      if (e.key === "Escape" || e.key === "Tab") { cierra(); if (e.key === "Escape") { e.preventDefault(); btn.focus(); } return; }
      if (e.key === "ArrowDown") { e.preventDefault(); marca(Math.min(elegibles.length - 1, activa + 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); marca(Math.max(0, activa - 1)); return; }
      if (e.key === "Home") { e.preventDefault(); marca(0); return; }
      if (e.key === "End") { e.preventDefault(); marca(elegibles.length - 1); return; }
      if (e.key === "Enter" || (e.key === " " && !tecleado)) { e.preventDefault(); elige(activa); return; }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        clearTimeout(relojTecla);
        tecleado += e.key.toLowerCase();
        relojTecla = setTimeout(() => { tecleado = ""; }, 700);
        const i = elegibles.findIndex(o => !o.off && limpio(o.t).startsWith(tecleado));
        if (i >= 0) marca(i);
      }
    };
    /* tocar fuera la cierra; el toque se queda ahí (no abre lo de debajo) */
    const fuera = e => {
      if (lista.contains(e.target)) return;
      if (btn.contains(e.target)) return;          // el propio botón la cierra con su clic
      cierra();
    };
    const alMover = e => { if (!lista.contains(e.target)) cierra(); };
    document.addEventListener("keydown", teclas, true);
    document.addEventListener("pointerdown", fuera, true);
    addEventListener("scroll", alMover, true);
    addEventListener("resize", cierra);
    abierta = { btn, lista, quita: () => {
      document.removeEventListener("keydown", teclas, true);
      document.removeEventListener("pointerdown", fuera, true);
      removeEventListener("scroll", alMover, true);
      removeEventListener("resize", cierra);
    } };
  }
  function cierra() {
    if (!abierta) return;
    const a = abierta; abierta = null;
    a.quita();
    a.lista.remove();
    a.btn.setAttribute("aria-expanded", "false");
  }

  /* ── las casillas que todavía se veían de sistema ── */
  function cuida(inps) {
    const marcar = [];
    inps.forEach(inp => {
      if (inp.__csCasilla || inp.hasAttribute("data-nativo") || inp.closest("[data-nativo]")) return;
      const cs = getComputedStyle(inp);
      /* las escondidas a propósito (interruptores propios: la casilla real va
         transparente o sin tamaño) no se tocan. ⚠️ visibility NO cuenta: varias
         páginas tapan todo con visibility:hidden mientras cargan */
      if (cs.display === "none" || +cs.opacity === 0) return;
      if (parseFloat(cs.width) === 0 || parseFloat(cs.height) === 0) return;
      const ap = cs.appearance || cs.webkitAppearance || "auto";
      if (ap !== "auto" && ap !== "checkbox" && ap !== "radio") return;     // ya tiene su diseño
      marcar.push(inp);
    });
    marcar.forEach(inp => {
      inp.__csCasilla = true;
      inp.classList.add(inp.type === "radio" ? "cs-radio" : "cs-check");
    });
  }

  function repasa(raiz) {
    if (!raiz || !raiz.querySelectorAll) return;
    const sels = raiz.tagName === "SELECT" ? [raiz] : [...raiz.querySelectorAll("select")];
    if (sels.length) mejora(sels);
    const inps = raiz.matches && raiz.matches('input[type="checkbox"],input[type="radio"]') ? [raiz]
      : [...raiz.querySelectorAll('input[type="checkbox"],input[type="radio"]')];
    if (inps.length) cuida(inps);
  }

  window.ClubSelect = {
    /* menu(boton, [["valor","Texto"], …] o [{v,t}], valorActual, alElegir) */
    menu(btn, opciones, actual, alElegir) {
      if (abierta && abierta.btn === btn) return cierra();
      const ops = (opciones || []).map(o => Array.isArray(o) ? { v: o[0], t: o[1] } : o);
      abreLista(btn, ops, actual, alElegir);
    },
    cierra,
    repasa,
  };

  const arranca = () => {
    repasa(document.body);
    let cola = [];
    new MutationObserver(ms => {
      ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && !n.classList.contains("cs-lista")) cola.push(n); }));
      if (!cola.length) return;
      const nodos = cola; cola = [];
      /* todo lo nuevo de golpe: una sola medición para todos */
      const sels = [], inps = [];
      nodos.forEach(n => {
        if (!n.isConnected) return;
        if (n.tagName === "SELECT") sels.push(n); else if (n.querySelectorAll) sels.push(...n.querySelectorAll("select"));
        if (n.matches && n.matches('input[type="checkbox"],input[type="radio"]')) inps.push(n);
        else if (n.querySelectorAll) inps.push(...n.querySelectorAll('input[type="checkbox"],input[type="radio"]'));
      });
      if (sels.length) mejora(sels);
      if (inps.length) cuida(inps);
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arranca);
  else arranca();
})();
