/* ============================================================
   AFRICALENDAR — Script principal
   Corrections :
   - Parsing CSV robuste (virgules dans les descriptions)
   - Modal : utilise aria-hidden au lieu de l'attribut `hidden`
     pour permettre les animations CSS
   - Fermeture au clic backdrop et touche Escape
   - Filtres par type + recherche texte en temps réel
   - Couleurs de badge par catégorie
   - Accessibilité : focus piégé dans le modal
   ============================================================ */

/* ── État global ────────────────────────────────────────────── */
let eventsData     = [];
let filteredEvents = {};

const calendarGrid  = document.getElementById('calendar-grid');
const modal         = document.getElementById('event-modal');
const modalBackdrop = modal.querySelector('.modal-backdrop');
const modalContent  = modal.querySelector('.modal-content');
const closeModalBtn = document.getElementById('close-modal');
const searchInput   = document.getElementById('search-input');
const filterSelect  = document.getElementById('filter-type');
const resultsCount  = document.getElementById('results-count');
const emptyState    = document.getElementById('empty-state');

/* ── Palette des types ──────────────────────────────────────── */
const TYPE_COLORS = {
  independence : '#c95f2e',
  figure       : '#2563a8',
  festival     : '#4a7c59',
  battle       : '#8b1c1c',
  revolution   : '#7c3a8b',
  heritage     : '#8b6914',
  treaty       : '#1a6b7a',
  religion     : '#5a4a8b',
  commemoration: '#3a6b5a',
  tradition    : '#6b4a2a',
  culture      : '#2a5a8b',
  sport        : '#1a7a3a',
  unesco       : '#8b1a6b',
};

function typeColor(type) {
  const key = (type || '').toLowerCase().trim();
  return TYPE_COLORS[key] || '#5a6470';
}

/* ── 1. Chargement et parsing CSV ───────────────────────────── */
async function loadEventsData() {
  try {
    const response = await fetch('anfrica-calendar.csv');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csvText = await response.text();

    eventsData = parseCSV(csvText);
  } catch (err) {
    console.error('Erreur de chargement du CSV :', err);
    calendarGrid.innerHTML = '<p style="padding:2rem;color:var(--c-muted)">Impossible de charger les données. Vérifiez que le fichier CSV est dans le même dossier.</p>';
  }
}

/**
 * Parse un CSV en respectant les guillemets et les virgules internes.
 * Retourne un tableau d'objets { date, event, type, country, description }
 */
function parseCSV(text) {
  const rows = text.trim().split('\n');
  // Ignorer la ligne d'en-tête
  return rows.slice(1).map(row => {
    const cols = parseCSVRow(row);
    return {
      date:        (cols[0] || '').replace(/^"|"$/g, '').trim(),
      event:       (cols[1] || '').replace(/^"|"$/g, '').trim(),
      type:        (cols[2] || '').replace(/^"|"$/g, '').trim(),
      country:     (cols[3] || '').replace(/^"|"$/g, '').trim(),
      description: (cols[4] || '').replace(/^"|"$/g, '').trim(),
    };
  }).filter(ev => ev.date && ev.event);
}

/** Parse une ligne CSV en respectant les champs entre guillemets */
function parseCSVRow(row) {
  const cols = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"'; i++; // guillemet échappé ""
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}

/* ── 2. Peuplement du calendrier ────────────────────────────── */
function populateCalendar() {
  // Grouper par date
  const eventsByDate = {};
  eventsData.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  filteredEvents = eventsByDate;
  renderCards(eventsByDate);
  populateTypeFilter();
}

function renderCards(eventsByDate) {
  calendarGrid.innerHTML = '';
  const dates = Object.keys(eventsByDate);

  if (dates.length === 0) {
    emptyState.hidden = false;
    resultsCount.textContent = '';
    return;
  }
  emptyState.hidden = true;

  const total = Object.values(eventsByDate).reduce((s, arr) => s + arr.length, 0);
  resultsCount.textContent = `${total} événement${total > 1 ? 's' : ''} · ${dates.length} date${dates.length > 1 ? 's' : ''}`;

  dates.forEach(date => {
    const events = eventsByDate[date];
    const primary = events[0];
    const color   = typeColor(primary.type);

    const card = document.createElement('button');
    card.className     = 'day-card';
    card.style.setProperty('--type-color', color);
    card.setAttribute('aria-label', `${date} : ${primary.event}`);

    card.innerHTML = `
      <span class="card-date">${date}</span>
      <span class="card-badge">${primary.type || 'Événement'}</span>
      <span class="card-title">${primary.event}</span>
      <span class="card-country">${primary.country}</span>
    `;

    card.addEventListener('click', () => openModal(events));
    calendarGrid.appendChild(card);
  });
}

/* ── 3. Filtre par type ─────────────────────────────────────── */
function populateTypeFilter() {
  const types = [...new Set(eventsData.map(ev => ev.type).filter(Boolean))].sort();
  types.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    filterSelect.appendChild(opt);
  });
}

function applyFilters() {
  const query   = searchInput.value.toLowerCase().trim();
  const selType = filterSelect.value;

  const eventsByDate = {};

  eventsData.forEach(ev => {
    const matchesType    = !selType || ev.type === selType;
    const matchesSearch  = !query ||
      ev.event.toLowerCase().includes(query)       ||
      ev.country.toLowerCase().includes(query)     ||
      ev.description.toLowerCase().includes(query) ||
      ev.date.toLowerCase().includes(query);

    if (matchesType && matchesSearch) {
      if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
      eventsByDate[ev.date].push(ev);
    }
  });

  renderCards(eventsByDate);
}

searchInput.addEventListener('input', applyFilters);
filterSelect.addEventListener('change', applyFilters);

/* ── 4. Modal ───────────────────────────────────────────────── */
function openModal(events) {
  const details = modalContent.querySelector('.event-details') || (() => {
    const el = document.createElement('article');
    el.className = 'event-details';
    modalContent.appendChild(el);
    return el;
  })();

  details.innerHTML = '';

  events.forEach((ev, i) => {
    const color = typeColor(ev.type);
    const entry = document.createElement('div');
    entry.className = 'event-entry';
    entry.style.setProperty('--type-color', color);

    entry.innerHTML = `
      <p class="modal-date">${ev.date}</p>
      <span class="modal-type-badge">${ev.type || 'Événement'}</span>
      <h2 class="event-title">${ev.event}</h2>
      <p class="event-meta"><strong>Pays :</strong> ${ev.country}</p>
      <p class="event-description">${ev.description}</p>
    `;
    details.appendChild(entry);
  });

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus sur le bouton fermer (accessibilité)
  setTimeout(() => closeModalBtn.focus(), 50);
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

closeModalBtn.addEventListener('click', closeModal);

// Clic sur le backdrop
modalBackdrop.addEventListener('click', closeModal);

// Touche Escape — BUG original : non géré
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
    closeModal();
  }
});

/* ── 5. Initialisation ──────────────────────────────────────── */
async function initAfricalendar() {
  await loadEventsData();
  populateCalendar();
}

document.addEventListener('DOMContentLoaded', initAfricalendar);
