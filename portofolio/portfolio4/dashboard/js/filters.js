/**
 * filters.js — Interactive Filtering Engine
 */
window.QCFilters = {
  activeFilters: {
    startDate: '',
    endDate: '',
    product: '',
    parameter: '',
    line: '',
    status: ''
  },

  init(records) {
    this.populateDropdowns(records);
    this.bindEvents();
  },

  populateDropdowns(records) {
    const products = new Set();
    const parameters = new Set();
    const lines = new Set();

    records.forEach(r => {
      if (r.product) products.add(r.product);
      if (r.parameter) parameters.add(r.parameter);
      if (r.line) lines.add(r.line);
    });

    const prodSelect = document.getElementById('filterProduct');
    const paramSelect = document.getElementById('filterParameter');
    const lineSelect = document.getElementById('filterLine');

    prodSelect.innerHTML = '<option value="">Semua Produk</option>';
    paramSelect.innerHTML = '<option value="">Semua Parameter</option>';
    lineSelect.innerHTML = '<option value="">Semua Lini</option>';

    Array.from(products).sort().forEach(p => prodSelect.innerHTML += `<option value="${p}">${p}</option>`);
    Array.from(parameters).sort().forEach(p => paramSelect.innerHTML += `<option value="${p}">${p}</option>`);
    Array.from(lines).sort().forEach(l => lineSelect.innerHTML += `<option value="${l}">${l}</option>`);
  },

  bindEvents() {
    const inputs = ['filterStartDate', 'filterEndDate', 'filterProduct', 'filterParameter', 'filterLine', 'filterStatus'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.applyFilters());
      }
    });

    document.getElementById('btnResetFilters').addEventListener('click', () => this.resetFilters());

    // Mobile accordion toggle
    const accBtn = document.getElementById('filterAccordionToggle');
    if (accBtn) {
      accBtn.addEventListener('click', () => {
        document.getElementById('filterBody').classList.toggle('hidden');
      });
    }
  },

  applyFilters() {
    this.activeFilters.startDate = document.getElementById('filterStartDate').value;
    this.activeFilters.endDate = document.getElementById('filterEndDate').value;
    this.activeFilters.product = document.getElementById('filterProduct').value;
    this.activeFilters.parameter = document.getElementById('filterParameter').value;
    this.activeFilters.line = document.getElementById('filterLine').value;
    this.activeFilters.status = document.getElementById('filterStatus').value;

    const filtered = window.QCDashboard.allRecords.filter(r => {
      if (this.activeFilters.startDate && new Date(r.date) < new Date(this.activeFilters.startDate)) return false;
      if (this.activeFilters.endDate && new Date(r.date) > new Date(this.activeFilters.endDate)) return false;
      if (this.activeFilters.product && r.product !== this.activeFilters.product) return false;
      if (this.activeFilters.parameter && r.parameter !== this.activeFilters.parameter) return false;
      if (this.activeFilters.line && r.line !== this.activeFilters.line) return false;
      if (this.activeFilters.status && r.status !== this.activeFilters.status) return false;
      return true;
    });

    window.QCDashboard.filteredRecords = filtered;
    window.QCDashboard.currentPage = 1;
    window.QCDashboard.renderDashboard();

    document.getElementById('filterMatchingCount').textContent = filtered.length.toLocaleString('id-ID');
  },

  resetFilters() {
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    document.getElementById('filterProduct').value = '';
    document.getElementById('filterParameter').value = '';
    document.getElementById('filterLine').value = '';
    document.getElementById('filterStatus').value = '';
    this.applyFilters();
  }
};