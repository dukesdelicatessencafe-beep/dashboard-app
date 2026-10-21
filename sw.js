<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sales & Analytics Dashboard with VAT Threshold Alert</title>
  
  <!-- CHART.JS LIBRARY -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    :root {
      --primary-gold: #D4AF37;
      --accent-gold: #F9E3B4;
      --bg-dark: #121212;
      --card-bg: #1e1e1e;
      --text-light: #ffffff;
      --pos-green: #4cd137;
      --neg-red: #ff4d4d;
    }

    * { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-light);
      margin: 0;
      padding: 12px;
      -webkit-text-size-adjust: 100%;
    }

    .hidden { display: none !important; }

    #login {
      max-width: 360px;
      width: 100%;
      margin: 80px auto;
      padding: 24px;
      background: var(--card-bg);
      border: 1px solid var(--primary-gold);
      border-radius: 8px;
      text-align: center;
    }

    #login input {
      width: 100%;
      padding: 12px;
      margin-bottom: 15px;
      background: #2a2a2a;
      border: 1px solid var(--primary-gold);
      color: #fff;
      border-radius: 4px;
      font-size: 16px;
    }

    button {
      background: var(--primary-gold);
      color: #000;
      border: none;
      padding: 10px 16px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      min-height: 40px;
    }

    button:hover { background: var(--accent-gold); }

    .nav {
      display: flex;
      gap: 8px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .nav div {
      background: var(--primary-gold);
      color: #000;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      flex: 1 1 auto;
      text-align: center;
    }

    .nav div.active {
      background: var(--accent-gold);
      border: 2px solid var(--primary-gold);
      color: #000;
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }

    .kpi-card {
      background: var(--card-bg);
      border-left: 4px solid var(--primary-gold);
      padding: 14px;
      border-radius: 4px;
    }

    .kpi-card h3 {
      margin: 0 0 6px 0;
      font-size: 12px;
      color: var(--accent-gold);
      letter-spacing: 0.5px;
    }

    .kpi-card .val {
      font-size: 20px;
      font-weight: bold;
      line-height: 1.2;
    }

    .kpi-card .subtext { color: #aaa; margin-top: 4px; font-size: 13px; }

    .progress-bar-container {
      background: #2a2a2a;
      border-radius: 4px;
      height: 8px;
      width: 100%;
      margin-top: 8px;
      overflow: hidden;
      border: 1px solid #444;
    }

    .progress-bar-fill { height: 100%; background-color: var(--primary-gold); width: 0%; transition: width 0.4s ease; }
    .progress-bar-fill.vat-warning { background-color: #ffcc00; }
    .progress-bar-fill.vat-danger { background-color: var(--neg-red); }

    #tabsWrapper { overflow: hidden; width: 100%; position: relative; }
    #tabs { display: flex; width: 200%; transition: transform 0.3s ease-in-out; }
    .tab-content { width: 50%; min-width: 50%; flex: 0 0 50%; box-sizing: border-box; padding: 0 2px; }

    .chart-container {
      position: relative;
      height: 280px;
      width: 100%;
      background: var(--card-bg);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .table-responsive {
      width: 100%;
      max-height: 350px;
      overflow-x: auto;
      overflow-y: auto;
      margin-bottom: 12px;
      border: 1px solid #333;
      border-radius: 6px;
      background: var(--card-bg);
    }

    table { width: 100%; border-collapse: collapse; background: var(--card-bg); font-size: 13px; white-space: nowrap; }
    table th, table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #333; }
    table th { color: var(--accent-gold); font-size: 12px; background: #181818; position: sticky; top: 0; }

    #loading {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      display: none;
      justify-content: center;
      align-items: center;
      font-size: 18px;
      color: var(--accent-gold);
      z-index: 1000;
    }

    #toast {
      position: fixed;
      bottom: 20px; right: 20px; left: 20px;
      max-width: 320px;
      margin: 0 auto;
      background: var(--primary-gold);
      color: #000;
      padding: 12px 18px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 14px;
      text-align: center;
      display: none;
      z-index: 1001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    #toast.show { display: block; }
  </style>
</head>
<body>

  <!-- LOGIN SCREEN -->
  <div id="login">
    <h2 style="color: var(--primary-gold); margin-top: 0;">Secure Dashboard Login</h2>
    <input type="password" id="pass" placeholder="Enter Password" onkeypress="if(event.key === 'Enter') App.login()">
    <button onclick="App.login()" style="width: 100%;">Login Securely</button>
  </div>

  <!-- NAVIGATION -->
  <div id="nav" class="nav hidden">
    <div class="active" onclick="App.switchTab(0, this)">OVERVIEW & VAT</div>
    <div onclick="App.switchTab(1, this)">ANALYTICS & PRODUCTS</div>
  </div>

  <!-- MAIN APP WRAPPER -->
  <div id="app" class="hidden">
    
    <!-- DATE CONTROLS -->
    <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; background: var(--card-bg); padding: 10px; border-radius: 8px;">
      <div>
        <label style="font-size:11px; color:var(--accent-gold);">From:</label>
        <input type="date" id="startDate" onchange="App.applyRange()" style="background:#2a2a2a; border:1px solid var(--primary-gold); color:#fff; padding:6px; border-radius:4px;">
      </div>
      <div>
        <label style="font-size:11px; color:var(--accent-gold);">To:</label>
        <input type="date" id="endDate" onchange="App.applyRange()" style="background:#2a2a2a; border:1px solid var(--primary-gold); color:#fff; padding:6px; border-radius:4px;">
      </div>
      <div style="display:flex; gap:4px; margin-top:auto;">
        <button onclick="App.setRange('today')" style="padding:6px 10px; font-size:11px;">Today</button>
        <button onclick="App.setRange('7')" style="padding:6px 10px; font-size:11px;">7 Days</button>
        <button onclick="App.setRange('30')" style="padding:6px 10px; font-size:11px;">30 Days</button>
      </div>
    </div>

    <!-- TABS CONTAINER -->
    <div id="tabsWrapper">
      <div id="tabs">
        
        <!-- TAB 0: OVERVIEW & VAT MONITOR -->
        <div class="tab-content" id="tabContent-0">
          <div class="kpi-row">
            
            <div class="kpi-card">
              <h3>TOTAL REVENUE (SELECTED RANGE)</h3>
              <div class="val" id="sales">£0.00</div>
              <div class="subtext">Filtered timeframe sum</div>
            </div>

            <!-- ENHANCED ROLLING 12-MONTH TURNOVER & VAT THRESHOLD MONITOR -->
            <div class="kpi-card" id="vatCard" style="border-left-color: var(--primary-gold);">
              <h3>ROLLING 12-MONTH TOTAL (£90K LIMIT)</h3>
              <div class="val" id="rollingTotal">Syncing...</div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" id="vatBar"></div>
              </div>
              <div class="subtext" id="vatStatus">Calculating history...</div>
            </div>

            <div class="kpi-card">
              <h3>ACTIVE RECORD DAYS</h3>
              <div class="val" id="products">0</div>
            </div>

            <div class="kpi-card">
              <h3>TOP CATEGORY / ITEM</h3>
              <div class="val" id="top">-</div>
            </div>
          </div>

          <div class="chart-container">
            <canvas id="barChart"></canvas>
          </div>
        </div>

        <!-- TAB 1: ANALYTICS -->
        <div class="tab-content" id="tabContent-1">
          <div class="chart-container">
            <canvas id="salesChart"></canvas>
          </div>

          <h3 style="color: var(--accent-gold); font-size: 14px; margin-bottom: 6px;">Product / Category Breakdown</h3>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Category / Item</th>
                  <th>Total Revenue (£)</th>
                </tr>
              </thead>
              <tbody id="productTable">
                <tr><td colspan="2">No data</td></tr>
              </tbody>
            </table>
          </div>

          <div class="kpi-card" style="margin-bottom: 0;">
            <h3>INSIGHTS SUMMARY</h3>
            <div id="insights" class="subtext">No insights available</div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <div id="loading">Connecting to Secure Server...</div>
  <div id="toast"></div>

  <!-- APP ENGINE SCRIPT -->
  <script>
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
        setTimeout(() => t.classList.remove("show"), 2000);
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
          
          // Set default date range inputs based on loaded dataset boundaries if available
          const dates = Object.keys(STATE.raw).sort();
          if (dates.length > 0 && $("startDate") && $("endDate")) {
            $("startDate").value = dates[0];
            $("endDate").value = dates[dates.length - 1];
          }

          applyRange();

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
      // VAT THRESHOLD LOOKUP ENGINE
      // =========================
      const computeVatMetrics = () => {
        const anchorDate = new Date();
        const startLookback = new Date(anchorDate);
        startLookback.setFullYear(anchorDate.getFullYear() - 1);

        let rollingSum = 0;

        for (const d in STATE.raw) {
          const recordDate = new Date(d);
          if (!isNaN(recordDate.getTime()) && recordDate >= startLookback && recordDate <= anchorDate) {
            for (const p in STATE.raw[d]) {
              rollingSum += Number(STATE.raw[d][p] || 0);
            }
          }
        }

        const vatThreshold = 90000;
        const remainingBuffer = vatThreshold - rollingSum;
        const daysSpan = Math.max(1, (anchorDate - startLookback) / (1000 * 60 * 60 * 24));
        const dailyVelocity = rollingSum / daysSpan;
        const estBreachDays = dailyVelocity > 0 ? Math.ceil(remainingBuffer / dailyVelocity) : 999;

        return { rollingSum, remainingBuffer, estBreachDays };
      };

      // =========================
      // RENDER
      // =========================
      const draw = (filteredData) => {

        const { pt, dt, total, dates, sorted, top5 } = buildMetrics(filteredData);
        const { rollingSum, remainingBuffer, estBreachDays } = computeVatMetrics();

        // ================= HOME KPI =================
        safeSet("sales", fmt(total));
        safeSet("products", sorted.length);
        safeSet("top", top5[0] || "-");

        // ================= VAT MONITOR RENDERING =================
        const rollingEl = $("rollingTotal");
        const statusEl = $("vatStatus");
        const vatCard = $("vatCard");
        const vBar = $("vatBar");
        const vatThreshold = 90000;

        if (rollingEl) {
          if (remainingBuffer > 0) {
            rollingEl.innerHTML = `${fmt(rollingSum)}<br><span style="font-size:12px; font-weight:bold; color:var(--accent-gold);">Margin Left: ${fmt(remainingBuffer)}</span>`;
          } else {
            rollingEl.innerHTML = `${fmt(rollingSum)}<br><span style="font-size:12px; font-weight:bold; color:var(--neg-red);">Over Limit by ${fmt(-remainingBuffer)}</span>`;
          }
        }

        const vatProgress = Math.min(100, (rollingSum / vatThreshold) * 100);
        if (vBar) vBar.style.width = vatProgress + "%";

        if (statusEl) {
          if (remainingBuffer <= 0) {
            statusEl.innerHTML = `<span style="color:#ff4d4d; font-weight:bold;">🚨 THRESHOLD EXCEEDED - HMRC VAT REGISTRATION REQUIRED</span>`;
            if (vatCard) vatCard.style.borderLeftColor = "var(--neg-red)";
            if (vBar) vBar.className = "progress-bar-fill vat-danger";
          } else if (remainingBuffer <= 5000 || estBreachDays <= 30) {
            statusEl.innerHTML = `<span style="color:#ff4d4d; font-weight:bold;">⚠️ WARNING: Register prior to crossing £90k limit! (Est. ${estBreachDays} days left)</span>`;
            if (vatCard) vatCard.style.borderLeftColor = "#ff4d4d";
            if (vBar) vBar.className = "progress-bar-fill vat-danger";
          } else if (remainingBuffer <= 15000) {
            statusEl.innerHTML = `<span style="color:#ffcc00; font-weight:bold;">⚡ Approaching Threshold. Monitor sales closely.</span>`;
            if (vatCard) vatCard.style.borderLeftColor = "#ffcc00";
            if (vBar) vBar.className = "progress-bar-fill vat-warning";
          } else {
            statusEl.innerHTML = `<span style="color:#4cd137;">Safe: Buffer remaining (${fmt(remainingBuffer)})</span>`;
            if (vatCard) vatCard.style.borderLeftColor = "var(--primary-gold)";
            if (vBar) vBar.className = "progress-bar-fill";
          }
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
                data: dates.map(d => filteredData[d]?.[p] || 0),
                stack: "stack1",
                backgroundColor: getRandomColor(p)
              }))
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
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
                data: dates.map(d => dt[d] || 0),
                backgroundColor: "#D4AF37"
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
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
            ? `<b>Top Revenue Drivers</b><br>` +
              top5.map(p => `• ${p} (${fmt(pt[p])})`).join("<br>")
            : "";
        }
      };

      // Simple stable color generator helper for categories/products
      const getRandomColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + "00000".substring(0, 6 - c.length) + c;
      };

      // =========================
      // NAV
      // =========================
      const switchTab = (i, el) => {
        const tabs = $("tabs");
        if (tabs) tabs.style.transform = `translateX(-${i * 50}%)`;

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
  </script>
</body>
</html>
