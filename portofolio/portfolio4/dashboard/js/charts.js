/**
 * charts.js — Render Visual Chart Pareto, Daily Trend & Monthly Trend
 */
window.QCCharts = {
  instances: {},

  colors: {
    pink: '#d19b9b',
    pinkDark: '#b67b7b',
    green: '#b2c22b',
    danger: '#c85c5c',
    info: '#7fa6b8',
    grid: 'rgba(200, 180, 190, 0.2)'
  },

  renderAll() {
    this.renderParetoChart();
    this.renderDailyTrendChart();
    this.renderMonthlyTrendChart();
  },

  // 1. Pareto Chart (Kombinasi Bar Count & Line Cumulative %)
  renderParetoChart() {
    const ctx = document.getElementById('paretoChartCanvas').getContext('2d');
    if (this.instances.pareto) this.instances.pareto.destroy();

    const labels = [
      'High Moisture', 'High pH', 'Metal Detector Fail', 'Seal Defect',
      'Low Moisture', 'Overweight', 'Appearance Defect', 'Underweight', 'Low Brix'
    ];
    const counts = [45, 43, 38, 35, 34, 33, 32, 31, 25];
    const cumulativePct = [14, 28, 40, 51, 62, 72, 82, 92, 100];

    this.instances.pareto = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Count of Batch',
            data: counts,
            backgroundColor: this.colors.pink,
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Cumulative %',
            data: cumulativePct,
            type: 'line',
            borderColor: this.colors.danger,
            backgroundColor: this.colors.danger,
            borderWidth: 2,
            pointRadius: 4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 50,
            title: { display: true, text: 'Jumlah Batch' }
          },
          y1: {
            beginAtZero: true,
            max: 100,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: v => v + '%' }
          },
          x: {
            ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
          }
        }
      }
    });
  },

  // 2. Daily Reject Trend Chart (1–7 Range & Peaks)
  renderDailyTrendChart() {
    const ctx = document.getElementById('dailyTrendChartCanvas').getContext('2d');
    if (this.instances.daily) this.instances.daily.destroy();

    // Data sample representatif harian Jan-Apr
    const days = [];
    const dailyValues = [];
    const startDate = new Date('2026-01-02');

    for (let i = 0; i < 60; i++) {
      const d = new Date(startDate.getTime() + i * 2 * 86400000);
      days.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
      // Generate fluktuasi 1-7 dengan peak
      if (i === 18 || i === 36 || i === 41) {
        dailyValues.push(7); // Peaks 8 Feb, 18 Mar, 23 Mar
      } else {
        dailyValues.push(Math.floor(Math.sin(i * 0.8) * 2.2 + 3.5));
      }
    }

    this.instances.daily = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Daily Reject Batches',
          data: dailyValues,
          borderColor: this.colors.pinkDark,
          backgroundColor: 'rgba(209, 155, 155, 0.15)',
          borderWidth: 2,
          pointRadius: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 8, ticks: { stepSize: 1 } }
        }
      }
    });
  },

  // 3. Monthly & Weekly Trend Chart
  renderMonthlyTrendChart() {
    const ctx = document.getElementById('monthlyTrendChartCanvas').getContext('2d');
    if (this.instances.monthly) this.instances.monthly.destroy();

    this.instances.monthly = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Januari (84)', 'Februari (73)', 'Maret (76)', 'April (83)'],
        datasets: [{
          label: 'Monthly Reject Batches',
          data: [84, 73, 76, 83],
          borderColor: this.colors.green,
          backgroundColor: 'rgba(178, 194, 43, 0.2)',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 65, max: 90, title: { display: true, text: 'Count of Batch' } }
        }
      }
    });
  }
};