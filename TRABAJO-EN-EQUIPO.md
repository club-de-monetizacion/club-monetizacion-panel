# Trabajo en equipo — contexto para Claude Code

Este archivo lo lee tu Claude en cada sesión. Lo escribió el Claude de Diego el 29 de
septiembre de 2026, después de leer este código. Si algo de aquí ya no es cierto,
corrígelo: es documentación viva, no un decreto.

## Quiénes somos

Dos personas desarrollan esta app **a la vez**, cada una con su propio Claude Code:

| Quién | Qué hace |
|---|---|
| **César** (`skaterrgg-tech`) | editor de Diego. Construyó esta app. No programa a mano: se lo pide a Claude. |
| **Diego Cabrera** (`diegocabrera22`) | dueño del Club de Monetización. Tiene una app de escritorio (Electron) que se está fusionando con esta. |

El repositorio vive en la organización **`club-de-monetizacion`**, que es del Club, no de
ninguno de los dos. Los dos pedimos cambios sobre el mismo código, al mismo tiempo.

## Qué estamos haciendo

**Fusionar dos apps de tareas en una.** Esta es la que se queda.

Diego tenía una app de escritorio en su Mac. Se desarma y se le trae **solo lo que una
web no puede hacer sola**:

1. **Un botón flotante** siempre encima de todo, en todos los escritorios y sobre apps
   a pantalla completa. Se pulsa y se captura un pendiente sin cambiar de ventana.
2. **Un atajo global** (`⌘⇧Espacio`) que abre esa caja desde cualquier programa.
3. **Notificaciones** del sistema: un aviso al día por cada tarea con el plazo
   cumplido, hasta que se marque hecha. En el Mac y en el iPhone.

Todo lo demás de esta app —Kanban, calendario, comentarios, adjuntos, tareas
recurrentes, ideas, soporte— **se queda tal cual**. No se rehace nada.

Cómo queda al final:

```
  Esta web (Next.js)  ──  el cerebro: datos, usuarios y todas las vistas
         │
         ├── iPhone: esta misma web instalada en la pantalla de inicio
         │
         └── Mac: una app de Electron que carga esta web
                  + el botón flotante nativo (captura rápida)
                  + el atajo global
                  + las notificaciones del sistema
```

La app de Electron **ya sabe cargar esta web por dentro** (está hecho y probado en el
repositorio `diegocabrera22/pendientes`, ajuste `webUrl`). Lo que falta es cómo captura.

## Lo que hace falta de este lado

### 1. Una ruta para la captura rápida  ← lo primero

Esta app no tiene API: `src/app/api/` solo tiene `auth/[...nextauth]`, y todo lo demás
son **server actions** en `src/app/actions/`. Una app de escritorio no puede llamar a
una server action: no es un navegador con cookies de sesión.

Hace falta una ruta de API pequeña, algo como `POST /api/captura`, que reciba un texto
y cree la tarea. Cómo se autentica está por decidir (lo natural: un token por
dispositivo, guardado en el llavero del Mac). **Esto no está diseñado todavía** — hay
que hablarlo antes de escribirlo.

### 2. Dónde caen las capturas

¿A `PersonalTask` (la lista privada de cada uno), a `Task` en el Kanban, o a una
bandeja de entrada nueva que luego se reparte? Sin decidir.

Lo que Diego captura hoy tiene: texto, un tipo (**tarea, idea, video, skool**),
prioridad, plazo, etiquetas libres con `#` y subtareas. Hay que ver qué se mapea a
`TaskType` / `TaskCategory` / `ChecklistItem` y qué se añade.

### 3. Las 18 tareas de Diego

Están en el JSON de su Mac. **Hay que pasarlas a Postgres antes de retirar esa app**,
con respaldo y comprobando una por una. No se apaga nada hasta que estén aquí y él las
vea.

## El login: se quita Google, se entra con las cuentas del Club

Decisión de Diego (29 sep 2026). Hoy `src/auth.ts` usa el proveedor de Google y
`ADMIN_EMAILS` para repartir el rol `ADMIN`. Va a entrar con **el mismo correo y
contraseña del panel del Club**, y **solo los administradores** — los miembros
normales del Club no deben poder entrar.

El motivo es práctico: los accesos se dan y se quitan **en un solo sitio**, el panel de
Diego, y valen para todo.

**El panel ya tiene lo necesario y no hay que cambiarle nada.** Probado el 29 sep 2026
llamándolo desde fuera:

```
POST https://panel.clubdemonetizacion.com/api/encuesta
     {"action":"entrarEquipo","email":"…","clave":"…"}
  →  200 {"ok":true,"tok":"…","nombre":"…","rol":"maestro|equipo|mirar"}
  →  401 {"error":"Correo o contraseña incorrectos"}

POST https://panel.clubdemonetizacion.com/api/encuesta
     {"action":"yo","tok":"…"}
  →  200 {"ok":true,"rol":"…","email":"…"}     (sesión válida)
  →  401 {"error":"Sesión caducada"}
```

Responde a cualquier origen (`access-control-allow-origin: *`), así que se puede llamar
desde el servidor sin problema.

### Cómo se implementa

En `src/auth.ts`, quitar `Google(...)` de `providers` y poner un `Credentials(...)` con
correo y contraseña. Su `authorize()` **no valida ninguna contraseña por su cuenta**:
reenvía los datos a `entrarEquipo` y obedece la respuesta del panel. Con el
`{tok, nombre, rol}` que devuelve se crea la sesión. El `signIn` que hoy consulta
`ADMIN_EMAILS` pasa a mapear el rol que manda el panel:

| Rol en el panel | `Role` aquí |
|---|---|
| `maestro` | `ADMIN` |
| `equipo` | `ADMIN` (son los administradores del Club) |
| `mirar` | solo lectura — por decidir si es `MIEMBRO` o un rol nuevo |
| cualquier otro | **no entra** |

Reglas de esto:

1. **Las contraseñas no se guardan aquí.** No se añade ninguna columna de contraseña,
   no se hashea nada, no se importa nada. El panel es la única fuente de verdad.
2. **El panel (`encuesta-club`) no se modifica.** Es producción con alumnos que
   pagaron. Esta app solo lo consulta.
3. Guardar el `tok` en el JWT y **revalidarlo** con `{"action":"yo","tok":…}`: si
   devuelve 401, se cierra la sesión. Así, cuando en el panel se le quita el acceso a
   alguien, deja de entrar sin esperar a que caduque.
4. `PrismaAdapter` y los modelos `Account` / `Session` son del flujo OAuth; con
   credenciales y JWT hay que revisar qué sigue haciendo falta. El `User` se sigue
   creando por correo en el primer login.

**No es urgente**: primero la captura rápida. Si al mirarlo ves un problema con este
diseño, dilo antes de programarlo.

## Reglas que no se rompen

1. **Jamás se pierden tareas.** Son datos reales de gente que trabaja con ellos.
   Respaldo antes de tocar el esquema, una migración o cualquier borrado en lote.
2. **Nada de `prisma db push` contra producción sin respaldo y sin avisar.** Un cambio
   de esquema mal hecho borra columnas con datos dentro.
3. **El panel del Club no se modifica** (regla 2 del login).
4. **Las contraseñas no se copian aquí** (regla 1 del login).
5. **Nada de claves ni secretos en el repositorio.** Variables de entorno, siempre. Si
   encuentras un `.env` dentro del historial de git, avisa antes de hacer nada.

## Cómo no pisarnos

Somos dos tocando el mismo repositorio, y ninguno quiere despertar con la app rota por
un cambio del otro.

**Antes de empezar a trabajar:**

```bash
git pull --no-rebase
```

Mezcla, **no rebase**: deja muchos menos estados a medias y ningún commit perdido.

**Antes de subir**, comprobar que la app sigue entera:

```bash
npm run build     # si no compila, no se sube
npm run lint
```

Y después:

```bash
git add -A && git commit -m "lo que cambiaste, en una frase" && git push
```

**Lo que está en el repositorio siempre tiene que arrancar**, porque el otro se lo baja
a ciegas.

Si hay conflicto al mezclar: **resolverlo, nunca descartar lo del otro.** Si no está
claro cuál de las dos versiones es la buena, preguntar antes de decidir.

### Cuando un cambio afecta al otro

Si tocas el esquema de Prisma, una ruta de la API o cómo se autentica, **dilo en el
mensaje del commit** y avísale a tu humano para que se lo diga al otro. El botón
flotante del Mac va a llamar a esta app: un cambio ahí lo rompe desde el otro lado sin
que se note nada aquí.

## Estilo

Contestar **en español**. El código y los nombres de archivo se quedan como están.
