"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import {
  agregarSubtarea,
  borrarPendiente,
  borrarSubtarea,
  cambiarPlazoPendiente,
  cambiarTextoPendiente,
  cambiarTipoPendiente,
  crearPendiente,
  limpiarHechos,
  marcarPendiente,
  marcarSubtarea,
  plegarSubtareas,
  type PendienteVista,
} from "@/app/actions/pendientes";
import { TIPOS, TIPO_POR_ID, type TipoId } from "@/lib/pendientes-parse";
import { MESES, comoTexto, hoyTexto, paraHoy, vencida } from "@/lib/pendientes-fechas";

/** "24 sep", o la hora si es de hoy: lo mismo que muestra la app de escritorio. */
function fechaCorta(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  const mismoDia =
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear();
  if (mismoDia) {
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  }
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

type Filtro = "todo" | "hoy" | "TAREA" | "IDEA" | "VIDEO" | "SKOOL" | "plazo";

/** Enlaces cortos, como en la app de escritorio: se ve el dominio, no el churro. */
function conEnlaces(texto: string) {
  const partes = texto.split(/(https?:\/\/[^\s]+)/g);
  return partes.map((p, i) => {
    if (!/^https?:\/\//.test(p)) return <span key={i}>{p}</span>;
    let corto = p;
    try {
      const u = new URL(p);
      corto = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? "/…" : "");
    } catch { /* si no es una dirección válida se deja tal cual */ }
    return (
      <a
        key={i}
        href={p}
        target="_blank"
        rel="noreferrer noopener"
        title={p}
        onClick={(e) => e.stopPropagation()}
        className="text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-2 hover:decoration-[var(--accent)]"
      >
        {corto}
      </a>
    );
  });
}

type Retoque =
  | { tipo: "marcar"; id: string; hecho: boolean }
  | { tipo: "borrar"; id: string }
  | { tipo: "plegar"; id: string; plegadas: boolean }
  | { tipo: "sub"; id: string; hecho: boolean }
  | { tipo: "tipo"; id: string; valor: PendienteVista["tipo"] };

/**
 * Lo que se toca se ve al instante y el servidor confirma detrás. Sin esto, cada
 * casilla que se marcaba esperaba medio segundo a que la página volviera del
 * servidor, y la app se sentía pesada aunque no lo fuera.
 */
function conRetoque(lista: PendienteVista[], r: Retoque): PendienteVista[] {
  switch (r.tipo) {
    case "borrar":
      return lista.filter((p) => p.id !== r.id);
    case "marcar":
      return lista.map((p) => (p.id === r.id ? { ...p, hecho: r.hecho } : p));
    case "plegar":
      return lista.map((p) => (p.id === r.id ? { ...p, plegadas: r.plegadas } : p));
    case "tipo":
      return lista.map((p) => (p.id === r.id ? { ...p, tipo: r.valor } : p));
    case "sub":
      return lista.map((p) => ({
        ...p,
        subtareas: p.subtareas.map((s) => (s.id === r.id ? { ...s, hecho: r.hecho } : s)),
      }));
  }
}

export function PendientesBoard({ inicial }: { inicial: PendienteVista[] }) {
  const [pendiente, arranca] = useTransition();
  const [lista0, retoca] = useOptimistic(inicial, conRetoque);
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<TipoId>("TAREA");
  const [plazo, setPlazo] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [busca, setBusca] = useState("");
  const [etiqueta, setEtiqueta] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevaSub, setNuevaSub] = useState<Record<string, string>>({});
  const campo = useRef<HTMLTextAreaElement>(null);

  const vivos = lista0.filter((p) => !p.hecho);
  const cuenta = {
    todo: vivos.length,
    hoy: vivos.filter((p) => paraHoy(p.plazo)).length,
    TAREA: vivos.filter((p) => p.tipo === "TAREA").length,
    IDEA: vivos.filter((p) => p.tipo === "IDEA").length,
    VIDEO: vivos.filter((p) => p.tipo === "VIDEO").length,
    SKOOL: vivos.filter((p) => p.tipo === "SKOOL").length,
    plazo: vivos.filter((p) => p.plazo).length,
  };
  const hechos = lista0.filter((p) => p.hecho).length;

  const lista = useMemo(() => {
    let out = lista0.filter((p) => !p.hecho);
    if (filtro === "hoy") out = out.filter((p) => paraHoy(p.plazo) || vencida(p.plazo));
    else if (filtro === "plazo") out = out.filter((p) => p.plazo);
    else if (filtro !== "todo") out = out.filter((p) => p.tipo === filtro);
    if (etiqueta) out = out.filter((p) => p.etiquetas.includes(etiqueta));
    const q = busca.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (p) =>
          p.texto.toLowerCase().includes(q) ||
          p.etiquetas.some((t) => t.includes(q)) ||
          p.subtareas.some((s) => s.texto.toLowerCase().includes(q))
      );
    }
    // Primero lo urgente, luego lo que vence antes, luego el orden de la persona.
    return [...out].sort((a, b) => {
      if (b.prioridad !== a.prioridad) return b.prioridad - a.prioridad;
      if (a.plazo && b.plazo) return a.plazo < b.plazo ? -1 : 1;
      if (a.plazo) return -1;
      if (b.plazo) return 1;
      return 0;
    });
  }, [lista0, filtro, busca, etiqueta]);

  const etiquetas = useMemo(
    () => [...new Set(vivos.flatMap((p) => p.etiquetas))].sort(),
    [lista0] // eslint-disable-line react-hooks/exhaustive-deps
  );

  function agregar() {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    setPlazo("");
    arranca(async () => {
      await crearPendiente(t, tipo, plazo || null);
    });
    campo.current?.focus();
  }

  const FILTROS: { id: Filtro; label: string; n: number }[] = [
    { id: "todo", label: "Todo", n: cuenta.todo },
    { id: "hoy", label: "Hoy", n: cuenta.hoy },
    { id: "TAREA", label: "Tareas", n: cuenta.TAREA },
    { id: "IDEA", label: "Ideas", n: cuenta.IDEA },
    { id: "VIDEO", label: "Videos", n: cuenta.VIDEO },
    { id: "SKOOL", label: "Skool", n: cuenta.SKOOL },
    { id: "plazo", label: "Con plazo", n: cuenta.plazo },
  ];

  return (
    <div className={`space-y-4 ${pendiente ? "opacity-[0.97]" : ""}`}>
      {/* ── La captura: se escribe todo de corrido y se reparte solo ── */}
      <div className="glass-panel campo-captura rounded-2xl p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
          <textarea
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                agregar();
              }
            }}
            rows={1}
            placeholder="¿Qué se te acaba de ocurrir?"
            className="focus-ring min-h-[42px] flex-1 resize-y rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-[var(--ink-0)] placeholder:text-[var(--ink-3)]"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <label
              className={`focus-ring flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs transition ${
                plazo
                  ? "border-[var(--accent)]/45 bg-[var(--accent)]/12 text-[var(--ink-0)]"
                  : "border-white/10 bg-white/5 text-[var(--ink-2)] hover:text-[var(--ink-0)]"
              }`}
              title="Para cuándo"
            >
              {plazo ? comoTexto(plazo) : "Plazo"}
              <input
                type="date"
                value={plazo}
                min={hoyTexto()}
                onChange={(e) => setPlazo(e.target.value)}
                className="w-0 opacity-0"
              />
            </label>

            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  tipo === t.id
                    ? "text-[var(--ink-0)]"
                    : "border-white/10 bg-white/5 text-[var(--ink-2)] hover:text-[var(--ink-0)]"
                }`}
                style={
                  tipo === t.id
                    ? { borderColor: `${t.color}66`, background: `${t.color}1f` }
                    : undefined
                }
              >
                {t.label}
              </button>
            ))}

            <button
              type="button"
              onClick={agregar}
              disabled={!texto.trim()}
              className="btn-oro focus-ring px-5 py-2 text-xs"
            >
              Agregar
            </button>
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-3)]">
          Escribe <code className="rounded bg-white/5 px-1 text-[var(--ink-2)]">#etiqueta</code> para
          clasificar · <code className="rounded bg-white/5 px-1 text-[var(--ink-2)]">!</code>{" "}
          importante ·{" "}
          <code className="rounded bg-white/5 px-1 text-[var(--ink-2)]">!!</code> urgente ·{" "}
          <code className="rounded bg-white/5 px-1 text-[var(--ink-2)]">@viernes</code> o{" "}
          <code className="rounded bg-white/5 px-1 text-[var(--ink-2)]">@15/10</code> pone plazo ·
          Enter para agregar
        </p>
      </div>

      {/* ── Filtros y buscador ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              filtro === f.id
                ? "border-[var(--oro)]/50 bg-[var(--oro)]/15 text-[var(--ink-0)]"
                : "border-white/10 bg-white/5 text-[var(--ink-2)] hover:text-[var(--ink-0)]"
            }`}
          >
            {f.label}{" "}
            <span className={filtro === f.id ? "text-[var(--oro-claro)]" : "text-[var(--ink-3)]"}>
              {f.n}
            </span>
          </button>
        ))}

        <div className="relative ml-auto">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar…"
            className="focus-ring w-44 rounded-full border border-white/10 bg-white/5 py-1.5 pl-3.5 pr-9 text-xs text-[var(--ink-0)] placeholder:text-[var(--ink-3)] sm:w-56"
          />
          {busca ? (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpiar la búsqueda"
              // Generoso a propósito: el de la app de escritorio era diminuto.
              className="focus-ring absolute top-1/2 right-0.5 -translate-y-1/2 rounded-full p-1.5 text-[var(--ink-3)] transition hover:bg-white/10 hover:text-[var(--ink-0)]"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>

        {hechos > 0 ? (
          <button
            type="button"
            onClick={() => arranca(async () => { await limpiarHechos(); })}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--ink-2)] transition hover:text-[var(--ink-0)]"
          >
            Limpiar hechas ({hechos})
          </button>
        ) : null}
      </div>

      {etiquetas.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {etiquetas.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEtiqueta(etiqueta === t ? null : t)}
              className={`rounded-md px-2 py-0.5 text-[11px] transition ${
                etiqueta === t
                  ? "bg-[var(--accent)]/25 text-[var(--ink-0)]"
                  : "bg-white/5 text-[var(--ink-3)] hover:text-[var(--ink-1)]"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      ) : null}

      {/* ── La lista ── */}
      {lista.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-[var(--ink-2)]">
            {cuenta.todo === 0
              ? "Nada pendiente. Escribe arriba lo primero que se te ocurra."
              : "Nada con ese filtro."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {lista.map((p) => {
            const t = TIPO_POR_ID[p.tipo as TipoId];
            const hechas = p.subtareas.filter((s) => s.hecho).length;
            const atrasada = vencida(p.plazo);
            return (
              <li
                key={p.id}
                className={`item-pendiente group px-3.5 py-3 ${
                  p.prioridad === 2 ? "p2" : p.prioridad === 1 ? "p1" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      arranca(async () => {
                        retoca({ tipo: "marcar", id: p.id, hecho: true });
                        await marcarPendiente(p.id, true);
                      })
                    }
                    aria-label="Marcar como hecha"
                    className="focus-ring mt-0.5 h-4.5 w-4.5 flex-none rounded-md border-2 border-white/20 transition hover:border-[var(--oro)] hover:bg-[var(--oro)]/20"
                  />

                  <div className="min-w-0 flex-1">
                    {editando === p.id ? (
                      <textarea
                        autoFocus
                        defaultValue={p.texto}
                        rows={Math.min(8, p.texto.split("\n").length + 1)}
                        onBlur={(e) => {
                          const v = e.target.value;
                          setEditando(null);
                          if (v.trim() && v !== p.texto) {
                            arranca(async () => { await cambiarTextoPendiente(p.id, v); });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") { setEditando(null); }
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            (e.target as HTMLTextAreaElement).blur();
                          }
                        }}
                        className="focus-ring w-full resize-y rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm whitespace-pre-wrap text-[var(--ink-0)]"
                      />
                    ) : (
                      <p
                        onClick={() => setEditando(p.id)}
                        className="cursor-text text-sm leading-relaxed whitespace-pre-wrap text-[var(--ink-0)]"
                      >
                        {conEnlaces(p.texto)}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        title="Cambiar el tipo"
                        onClick={() => {
                          const i = TIPOS.findIndex((x) => x.id === p.tipo);
                          const sig = TIPOS[(i + 1) % TIPOS.length].id;
                          arranca(async () => {
                            retoca({ tipo: "tipo", id: p.id, valor: sig });
                            await cambiarTipoPendiente(p.id, sig);
                          });
                        }}
                        className="rounded px-1.5 py-0.5 font-semibold tracking-wide transition hover:brightness-125"
                        style={{ background: `${t.color}22`, color: t.color }}
                      >
                        {t.corto}
                      </button>

                      {/* La fecha en que se capturó, como en la app de escritorio */}
                      <span className="flex items-center gap-1 text-[var(--ink-3)]" title="Cuándo lo apuntaste">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7.5V12l3 2" strokeLinecap="round" />
                        </svg>
                        {fechaCorta(p.creado)}
                      </span>

                      {p.plazo ? (
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            atrasada
                              ? "bg-red-500/15 text-red-300"
                              : paraHoy(p.plazo)
                                ? "bg-[var(--oro)]/20 text-[var(--oro-claro)]"
                                : "bg-white/5 text-[var(--ink-3)]"
                          }`}
                          title="Plazo"
                        >
                          {comoTexto(p.plazo)}
                        </span>
                      ) : null}

                      {p.etiquetas.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setEtiqueta(etiqueta === e ? null : e)}
                          className="rounded bg-white/5 px-1.5 py-0.5 text-[var(--ink-3)] transition hover:text-[var(--ink-1)]"
                        >
                          #{e}
                        </button>
                      ))}

                      {p.subtareas.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            arranca(async () => {
                              retoca({ tipo: "plegar", id: p.id, plegadas: !p.plegadas });
                              await plegarSubtareas(p.id, !p.plegadas);
                            })
                          }
                          className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[var(--ink-3)] transition hover:text-[var(--ink-1)]"
                          title={p.plegadas ? "Ver los pasos" : "Recoger los pasos"}
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {hechas}/{p.subtareas.length}
                        </button>
                      ) : null}

                      <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <label className="cursor-pointer rounded px-1.5 py-0.5 text-[var(--ink-3)] transition hover:text-[var(--ink-1)]">
                          Plazo
                          <input
                            type="date"
                            defaultValue={p.plazo ?? ""}
                            onChange={(e) =>
                              arranca(async () => {
                                await cambiarPlazoPendiente(p.id, e.target.value || null);
                              })
                            }
                            className="w-0 opacity-0"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            arranca(async () => {
                              retoca({ tipo: "borrar", id: p.id });
                              await borrarPendiente(p.id);
                            })
                          }
                          className="rounded px-1.5 py-0.5 text-[var(--ink-3)] transition hover:text-red-300"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>

                    {/* Los pasos: siempre a la vista salvo que se recojan */}
                    {!p.plegadas ? (
                      <div className={`mt-2 space-y-1.5 ${p.subtareas.length ? "border-l border-white/10 pl-3" : "pl-0.5"}`}>
                        {p.subtareas.map((s) => (
                          <div key={s.id} className="group/s flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                arranca(async () => {
                                  retoca({ tipo: "sub", id: s.id, hecho: !s.hecho });
                                  await marcarSubtarea(s.id, !s.hecho);
                                })
                              }
                              aria-label={s.hecho ? "Desmarcar" : "Marcar"}
                              className={`focus-ring h-3.5 w-3.5 flex-none rounded border-2 transition ${
                                s.hecho
                                  ? "border-[var(--oro)] bg-[var(--oro)]"
                                  : "border-white/20 hover:border-[var(--oro)]"
                              }`}
                            />
                            <span
                              className={`flex-1 text-[13px] ${
                                s.hecho ? "text-[var(--ink-3)] line-through" : "text-[var(--ink-1)]"
                              }`}
                            >
                              {s.texto}
                            </span>
                            <button
                              type="button"
                              onClick={() => arranca(async () => { await borrarSubtarea(s.id); })}
                              className="rounded px-1 text-[11px] text-[var(--ink-3)] opacity-0 transition group-hover/s:opacity-100 hover:text-red-300"
                            >
                              ×
                            </button>
                          </div>
                        ))}

                        <input
                          value={nuevaSub[p.id] ?? ""}
                          data-paso-nuevo
                          onChange={(e) => setNuevaSub({ ...nuevaSub, [p.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            const v = (nuevaSub[p.id] ?? "").trim();
                            if (!v) return;
                            setNuevaSub({ ...nuevaSub, [p.id]: "" });
                            arranca(async () => { await agregarSubtarea(p.id, v); });
                          }}
                          placeholder="+ un paso"
                          className={`focus-ring w-full rounded-lg bg-transparent px-1 py-0.5 text-[13px] text-[var(--ink-1)] placeholder:text-[var(--ink-3)]/70 hover:bg-white/[0.04] ${
                            p.subtareas.length ? "" : "opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                          }`}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Las hechas, al final y recogidas ── */}
      {hechos > 0 ? (
        <details className="glass-panel rounded-2xl p-3">
          <summary className="cursor-pointer list-none text-xs text-[var(--ink-3)] transition hover:text-[var(--ink-1)]">
            {hechos} hecha{hechos === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-1">
            {lista0
              .filter((p) => p.hecho)
              .map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-[13px]">
                  <button
                    type="button"
                    onClick={() =>
                      arranca(async () => {
                        retoca({ tipo: "marcar", id: p.id, hecho: false });
                        await marcarPendiente(p.id, false);
                      })
                    }
                    aria-label="Devolver a pendientes"
                    className="focus-ring h-3.5 w-3.5 flex-none rounded border-2 border-[var(--oro)] bg-[var(--oro)]"
                  />
                  <span className="flex-1 truncate text-[var(--ink-3)] line-through">{p.texto}</span>
                </li>
              ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
