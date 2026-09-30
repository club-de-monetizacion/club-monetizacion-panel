"use client";

import { useState } from "react";

/**
 * Campo de contraseña con el ojo para verla. Es cliente porque hay que alternar el
 * tipo del input; el formulario que lo contiene sigue siendo una server action.
 */
export function CampoClave({
  id = "password",
  name = "password",
  label = "Contraseña",
  autoComplete = "current-password",
  ayuda,
  obligatorio = true,
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete?: string;
  ayuda?: string;
  /** Un campo obligatorio y escondido (dentro de un `details` cerrado) bloquea el
      envío del formulario sin avisar: el navegador no puede enfocarlo para pedirlo.
      Por eso el PIN, que vive escondido, no es obligatorio. */
  obligatorio?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-[var(--ink-2)]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={obligatorio}
          autoComplete={autoComplete}
          className="focus-ring w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 pr-11 text-sm text-[var(--ink-0)]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar la contraseña" : "Ver la contraseña"}
          title={visible ? "Ocultar" : "Ver"}
          className="focus-ring absolute top-1/2 right-1 -translate-y-1/2 rounded-lg p-2 text-[var(--ink-3)] transition hover:text-[var(--ink-0)]"
        >
          {visible ? (
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 3l18 18" strokeLinecap="round" />
              <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.5 2.6-3.1 4M6.2 7.3C4.2 8.8 2.7 10.9 2 12c1 2.5 5 7 10 7 1.6 0 3-.4 4.3-1.1" strokeLinecap="round" />
              <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {ayuda ? (
        <p className="mt-1.5 text-xs text-[var(--ink-3)]">{ayuda}</p>
      ) : null}
    </div>
  );
}
