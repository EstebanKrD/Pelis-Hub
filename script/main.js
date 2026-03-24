import { state } from "./state.js";
import { obtenerShows } from "./service.js";
import { obtenerItemsPorPagina } from "./storage.js";
import { renderizarTarjetas, iniciarUI } from "./ui.js";
import { configurarBuscador } from "./service.js";
import { configurarFiltros, renderizarPaginacion, paginarShows } from "./ui.js";

window.addEventListener("load", async () => {
  iniciarUI();

  const itemsGuardados = obtenerItemsPorPagina();
  if (itemsGuardados) {
    state.itemsPorPagina = parseInt(itemsGuardados);
  }

  const shows = await obtenerShows(0);
  state.todosLosShows = shows;
  state.showsFiltrados = shows;

  renderizarTarjetas(paginarShows());
  renderizarPaginacion();
  configurarBuscador();
  configurarFiltros();
});

window.addEventListener("load", async () => {
  iniciarUI();

  const ruta = window.location.pathname;

  if (ruta.includes("index.html") || ruta === "/") {
    const itemsGuardados = obtenerItemsPorPagina();
    if (itemsGuardados) {
      state.itemsPorPagina = parseInt(itemsGuardados);
    }

    const shows = await obtenerShows(0);
    state.todosLosShows = shows;
    state.showsFiltrados = shows;

    renderizarTarjetas(paginarShows());
    renderizarPaginacion();
    configurarBuscador();
    configurarFiltros();
  }

  if (ruta.includes("favorito.html")) {
    const { iniciarPaginaFavoritos } = await import("./ui.js");
    iniciarPaginaFavoritos();
  }

  if (ruta.includes("detalles.html")) {
  }
});
