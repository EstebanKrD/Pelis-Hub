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
import { esFavorito, guardarFavorito, eliminarFavorito } from "./storage.js";

window.addEventListener("load", async () => {
  iniciarUI();

  const ruta = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const idShow = params.get("id");

  const esInicio   = ruta.includes("index.html") || ruta === "/" || ruta.endsWith("/");
  const esFavoritos = ruta.includes("favorito.html");
  const esDetalles  = ruta.includes("detalles.html");

  // ── PÁGINA DE INICIO ─────────────────────────────────────────
  if (esInicio) {
    try {
      const itemsGuardados = obtenerItemsPorPagina();
      if (itemsGuardados) state.itemsPorPagina = parseInt(itemsGuardados);

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

  // ── PÁGINA DE FAVORITOS ──────────────────────────────────────
  if (esFavoritos) {
    iniciarPaginaFavoritos();
  }

  // ── PÁGINA DETALLES — vista individual si hay ?id= ───────────
  if (esDetalles && idShow) {
    await cargarDetalleShow(idShow);
    return;
  }

  // ── PÁGINA DETALLES — vista de filtros (sin ?id) ─────────────
  if (esDetalles && !idShow) {
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

// ── DETALLE INDIVIDUAL ────────────────────────────────────────
async function cargarDetalleShow(id) {
  const seccionFiltros = document.getElementById("seccion-filtros");
  const seccionDetalle = document.getElementById("seccion-detalle");

  if (seccionFiltros) seccionFiltros.style.display = "none";
  if (seccionDetalle) seccionDetalle.style.display = "block";

  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${id}`);
    if (!res.ok) throw new Error("No encontrado");
    const show = await res.json();
    renderizarDetalle(show);
  } catch (err) {
    console.error(err);
    const contenido = document.getElementById("detalle-contenido");
    if (contenido) contenido.innerHTML = `
      <div class="estado-vacio">
        <div class="icono">⚠️</div>
        <h3>Error al cargar</h3>
        <p>No se pudo obtener la información de esta serie.</p>
      </div>`;
  }
}

function renderizarDetalle(show) {
  const contenido = document.getElementById("detalle-contenido");
  if (!contenido) return;

  const imagen   = show.image?.original || show.image?.medium || "";
  const nombre   = show.name || "Sin nombre";
  const generos  = (show.genres || []).map(g => `<span class="genero-tag">${g}</span>`).join("");
  const rating   = show.rating?.average || "N/A";
  const idioma   = show.language || "N/A";
  const estado   = show.status || "N/A";
  const estreno  = show.premiered
    ? new Date(show.premiered).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";
  const resumen  = show.summary || "<em>Sin resumen disponible.</em>";
  const esFav    = esFavorito(show.id);

  contenido.innerHTML = `
    <button class="btn-volver" id="btn-volver">← Volver</button>

    <div class="detalle-hero">
      <div class="detalle-imagen-wrap">
        ${imagen ? `<img src="${imagen}" alt="${nombre}">` : `<div class="sin-imagen">🎬</div>`}
      </div>

      <div class="detalle-info">
        <h1 class="detalle-nombre">${nombre}</h1>
        <div class="detalle-badges">${generos}</div>

        <div class="detalle-meta">
          <div class="meta-item">
            <span class="meta-label">⭐ Rating</span>
            <span class="meta-valor">${rating}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">🌐 Idioma</span>
            <span class="meta-valor">${idioma}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">📡 Estado</span>
            <span class="meta-valor estado-badge estado-${estado.toLowerCase().replace(/\s/g, "-")}">${estado}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">📅 Estreno</span>
            <span class="meta-valor">${estreno}</span>
          </div>
        </div>

        <button class="btn-fav-detalle ${esFav ? "btn-fav-activo" : ""}" id="btn-fav-detalle" data-id="${show.id}">
          ${esFav ? "♥ En favoritos" : "♡ Agregar a favoritos"}
        </button>
      </div>
    </div>

    <div class="detalle-resumen">
      <h2>Resumen</h2>
      <div class="detalle-resumen-texto">${resumen}</div>
    </div>
  `;

  // Botón volver
  document.getElementById("btn-volver")?.addEventListener("click", () => {
    history.length > 1 ? history.back() : (window.location.href = "detalles.html");
  });

  // Botón favorito
  const btnFav = document.getElementById("btn-fav-detalle");
  btnFav?.addEventListener("click", () => {
    const id = parseInt(btnFav.dataset.id);
    if (esFavorito(id)) {
      eliminarFavorito(id);
      btnFav.textContent = "♡ Agregar a favoritos";
      btnFav.classList.remove("btn-fav-activo");
    } else {
      guardarFavorito(show);
      btnFav.textContent = "♥ En favoritos";
      btnFav.classList.add("btn-fav-activo");
    }
  });
}

// ── RENDERIZADO DE RESULTADOS EN detalles.html ────────────────
function renderizarResultados(shows) {
  const contenedor  = document.getElementById("contenedor-resultados");
  const estadoVacio = document.getElementById("estado-resultado-vacio");
  if (!contenedor) return;

  if (!shows || shows.length === 0) {
    contenedor.innerHTML = "";
    if (estadoVacio) estadoVacio.style.display = "flex";
    return;
  }

  if (estadoVacio) estadoVacio.style.display = "none";

  import("./storage.js").then(({ esFavorito, guardarFavorito, eliminarFavorito }) => {
    contenedor.innerHTML = shows.map((show) => {
      const imagen  = show.image?.medium || "";
      const nombre  = show.name || "Sin nombre";
      const generos = show.genres?.slice(0, 2).join(" · ") || "Sin género";
      const rating  = show.rating?.average || "N/A";
      const fav     = esFavorito(show.id);

      return `
        <div class="card">
          <div class="card-imagen">
            ${imagen ? `<img src="${imagen}" alt="${nombre}" loading="lazy">` : `<div class="sin-imagen">🎬</div>`}
            ${rating !== "N/A" ? `<span class="card-rating">★ ${rating}</span>` : ""}
          </div>
          <div class="card-body">
            <p class="card-titulo">${nombre}</p>
            <div class="card-generos"><span class="genero-tag">${generos}</span></div>
          </div>
          <div class="card-acciones">
            <button class="btn-primario btn-detalle" data-id="${show.id}">Ver más</button>
            <button class="btn-secundario btn-favorito" data-id="${show.id}">${fav ? "♥" : "♡"}</button>
          </div>
        </div>`;
    }).join("");

    contenedor.querySelectorAll(".btn-detalle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        window.location.href = `detalles.html?id=${e.target.dataset.id}`;
      });
    });

    contenedor.querySelectorAll(".btn-favorito").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id   = parseInt(e.target.dataset.id);
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
  const input    = document.getElementById("input-buscar");
  const btnBuscar = document.getElementById("btn-buscar");
  if (!input) return;

  const ejecutarBusqueda = async () => {
    const valor = input.value.trim();
    if (valor === "") {
      renderizarResultados(state.todosLosShows.slice(0, 20));
      return;
    }
    try {
      const res  = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(valor)}`);
      const data = await res.json();
      renderizarResultados(data.map((item) => item.show));
      guardarEnHistorial(valor);
      actualizarHistorialUI();
    } catch (err) {
      console.error("Error buscando:", err);
    }
  };

  let timeout;
  input.addEventListener("input", () => { clearTimeout(timeout); timeout = setTimeout(ejecutarBusqueda, 400); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { clearTimeout(timeout); ejecutarBusqueda(); } });
  if (btnBuscar) btnBuscar.addEventListener("click", () => { clearTimeout(timeout); ejecutarBusqueda(); });
}

// ── HISTORIAL ─────────────────────────────────────────────────
const CLAVE_HISTORIAL = "pelishub-historial";

function obtenerHistorial() {
  try { return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || []; }
  catch { return []; }
}

function guardarEnHistorial(termino) {
  if (!termino) return;
  let h = obtenerHistorial().filter((x) => x !== termino);
  h.unshift(termino);
  localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(h.slice(0, 8)));
}

function configurarHistorial() {
  actualizarHistorialUI();
  document.getElementById("btn-limpiar-historial")?.addEventListener("click", () => {
    localStorage.removeItem(CLAVE_HISTORIAL);
    actualizarHistorialUI();
  });
}

function actualizarHistorialUI() {
  const lista       = document.getElementById("Historial-lista");
  const estadoVacio = document.getElementById("estado-historial-vacio");
  if (!lista) return;

  const historial = obtenerHistorial();

  if (historial.length === 0) {
    lista.innerHTML = "";
    if (estadoVacio) estadoVacio.style.display = "flex";
    return;
  }

  if (estadoVacio) estadoVacio.style.display = "none";

  lista.innerHTML = historial.map((term) => `
    <button class="pill historial-item" data-termino="${term}">🔍 ${term}</button>
  `).join("");

  lista.querySelectorAll(".historial-item").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const input = document.getElementById("input-buscar");
      if (input) input.value = btn.dataset.termino;
      try {
        const res  = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(btn.dataset.termino)}`);
        const data = await res.json();
        renderizarResultados(data.map((i) => i.show));
      } catch (err) { console.error(err); }
    });
  });
}