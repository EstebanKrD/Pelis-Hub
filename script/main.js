import { state } from "./state.js";
import { obtenerShows, configurarBuscador } from "./service.js";
import { obtenerItemsPorPagina } from "./storage.js";
import {
  renderizarTarjetas,
  iniciarUI,
  renderizarPaginacion,
  paginarShows,
  iniciarPaginaFavoritos,
  configurarFiltros,
} from "./ui.js";

window.addEventListener("load", async () => {
  iniciarUI();

  const ruta = window.location.pathname;
  const esInicio =
    ruta.includes("index.html") || ruta === "/" || ruta.endsWith("/");
  const esFavoritos = ruta.includes("favorito.html");
  const esFiltros = ruta.includes("detalles.html");

  // ── PÁGINA DE INICIO ──────────────────────────────────────────
  if (esInicio) {
    try {
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
    } catch (error) {
      console.error("Error en inicio:", error);
    }
  }

  // ── PÁGINA DE FAVORITOS ───────────────────────────────────────
  if (esFavoritos) {
    iniciarPaginaFavoritos();
  }

  // ── PÁGINA DE FILTROS / DETALLES ──────────────────────────────
  if (esFiltros) {
    try {
      const shows = await obtenerShows(0);
      state.todosLosShows = shows;
      state.showsFiltrados = shows;

      renderizarResultados(state.showsFiltrados.slice(0, 20));
      configurarFiltros(renderizarResultados);
      configurarBuscadorFiltros();
      configurarHistorial();
    } catch (error) {
      console.error("Error en filtros:", error);
    }
  }
});

// ── RENDERIZADO DE RESULTADOS EN detalles.html ────────────────
function renderizarResultados(shows) {
  const contenedor = document.getElementById("contenedor-resultados");
  const estadoVacio = document.getElementById("estado-resultado-vacio");
  if (!contenedor) return;

  if (!shows || shows.length === 0) {
    contenedor.innerHTML = "";
    if (estadoVacio) estadoVacio.style.display = "flex";
    return;
  }

  if (estadoVacio) estadoVacio.style.display = "none";

  import("./storage.js").then(({ esFavorito, guardarFavorito, eliminarFavorito }) => {
    contenedor.innerHTML = shows
      .map((show) => {
        const imagen = show.image?.medium || "";
        const nombre = show.name || "Sin nombre";
        const generos = show.genres?.slice(0, 2).join(" · ") || "Sin género";
        const rating = show.rating?.average || "N/A";
        const fav = esFavorito(show.id);

        return `
        <div class="card">
          <div class="card-imagen">
            ${imagen
              ? `<img src="${imagen}" alt="${nombre}" loading="lazy">`
              : `<div class="sin-imagen">🎬</div>`}
            ${rating !== "N/A" ? `<span class="card-rating">★ ${rating}</span>` : ""}
          </div>
          <div class="card-body">
            <p class="card-titulo">${nombre}</p>
            <div class="card-generos">
              <span class="genero-tag">${generos}</span>
            </div>
          </div>
          <div class="card-acciones">
            <button class="btn-primario btn-detalle" data-id="${show.id}">Ver más</button>
            <button class="btn-secundario btn-favorito" data-id="${show.id}">
              ${fav ? "♥" : "♡"}
            </button>
          </div>
        </div>`;
      })
      .join("");

    contenedor.querySelectorAll(".btn-detalle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        window.location.href = `detalles.html?id=${e.target.dataset.id}`;
      });
    });

    contenedor.querySelectorAll(".btn-favorito").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);
        const show = shows.find((s) => s.id === id);
        if (!show) return;
        if (esFavorito(id)) {
          eliminarFavorito(id);
          e.target.textContent = "♡";
        } else {
          guardarFavorito(show);
          e.target.textContent = "♥";
        }
      });
    });
  });
}

// ── BUSCADOR EN detalles.html ─────────────────────────────────
function configurarBuscadorFiltros() {
  const input = document.getElementById("input-buscar");
  const btnBuscar = document.getElementById("btn-buscar");
  if (!input) return;

  const ejecutarBusqueda = async () => {
    const valor = input.value.trim();

    if (valor === "") {
      renderizarResultados(state.todosLosShows.slice(0, 20));
      return;
    }

    try {
      const res = await fetch(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(valor)}`
      );
      const data = await res.json();
      renderizarResultados(data.map((item) => item.show));
      guardarEnHistorial(valor);
      actualizarHistorialUI();
    } catch (err) {
      console.error("Error buscando:", err);
    }
  };

  let timeout;
  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(ejecutarBusqueda, 400);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(timeout);
      ejecutarBusqueda();
    }
  });

  if (btnBuscar) {
    btnBuscar.addEventListener("click", () => {
      clearTimeout(timeout);
      ejecutarBusqueda();
    });
  }
}

// ── HISTORIAL DE BÚSQUEDA ─────────────────────────────────────
const CLAVE_HISTORIAL = "pelishub-historial";

function obtenerHistorial() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || [];
  } catch {
    return [];
  }
}

function guardarEnHistorial(termino) {
  if (!termino) return;
  let historial = obtenerHistorial().filter((h) => h !== termino);
  historial.unshift(termino);
  historial = historial.slice(0, 8);
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial));
}

function configurarHistorial() {
  actualizarHistorialUI();

  const btnLimpiar = document.getElementById("btn-limpiar-historial");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      localStorage.removeItem(CLAVE_HISTORIAL);
      actualizarHistorialUI();
    });
  }
}

function actualizarHistorialUI() {
  const lista = document.getElementById("Historial-lista");
  const estadoVacio = document.getElementById("estado-historial-vacio");
  if (!lista) return;

  const historial = obtenerHistorial();

  if (historial.length === 0) {
    lista.innerHTML = "";
    if (estadoVacio) estadoVacio.style.display = "flex";
    return;
  }

  if (estadoVacio) estadoVacio.style.display = "none";

  lista.innerHTML = historial
    .map(
      (term) => `
      <button class="pill historial-item" data-termino="${term}">
        🔍 ${term}
      </button>`
    )
    .join("");

  lista.querySelectorAll(".historial-item").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const input = document.getElementById("input-buscar");
      if (input) input.value = btn.dataset.termino;

      try {
        const res = await fetch(
          `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(btn.dataset.termino)}`
        );
        const data = await res.json();
        renderizarResultados(data.map((i) => i.show));
      } catch (err) {
        console.error("Error en historial:", err);
      }
    });
  });
}