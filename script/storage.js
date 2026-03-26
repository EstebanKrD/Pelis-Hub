// claves
const CLAVE_FAVORITOS = "pelishub-favoritos";
const CLAVE_ITEMS_POR_PAGINA = "pelishub-items-por-pagina";

// leer storage
function leerStorage(clave, defecto = []) {
  try {
    const data = localStorage.getItem(clave);
    return data ? JSON.parse(data) : defecto;
  } catch {
    return defecto;
  }
}

// guardar storage
function guardarStorage(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.error(error);
  }
}

// obtener favoritos
export function obtenerFavoritos() {
  return leerStorage(CLAVE_FAVORITOS);
}

// guardar favorito
export function guardarFavorito(show) {
  const favoritos = obtenerFavoritos();

  if (!favoritos.some(f => f.id === show.id)) {
    favoritos.push(show);
    guardarStorage(CLAVE_FAVORITOS, favoritos);
  }
}

// eliminar favorito
export function eliminarFavorito(id) {
  const nuevos = obtenerFavoritos().filter(f => f.id !== id);
  guardarStorage(CLAVE_FAVORITOS, nuevos);
}

// verificar favorito
export function esFavorito(id) {
  return obtenerFavoritos().some(f => f.id === id);
}

// limpiar favoritos
export function limpiarFavoritos() {
  localStorage.removeItem(CLAVE_FAVORITOS);
}

// guardar items por página
export function guardarItemsPorPagina(cantidad) {
  try {
    localStorage.setItem(CLAVE_ITEMS_POR_PAGINA, String(cantidad));
  } catch (error) {
    console.error(error);
  }
}

// obtener items por página
export function obtenerItemsPorPagina() {
  try {
    const valor = localStorage.getItem(CLAVE_ITEMS_POR_PAGINA);
    return valor ? parseInt(valor) : null;
  } catch {
    return null;
  }
}