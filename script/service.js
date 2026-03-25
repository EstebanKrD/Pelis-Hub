import { state } from "./state.js";
import { renderizarTarjetas, renderizarPaginacion, paginarShows } from "./ui.js";

export function configurarBuscador() {
  const input = document.getElementById("input-busqueda");

  if (!input) return;

  input.addEventListener("input", async (e) => {
    const valor = e.target.value.trim();

    if (valor === "") {
      state.showsFiltrados = state.todosLosShows;
    } else {
      const res = await fetch(
        https://api.tvmaze.com/search/shows?q=${valor}
      );
      const data = await res.json();

      // ⚠️ IMPORTANTE: la API devuelve { show: {...} }
      state.showsFiltrados = data.map((item) => item.show);
    }

    state.paginaActual = 0;

    renderizarTarjetas(paginarShows());
    renderizarPaginacion();
  });
}