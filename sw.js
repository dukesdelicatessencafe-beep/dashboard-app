const App = (() => {

  const CONFIG = {
    URL: "https://script.google.com/macros/s/AKfycbxo28u058nlkD54fAoabW7WfW0tGU3IRVsEcyOSMpnzLvvtJ0U0Wyzp_-tMytupm8JmiQ/exec",
    PASSWORD: "1234"
  };

  const STATE = {
    raw: {},
    filtered: {},
    barChart: null,
    salesChart: null
  };

  const $ = (id) => document.getElementById(id);

  const fmt = (v) => "£" + (Number(v || 0)).toFixed(2);

  const toast = (msg) => {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1500);
  };

  // =========================
  // LOGIN
  // =========================
  const login = () => {
    if ($("pass")?.value !== CONFIG.PASSWORD) {
      toast("Wrong password");
      return;
    }

    $("login").style.display = "none";
    $("app").style.display = "block";
    $("nav").style.display = "flex";

    load();
  };

  // =========================
  // LOADING (with skeleton feel)
  // =========================
  const load = async () => {
    try {
      if ($("loading")) $("loading").style.display = "flex";

      const res = await fetch(CONFIG.URL, { cache: "no-store" });
      const data = await res.json();

      STATE.raw = data;
      STATE.filtered = data;

      draw(data);

    } catch (e) {
      toast("Load failed");
    } finally {
      if ($("loading")) $("loading").style.display = "none";
    }
  };

  // =========================
  // RANGE FILTER
  // =========================
  const setRange = (type) => {
    const now = new Date();
    let start = new Date();

    if (type === "today") start.setHours(0, 0, 0, 0);
    if (type === "7") start.setDate(now.getDate() - 7);
    if (type === "30") start.setDate(now.getDate() - 30);

    $("startDate").value = start.toISOString().split("T")[0];
    $("endDate").value = now.toISOString().split("T")[0];

    applyRange();
  };

  const applyRange = () => {
    const s = new Date($("startDate").value + "T00:00:00").getTime();
    const e = new Date($("endDate").value + "T23:59:59").getTime();

    const out = {};

    for (const d in STATE.raw) {
      const t = new Date(d).getTime();
      if (!isNaN(t) && t >= s && t <= e) {
        out[d] = STATE.raw[d];
      }
    }

    STATE.filtered = out;
    draw(out);
  };

  // =========================
  // CORE CALCULATION
  // =========================
  const compute = (data) => {
    let pt = {}, dt = {}, total = 0;

    const dates = Object.keys(data || {}).sort();

    for (const d of dates) {
      dt[d] = 0;
      for (const p in data[d]) {
        const v = Number(data[d][p] || 0);
        pt[p] = (pt[p] || 0) + v;
        dt[d] += v;
        total += v;
      }
    }

    const sorted = Object.keys(pt).sort((a, b) => pt[b] - pt[a]);
    const top5 = sorted.slice(0, 5);

    return { pt, dt, total, dates, sorted, top5 };
  };

  // =========================
  // % CHANGE (SAAS KPI)
  // =========================
  const getPreviousComparison = (currentTotal) => {
    const dates = Object.keys(STATE.raw).sort();
    const half = Math.floor(dates.length / 2);

    let prevTotal = 0;

    dates.slice(0, half).forEach(d => {
      for (const p in STATE.raw[d]) {
        prevTotal += Number(STATE.raw[d][p] || 0);
      }
    });

    if (!prevTotal) return { pct: 0, dir: "flat" };

    const pct = ((currentTotal - prevTotal) / prevTotal) * 100;

    return {
      pct: Math.abs(pct.toFixed(1)),
      dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat"
    };
  };

  // =========================
  // DRAW UI
  // =========================
  const draw = (data) => {

    const { pt, dt, total, dates, sorted, top5 } = compute(data);
    const trend = getPreviousComparison(total);

    // KPI
    $("sales").textContent = fmt(total);
    $("products").textContent = sorted.length;
    $("top").textContent = top5[0] || "-";

    // KPI trend enhancement
    const salesEl = $("sales");
    if (salesEl) {
      salesEl.innerHTML =
        `${fmt(total)} <small style="opacity:.7">
        ${trend.dir === "up" ? "▲" : trend.dir === "down" ? "▼" : "•"}
        ${trend.pct}%
        </small>`;
    }

    // TOP PRODUCTS
    const homeTop = $("homeTopList");
    if (homeTop) {
      homeTop.innerHTML = top5.length
        ? top5.map((p, i) =>
            `<div style="display:flex;justify-content:space-between">
              <span>${i + 1}. ${p}</span>
              <span>${fmt(pt[p])}</span>
            </div>`
          ).join("")
        : "-";
    }

    // TABLE
    const table = $("productTable");
    if (table) {
      table.innerHTML = sorted.map(p =>
        `<tr><td>${p}</td><td>${fmt(pt[p])}</td></tr>`
      ).join("");
    }

    // SEARCH FILTER (SAAS FEATURE)
    window.filterProducts = (q) => {
      const rows = document.querySelectorAll("#productTable tr");
      rows.forEach(r => {
        r.style.display =
          r.innerText.toLowerCase().includes(q.toLowerCase())
            ? ""
            : "none";
      });
    };

    // BAR CHART (STACKED FIXED)
    if (STATE.barChart) STATE.barChart.destroy();

    STATE.barChart = new Chart($("barChart"), {
      type: "bar",
      data: {
        labels: dates,
        datasets: top5.map(p => ({
          label: p,
          data: dates.map(d => data[d]?.[p] || 0),
          stack: "stack1"
        }))
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: £${ctx.raw}`
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            ticks: { callback: v => "£" + v }
          }
        }
      }
    });

    // SALES CHART
    if (STATE.salesChart) STATE.salesChart.destroy();

    STATE.salesChart = new Chart($("salesChart"), {
      type: "bar",
      data: {
        labels: dates,
        datasets: [{
          label: "Sales (£)",
          data: dates.map(d => dt[d] || 0)
        }]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => "£" + ctx.raw
            }
          }
        }
      }
    });

    // INSIGHTS
    const insights = $("insights");
    if (insights) {
      insights.innerHTML =
        "<b>Top Products</b><br>" +
        top5.map(p => `• ${p} (${fmt(pt[p])})`).join("<br>");
    }
  };

  // =========================
  // EXPORT CSV (SAAS FEATURE)
  // =========================
  const exportCSV = () => {
    let rows = [["Product", "Value"]];

    const { pt } = compute(STATE.filtered);

    Object.keys(pt).forEach(p => {
      rows.push([p, pt[p]]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
  };

  // =========================
  // NAV
  // =========================
  const switchTab = (i, el) => {
    $("tabs").style.transform = `translateX(-${i * 100}%)`;
    document.querySelectorAll(".nav div")
      .forEach(b => b.classList.remove("active"));
    if (el) el.classList.add("active");
  };

  return {
    login,
    load,
    setRange,
    applyRange,
    switchTab,
    exportCSV
  };

})();

window.App = App;
