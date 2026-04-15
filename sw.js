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

  const toast = (msg) => {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1500);
  };

  const login = () => {
    if ($("pass").value !== CONFIG.PASSWORD) {
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
    // ✅ SHOW loader BEFORE fetch
    $("loading").style.display = "flex";

    const res = await fetch(CONFIG.URL, { cache: "no-store" });
    const data = await res.json();

    STATE.raw = data;
    draw(data);

    // ✅ HIDE loader AFTER everything is drawn
    $("loading").style.display = "none";

  } catch (e) {
    $("loading").style.display = "none";
    toast("Load failed");
  }
};


  const setRange = (type) => {
    const now = new Date();
    let start = new Date();

    if (type === "today") start.setHours(0,0,0,0);
    if (type === "7") start.setDate(now.getDate() - 7);
    if (type === "30") start.setDate(now.getDate() - 30);

    $("startDate").value = start.toISOString().split("T")[0];
    $("endDate").value = now.toISOString().split("T")[0];

    applyRange();
  };

  const applyRange = () => {
    const s = new Date($("startDate").value).getTime();
    const e = new Date($("endDate").value).getTime();

    const out = {};

    for (const d in STATE.raw) {
      const t = new Date(d).getTime();
      if (t >= s && t <= e) out[d] = STATE.raw[d];
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

    // =========================
    // HOME CARDS
    // =========================
    $("sales").textContent = "£" + total.toFixed(2);
    $("products").textContent = sorted.length;
    $("top").textContent = top5[0] || "-";
// =========================
// HOME TOP PRODUCTS (CLEAN FIX)
// =========================
const homeTop = document.getElementById("homeTopList");

if (homeTop) {
  homeTop.innerHTML =
    top5.length
      ? top5.map((p, i) =>
          `<div>${i + 1}. ${p} — £${pt[p].toFixed(2)}</div>`
        ).join("")
      : "-";
}
  
    // =========================
    // PRODUCTS TABLE
    // =========================
    $("productTable").innerHTML =
      sorted.map(p =>
        `<tr><td>${p}</td><td>£${pt[p].toFixed(2)}</td></tr>`
      ).join("");

    const money = v => "£" + v.toFixed(2);

    // =========================
    // BAR CHART (HOME)
    // =========================
    if (STATE.barChart) STATE.barChart.destroy();

    STATE.barChart = new Chart($("barChart"), {
      type: "bar",
      data: {
        labels: dates,
        datasets: top5.map(p => ({
          label: p,
          data: dates.map(d => data[d]?.[p] || 0),
          stack: "s"
        }))
      },
      options: {
        scales: {
          y: { ticks: { callback: money } },
          x: { stacked: true }
        }
      }
    });

    // =========================
    // SALES CHART (STATS TAB)
    // =========================
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
        scales: {
          y: { ticks: { callback: money } }
        }
      }
    });
  };

  const switchTab = (i, el) => {
    STATE.tab = i;

    $("tabs").style.transform = `translateX(-${i * 100}%)`;

    document.querySelectorAll(".nav div")
      .forEach(b => b.classList.remove("active"));

    el.classList.add("active");
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
