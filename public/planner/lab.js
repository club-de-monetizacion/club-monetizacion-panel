/* ══════════════════════════════════════════════════════════════════════════
   LAB — laboratorio de portadas
   ──────────────────────────────────────────────────────────────────────────
   Un lienzo en blanco donde bajar las ideas de una portada: pegas capturas,
   escribes encima, dibujas, y mueves todo hasta que la portada aparece.

   Los gestos son los de Miro y Excalidraw a propósito, para no tener que
   aprender nada: V seleccionar · H mano · N nota · T texto · R rectángulo ·
   O elipse · F flecha · L lápiz. Espacio o botón del medio para arrastrar la
   hoja, rueda para desplazar, Cmd/Ctrl+rueda para el zoom, Cmd+V para pegar,
   Supr para borrar, Cmd+Z para deshacer, Cmd+D para duplicar.

   Todo se guarda solo en este dispositivo, por tablero.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  const LLAVE = "lab_portadas_v1";
  const COLORES = ["#FFE7A8", "#4d8bff", "#5fd3b0", "#ff7b7b", "#c9a0ff", "#ffffff"];
  const GROSORES = [2, 4, 8];

  let el, mundo, svg, canvas;          // el DOM
  let items = [];                      // lo que hay en la hoja
  let pan = { x: 0, y: 0 }, zoom = 1;
  let herramienta = "sel";
  let color = COLORES[0], grosor = 2;
  let sel = new Set();
  let historia = [], futuro = [];
  let arrastre = null, panEnCurso = null, cajaSel = null, trazo = null;
  let montado = false;

  const uid = () => "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const guarda = () => { try { localStorage.setItem(LLAVE, JSON.stringify(items)); } catch (e) {} };
  const carga = () => { try { items = JSON.parse(localStorage.getItem(LLAVE) || "[]"); } catch (e) { items = []; } };

  /* ── deshacer: se guarda el estado antes de cada cambio ── */
  function apunta() {
    historia.push(JSON.stringify(items));
    if (historia.length > 60) historia.shift();
    futuro.length = 0;
  }
  function deshacer() {
    if (!historia.length) return;
    futuro.push(JSON.stringify(items));
    items = JSON.parse(historia.pop());
    sel.clear(); pinta(); guarda();
  }
  function rehacer() {
    if (!futuro.length) return;
    historia.push(JSON.stringify(items));
    items = JSON.parse(futuro.pop());
    sel.clear(); pinta(); guarda();
  }

  /* ── de la pantalla a la hoja ── */
  function aHoja(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: (ev.clientX - r.left - pan.x) / zoom, y: (ev.clientY - r.top - pan.y) / zoom };
  }

  /* ════════ PINTAR ════════ */
  function pinta() {
    mundo.querySelectorAll(".lab-el").forEach(n => n.remove());
    const trazos = [];
    items.forEach(it => {
      if (it.t === "trazo" || it.t === "flecha" || it.t === "linea") { trazos.push(it); return; }
      mundo.appendChild(nodo(it));
    });
    pintaSvg(trazos);
    pintaGuias();
    aplica();
    const vacio = document.getElementById("labVacio");
    if (vacio) vacio.style.display = items.length ? "none" : "block";
  }

  /* maxresdefault no existe en todos los videos: cuando falta, YouTube
     devuelve un gris de 120px. Se detecta por el ancho y se baja a hq. */
  function cuidaPortada(img, it) {
    img.addEventListener("load", () => {
      if (img.naturalWidth <= 150 && it.vid) {
        const hq = "https://i.ytimg.com/vi/" + it.vid + "/hqdefault.jpg";
        if (img.src !== hq) { img.src = hq; it.img = hq; guarda(); }
      }
    });
    img.addEventListener("error", () => {
      if (it.vid) img.src = "https://i.ytimg.com/vi/" + it.vid + "/hqdefault.jpg";
    });
  }

  function nodo(it) {
    const d = document.createElement("div");
    d.className = "lab-el " + it.t + (sel.has(it.id) ? " sel" : "");
    d.dataset.id = it.id;
    d.style.left = it.x + "px"; d.style.top = it.y + "px";
    d.style.width = it.w + "px"; d.style.height = it.h + "px";
    if (it.t === "img") {
      d.innerHTML = '<img src="' + it.src + '" alt="">';
    } else if (it.t === "nota") {
      d.style.background = it.color || "#FFE7A8";
      d.textContent = it.texto || "";
    } else if (it.t === "texto") {
      d.style.color = it.color || "#fff";
      d.style.fontSize = (it.fs || 20) + "px";
      d.textContent = it.texto || "";
    } else if (it.t === "rect" || it.t === "elipse") {
      d.style.border = (it.grosor || 2) + "px solid " + (it.color || "#FFE7A8");
      d.style.borderRadius = it.t === "elipse" ? "50%" : "6px";
      if (it.relleno) d.style.background = it.color + "33";
    } else if (it.t === "link") {
      /* Si trae portada, la portada es la tarjeta entera: se pega un video
         para VERLO, no para leer su dirección. El enlace queda en un botón
         pequeño en la esquina. */
      if (it.img) {
        d.classList.add("conPortada");
        d.innerHTML =
          '<img class="lk-img" src="' + it.img + '" alt="">' +
          '<button class="lk-ir" title="Abrir en YouTube">' +
            '<svg viewBox="0 0 24 24" fill="currentColor">' +
              '<path d="M10 15.5l6-3.5-6-3.5v7z"/>' +
              '<path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8z" fill="none" stroke="currentColor" stroke-width="1.9"/>' +
            "</svg></button>";
      } else {
        d.innerHTML = '<div class="lk-tx solo">' + (it.titulo || it.url) + "</div>";
      }
      d.title = it.url;
    }
    if (it.t === "link" && it.img) {
      const im = d.querySelector(".lk-img");
      if (im) cuidaPortada(im, it);
    }
    if (sel.has(it.id) && sel.size === 1 && it.t !== "texto")
      ["nw","ne","sw","se"].forEach(p => {
        const a = document.createElement("div");
        a.className = "lab-asa " + p; a.dataset.asa = p;
        d.appendChild(a);
      });
    return d;
  }

  function pintaSvg(trazos) {
    let s = "";
    trazos.forEach(it => {
      const c = it.color || "#FFE7A8", g = it.grosor || 2;
      const elegido = sel.has(it.id);
      if (it.t === "trazo") {
        s += `<path d="${it.d}" fill="none" stroke="${c}" stroke-width="${g}" stroke-linecap="round" stroke-linejoin="round" data-id="${it.id}" style="pointer-events:stroke;cursor:pointer"${elegido ? ' stroke-dasharray="6 4"' : ""}/>`;
      } else {
        const marca = it.t === "flecha" ? ' marker-end="url(#labPunta)"' : "";
        s += `<line x1="${it.x1}" y1="${it.y1}" x2="${it.x2}" y2="${it.y2}" stroke="${c}" stroke-width="${g}" stroke-linecap="round"${marca} data-id="${it.id}" style="pointer-events:stroke;cursor:pointer"${elegido ? ' stroke-dasharray="6 4"' : ""}/>`;
      }
    });
    svg.innerHTML =
      '<defs><marker id="labPunta" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">' +
      '<polygon points="0 0,9 3.5,0 7" fill="' + color + '"/></marker></defs>' + s +
      (trazo ? trazo.vista : "");
  }

  function aplica() {
    mundo.style.transform = `translate(${pan.x}px,${pan.y}px) scale(${zoom})`;
    svg.style.transform = mundo.style.transform;
    const gu = document.getElementById("labGuiasSvg");
    if (gu) gu.style.transform = mundo.style.transform;
    const z = document.getElementById("labZoomLabel");
    if (z) z.textContent = Math.round(zoom * 100) + "%";
  }

  /* ════════ CREAR COSAS ════════ */
  function anade(it) { apunta(); items.push(it); guarda(); pinta(); return it; }

  function nota(x, y, texto) {
    return anade({ id: uid(), t: "nota", x, y, w: 190, h: 130, color, texto: texto || "" });
  }
  function texto(x, y, txt) {
    return anade({ id: uid(), t: "texto", x, y, w: 260, h: 40, color: "#ffffff", fs: 20, texto: txt || "" });
  }
  function imagen(src, x, y) {
    const im = new Image();
    im.onload = () => {
      const max = 420;
      const k = Math.min(1, max / Math.max(im.width, im.height));
      anade({ id: uid(), t: "img", x, y, w: Math.round(im.width * k), h: Math.round(im.height * k), src });
    };
    im.src = src;
  }
  function enlace(url, x, y) {
    const yt = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
    anade({ id: uid(), t: "link", x, y, w: 320, h: yt ? 180 : 96, url,
      titulo: url.replace(/^https?:\/\//, "").slice(0, 60),
      img: yt ? "https://i.ytimg.com/vi/" + yt[1] + "/maxresdefault.jpg" : "",
      vid: yt ? yt[1] : "" });
  }

  /* ════════ PEGAR ════════ */
  function alPegar(e) {
    if (!activo()) return;
    const d = e.clipboardData; if (!d) return;
    const dentro = document.activeElement;
    if (dentro && dentro.isContentEditable) return;      // escribiendo en una nota
    const r = canvas.getBoundingClientRect();
    const cx = (r.width / 2 - pan.x) / zoom, cy = (r.height / 2 - pan.y) / zoom;

    for (const it of d.items) {
      if (it.type.startsWith("image/")) {
        e.preventDefault();
        const f = it.getAsFile(); if (!f) continue;
        const fr = new FileReader();
        fr.onload = ev => imagen(ev.target.result, cx - 150, cy - 100);
        fr.readAsDataURL(f);
        return;
      }
    }
    const txt = (d.getData("text/plain") || "").trim();
    if (!txt) return;
    e.preventDefault();
    if (/^https?:\/\//i.test(txt)) enlace(txt, cx - 150, cy - 105);
    else nota(cx - 95, cy - 65, txt);
  }

  /* ════════ GUÍAS DE ALINEACIÓN ════════
     Cuando lo que arrastras se alinea con otra cosa —por un borde o por el
     centro—, aparece una línea y la pieza se pega sola. Es lo que hace que
     un tablero quede recto sin tener que medir nada. */
  const IMAN_PX = 9;              // a cuántos píxeles de pantalla engancha
  let guias = [];                 // las líneas que se están enseñando

  /* los seis puntos de interés de un elemento */
  function bordes(it) {
    if (it.x == null) {           // flechas y líneas: su caja envolvente
      const x = Math.min(it.x1, it.x2), y = Math.min(it.y1, it.y2);
      const w = Math.abs(it.x2 - it.x1), h = Math.abs(it.y2 - it.y1);
      return { x1:x, cx:x + w/2, x2:x + w, y1:y, cy:y + h/2, y2:y + h, w, h };
    }
    return { x1:it.x, cx:it.x + it.w/2, x2:it.x + it.w,
             y1:it.y, cy:it.y + it.h/2, y2:it.y + it.h, w:it.w, h:it.h };
  }

  /* Busca con qué se alinea lo que se mueve y devuelve cuánto hay que
     correrlo para que encaje, más las líneas que hay que dibujar. */
  function buscaGuias(movidos) {
    const tol = IMAN_PX / zoom;
    const quietos = items.filter(i => !movidos.includes(i));
    if (!quietos.length) return { dx:0, dy:0, lineas:[] };

    /* la caja que envuelve todo lo que se arrastra */
    const bs = movidos.map(bordes);
    const caja = {
      x1: Math.min(...bs.map(b => b.x1)), x2: Math.max(...bs.map(b => b.x2)),
      y1: Math.min(...bs.map(b => b.y1)), y2: Math.max(...bs.map(b => b.y2)),
    };
    caja.cx = (caja.x1 + caja.x2) / 2;
    caja.cy = (caja.y1 + caja.y2) / 2;

    let mejorX = null, mejorY = null;
    for (const q of quietos) {
      const b = bordes(q);
      /* vertical: izquierda con izquierda, centro con centro, derecha con
         derecha, y también izquierda con derecha (pegadas) */
      for (const [ma, qa] of [["x1","x1"],["cx","cx"],["x2","x2"],["x1","x2"],["x2","x1"]]) {
        const d = b[qa] - caja[ma];
        if (Math.abs(d) <= tol && (!mejorX || Math.abs(d) < Math.abs(mejorX.d)))
          mejorX = { d, en: b[qa], a: q };
      }
      for (const [ma, qa] of [["y1","y1"],["cy","cy"],["y2","y2"],["y1","y2"],["y2","y1"]]) {
        const d = b[qa] - caja[ma];
        if (Math.abs(d) <= tol && (!mejorY || Math.abs(d) < Math.abs(mejorY.d)))
          mejorY = { d, en: b[qa], a: q };
      }
    }

    const lineas = [];
    if (mejorX) {
      const b = bordes(mejorX.a);
      lineas.push({ v:true, en:mejorX.en,
        desde: Math.min(b.y1, caja.y1 + mejorY?.d || caja.y1) - 24,
        hasta: Math.max(b.y2, caja.y2) + 24 });
    }
    if (mejorY) {
      const b = bordes(mejorY.a);
      lineas.push({ v:false, en:mejorY.en,
        desde: Math.min(b.x1, caja.x1) - 24,
        hasta: Math.max(b.x2, caja.x2) + 24 });
    }
    return { dx: mejorX ? mejorX.d : 0, dy: mejorY ? mejorY.d : 0, lineas };
  }

  function pintaGuias() {
    const c = document.getElementById("labGuias");
    if (!c) return;
    if (!guias.length) { c.innerHTML = ""; return; }
    const g = 1 / zoom;           // que la línea se vea igual de fina con cualquier zoom
    c.innerHTML = guias.map(l => l.v
      ? `<line x1="${l.en}" y1="${l.desde}" x2="${l.en}" y2="${l.hasta}" stroke="#ff3d7f" stroke-width="${g}" stroke-dasharray="${5*g} ${4*g}"/>`
      : `<line x1="${l.desde}" y1="${l.en}" x2="${l.hasta}" y2="${l.en}" stroke="#ff3d7f" stroke-width="${g}" stroke-dasharray="${5*g} ${4*g}"/>`
    ).join("");
  }

  /* ════════ RATÓN ════════ */
  function abajo(e) {
    if (e.target.closest(".lab-barra,.lab-zoom,.lab-props")) return;
    const p = aHoja(e);

    // redimensionar
    const asa = e.target.dataset && e.target.dataset.asa;
    if (asa) {
      const it = items.find(i => i.id === e.target.parentElement.dataset.id);
      if (it) { apunta(); arrastre = { tipo: "tam", it, asa, p0: p, o: { ...it } }; return; }
    }

    /* El DERECHO mueve la hoja, en cualquier herramienta. También el del
       medio, la barra espaciadora y la herramienta mano. */
    if (herramienta === "mano" || e.button === 2 || e.button === 1 || window.__labEspacio) {
      panEnCurso = { x: e.clientX, y: e.clientY, o: { ...pan } };
      canvas.classList.add("arrastrando");
      return;
    }

    const nodoEl = e.target.closest(".lab-el");
    const idSvg = e.target.dataset ? e.target.dataset.id : null;

    if (herramienta === "sel") {
      if (nodoEl || idSvg) {
        const id = nodoEl ? nodoEl.dataset.id : idSvg;
        if (!e.shiftKey && !sel.has(id)) sel.clear();
        sel.add(id);
        apunta();
        arrastre = { tipo: "mover", p0: p, o: {} };
        sel.forEach(i => { const it = items.find(x => x.id === i); if (it) arrastre.o[i] = { x: it.x, y: it.y, x1: it.x1, y1: it.y1, x2: it.x2, y2: it.y2 }; });
        pinta();
        return;
      }
      if (!e.shiftKey) { sel.clear(); pinta(); }
      cajaSel = { x: e.clientX, y: e.clientY };
      return;
    }

    if (herramienta === "lapiz") {
      trazo = { pts: [[p.x, p.y]], vista: "" };
      return;
    }
    if (herramienta === "nota") { nota(p.x, p.y); usa("sel"); return; }
    if (herramienta === "texto") {
      const t = texto(p.x, p.y);
      setTimeout(() => editar(t.id), 20);
      usa("sel"); return;
    }
    if (herramienta === "rect" || herramienta === "elipse") {
      apunta();
      const it = { id: uid(), t: herramienta, x: p.x, y: p.y, w: 1, h: 1, color, grosor };
      items.push(it);
      arrastre = { tipo: "dibuja", it, p0: p };
      return;
    }
    if (herramienta === "flecha" || herramienta === "linea") {
      apunta();
      const it = { id: uid(), t: herramienta, x1: p.x, y1: p.y, x2: p.x, y2: p.y, color, grosor };
      items.push(it);
      arrastre = { tipo: "linea", it };
      return;
    }
  }

  function mueve(e) {
    if (panEnCurso) {
      pan.x = panEnCurso.o.x + (e.clientX - panEnCurso.x);
      pan.y = panEnCurso.o.y + (e.clientY - panEnCurso.y);
      aplica(); return;
    }
    if (trazo) {
      const p = aHoja(e);
      trazo.pts.push([p.x, p.y]);
      trazo.vista = `<path d="${ruta(trazo.pts)}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round"/>`;
      pintaSvg(items.filter(i => i.t === "trazo" || i.t === "flecha" || i.t === "linea"));
      return;
    }
    if (cajaSel) {
      const c = document.getElementById("labSelBox");
      const x = Math.min(cajaSel.x, e.clientX), y = Math.min(cajaSel.y, e.clientY);
      const r = canvas.getBoundingClientRect();
      c.style.display = "block";
      c.style.left = (x - r.left) + "px"; c.style.top = (y - r.top) + "px";
      c.style.width = Math.abs(e.clientX - cajaSel.x) + "px";
      c.style.height = Math.abs(e.clientY - cajaSel.y) + "px";
      return;
    }
    if (!arrastre) return;
    const p = aHoja(e);
    const dx = p.x - (arrastre.p0 ? arrastre.p0.x : 0), dy = p.y - (arrastre.p0 ? arrastre.p0.y : 0);

    if (arrastre.tipo === "mover") {
      const movidos = [];
      sel.forEach(id => {
        const it = items.find(x => x.id === id), o = arrastre.o[id];
        if (!it || !o) return;
        if (it.t === "flecha" || it.t === "linea") {
          it.x1 = o.x1 + dx; it.y1 = o.y1 + dy; it.x2 = o.x2 + dx; it.y2 = o.y2 + dy;
        } else { it.x = o.x + dx; it.y = o.y + dy; }
        movidos.push(it);
      });
      /* y ahora se pega a lo que tenga cerca */
      const g = buscaGuias(movidos);
      if (g.dx || g.dy) movidos.forEach(it => {
        if (it.x == null) { it.x1 += g.dx; it.x2 += g.dx; it.y1 += g.dy; it.y2 += g.dy; }
        else { it.x += g.dx; it.y += g.dy; }
      });
      guias = g.lineas;
      pinta(); return;
    }
    if (arrastre.tipo === "dibuja") {
      const it = arrastre.it;
      it.x = Math.min(arrastre.p0.x, p.x); it.y = Math.min(arrastre.p0.y, p.y);
      it.w = Math.abs(p.x - arrastre.p0.x); it.h = Math.abs(p.y - arrastre.p0.y);
      pinta(); return;
    }
    if (arrastre.tipo === "linea") {
      arrastre.it.x2 = p.x; arrastre.it.y2 = p.y;
      pinta(); return;
    }
    if (arrastre.tipo === "tam") {
      const { it, asa, o } = arrastre;
      if (asa.includes("e")) it.w = Math.max(24, o.w + dx);
      if (asa.includes("s")) it.h = Math.max(24, o.h + dy);
      if (asa.includes("w")) { it.w = Math.max(24, o.w - dx); it.x = o.x + (o.w - it.w); }
      if (asa.includes("n")) { it.h = Math.max(24, o.h - dy); it.y = o.y + (o.h - it.h); }
      pinta(); return;
    }
  }

  function arriba(e) {
    if (panEnCurso) { panEnCurso = null; canvas.classList.remove("arrastrando"); return; }
    if (trazo) {
      if (trazo.pts.length > 1) {
        apunta();
        items.push({ id: uid(), t: "trazo", d: ruta(trazo.pts), color, grosor });
        guarda();
      }
      trazo = null; pinta(); return;
    }
    if (cajaSel) {
      const c = document.getElementById("labSelBox");
      const r = canvas.getBoundingClientRect();
      const x1 = (Math.min(cajaSel.x, e.clientX) - r.left - pan.x) / zoom;
      const y1 = (Math.min(cajaSel.y, e.clientY) - r.top - pan.y) / zoom;
      const x2 = (Math.max(cajaSel.x, e.clientX) - r.left - pan.x) / zoom;
      const y2 = (Math.max(cajaSel.y, e.clientY) - r.top - pan.y) / zoom;
      items.forEach(it => {
        const ix = it.x != null ? it.x : Math.min(it.x1, it.x2);
        const iy = it.y != null ? it.y : Math.min(it.y1, it.y2);
        if (ix >= x1 && ix <= x2 && iy >= y1 && iy <= y2) sel.add(it.id);
      });
      c.style.display = "none"; cajaSel = null; pinta(); return;
    }
    if (arrastre) { guarda(); arrastre = null; guias = []; pinta(); }
  }

  const ruta = pts => pts.map((p, i) => (i ? "L" : "M") + Math.round(p[0]) + "," + Math.round(p[1])).join(" ");

  /* ── escribir dentro de una nota o un texto ── */
  function editar(id) {
    const n = mundo.querySelector(`.lab-el[data-id="${id}"]`);
    const it = items.find(x => x.id === id);
    if (!n || !it) return;
    n.contentEditable = "true";
    n.focus();
    const rng = document.createRange(); rng.selectNodeContents(n);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(rng);
    const fin = () => {
      n.contentEditable = "false";
      apunta(); it.texto = n.textContent; guarda(); pinta();
    };
    n.addEventListener("blur", fin, { once: true });
    n.addEventListener("keydown", ev => {
      ev.stopPropagation();
      if (ev.key === "Escape" || (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey))) { ev.preventDefault(); n.blur(); }
    });
  }

  /* ════════ TECLADO ════════ */
  function teclas(e) {
    if (!activo()) return;
    const a = document.activeElement;
    if (a && (a.isContentEditable || a.tagName === "INPUT" || a.tagName === "TEXTAREA")) return;

    if (e.code === "Space") { window.__labEspacio = true; canvas.classList.add("mano"); }
    const cmd = e.metaKey || e.ctrlKey;
    if (cmd && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? rehacer() : deshacer(); return; }
    if (cmd && e.key.toLowerCase() === "d") { e.preventDefault(); duplica(); return; }
    if (cmd && e.key.toLowerCase() === "a") { e.preventDefault(); items.forEach(i => sel.add(i.id)); pinta(); return; }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (!sel.size) return;
      e.preventDefault(); apunta();
      items = items.filter(i => !sel.has(i.id));
      sel.clear(); guarda(); pinta(); return;
    }
    if (e.key === "Escape") { sel.clear(); pinta(); usa("sel"); return; }
    if (cmd) return;
    const atajos = { v:"sel", h:"mano", n:"nota", t:"texto", r:"rect", o:"elipse", f:"flecha", l:"lapiz" };
    const h = atajos[e.key.toLowerCase()];
    if (h) usa(h);
  }
  function teclasArriba(e) { if (e.code === "Space") { window.__labEspacio = false; if (herramienta !== "mano") canvas.classList.remove("mano"); } }

  function duplica() {
    if (!sel.size) return;
    apunta();
    const nuevos = [];
    sel.forEach(id => {
      const it = items.find(x => x.id === id); if (!it) return;
      const c = JSON.parse(JSON.stringify(it)); c.id = uid();
      if (c.x != null) { c.x += 24; c.y += 24; } else { c.x1 += 24; c.y1 += 24; c.x2 += 24; c.y2 += 24; }
      nuevos.push(c);
    });
    items.push(...nuevos);
    sel = new Set(nuevos.map(n => n.id));
    guarda(); pinta();
  }

  /* ════════ HERRAMIENTAS ════════ */
  function usa(h) {
    herramienta = h;
    document.querySelectorAll(".lab-h[data-h]").forEach(b => b.classList.toggle("on", b.dataset.h === h));
    canvas.classList.toggle("mano", h === "mano");
    canvas.classList.toggle("dibuja", ["lapiz","rect","elipse","flecha","linea"].includes(h));
    canvas.classList.toggle("texto", h === "texto" || h === "nota");
    const props = document.getElementById("labProps");
    if (props) props.classList.toggle("on", ["lapiz","rect","elipse","flecha","linea","nota"].includes(h));
  }

  const activo = () => el && el.classList.contains("on");

  /* ════════ MONTAJE ════════ */
  function monta() {
    if (montado) return;
    montado = true;
    el = document.getElementById("labWrap");
    canvas = document.getElementById("labCanvas");
    mundo = document.getElementById("labMundo");
    svg = document.getElementById("labSvg");

    document.querySelectorAll(".lab-h[data-h]").forEach(b => b.onclick = () => usa(b.dataset.h));
    const pal = document.getElementById("labPaleta");
    COLORES.forEach(c => {
      const b = document.createElement("button");
      b.className = "lab-col" + (c === color ? " on" : "");
      b.style.background = c; b.title = c;
      b.onclick = () => {
        color = c;
        pal.querySelectorAll(".lab-col").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        if (sel.size) { apunta(); sel.forEach(id => { const it = items.find(x => x.id === id); if (it) it.color = c; }); guarda(); pinta(); }
      };
      pal.appendChild(b);
    });
    const gr = document.getElementById("labGrosor");
    GROSORES.forEach((g, i) => {
      const b = document.createElement("button");
      b.className = i === 0 ? "on" : "";
      b.innerHTML = `<i style="width:${g + 6}px;height:${g}px"></i>`;
      b.onclick = () => {
        grosor = g;
        gr.querySelectorAll("button").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
      };
      gr.appendChild(b);
    });

    /* El botón del enlace abre el video. Se atiende antes que el arrastre:
       si no, al pulsarlo se movería la tarjeta en vez de abrir nada. */
    canvas.addEventListener("mousedown", e => {
      const ir = e.target.closest && e.target.closest(".lk-ir");
      if (!ir) return;
      e.stopPropagation(); e.preventDefault();
      const n = ir.closest(".lab-el");
      const it = items.find(x => x.id === (n && n.dataset.id));
      if (it && it.url) window.open(it.url, "_blank", "noopener");
    }, true);

    canvas.addEventListener("mousedown", abajo);
    document.addEventListener("mousemove", mueve);
    document.addEventListener("mouseup", arriba);
    canvas.addEventListener("dblclick", e => {
      const n = e.target.closest(".lab-el");
      if (n) { const it = items.find(x => x.id === n.dataset.id); if (it && (it.t === "nota" || it.t === "texto")) editar(it.id); }
      else { const p = aHoja(e); const t = texto(p.x, p.y); setTimeout(() => editar(t.id), 20); }
    });
    canvas.addEventListener("contextmenu", e => e.preventDefault());
    canvas.addEventListener("dragstart", e => e.preventDefault());
    /* La rueda SIEMPRE hace zoom, con o sin Ctrl: en un lienzo, desplazar
       arriba y abajo con la rueda no sirve de nada. Para moverse se arrastra
       con la mano, con la barra espaciadora o con el botón del medio. */
    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const paso = Math.min(0.12, Math.abs(e.deltaY) / 400);
      const k = e.deltaY > 0 ? 1 - paso : 1 + paso;
      const nz = Math.min(4, Math.max(0.2, zoom * k));
      pan.x = mx - (mx - pan.x) * (nz / zoom);
      pan.y = my - (my - pan.y) * (nz / zoom);
      zoom = nz;
      aplica();
    }, { passive: false });

    // soltar archivos encima
    canvas.addEventListener("dragover", e => e.preventDefault());
    canvas.addEventListener("drop", e => {
      e.preventDefault();
      const p = aHoja(e);
      [...(e.dataTransfer.files || [])].forEach((f, i) => {
        if (!f.type.startsWith("image/")) return;
        const fr = new FileReader();
        fr.onload = ev => imagen(ev.target.result, p.x + i * 24, p.y + i * 24);
        fr.readAsDataURL(f);
      });
    });

    document.addEventListener("paste", alPegar);
    document.addEventListener("keydown", teclas);
    document.addEventListener("keyup", teclasArriba);

    document.getElementById("labMas").onclick = () => { zoom = Math.min(4, zoom * 1.15); aplica(); };
    document.getElementById("labMenos").onclick = () => { zoom = Math.max(0.2, zoom / 1.15); aplica(); };
    document.getElementById("labReset").onclick = () => { zoom = 1; pan = { x: 0, y: 0 }; aplica(); };
    document.getElementById("labBorra").onclick = () => {
      if (!items.length) return;
      if (!confirm("¿Vaciar el laboratorio? Esto no se puede deshacer desde aquí.")) return;
      apunta(); items = []; sel.clear(); guarda(); pinta();
    };
    carga();
    usa("sel");
    pinta();
  }

  /* ── la abre el planner desde su botón ── */
  window.abrirLab = function (btn) {
    monta();
    if (typeof spyActive !== "undefined" && spyActive && typeof closeYtSpy === "function") closeYtSpy();
    if (typeof covActive !== "undefined" && covActive && typeof closeCoverAll === "function") closeCoverAll();
    if (typeof setActiveNav === "function") setActiveNav(btn);
    const bw = document.getElementById("boardWrap"); if (bw) bw.style.display = "none";
    const tc = document.getElementById("treeCanvas"); if (tc) tc.style.display = "none";
    el.classList.add("on");
    if (typeof view !== "undefined") window.view = "lab";
    pinta();
  };
  window.cerrarLab = function () { if (el) el.classList.remove("on"); };
})();
