import { state } from "./state.js";
import { obtenerShows, configurarBuscador } from "./service.js";
import { obtenerItemsPorPagina } from "./storage.js";
import {
  renderizarTarjetas,
  iniciarUI,
  configurarFiltros,
  renderizarPaginacion,
  paginarShows,
  iniciarPaginaFavoritos,
} from "./ui.js";

window.addEventListener("load", async () => {
  iniciarUI();

  const ruta = window.location.pathname;

  try {
    // 🟢 INDEX
    if (ruta.includes("index.html") || ruta === "/" || ruta === "") {
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

    // 🔵 FAVORITOS
    if (ruta.includes("favorito.html")) {
      iniciarPaginaFavoritos();
    }

    // 🟣 DETALLES
    if (ruta.includes("detalles.html")) {
      // luego lo implementamos
    }
  } catch (error) {
    console.error("Error en la app:", error);
  }
});
