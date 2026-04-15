const App = (() => {

  // =========================
  // CONFIG
  // =========================
  const CONFIG = {
    URL: "https://script.google.com/macros/s/AKfycbxo28u058nlkD54fAoabW7WfW0tGU3IRVsEcyOSMpnzLvvtJ0U0Wyzp_-tMytupm8JmiQ/exec",
    PASSWORD: "1234"
  };

  // =========================
  // STATE
  // =========================
  const STATE = {
    raw: {},
    barChart: null,
    salesChart: null
  };

  // =========================
  // HELPERS
  // =========================
  const $ = (id) => document.getElementById(id);

  const fmt = (v) => "£" + (Number(v || 0)).toFixed(2);

  const safeSet = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

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
    const pass = $("pass");
    if (!pass || pass.value !== CONFIG.PASSWORD) {
      toast("Wrong password");
      return;
    }

    const loginEl = $("login");
    const appEl = $("app");
    const navEl = $("nav");

    if (loginEl) loginEl.style.display = "none";
    if (appEl) appEl.style.display = "block";
    if (navEl) navEl.style.display = "flex";

    load();
  };

  // =========================
  // LOAD DATA
  // =========================
  const load = async () => {
    try {
      const loader = $("loading");
      if (loader) loader.style.display = "flex";

      const res = await fetch(CONFIG.URL, { cache: "no-store" });
      const data = await res.json();

      STATE.raw = data || {};
      draw(STATE.raw);

    } catch (e) {
      toast("Load failed");
    } finally {
      const loader = $("loading");
      if (loader) loader.style.display = "none";
    }
  };

  // =========================
  // DATE RANGE
  // =========================
  const setRange = (type) => {
    const now = new Date();
    const start = new Date();

    if (type === "today") start.setHours(0, 0, 0, 0);
    if (type === "7") start.setDate(now.getDate() - 7);
    if (type === "30") start.setDate(now.getDate() - 30);

    const s = $("startDate");
    const e = $("endDate");

    if (s) s.value = start.toISOString().split("T")[0];
    if (e) e.value = now.toISOString().split("T")[0];

    applyRange();
  };

  const applyRange = () => {
    const sEl = $("startDate");
    const eEl = $("endDate");

    if (!sEl || !eEl) return;

    const s = new Date(sEl.value + "T00:00:00").getTime();
    const e = new Date(eEl.value + "T23:59:59").getTime();

    const filtered = {};

    for (const d in STATE.raw) {
      const t = new Date(d).getTime();
      if (!isNaN(t) && t >= s && t <= e) {
        filtered[d] = STATE.raw[d];
      }
    }

    draw(filtered);
  };

  // =========================
  // CORE DATA ENGINE
  // =========================
  const buildMetrics = (data) => {
    let pt = {};
    let dt = {};
    let total = 0;

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
  // RENDER
  // =========================
  const draw = (data) => {

    const { pt, dt, total, dates, sorted, top5 } = buildMetrics(data);

    // ================= HOME KPI =================
    safeSet("sales", fmt(total));
    safeSet("products", sorted.length);
    safeSet("top", top5[0] || "-");

    // ================= TOP PRODUCTS =================
    const homeTop = $("homeTopList");
    if (homeTop) {
      homeTop.innerHTML = top5.length
        ? top5.map((p, i) =>
            `<div>${i + 1}. ${p} — ${fmt(pt[p])}</div>`
          ).join("")
        : "<div>No data</div>";
    }

    // ================= TABLE =================
    const table = $("productTable");
    if (table) {
      table.innerHTML = sorted.length
        ? sorted.map(p =>
            `<tr><td>${p}</td><td>${fmt(pt[p])}</td></tr>`
          ).join("")
        : "<tr><td colspan='2'>No data</td></tr>";
    }

    // ================= STACKED BAR (HOME) =================
    const barCanvas = $("barChart");
    if (barCanvas) {

      if (STATE.barChart) STATE.barChart.destroy();

      STATE.barChart = new Chart(barCanvas, {
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
          scales: {
            x: { stacked: true },
            y: {
              stacked: true,
              ticks: { callback: v => "£" + v }
            }
          }
        }
      });
    }

    // ================= SALES CHART =================
    const salesCanvas = $("salesChart");
    if (salesCanvas) {

      if (STATE.salesChart) STATE.salesChart.destroy();

      STATE.salesChart = new Chart(salesCanvas, {
        type: "bar",
        data: {
          labels: dates,
          datasets: [{
            label: "Sales (£)",
            data: dates.map(d => dt[d] || 0)
          }]
        },
        options: {
          scales: {
            y: {
              ticks: { callback: v => "£" + v }
            }
          }
        }
      });
    }

    // ================= INSIGHTS =================
    const insights = $("insights");
    if (insights) {
      insights.innerHTML = top5.length
        ? `<b>Top Products</b><br>` +
          top5.map(p => `• ${p} (${fmt(pt[p])})`).join("<br>")
        : "";
    }
  };

  // =========================
  // NAV
  // =========================
  const switchTab = (i, el) => {

    const tabs = $("tabs");
    if (tabs) tabs.style.transform = `translateX(-${i * 100}%)`;

    document.querySelectorAll(".nav div")
      .forEach(b => b.classList.remove("active"));

    if (el) el.classList.add("active");
  };

  // =========================
  // PUBLIC API
  // =========================
  return {
    login,
    load,
    setRange,
    applyRange,
    switchTab
  };

})();

window.App = App;
