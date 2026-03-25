import { state } from "./state.js";
import {
  guardarFavorito,
  eliminarFavorito,
  esFavorito,
  obtenerFavoritos,
  limpiarFavoritos,
} from "./persistance.js";

export function iniciarUI() {
  iniciarIntro();
  iniciarHamburguesa();
}

// Animación de intro y aparición de página principal
function iniciarIntro() {
  const intro = document.getElementById("intro");
  const pagina = document.getElementById("pagina-principal");

  // Si no hay intro o página, no bloquea
  if (!intro || !pagina) {
    if (pagina) pagina.classList.add("visible");
    return;
  }

  setTimeout(() => {
    intro.classList.add("saliendo");

    setTimeout(() => {
      intro.style.display = "none";
      pagina.classList.add("visible");
    }, 650);
  }, 3200);

  // Failsafe (por si algo falla)
  setTimeout(() => {
    pagina.classList.add("visible");
    if (intro) intro.style.display = "none";
  }, 5000);
}

// Menú hamburguesa para móvil
function iniciarHamburguesa() {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("abierto");
    navLinks.classList.toggle("abierto");
  });
}

// ── TARJETAS ───────────────────────────────────────────────────

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
      _toggleFavorito(show, e.target);
    });
  });
}

// Genera el HTML de una tarjeta
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

// Alterna favorito y actualiza el botón
function _toggleFavorito(show, btn) {
  if (esFavorito(show.id)) {
    eliminarFavorito(show.id);
    btn.textContent = "♡";
  } else {
    guardarFavorito(show);
    btn.textContent = "♥";
  }
}

// ── PAGINACIÓN ─────────────────────────────────────────────────

export function renderizarPaginacion() {
  const infoPagina = document.getElementById("info-pagina");
  const btnsPagina = document.getElementById("btns-pagina");

  if (!infoPagina || !btnsPagina) return;

  const totalPaginas = Math.ceil(
    state.showsFiltrados.length / state.itemsPorPagina
  );
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

// Genera botones numerados con elipsis
function generarNumerosPagina(paginaActual, totalPaginas) {
  let html = "";

  for (let i = 1; i <= totalPaginas; i++) {
    if (
      i === 1 ||
      i === totalPaginas ||
      (i >= paginaActual - 1 && i <= paginaActual + 1)
    ) {
      html += `<button class="btn-pagina numero ${i === paginaActual ? "active" : ""}" data-pagina="${i - 1}">${i}</button>`;
    } else if (i === paginaActual - 2 || i === paginaActual + 2) {
      html += `<button class="btn-pagina" disabled>...</button>`;
    }
  }

  return html;
}

// ── FAVORITOS ──────────────────────────────────────────────────

export function renderizarFavoritos() {
  const contenedor  = document.getElementById("contenedor-favoritos");
  const estadoVacio = document.getElementById("estado-vacio");

  if (!contenedor) return;

  // Usa persistence.js en lugar de localStorage directamente
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

  // Eliminar favorito individual
  contenedor.querySelectorAll(".btn-eliminar-fav").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      eliminarFavorito(parseInt(e.target.dataset.id));
      renderizarFavoritos();
    });
  });

  // Limpiar todos los favoritos
  const btnLimpiar = document.getElementById("btn-limpiar");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      limpiarFavoritos();
      renderizarFavoritos();
    });
  }
}