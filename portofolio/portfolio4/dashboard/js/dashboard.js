/**
 * dashboard.js — KPI Metrics, Pivot Aggregation & Data Table Controller
 */
window.QCDashboard = {
  allRecords: [],
  filteredRecords: [],
  currentPage: 1,
  pageSize: 25,
  currentSort: { column: 'date', order: 'desc' },
  searchQuery: '',

  init(dataResult) {
    this.allRecords = dataResult.records;
    this.filteredRecords = [...this.allRecords];

    document.getElementById('connectedFileName').textContent = dataResult.source;
    document.getElementById('dataRecordBadge').textContent = `${dataResult.totalCount.toLocaleString('id-ID')} Baris Data Terverifikasi`;
    document.getElementById('kpiQualityScore').textContent = `${dataResult.qualityScore}%`;
    document.getElementById('qualityScoreFill').style.width = `${dataResult.qualityScore}%`;
    document.getElementById('filterTotalCount').textContent = dataResult.totalCount.toLocaleString('id-ID');
    document.getElementById('filterMatchingCount').textContent = dataResult.totalCount.toLocaleString('id-ID');

    QCFilters.init(this.allRecords);
    this.bindTableEvents();
    this.renderDashboard();
  },

  renderDashboard() {
    this.calculateKPIs();
    this.renderPivotTable();
    this.renderDataTable();
    QCCharts.renderAll(this.filteredRecords);
  },

  calculateKPIs() {
    const total = this.filteredRecords.length;
    let pass = 0, warn = 0, fail = 0;

    this.filteredRecords.forEach(r => {
      if (r.status === 'PASS') pass++;
      else if (r.status === 'WARNING') warn++;
      else if (r.status === 'FAIL') fail++;
    });

    const passRate = total ? ((pass / total) * 100).toFixed(1) : '0';
    const warnRate = total ? ((warn / total) * 100).toFixed(1) : '0';
    const failRate = total ? ((fail / total) * 100).toFixed(1) : '0';

    document.getElementById('kpiTotalSamples').textContent = total.toLocaleString('id-ID');
    document.getElementById('kpiPassRate').textContent = `${passRate}%`;
    document.getElementById('kpiPassCount').textContent = `${pass.toLocaleString('id-ID')} Batch Lolos`;

    document.getElementById('kpiWarningRate').textContent = `${warnRate}%`;
    document.getElementById('kpiWarningCount').textContent = `${warn.toLocaleString('id-ID')} Batch Peringatan`;

    document.getElementById('kpiFailRate').textContent = `${failRate}%`;
    document.getElementById('kpiFailCount').textContent = `${fail.toLocaleString('id-ID')} Batch Reject`;

    document.getElementById('overallPassRate').textContent = `${passRate}% Passed`;
    document.getElementById('holdBatchCount').textContent = `${warn + fail} Batch`;
  },

  // Render Aggregated Pivot Matrix
  renderPivotTable() {
    const tbody = document.getElementById('pivotSummaryTableBody');
    tbody.innerHTML = '';

    const pivotData = {};
    this.filteredRecords.forEach(r => {
      if (!pivotData[r.product]) {
        pivotData[r.product] = { total: 0, pass: 0, warn: 0, fail: 0 };
      }
      pivotData[r.product].total++;
      if (r.status === 'PASS') pivotData[r.product].pass++;
      else if (r.status === 'WARNING') pivotData[r.product].warn++;
      else if (r.status === 'FAIL') pivotData[r.product].fail++;
    });

    Object.keys(pivotData).sort().forEach(prod => {
      const d = pivotData[prod];
      const rate = ((d.pass / d.total) * 100).toFixed(1);
      const isGood = rate >= 92;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${prod}</strong></td>
        <td>${d.total.toLocaleString('id-ID')}</td>
        <td class="text-success">${d.pass.toLocaleString('id-ID')}</td>
        <td class="text-warning">${d.warn.toLocaleString('id-ID')}</td>
        <td class="text-danger">${d.fail.toLocaleString('id-ID')}</td>
        <td><strong>${rate}%</strong></td>
        <td>
          <span class="badge ${isGood ? 'badge-success' : 'badge-warning'}">
            ${isGood ? '<i class="fa-solid fa-check"></i> OPTIMAL' : '<i class="fa-solid fa-triangle-exclamation"></i> MONITOR'}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  // Render Main QC Analysis Records
  renderDataTable() {
    const tbody = document.getElementById('qcTableBody');
    tbody.innerHTML = '';

    let dataset = this.filteredRecords;

    // Search filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      dataset = dataset.filter(r =>
        r.batch.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q) ||
        r.parameter.toLowerCase().includes(q) ||
        r.inspector.toLowerCase().includes(q) ||
        r.line.toLowerCase().includes(q)
      );
    }

    // Sort
    dataset.sort((a, b) => {
      let valA = a[this.currentSort.column];
      let valB = b[this.currentSort.column];
      if (valA < valB) return this.currentSort.order === 'asc' ? -1 : 1;
      if (valA > valB) return this.currentSort.order === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination slice
    const totalItems = dataset.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const paginatedData = dataset.slice(startIndex, startIndex + this.pageSize);

    if (!paginatedData.length) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 24px; color: var(--muted);">Data tidak ditemukan untuk pencarian ini.</td></tr>`;
    } else {
      paginatedData.forEach(r => {
        const tr = document.createElement('tr');
        const badgeClass = r.status === 'PASS' ? 'badge-success' : r.status === 'WARNING' ? 'badge-warning' : 'badge-danger';
        tr.innerHTML = `
          <td>${QCUtils.formatDate(r.date)}</td>
          <td><code>${r.batch}</code></td>
          <td><strong>${r.product}</strong></td>
          <td>${r.parameter}</td>
          <td><strong>${QCUtils.formatNumber(r.value)}</strong></td>
          <td>${QCUtils.formatNumber(r.minSpec)}</td>
          <td>${QCUtils.formatNumber(r.maxSpec)}</td>
          <td><span class="badge ${badgeClass}">${r.status}</span></td>
          <td>${r.line}</td>
          <td>${r.inspector}</td>
          <td><small>${r.note}</small></td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Update Pagination Info
    document.getElementById('tablePaginationInfo').textContent =
      `Menampilkan ${Math.min(startIndex + 1, totalItems)} - ${Math.min(startIndex + this.pageSize, totalItems)} dari ${totalItems.toLocaleString('id-ID')} records`;

    this.renderPaginationButtons(totalPages);
  },

  renderPaginationButtons(totalPages) {
    const container = document.getElementById('paginationControls');
    container.innerHTML = '';

    const btnPrev = document.createElement('button');
    btnPrev.className = 'btn-page';
    btnPrev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    btnPrev.disabled = this.currentPage === 1;
    btnPrev.onclick = () => { this.currentPage--; this.renderDataTable(); };
    container.appendChild(btnPrev);

    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      const btn = document.createElement('button');
      btn.className = `btn-page ${i === this.currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.onclick = () => { this.currentPage = i; this.renderDataTable(); };
      container.appendChild(btn);
    }

    if (totalPages > 5) {
      const span = document.createElement('span');
      span.style.padding = '6px';
      span.textContent = '...';
      container.appendChild(span);

      const btnLast = document.createElement('button');
      btnLast.className = `btn-page ${totalPages === this.currentPage ? 'active' : ''}`;
      btnLast.textContent = totalPages;
      btnLast.onclick = () => { this.currentPage = totalPages; this.renderDataTable(); };
      container.appendChild(btnLast);
    }

    const btnNext = document.createElement('button');
    btnNext.className = 'btn-page';
    btnNext.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    btnNext.disabled = this.currentPage === totalPages;
    btnNext.onclick = () => { this.currentPage++; this.renderDataTable(); };
    container.appendChild(btnNext);
  },

  bindTableEvents() {
    // Search Debounce
    const searchInput = document.getElementById('tableSearchInput');
    const clearBtn = document.getElementById('btnClearSearch');

    searchInput.addEventListener('input', QCUtils.debounce(e => {
      this.searchQuery = e.target.value.trim();
      this.currentPage = 1;
      clearBtn.classList.toggle('hidden', !this.searchQuery);
      this.renderDataTable();
    }, 300));

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      clearBtn.classList.add('hidden');
      this.currentPage = 1;
      this.renderDataTable();
    });

    // Page Size
    document.getElementById('itemsPerPage').addEventListener('change', e => {
      this.pageSize = parseInt(e.target.value, 10);
      this.currentPage = 1;
      this.renderDataTable();
    });

    // Column Sorting
    document.querySelectorAll('#qcDataTable th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (this.currentSort.column === col) {
          this.currentSort.order = this.currentSort.order === 'asc' ? 'desc' : 'asc';
        } else {
          this.currentSort.column = col;
          this.currentSort.order = 'asc';
        }
        this.renderDataTable();
      });
    });

    // Column Visibility Toggle
    const colBtn = document.getElementById('btnColumnToggle');
    const colMenu = document.getElementById('columnMenu');
    colBtn.addEventListener('click', () => colMenu.classList.toggle('hidden'));

    colMenu.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', e => {
        const colIdx = parseInt(e.target.dataset.col, 10);
        const isVisible = e.target.checked;
        const table = document.getElementById('qcDataTable');
        Array.from(table.rows).forEach(row => {
          if (row.cells[colIdx]) {
            row.cells[colIdx].style.display = isVisible ? '' : 'none';
          }
        });
      });
    });

    // Export CSVs
    document.getElementById('btnExportDataCSV').addEventListener('click', () => {
      QCUtils.exportToCSV('QC_Analysis_Data_Records.csv', this.filteredRecords);
    });

    document.getElementById('btnExportPivotCSV').addEventListener('click', () => {
      QCUtils.exportToCSV('QC_Pivot_Summary_Product_Matrix.csv', this.filteredRecords);
    });

    document.getElementById('btnExportReport').addEventListener('click', () => {
      window.print();
    });
  }
};