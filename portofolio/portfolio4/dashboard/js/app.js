/**
 * app.js — Master Controller, Natural Chronological Data Generator & Filtering Engine
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Setup Theme Switcher
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelector('.theme-text').textContent = isDark ? 'Dark Mode' : 'Light Mode';
  });

  // 2. Mobile Sidebar Control
  document.getElementById('btnOpenSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
  });
  document.getElementById('btnCloseSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });
  
  // --- AKTIVASI LINK SIDEBAR (CLICK & SCROLL SPY) ---
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  const sections = document.querySelectorAll('.section-block');

  // 1. Ketika link sidebar diklik
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      // Hapus class active dari semua link
      navLinks.forEach(item => item.classList.remove('active'));
      // Tambahkan class active ke link yang baru saja diklik
      this.classList.add('active');

      // Tutup drawer sidebar secara otomatis jika di tampilan mobile
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  });

  // 2. ScrollSpy: Mengubah link active secara otomatis saat halaman di-scroll
  window.addEventListener('scroll', () => {
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 120; // Offset jarak header atas

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    if (currentSectionId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });

  // 3. Naturalized Chronological Generator (4.800 Data Asli Terdistribusi Sesuai Tanggal)
  const masterDataset = generateNaturalizedDataset();
  let currentFiltered = [...masterDataset];
  let currentPage = 1;
  const pageSize = 25;

  function renderTable() {
    const tbody = document.getElementById('rawTableBody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * pageSize;
    const pageRows = currentFiltered.slice(start, start + pageSize);

    if (pageRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color: var(--muted);">Data tidak ditemukan untuk filter saat ini.</td></tr>`;
    } else {
      pageRows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        const isFail = row.status === 'FAIL';
        if (isFail) tr.className = 'row-highlight';
        tr.innerHTML = `
          <td>${start + idx + 1}</td>
          <td>${row.date}</td>
          <td><code>${row.batch}</code></td>
          <td><strong>${row.product}</strong></td>
          <td>${row.machine}</td>
          <td>Shift ${row.shift}</td>
          <td>Operator ${row.operator}</td>
          <td><span class="badge ${isFail ? 'badge-danger' : 'badge-success'}">${row.status}</span></td>
          <td>${row.cause ? `<strong>${row.cause}</strong>` : '<span class="text-muted">—</span>'}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    document.getElementById('tablePaginationInfo').textContent =
      `Menampilkan ${Math.min(start + 1, currentFiltered.length)} - ${Math.min(start + pageSize, currentFiltered.length)} dari ${currentFiltered.length.toLocaleString('id-ID')} data`;

    renderPagination();
  }

  function renderPagination() {
    const container = document.getElementById('tablePaginationBtns');
    container.innerHTML = '';
    const totalPages = Math.ceil(currentFiltered.length / pageSize) || 1;

    const makeBtn = (text, page, active = false, disabled = false) => {
      const btn = document.createElement('button');
      btn.className = `btn-page ${active ? 'active' : ''}`;
      btn.innerHTML = text;
      btn.disabled = disabled;
      btn.onclick = () => { currentPage = page; renderTable(); };
      return btn;
    };

    container.appendChild(makeBtn('&laquo;', currentPage - 1, false, currentPage === 1));
    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      container.appendChild(makeBtn(i, i, i === currentPage));
    }
    if (totalPages > 5) {
      container.appendChild(makeBtn('...', currentPage, false, true));
      container.appendChild(makeBtn(totalPages, totalPages, totalPages === currentPage));
    }
    container.appendChild(makeBtn('&raquo;', currentPage + 1, false, currentPage === totalPages));
  }

  // Filter Event Listeners
  function applyFilters() {
    const search = document.getElementById('globalSearch').value.toLowerCase();
    const prod = document.getElementById('filterProductSelect').value;
    const mach = document.getElementById('filterMachineSelect').value;
    const status = document.getElementById('filterStatusSelect').value;

    currentFiltered = masterDataset.filter(r => {
      const matchSearch = !search ||
        r.batch.toLowerCase().includes(search) ||
        r.product.toLowerCase().includes(search) ||
        r.machine.toLowerCase().includes(search) ||
        r.operator.toLowerCase().includes(search) ||
        r.cause.toLowerCase().includes(search);

      const matchProd = !prod || r.product === prod;
      const matchMach = !mach || r.machine === mach;
      const matchStatus = !status || r.status === status;

      return matchSearch && matchProd && matchMach && matchStatus;
    });

    currentPage = 1;
    renderTable();
  }

  document.getElementById('globalSearch').addEventListener('input', applyFilters);
  document.getElementById('filterProductSelect').addEventListener('change', applyFilters);
  document.getElementById('filterMachineSelect').addEventListener('change', applyFilters);
  document.getElementById('filterStatusSelect').addEventListener('change', applyFilters);

  // CSV Export
  document.getElementById('btnExportCSV').addEventListener('click', () => {
    QCUtils.exportToCSV('QC_Food_4800_Master_Data.csv', currentFiltered);
  });

  // Render Charts & Initial View
  QCCharts.renderAll();
  renderTable();
});

/**
 * Naturalized Generator: Memastikan data tersebar kronologis dari 2 Jan - 30 Apr 2026
 * tanpa berkumpulnya FAIL di awal, dengan proporsi dan total matrix persis 100%.
 */
function generateNaturalizedDataset() {
  const products = ['Cookies', 'Crackers', 'Strawberry Jam', 'Tomato Sauce', 'Yogurt'];
  const machines = ['M1', 'M2', 'M3'];
  const operators = ['A', 'B', 'C', 'D', 'E', 'F'];
  const shifts = [1, 2];

  // Specific Target Fails for Each Product x Machine
  const failAllocation = {
    'Cookies_M1': { count: 23, causes: ['High Moisture', 'High Moisture', 'High Moisture', 'Appearance Defect', 'Appearance Defect', 'High pH', 'High pH', 'Metal Detector Fail', 'Metal Detector Fail', 'Seal Defect', 'Seal Defect', 'Underweight', 'Underweight', 'Low Moisture', 'Low Moisture', 'Overweight', 'Overweight', 'Low Brix', 'High Moisture', 'High Moisture', 'Appearance Defect', 'Seal Defect', 'Low Moisture'] },
    'Cookies_M2': { count: 27, causes: ['High Moisture', 'High Moisture', 'High Moisture', 'High Moisture', 'High Moisture', 'Appearance Defect', 'Appearance Defect', 'Appearance Defect', 'High pH', 'High pH', 'High pH', 'Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Seal Defect', 'Seal Defect', 'Underweight', 'Underweight', 'Underweight', 'Low Moisture', 'Low Moisture', 'Low Moisture', 'Overweight', 'Overweight', 'Low Brix', 'High Moisture', 'Seal Defect'] },
    'Cookies_M3': { count: 19, causes: ['High Moisture', 'High Moisture', 'High Moisture', 'High Moisture', 'High Moisture', 'Appearance Defect', 'Appearance Defect', 'High pH', 'High pH', 'High pH', 'Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Seal Defect', 'Seal Defect', 'Underweight', 'Underweight', 'Low Moisture', 'Overweight'] },
    
    'Crackers_M1': { count: 21, causes: ['High Moisture', 'High Moisture', 'High Moisture', 'High Moisture', 'Seal Defect', 'Seal Defect', 'Seal Defect', 'High pH', 'High pH', 'Low Brix', 'Low Brix', 'Low Moisture', 'Low Moisture', 'Appearance Defect', 'Appearance Defect', 'Metal Detector Fail', 'Metal Detector Fail', 'Overweight', 'Overweight', 'Underweight', 'High Moisture'] },
    'Crackers_M2': { count: 20, causes: ['High Moisture', 'High Moisture', 'High Moisture', 'High Moisture', 'Seal Defect', 'Seal Defect', 'Seal Defect', 'High pH', 'High pH', 'High pH', 'Low Brix', 'Low Brix', 'Low Brix', 'Low Moisture', 'Low Moisture', 'Appearance Defect', 'Appearance Defect', 'Metal Detector Fail', 'Overweight', 'Underweight'] },
    'Crackers_M3': { count: 19, causes: ['High Moisture', 'High Moisture', 'High Moisture', 'Seal Defect', 'Seal Defect', 'High pH', 'High pH', 'Low Brix', 'Low Brix', 'Low Moisture', 'Low Moisture', 'Low Moisture', 'Appearance Defect', 'Appearance Defect', 'Metal Detector Fail', 'Metal Detector Fail', 'Overweight', 'Overweight', 'Underweight'] },

    'Strawberry Jam_M1': { count: 14, causes: ['Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Appearance Defect', 'Appearance Defect', 'High Moisture', 'High Moisture', 'High pH', 'High pH', 'Low Brix', 'Seal Defect', 'Underweight', 'Low Moisture', 'Overweight'] },
    'Strawberry Jam_M2': { count: 15, causes: ['Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Appearance Defect', 'Appearance Defect', 'High Moisture', 'High Moisture', 'High pH', 'High pH', 'Low Brix', 'Low Brix', 'Seal Defect', 'Seal Defect', 'Underweight'] },
    'Strawberry Jam_M3': { count: 21, causes: ['Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Appearance Defect', 'Appearance Defect', 'High Moisture', 'High Moisture', 'High pH', 'High pH', 'Low Brix', 'Low Brix', 'Seal Defect', 'Seal Defect', 'Underweight', 'Underweight', 'Underweight', 'Low Moisture', 'Low Moisture', 'Low Moisture', 'Overweight', 'Overweight'] },

    'Tomato Sauce_M1': { count: 19, causes: ['High pH', 'High pH', 'High pH', 'High pH', 'High pH', 'Overweight', 'Overweight', 'Overweight', 'Low Moisture', 'Low Moisture', 'Metal Detector Fail', 'Metal Detector Fail', 'Low Brix', 'Low Brix', 'Appearance Defect', 'High Moisture', 'Underweight', 'Seal Defect', 'High pH'] },
    'Tomato Sauce_M2': { count: 18, causes: ['High pH', 'High pH', 'High pH', 'High pH', 'Overweight', 'Overweight', 'Overweight', 'Overweight', 'Low Moisture', 'Low Moisture', 'Low Moisture', 'Metal Detector Fail', 'Metal Detector Fail', 'Low Brix', 'Low Brix', 'Appearance Defect', 'Appearance Defect', 'High Moisture'] },
    'Tomato Sauce_M3': { count: 19, causes: ['High pH', 'High pH', 'High pH', 'High pH', 'Overweight', 'Overweight', 'Overweight', 'Low Moisture', 'Low Moisture', 'Metal Detector Fail', 'Metal Detector Fail', 'Low Brix', 'Appearance Defect', 'High Moisture', 'High Moisture', 'Underweight', 'Underweight', 'Underweight', 'Seal Defect'] },

    'Yogurt_M1': { count: 20, causes: ['Seal Defect', 'Seal Defect', 'Seal Defect', 'Seal Defect', 'Underweight', 'Underweight', 'Underweight', 'Overweight', 'Overweight', 'Overweight', 'Low Moisture', 'Low Moisture', 'Metal Detector Fail', 'Metal Detector Fail', 'Appearance Defect', 'Appearance Defect', 'High Moisture', 'High Moisture', 'High pH', 'High pH'] },
    'Yogurt_M2': { count: 32, causes: ['Seal Defect', 'Seal Defect', 'Seal Defect', 'Seal Defect', 'Seal Defect', 'Underweight', 'Underweight', 'Underweight', 'Underweight', 'Underweight', 'Overweight', 'Overweight', 'Overweight', 'Low Moisture', 'Low Moisture', 'Low Moisture', 'Low Moisture', 'Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Appearance Defect', 'Appearance Defect', 'Appearance Defect', 'High Moisture', 'High Moisture', 'High Moisture', 'High pH', 'High pH', 'High pH', 'Low Brix', 'Low Brix'] },
    'Yogurt_M3': { count: 29, causes: ['Seal Defect', 'Seal Defect', 'Seal Defect', 'Seal Defect', 'Underweight', 'Underweight', 'Underweight', 'Underweight', 'Overweight', 'Overweight', 'Overweight', 'Low Moisture', 'Low Moisture', 'Low Moisture', 'Metal Detector Fail', 'Metal Detector Fail', 'Metal Detector Fail', 'Appearance Defect', 'Appearance Defect', 'Appearance Defect', 'High Moisture', 'High Moisture', 'High Moisture', 'High pH', 'High pH', 'High pH', 'Low Brix', 'Low Brix', 'Low Brix'] }
  };

  const dataset = [];
  const startDate = new Date('2026-01-02');
  let id = 1;

  // Build 4.800 chronological slots
  for (let day = 0; day < 119; day++) {
    const curDate = new Date(startDate.getTime() + day * 86400000).toISOString().split('T')[0];
    const batchesPerDay = Math.floor(4800 / 119) + (day < 4800 % 119 ? 1 : 0);

    for (let b = 0; b < batchesPerDay; b++) {
      const prod = products[(id + b) % products.length];
      const mach = machines[(id * 2 + b) % machines.length];
      const shift = shifts[(id + day) % 2];
      const op = operators[(id + b) % operators.length];
      const key = `${prod}_${mach}`;

      let isFail = false;
      let failCause = '';

      // Check if this slot should take one of the allocated fails naturally
      if (failAllocation[key] && failAllocation[key].causes.length > 0 && ((id * 7 + day) % 15 === 0 || failAllocation[key].causes.length > (4800 - id) / 10)) {
        isFail = true;
        failCause = failAllocation[key].causes.pop();
      }

      dataset.push({
        id: id,
        date: curDate,
        batch: `BCH-2026-${String(id).padStart(5, '0')}`,
        product: prod,
        machine: mach,
        shift: shift,
        operator: op,
        status: isFail ? 'FAIL' : 'PASS',
        cause: failCause
      });
      id++;
    }
  }

  // Ensure any leftover fails are distributed naturally
  Object.keys(failAllocation).forEach(key => {
    while (failAllocation[key].causes.length > 0) {
      const cause = failAllocation[key].causes.pop();
      const [prod, mach] = key.split('_');
      const target = dataset.find(d => d.product === prod && d.machine === mach && d.status === 'PASS');
      if (target) {
        target.status = 'FAIL';
        target.cause = cause;
      }
    }
  });

  return dataset;
}