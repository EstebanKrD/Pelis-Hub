export const state = {
  // Datos principales
  todosLosShows: [],
  showsFiltrados: [],

  // Paginación
  paginaActual: 0,
  itemsPorPagina: 12,

  // Filtros y búsqueda
  busqueda: "",
  generoSeleccionado: "",

  // UI / estado
  cargando: false,
  error: null,

  // Opcional (para futuro)
  totalPaginas: 0
};