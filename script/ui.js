// ui.js
import { state } from "./state.js";
import {
  guardarFavorito,
  eliminarFavorito,
  esFavorito,
  obtenerFavoritos,
  limpiarFavoritos,
} from "./storage.js";

// ── INICIO ────────────────────────────────────────
export function iniciarUI() {
  iniciarIntro();
  iniciarHamburguesa();
  configurarFiltros();
  configurarSelectorItemsPorPagina();
}

// ── INTRO ────────────────────────────────────────
function iniciarIntro() {
  const intro = document.getElementById("intro");
  const pagina = document.getElementById("pagina-principal");
  if (!intro || !pagina) return;

  intro.style.display = "flex";

  setTimeout(() => {
    intro.classList.add("saliendo");
    setTimeout(() => {
      intro.style.display = "none";
      pagina.classList.add("visible");
    }, 650);
  }, 2200);
}

// ── MENÚ HAMBURGUESA ─────────────────────────────
function iniciarHamburguesa() {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("abierto");
    navLinks.classList.toggle("abierto");
  });
}

// ── SELECTOR ITEMS POR PÁGINA ─────────────────────
function configurarSelectorItemsPorPagina() {
  const select = document.getElementById("items-por-pagina");
  if (!select) return;

  select.value = String(state.itemsPorPagina);

  select.addEventListener("change", (e) => {
    state.itemsPorPagina = parseInt(e.target.value);
    state.paginaActual = 0;
    try {
      localStorage.setItem("pelishub-items-por-pagina", String(state.itemsPorPagina));
    } catch {}
    renderizarTarjetas(paginarShows());
    renderizarPaginacion();
  });
}

// ── TARJETAS ─────────────────────────────────────
export function renderizarTarjetas(shows) {
  const contenedor = document.getElementById("contenedor-cards");
  if (!contenedor) return;

  if (shows.length === 0) {
    contenedor.innerHTML = `
      <div class="estado-vacio">
        <div class="icono">🎬</div>
        <h3>Sin Resultados</h3>
        <p>No se encontraron series. Intenta otra búsqueda.</p>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = shows.map((show) => crearTarjeta(show)).join("");

  contenedor.querySelectorAll(".btn-detalle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      window.location.href = `detalles.html?id=${id}`;
    });
  });

  contenedor.querySelectorAll(".btn-favorito").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.dataset.id);
      const show = shows.find((s) => s.id === id);
      if (show) _toggleFavorito(show, e.target);
    });
  });
}

function crearTarjeta(show) {
  const imagen  = show.image?.medium || "";
  const nombre  = show.name || "Sin nombre";
  const generos = show.genres?.slice(0, 2).join(" · ") || "Sin género";
  const rating  = show.rating?.average || "N/A";
  const favorito = esFavorito(show.id);

  return `
    <div class="card">
      <div class="card-imagen">
        ${imagen
          ? `<img src="${imagen}" alt="${nombre}" loading="lazy">`
          : `<div class="sin-imagen">🎬</div>`
        }
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
          ${favorito ? "♥" : "♡"}
        </button>
      </div>
    </div>
  `;
}

function _toggleFavorito(show, btn) {
  if (esFavorito(show.id)) {
    eliminarFavorito(show.id);
    btn.textContent = "♡";
  } else {
    guardarFavorito(show);
    btn.textContent = "♥";
  }
  renderizarFavoritos();
  renderizarTarjetas(paginarShows());
}

// ── PAGINACIÓN ─────────────────────────────────
export function renderizarPaginacion() {
  const infoPagina = document.getElementById("info-pagina");
  const btnsPagina = document.getElementById("btns-pagina");
  if (!infoPagina || !btnsPagina) return;

  const totalPaginas = Math.ceil(state.showsFiltrados.length / state.itemsPorPagina);
  const paginaActual = state.paginaActual + 1;

  infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;

  btnsPagina.innerHTML = `
    <button class="btn-pagina" id="btn-anterior" ${state.paginaActual === 0 ? "disabled" : ""}>← Anterior</button>
    ${generarNumerosPagina(paginaActual, totalPaginas)}
    <button class="btn-pagina" id="btn-siguiente" ${state.paginaActual >= totalPaginas - 1 ? "disabled" : ""}>Siguiente →</button>
  `;

  document.getElementById("btn-anterior")?.addEventListener("click", () => {
    if (state.paginaActual > 0) {
      state.paginaActual--;
      actualizarVista();
    }
  });

  document.getElementById("btn-siguiente")?.addEventListener("click", () => {
    if (state.paginaActual < totalPaginas - 1) {
      state.paginaActual++;
      actualizarVista();
    }
  });

  document.querySelectorAll(".btn-pagina.numero").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.paginaActual = parseInt(btn.dataset.pagina);
      actualizarVista();
    });
  });
}

function actualizarVista() {
  renderizarTarjetas(paginarShows());
  renderizarPaginacion();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function paginarShows() {
  const inicio = state.paginaActual * state.itemsPorPagina;
  const fin = inicio + state.itemsPorPagina;
  return state.showsFiltrados.slice(inicio, fin);
}

function generarNumerosPagina(paginaActual, totalPaginas) {
  let html = "";
  for (let i = 1; i <= totalPaginas; i++) {
    if (i === 1 || i === totalPaginas || (i >= paginaActual - 1 && i <= paginaActual + 1)) {
      html += `<button class="btn-pagina numero ${i === paginaActual ? "active" : ""}" data-pagina="${i - 1}">${i}</button>`;
    } else if (i === paginaActual - 2 || i === paginaActual + 2) {
      html += `<button class="btn-pagina" disabled>...</button>`;
    }
  }
  return html;
}

// ── FAVORITOS ─────────────────────────────────
export function renderizarFavoritos() {
  const contenedor  = document.getElementById("contenedor-favoritos");
  const estadoVacio = document.getElementById("estado-vacio");
  if (!contenedor) return;

  const favoritos = obtenerFavoritos();

  if (favoritos.length === 0) {
    contenedor.innerHTML = "";
    if (estadoVacio) estadoVacio.style.display = "flex";
    return;
  }

  if (estadoVacio) estadoVacio.style.display = "none";

  contenedor.innerHTML = favoritos.map((show) => `
    <div class="card">
      <div class="card-imagen">
        ${show.image?.medium
          ? `<img src="${show.image.medium}" alt="${show.name}" loading="lazy">`
          : `<div class="sin-imagen">🎬</div>`
        }
      </div>
      <div class="card-body">
        <p class="card-titulo">${show.name}</p>
        <div class="card-generos">
          <span class="genero-tag">${show.genres?.slice(0, 2).join(" · ") || "Sin género"}</span>
        </div>
      </div>
      <div class="card-acciones">
        <button class="btn-primario btn-detalle" data-id="${show.id}">Ver más</button>
        <button class="btn-peligro btn-eliminar-fav" data-id="${show.id}">Eliminar</button>
      </div>
    </div>
  `).join("");

  contenedor.querySelectorAll(".btn-detalle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      window.location.href = `detalles.html?id=${e.target.dataset.id}`;
    });
  });

  contenedor.querySelectorAll(".btn-eliminar-fav").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      eliminarFavorito(parseInt(e.target.dataset.id));
      renderizarFavoritos();
    });
  });

  const btnLimpiar = document.getElementById("btn-limpiar");
  if (btnLimpiar) {
    btnLimpiar.replaceWith(btnLimpiar.cloneNode(true));
    const btnNuevo = document.getElementById("btn-limpiar");
    if (btnNuevo) {
      btnNuevo.addEventListener("click", () => {
        limpiarFavoritos();
        renderizarFavoritos();
      });
    }
  }
}

export function iniciarPaginaFavoritos() {
  renderizarFavoritos();
}

// ── FILTROS ─────────────────────────────────
// El parámetro `callbackRender` permite usar esta función en detalles.html
// con un renderizador diferente. Si no se pasa, usa renderizarTarjetas.
export function configurarFiltros(callbackRender = null) {
  document.querySelectorAll(".pill[data-genero]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pill[data-genero]").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");

      const genero = btn.dataset.genero;
      state.showsFiltrados =
        genero === "todos"
          ? state.todosLosShows
          : state.todosLosShows.filter((s) => s.genres?.includes(genero));

      state.paginaActual = 0;

      if (callbackRender) {
        // En detalles.html: renderiza en contenedor-resultados
        callbackRender(state.showsFiltrados);
      } else {
        // En index.html: renderiza con paginación
        renderizarTarjetas(paginarShows());
        renderizarPaginacion();
      }
    });
  });
}