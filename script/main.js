

import { state } from './state.js';
import { obtenerShows } from './service.js';
import { obtenerItemsPorPagina } from './storage.js';
import { renderizarTarjetas, iniciarUI } from './ui.js';
import { configurarBuscador } from './service.js';
import { configurarFiltros, renderizarPaginacion, paginarShows } from './ui.js';

window.addEventListener('load', async () => {
  iniciarUI();

  const itemsGuardados = obtenerItemsPorPagina();
  if (itemsGuardados) {
    state.itemsPorPagina = parseInt(itemsGuardados);
  }

  const shows = await obtenerShows(0);
  state.todosLosShows  = shows;
  state.showsFiltrados = shows;

  renderizarTarjetas(paginarShows());
  renderizarPaginacion();
  configurarBuscador();
  configurarFiltros();
});