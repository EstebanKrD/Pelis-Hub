// Clave para localStorage
const CLAVE_FAVORITOS = "pelishub-favoritos";

// ── UTILIDADES ─────────────────────────

// Leer datos
function leerFavoritos() {
  try {
    const data = localStorage.getItem(CLAVE_FAVORITOS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Guardar datos
function guardarEnStorage(favoritos) {
  try {
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
  } catch (error) {
    console.error("Error guardando favoritos:", error);
  }
}

// ── FUNCIONES PRINCIPALES ──────────────

// Obtener favoritos
export function obtenerFavoritos() {
  return leerFavoritos();
}

// Guardar favorito
export function guardarFavorito(show) {
  const favoritos = leerFavoritos();

  if (!favoritos.some((f) => f.id === show.id)) {
    favoritos.push(show);
    guardarEnStorage(favoritos);
  }
}

// Eliminar favorito
export function eliminarFavorito(id) {
  const favoritos = leerFavoritos().filter((f) => f.id !== id);
  guardarEnStorage(favoritos);
}

// Verificar si es favorito
export function esFavorito(id) {
  return leerFavoritos().some((f) => f.id === id);
}

// Limpiar todos los favoritos
export function limpiarFavoritos() {
  localStorage.removeItem(CLAVE_FAVORITOS);
}
