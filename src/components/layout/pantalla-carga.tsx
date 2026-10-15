/**
 * LA PANTALLA DE CARGA DEL CLUB
 *
 * La misma de `club-carga.js` (la que ve todo el dominio mientras se comprueba la
 * sesión): el logo que late, el nombre con su brillo y la barrita. Aquí sale al
 * entrar cuando el Club tarda, al cerrar sesión y cuando el vigilante te manda al
 * Club: así nunca se ve una pantalla de tareas a medias ni un formulario.
 * Los estilos están en `globals.css` (`.club-carga`).
 */
export function PantallaCarga() {
  return (
    <div className="club-carga" role="status" aria-label="Cargando">
      <div className="cc-cielo" />
      <div className="cc-trama" />
      <div className="cc-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cc-logo" src="/branding/logo-club.png" alt="" />
        <div className="cc-t">CLUB DE MONETIZACIÓN</div>
        <div className="cc-bar">
          <i />
        </div>
      </div>
    </div>
  );
}
