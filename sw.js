const App = (() => {

  const CONFIG = {
    URL: "https://script.google.com/macros/s/AKfycbxo28u058nlkD54fAoabW7WfW0tGU3IRVsEcyOSMpnzLvvtJ0U0Wyzp_-tMytupm8JmiQ/exec",
    PASSWORD: "1234"
  };

  const STATE = {
    raw: {},
    tab: 0,
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

  const load = async () => {
    try {
      if ($("loading")) $("loading").style.display = "flex";

      const res = await fetch(CONFIG.URL, { cache: "no-store" });
      const data = await res.json();

      STATE.raw = data;
      draw(data);

    } catch (e) {
      toast("Load failed");
    } finally {
      if ($("loading")) $("loading").style.display = "none";
    }
  };

  const setRange = (type) => {
    const now = new Date();
    let start = new Date();

    if (type === "today") start.setHours(0, 0, 0, 0);
    if (type === "7") start.setDate(now.getDate() - 7);
    if (type === "30") start.setDate(now.getDate() - 30);

    if ($("startDate")) $("startDate").value = start.toISOString().split("T")[0];
    if ($("endDate")) $("endDate").value = now.toISOString().split("T")[0];

    applyRange();
  };

  const applyRange = () => {
    const sEl = $("startDate");
    const eEl = $("endDate");
    if (!sEl || !eEl) return;

    const s = new Date(sEl.value + "T00:00:00").getTime();
    const e = new Date(eEl.value + "T23:59:59").getTime();

    const out = {};

    for (const d in STATE.raw) {
      const t = new Date(d).getTime();
      if (!isNaN(t) && t >= s && t <= e) {
        out[d] = STATE.raw[d];
      }
    }

    draw(out);
  };

  const draw = (data) => {

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

    // ================= HOME KPI =================
    if ($("sales")) $("sales").textContent = fmt(total);
    if ($("products")) $("products").textContent = sorted.length;
    if ($("top")) $("top").textContent = top5[0] || "-";

    // ================= HOME TOP PRODUCTS =================
    const homeTop = $("homeTopList");
    if (homeTop) {
      homeTop.innerHTML = top5.length
        ? top5.map((p, i) =>
            `<div>${i + 1}. ${p} — ${fmt(pt[p])}</div>`
          ).join("")
        : "<div>No data</div>";
    }

    // ================= PRODUCTS TABLE =================
    const table = $("productTable");
    if (table) {
      table.innerHTML = sorted.length
        ? sorted.map(p =>
            `<tr><td>${p}</td><td>${fmt(pt[p])}</td></tr>`
          ).join("")
        : "<tr><td colspan='2'>No data</td></tr>";
    }

    // ================= BAR CHART =================
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

  const switchTab = (i, el) => {
    STATE.tab = i;

    const tabs = $("tabs");
    if (tabs) tabs.style.transform = `translateX(-${i * 100}%)`;

    document.querySelectorAll(".nav div")
      .forEach(b => b.classList.remove("active"));

    if (el) el.classList.add("active");
  };

  return {
    login,
    load,
    setRange,
    applyRange,
    switchTab
  };

})();

window.App = App;
