/**
 * utils.js — Helper Functions for Data Formatting, Sanitization & Math
 */
window.QCUtils = {
  // Format Date ISO / Excel to DD MMM YYYY
  formatDate(dateVal) {
    if (!dateVal) return 'N/A';
    let d;
    if (typeof dateVal === 'number') {
      // Excel serial date format
      d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  // Parse Number safely
  parseNumber(val) {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const cleanStr = String(val).replace(/,/g, '.').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? null : num;
  },

  // Format Number with decimals
  formatNumber(val, decimals = 2) {
    const num = this.parseNumber(val);
    if (num === null) return 'N/A';
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  // Debounce for input searches
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // CSV Exporter
  exportToCSV(filename, rows) {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
              cell = cell.replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};