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

## Pendientes: la app de escritorio de Diego, ya dentro  ✅ hecho

**Hecho la noche del 30 sep 2026.** Sustituyó a "Tareas personales".

- `/pendientes` es la pantalla. La vieja `/tareas-personales` redirige ahí.
- La captura de corrido (`Grabar módulo 4 #master @viernes !!`) sale con etiqueta,
  plazo y urgencia: `lib/pendientes-parse.ts` y `lib/pendientes-fechas.ts` son el
  mismo parser de la app de escritorio, portado.
- Cuatro tipos con su color (TAREA, IDEA, VIDEO, SKOOL), filtros con su cuenta,
  buscador, subtareas plegables, y las hechas recogidas abajo.
- `PersonalTask` creció para esto: tipo, prioridad, plazo, etiquetas, orden y
  `PersonalSubtask`. Más `externalId`, el id que la tarea tenía en el Mac.
- **Cada acción comprueba que la fila es de quien la pide**, sin excepción para
  administradores. Esta lista es privada.

### La app de escritorio sincroniza con la plataforma

`POST /api/pendientes/sync` recibe los cambios del Mac y devuelve los de aquí, en la
misma llamada. Cuando los dos tocaron lo mismo, **gana el más reciente** por
`updatedAt`. Probado en las dos direcciones, borrados incluidos.

La app del Mac no es un navegador con sesión: manda una llave en la cabecera
(`lib/sync-token.ts`), derivada de `AUTH_SECRET` y del id de la persona. No se guarda
en ninguna tabla y da acceso **solo a los pendientes de esa persona**. `AUTH_SECRET`
las invalida todas de golpe. `scripts/llave-sync.mjs` saca la de alguien.

El middleware deja pasar `/api/pendientes/` y `/api/perfil/foto` sin sesión de
navegador; si no, la app recibía el HTML del login.

`pendientes.clubdemonetizacion.com` **ya no existe como herramienta**: redirige aquí.
Su `/api/` sigue en pie un tiempo por si algo apunta todavía ahí.

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

## El login: ya se entra con las cuentas del Club  ✅ hecho

**Hecho el 30 sep 2026 en la rama `login-club`, sin fusionar todavía.** Google ya no
está: `src/auth.ts` usa un proveedor de credenciales que valida contra el panel, la
pantalla de `/login` pide correo y contraseña, y `src/lib/panel-club.ts` es el único
sitio que habla con el panel. Las 12 comprobaciones de `pruebas/panel-club.mts` pasan
contra el panel de verdad, y el proyecto compila.

**Antes de fusionarla a `main`, ojo:** al desplegarla, **todo el mundo deja de entrar
con Google de golpe** y necesita su cuenta de administrador del panel del Club. Diego
confirmó el 30 sep 2026 que los cinco del equipo ya están dados de alta ahí. Aun así,
que lo vea alguien antes de fusionar.

Lo que sigue en pie del diseño original:


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

## Desafíos: el juego de los creadores  🚧 borrador, rama `desafios`

**Hecho el 7 oct 2026, sin fusionar.** Un apartado donde cada creador del Club da de alta
sus páginas (Instagram, TikTok, YouTube, Facebook), anota sus seguidores, gana insignias
por escalones y compite en una tabla clasificatoria. Pensado para vivir en un subdominio
propio (`desafios.…`) cuando Diego apruebe el DNS; mientras tanto es `/desafios`, con su
propia cabecera (no la barra del equipo) y un enlace «Borrador» en el menú, **solo para
administradores**.

- **Qué hay:** `/desafios` (Mi camino: nivel, próximas metas, primeros pasos), `/retos`
  (todas las insignias), `/clasificacion` (puntos, audiencia, crecimiento a 30 días),
  `/paginas` (alta de páginas, avances, perfil), `/creador/[id]` (la ficha que ve cualquiera)
  y `/admin` (moderación, solo ADMIN).
- **El catálogo vive en el código, no en la base:** `lib/desafios.ts` (escalones, rangos,
  puntos, niveles, metas). Cambiar un escalón o añadir uno más alto no pide migrar nada;
  las insignias ganadas se guardan por su `clave`. `pruebas/desafios.mts` lo comprueba.
- **Insignias de seguidores y audiencia se ganan solas** al anotar la cifra. **Las de video
  (vistas y likes) se reclaman**, con enlace y/o captura opcionales: se puede reclamar sin
  prueba. Reclamar un escalón alto concede los de abajo (`origenClave`).
- **Moderación:** el equipo puede quitar una insignia (queda quién y por qué; una revocada
  **no se vuelve a ganar sola**), devolverla, corregir una cifra, sacar a alguien de la tabla,
  dejarle una nota o borrar su perfil. Quitar un escalón alto quita también los que colgaban.
- **Seguidores automáticos: solo YouTube**, con la API pública de Google y `YOUTUBE_API_KEY`
  (opcional). Instagram, TikTok y Facebook no dejan leer eso sin ser una app aprobada por
  ellas, así que se anota a mano. Lo leído de YouTube lleva sello y no se pisa a mano.
- **Monetización e ingresos (8 oct 2026):** la primera meta de todos es **activar la
  monetización** (insignia que se reclama, en cualquier plataforma). Aparte, cada quien anota
  lo que gana por mes y plataforma (`/desafios/monetizacion`, **siempre en dólares**, una fila
  por persona-red-mes: volver a anotarlo corrige, no suma). Con ello se ganan solas las
  insignias de dinero, de $1 a $1M; anotar $1 o más también activa la monetización.
- **Privacidad, decidida por cada persona:** «Salir en la tabla», «Mostrar mis cifras de
  seguidores» y «Mostrar cuánto gano». **Los ingresos arrancan ocultos.** Lo oculto se quita en
  el servidor (`aVista` y `filasDeLaTabla` en `lib/desafios-data.ts`): no llega ni al HTML ni a
  los datos del navegador de otra persona. Las insignias normales se ven siempre; las de
  dinero se ocultan con los ingresos. La dueña y el equipo (ADMIN) lo ven todo. Los puntos y
  el nivel cuentan todo, para no cambiar según quién mire.
- **Demo pública, sin cuenta (`/demo`):** la misma interfaz en solo lectura, con los perfiles
  de demostración, para que cualquiera con el enlace vea cómo funciona (se elige con quién
  mirarlo: empezando, intermedio, monetizando, grande). **Es la única parte de Desafíos que se
  abre sin sesión**, y toca `authorized` en `src/auth.ts` con una sola línea (permitir `/demo`),
  igual que ya se permite `/api/pendientes/`. Es segura por construcción: cada consulta de
  `lib/desafios-data.ts` bajo «La demostración pública» lleva `esDemo = true` en el `where`, no
  hay ninguna acción que escriba, y un perfil real por `/demo/creador/…` da 404. Si se borran los
  perfiles de mentira, `/demo` queda vacía. Las pantallas viven en `components/desafios/vistas/`
  y las comparten la versión real y la demo. **Al publicar de verdad, decidir si `/demo` se queda
  o se quita** (borrar la carpeta `src/app/demo` y la línea de `src/auth.ts`).
- **⚠ PERFILES DE DEMOSTRACIÓN, A BORRAR ANTES DE PUBLICAR.** Para enseñarle Desafíos a Diego
  hay 4 creadores **inventados** (Camila Ortega, Andrés Paredes, Mateo Quintero y Sofía Lara)
  con páginas y cifras que no existen, de 1 semana, 3 meses y 6 meses de historia. Llevan la
  marca «Demo» y un aviso en su perfil. No tienen usuario, así que no salen en la lista del
  equipo. Para quitarlos: `node scripts/desafios-demo.mjs --quitar` (solo borra filas con
  `esDemo = true`; nunca toca un perfil real). Para volver a crearlos: el mismo script sin
  opciones. **Antes de abrir Desafíos a los creadores, o de dejarlo sin el aviso de borrador,
  corre `--quitar`.**
- **Tablas nuevas, nada tocado:** `PerfilCreador`, `CuentaSocial`, `AvanceCuenta`,
  `LogroCreador`, `IngresoCreador` y cuatro enums. Verificado con `prisma migrate diff` contra el esquema de
  `main`: solo `CREATE TYPE`, `CREATE TABLE`, índices y claves foráneas; **ningún `ALTER` ni
  `DROP` sobre tablas existentes**. Aun así, regla 2: respaldo (`scripts/respaldar-db.mjs`)
  y aviso antes del `db push` contra producción.

**Pendiente de decidir antes de abrirlo a los creadores:**

1. **Cómo entran los creadores.** Hoy `main` solo deja entrar a administradores del panel
   (el login con Google se quitó). Para que entren creadores hace falta un segundo camino
   de acceso. Ojo: el papel `MIEMBRO` ya existe (es el de `mirar` del panel) y hoy ve todo
   el panel del equipo en solo lectura; antes de abrir nada, un miembro tiene que quedar
   **limitado a `/desafios`** (en `authorized` de `src/auth.ts`). Es un cambio de
   autenticación: hay que hablarlo con Diego, no se hizo.
2. **El subdominio:** cuando esté el DNS, reescribir el host `desafios.…` a `/desafios`
   (en `next.config.ts`, excluyendo `/api` y `/_next`) y poner la URL en `metadata`.
3. **Fotos y capturas** se guardan en la base como texto (igual que las fotos de perfil).
   Con muchos creadores conviene moverlas a un almacén de archivos.

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

## La identidad es la del Club, no una parecida

El sistema visual sale de `club.css` (el del panel y la Bóveda) y está en
`app/globals.css`: los cuatro tonos del dorado, los seis del azul noche, las tarjetas
con su degradado y su sombra, las dos auroras del fondo, los botones `.btn-oro` y
`.btn-fantasma`, las pastillas `.chip`, y las tipografías Inter y Space Grotesk.

**Si se cambia algo allá, se cambia aquí.** Es una sola identidad, no tres parecidas.
Y el dorado lleva **texto oscuro** (`#1a1200`): con blanco no se lee.

Las tarjetas de Pendientes (`.item-pendiente`) copian la animación de la app de
escritorio, con sus mismos tiempos y su misma curva.

Los colores del perfil se recargan junto con la revalidación contra el panel: un
cambio de identidad se ve sin tener que volver a entrar.

## Estilo

Contestar **en español**. El código y los nombres de archivo se quedan como están.
