// ===== Constants =====
const STORAGE_KEY = 'sw-memorabilia-collection';

const SAMPLE_ITEMS = [
  {
    id: crypto.randomUUID(),
    name: 'Darth Vader Helmet (1:1 Replica)',
    category: 'Helmets/Masks',
    condition: 'Mint',
    date: '2024-05-04',
    price: 499.99,
    image: '',
    notes: 'Limited edition Black Series replica, #217 of 500.',
    createdAt: Date.now()
  },
  {
    id: crypto.randomUUID(),
    name: 'Vintage Boba Fett Action Figure',
    category: 'Action Figures',
    condition: 'Good',
    date: '2021-12-25',
    price: 150.00,
    image: '',
    notes: 'Original 1979 Kenner figure. Minor paint wear on helmet.',
    createdAt: Date.now() - 1000
  },
  {
    id: crypto.randomUUID(),
    name: 'A New Hope Original Theatrical Poster',
    category: 'Posters',
    condition: 'Near Mint',
    date: '2023-08-15',
    price: 320.00,
    image: '',
    notes: 'Style A one-sheet, Tom Jung artwork. Professionally framed.',
    createdAt: Date.now() - 2000
  },
  {
    id: crypto.randomUUID(),
    name: 'Luke Skywalker Force FX Lightsaber',
    category: 'Lightsabers',
    condition: 'Mint',
    date: '2024-01-10',
    price: 249.99,
    image: '',
    notes: 'Hasbro Black Series with stand and display case.',
    createdAt: Date.now() - 3000
  }
];

// ===== State =====
let collection = [];
let editingId = null;

// ===== DOM Elements =====
const dom = {
  grid: document.getElementById('item-grid'),
  emptyState: document.getElementById('empty-state'),
  modalOverlay: document.getElementById('modal-overlay'),
  modalTitle: document.getElementById('modal-title'),
  form: document.getElementById('item-form'),
  formId: document.getElementById('form-id'),
  formName: document.getElementById('form-name'),
  formCategory: document.getElementById('form-category'),
  formCondition: document.getElementById('form-condition'),
  formDate: document.getElementById('form-date'),
  formPrice: document.getElementById('form-price'),
  formImage: document.getElementById('form-image'),
  formNotes: document.getElementById('form-notes'),
  btnAdd: document.getElementById('btn-add'),
  btnCancel: document.getElementById('btn-cancel'),
  searchInput: document.getElementById('search-input'),
  filterCategory: document.getElementById('filter-category'),
  filterCondition: document.getElementById('filter-condition'),
  sortSelect: document.getElementById('sort-select'),
  statTotal: document.getElementById('stat-total'),
  statValue: document.getElementById('stat-value'),
  statCategories: document.getElementById('stat-categories')
};

// ===== Storage =====
function loadCollection() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      collection = JSON.parse(data);
    } else {
      collection = SAMPLE_ITEMS;
      saveCollection();
    }
  } catch {
    collection = SAMPLE_ITEMS;
    saveCollection();
  }
}

function saveCollection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

// ===== CRUD =====
function addItem(item) {
  collection.push(item);
  saveCollection();
  render();
}

function updateItem(id, updates) {
  const idx = collection.findIndex(i => i.id === id);
  if (idx !== -1) {
    collection[idx] = { ...collection[idx], ...updates };
    saveCollection();
    render();
  }
}

function deleteItem(id) {
  if (!confirm('Delete this item from your collection?')) return;
  collection = collection.filter(i => i.id !== id);
  saveCollection();
  render();
}

// ===== Filtering & Sorting =====
function getFilteredItems() {
  const search = dom.searchInput.value.toLowerCase().trim();
  const category = dom.filterCategory.value;
  const condition = dom.filterCondition.value;
  const sort = dom.sortSelect.value;

  let items = collection.filter(item => {
    if (search && !item.name.toLowerCase().includes(search)) return false;
    if (category && item.category !== category) return false;
    if (condition && item.condition !== condition) return false;
    return true;
  });

  const [field, dir] = sort.split('-');
  items.sort((a, b) => {
    let valA, valB;
    if (field === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (field === 'date') {
      valA = a.createdAt || 0;
      valB = b.createdAt || 0;
    } else if (field === 'price') {
      valA = a.price || 0;
      valB = b.price || 0;
    }
    if (valA < valB) return dir === 'asc' ? -1 : 1;
    if (valA > valB) return dir === 'asc' ? 1 : -1;
    return 0;
  });

  return items;
}

// ===== Rendering =====
function conditionClass(condition) {
  return 'badge-condition-' + condition.toLowerCase().replace(/\s+/g, '-');
}

function renderCard(item) {
  const imageHtml = item.image
    ? `<img class="card-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.outerHTML='<div class=\\'card-placeholder\\'>✦</div>'">`
    : '<div class="card-placeholder">✦</div>';

  const dateStr = item.date
    ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return `
    <article class="item-card" data-id="${item.id}">
      ${imageHtml}
      <div class="card-body">
        <div class="card-name">${escapeHtml(item.name)}</div>
        <div class="card-badges">
          <span class="badge badge-category">${escapeHtml(item.category)}</span>
          <span class="badge ${conditionClass(item.condition)}">${escapeHtml(item.condition)}</span>
        </div>
        <div class="card-details">
          ${item.price ? `<span class="card-price">$${Number(item.price).toFixed(2)}</span>` : ''}
          ${dateStr ? `<span>Acquired: ${dateStr}</span>` : ''}
        </div>
        ${item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : ''}
        <div class="card-actions">
          <button class="btn btn-edit" onclick="openEditModal('${item.id}')">✎ Edit</button>
          <button class="btn btn-danger" onclick="deleteItem('${item.id}')">✕ Delete</button>
        </div>
      </div>
    </article>
  `;
}

function renderStats() {
  dom.statTotal.textContent = collection.length;

  const totalValue = collection.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  dom.statValue.textContent = '$' + totalValue.toFixed(2);

  const counts = {};
  collection.forEach(i => {
    counts[i.category] = (counts[i.category] || 0) + 1;
  });

  dom.statCategories.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `<span class="category-chip">${escapeHtml(cat)}<span class="chip-count">${count}</span></span>`)
    .join('');
}

function render() {
  const items = getFilteredItems();
  if (items.length === 0) {
    dom.grid.innerHTML = '';
    dom.emptyState.style.display = 'block';
  } else {
    dom.emptyState.style.display = 'none';
    dom.grid.innerHTML = items.map(renderCard).join('');
  }
  renderStats();
}

// ===== Modal =====
function openAddModal() {
  editingId = null;
  dom.modalTitle.textContent = 'Add Item';
  dom.form.reset();
  dom.formId.value = '';
  dom.modalOverlay.classList.add('active');
  dom.formName.focus();
}

function openEditModal(id) {
  const item = collection.find(i => i.id === id);
  if (!item) return;
  editingId = id;
  dom.modalTitle.textContent = 'Edit Item';
  dom.formId.value = item.id;
  dom.formName.value = item.name;
  dom.formCategory.value = item.category;
  dom.formCondition.value = item.condition;
  dom.formDate.value = item.date || '';
  dom.formPrice.value = item.price || '';
  dom.formImage.value = item.image || '';
  dom.formNotes.value = item.notes || '';
  dom.modalOverlay.classList.add('active');
  dom.formName.focus();
}

function closeModal() {
  dom.modalOverlay.classList.remove('active');
  editingId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();

  const data = {
    name: dom.formName.value.trim(),
    category: dom.formCategory.value,
    condition: dom.formCondition.value,
    date: dom.formDate.value || '',
    price: parseFloat(dom.formPrice.value) || 0,
    image: dom.formImage.value.trim(),
    notes: dom.formNotes.value.trim()
  };

  if (editingId) {
    updateItem(editingId, data);
  } else {
    addItem({
      id: crypto.randomUUID(),
      ...data,
      createdAt: Date.now()
    });
  }

  closeModal();
}

// ===== Utilities =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== Event Listeners =====
dom.btnAdd.addEventListener('click', openAddModal);
dom.btnCancel.addEventListener('click', closeModal);
dom.form.addEventListener('submit', handleFormSubmit);

dom.modalOverlay.addEventListener('click', (e) => {
  if (e.target === dom.modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

dom.searchInput.addEventListener('input', render);
dom.filterCategory.addEventListener('change', render);
dom.filterCondition.addEventListener('change', render);
dom.sortSelect.addEventListener('change', render);

// ===== Init =====
loadCollection();
render();
