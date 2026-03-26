import { state } from "./state.js";
import { renderizarTarjetas, renderizarPaginacion, paginarShows } from "./ui.js";

export function configurarBuscador() {
  const input = document.getElementById("input-buscar");
  const btnBuscar = document.getElementById("btn-buscar");
  if (!input) return;

  const ejecutarBusqueda = async () => {
    const valor = input.value.trim();

    if (valor === "") {
      state.showsFiltrados = state.todosLosShows;
    } else {
      try {
        const res = await fetch(
          `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(valor)}`
        );
        const data = await res.json();
        state.showsFiltrados = data.map((item) => item.show);
      } catch (err) {
        console.error("Error en búsqueda:", err);
        return;
      }
    }

    state.paginaActual = 0;
    renderizarTarjetas(paginarShows());
    renderizarPaginacion();
  };

  // Búsqueda en tiempo real con debounce
  let timeout;
  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(ejecutarBusqueda, 400);
  });

  // Búsqueda al presionar Enter
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(timeout);
      ejecutarBusqueda();
    }
  });

  // Botón "Buscar"
  if (btnBuscar) {
    btnBuscar.addEventListener("click", () => {
      clearTimeout(timeout);
      ejecutarBusqueda();
    });
  }
}

export async function obtenerShows(pagina = 0) {
  const res = await fetch(`https://api.tvmaze.com/shows?page=${pagina}`);
  return await res.json();
}