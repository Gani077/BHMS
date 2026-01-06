// ---------------------------------------------------------
// High-level overview for viva:
// - CSV is loaded from 'batterydata_converted.csv' using fetch.
// - Data is parsed into arrays for time, voltage, current and power.
// - Analytics, health score and status are computed from these arrays.
// - Charts are drawn using Chart.js and updated whenever data reloads.
// ---------------------------------------------------------

let latestData = null;            // Holds the most recent processed data arrays
let voltageChartInstance = null;  // Chart.js instances so we can update them on reload
let currentChartInstance = null;
let powerChartInstance = null;
let workflowCurrentStep = 1;

initThemeFromStorage();
initPageNav();
initTabs();
wireDashboardButtons();
wireThemeToggle();
initWorkflowTimeline();
loadData();

// Applies theme from previous visit (stored in localStorage) if available.
function initThemeFromStorage() {
  const saved = window.localStorage ? localStorage.getItem("bhms-theme") : null;
  if (saved === "light") {
    document.body.classList.add("light-theme");
  }
}

// Handles top navigation: smooth scrolling, active link highlight, mobile toggle.
function initPageNav() {
  const navLinks = document.querySelectorAll(".nav-link");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinksContainer = document.querySelector(".nav-links");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      // set active link manually
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      // Close mobile menu on selection
      if (navLinksContainer) {
        navLinksContainer.classList.remove("open");
      }
      // Let browser handle smooth scroll via anchor + CSS
    });
  });

  if (navToggle && navLinksContainer) {
    navToggle.addEventListener("click", () => {
      navLinksContainer.classList.toggle("open");
    });
  }

  // Active link is handled on click; additional scroll-based highlighting is not required here.
}

// Wires the Dark / Light mode toggle button.
function wireThemeToggle() {
  const btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;

  const applyLabel = () => {
    const isLight = document.body.classList.contains("light-theme");
    btn.textContent = isLight ? "🌙" : "☀️";
    btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  };

  applyLabel();

  btn.addEventListener("click", () => {
    const isLightNow = document.body.classList.toggle("light-theme");
    if (window.localStorage) {
      localStorage.setItem("bhms-theme", isLightNow ? "light" : "dark");
    }
    applyLabel();
  });
}

// Handles tab switching between Dashboard, Voltage, Current, Power, etc.
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");
  let activeId = "dashboard";

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;

      tabs.forEach(t => t.classList.toggle("active", t === tab));
      panels.forEach(p => p.classList.toggle("active", p.id === target));

      // Reset workflow timeline whenever we enter the Workflow tab
      // so interaction always starts from Step 1.
      if (target === "workflow") {
        resetWorkflowTimeline();
      }

      activeId = target;
    });
  });
}

// Initialises the Data Science Workflow vertical timeline interactions.
function initWorkflowTimeline() {
  const steps = document.querySelectorAll(".workflow-step");
  if (!steps.length) return;

  resetWorkflowTimeline();

  steps.forEach(step => {
    const node = step.querySelector(".workflow-node");
    if (!node) return;

    node.addEventListener("click", () => {
      const stepIndex = parseInt(step.dataset.step, 10);
      // Only the *current* visible step is allowed to reveal the next one.
      if (stepIndex === workflowCurrentStep && stepIndex < steps.length) {
        revealWorkflowStep(stepIndex + 1);
      }
    });
  });
}

function resetWorkflowTimeline() {
  const steps = document.querySelectorAll(".workflow-step");
  const lineProgress = document.getElementById("workflow-line-progress");
  workflowCurrentStep = 1;

  steps.forEach(step => {
    const n = parseInt(step.dataset.step, 10);
    const node = step.querySelector(".workflow-node");
    if (n === 1) {
      step.classList.add("visible", "active");
      step.classList.remove("completed");
      if (node) node.title = "Click to reveal next step";
    } else {
      step.classList.remove("visible", "active", "completed");
      step.style.opacity = "";
      if (node) node.removeAttribute("title");
    }
  });

  if (lineProgress) {
    lineProgress.style.height = "24px";
  }
}

function revealWorkflowStep(stepIndex) {
  const steps = document.querySelectorAll(".workflow-step");
  const lineProgress = document.getElementById("workflow-line-progress");
  if (stepIndex < 1 || stepIndex > steps.length) return;

  const prevStep = steps[workflowCurrentStep - 1];
  if (prevStep) {
    prevStep.classList.remove("active");
    prevStep.classList.add("completed");
    const prevNode = prevStep.querySelector(".workflow-node");
    if (prevNode) prevNode.removeAttribute("title");
  }

  workflowCurrentStep = stepIndex;
  const currentStep = steps[workflowCurrentStep - 1];
  if (currentStep) {
    currentStep.classList.add("visible", "active");
    const currentNode = currentStep.querySelector(".workflow-node");
    if (currentNode && workflowCurrentStep < steps.length) {
      currentNode.title = "Click to reveal next step";
    }
  }

  if (lineProgress) {
    const totalSteps = steps.length;
    const fraction = (workflowCurrentStep - 1) / (totalSteps - 1 || 1);
    const maxHeight = 24 + (totalSteps - 1) * 60; // approximate based on card spacing
    lineProgress.style.height = `${24 + fraction * (maxHeight - 24)}px`;
  }
}

// Wires up the "Reload Data" and "Download Dataset" buttons on the Analytics tab.
function wireDashboardButtons() {
  const reloadBtn = document.getElementById("reload-data-btn");
  const downloadBtn = document.getElementById("download-csv-btn");

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      loadData(); // Simply reload the CSV and recompute everything
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      // We download the same CSV that is being used by the dashboard.
      const link = document.createElement("a");
      link.href = "batterydata_converted.csv";
      link.download = "batterydata_converted.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}

// Loads the CSV file and converts text into numeric arrays.
// This function is the single entry point whenever fresh data is required.
function loadData() {
  fetch("batterydata_converted.csv")
    .then(response => response.text())
    .then(text => {
      // Split CSV into rows, ignoring header row
      const rows = text.trim().split("\n").slice(1);

      const time = [];
      const voltage = [];
      const current = [];
      const power = [];

      rows.forEach(row => {
        const cols = row.split(",");
        time.push(cols[0]);
        voltage.push(parseFloat(cols[1]));
        current.push(parseFloat(cols[2]));
        power.push(parseFloat(cols[3]));
      });

      latestData = { time, voltage, current, power };

      updateDashboard(latestData);
      updateAnalytics(latestData);
      updateCharts(latestData);
    })
    .catch(err => {
      console.error("Error loading CSV:", err);
      alert("Could not load battery data. Please ensure the CSV is available.");
    });
}

// Updates top-level numbers, health score and battery status on the main dashboard.
function updateDashboard(data) {
  const { voltage, current, power } = data;

  // Latest readings for dashboard and detail panels
  const latestV = voltage[voltage.length - 1] ?? "--";
  const latestC = current[current.length - 1] ?? "--";
  const latestP = power[power.length - 1] ?? "--";

  document.getElementById("voltage").innerText = latestV.toFixed ? latestV.toFixed(2) : latestV;
  document.getElementById("current").innerText = latestC.toFixed ? latestC.toFixed(2) : latestC;
  document.getElementById("power").innerText = latestP.toFixed ? latestP.toFixed(2) : latestP;
  document.getElementById("voltage-latest").innerText = latestV.toFixed ? latestV.toFixed(2) : latestV;
  document.getElementById("current-latest").innerText = latestC.toFixed ? latestC.toFixed(2) : latestC;
  document.getElementById("power-latest").innerText = latestP.toFixed ? latestP.toFixed(2) : latestP;

  // Compute and display Battery Health Score based on voltage stability and current variation.
  const health = computeHealthScore(voltage, current);
  const scoreEl = document.getElementById("health-score");
  const levelEl = document.getElementById("health-level");

  scoreEl.innerText = `${health.score.toFixed(0)}%`;
  levelEl.innerText = health.label;
  levelEl.classList.remove("pill", "good", "warn", "bad");
  levelEl.classList.add("pill");

  // Colour-code health score according to range
  if (health.score >= 80) {
    levelEl.classList.add("good");
  } else if (health.score >= 50) {
    levelEl.classList.add("warn");
  } else {
    levelEl.classList.add("bad");
  }

  // Dynamic Battery Status: Normal / Warning / Critical
  const statusEl = document.getElementById("battery-status");
  const noteEl = document.getElementById("battery-status-note");
  const status = computeBatteryStatus(voltage, current);

  statusEl.textContent = status.label;
  statusEl.classList.remove("status-normal", "status-warning", "status-critical");
  statusEl.classList.add(status.cssClass);
  noteEl.textContent = status.description;
}

// Computes basic analytics (min/max/average) and updates the Analytics Summary section.
function updateAnalytics(data) {
  const { voltage, current, power } = data;

  const minV = Math.min(...voltage);
  const maxV = Math.max(...voltage);
  const avgV = average(voltage);
  const avgC = average(current);
  const peakP = Math.max(...power);

  document.getElementById("min-voltage").innerText = `${minV.toFixed(2)} V`;
  document.getElementById("max-voltage").innerText = `${maxV.toFixed(2)} V`;
  document.getElementById("avg-voltage").innerText = `${avgV.toFixed(2)} V`;
  document.getElementById("avg-current").innerText = `${avgC.toFixed(2)} A`;
  document.getElementById("peak-power").innerText = `${peakP.toFixed(2)} W`;
}

// Draws or refreshes all charts using Chart.js, including voltage threshold lines.
function updateCharts(data) {
  const { time, voltage, current, power } = data;

  // Example voltage limits (can be tuned to your pack specification)
  // NOTE: These limits are chosen for a single Li-Ion cell where the CSV
  // voltages are around 3.8–3.9 V. Adjust if you change to a different pack.
  const SAFE_VOLTAGE = 4.2;     // fully charged / upper safe reference
  const WARNING_LOW_V = 3.7;    // warning voltage drop
  const CRITICAL_LOW_V = 3.5;   // critical low voltage

  const vDataSets = [
    {
      label: "Voltage (V)",
      data: voltage,
      borderColor: "#00f2fe",
      fill: false
    },
    {
      // Safe line
      label: "Safe Voltage Limit",
      data: new Array(time.length).fill(SAFE_VOLTAGE),
      borderColor: "#2ecc71",
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false
    },
    {
      // Warning line
      label: "Warning Voltage Limit",
      data: new Array(time.length).fill(WARNING_LOW_V),
      borderColor: "#f1c40f",
      borderDash: [4, 4],
      pointRadius: 0,
      fill: false
    },
    {
      // Critical line
      label: "Critical Voltage Limit",
      data: new Array(time.length).fill(CRITICAL_LOW_V),
      borderColor: "#e74c3c",
      borderDash: [2, 4],
      pointRadius: 0,
      fill: false
    }
  ];

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        labels: {
          color: "#e4e7f5"
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#b1b5d0" },
        grid: { color: "rgba(255,255,255,0.05)" }
      },
      y: {
        ticks: { color: "#b1b5d0" },
        grid: { color: "rgba(255,255,255,0.05)" }
      }
    }
  };

  // Voltage chart with threshold lines
  if (voltageChartInstance) voltageChartInstance.destroy();
  voltageChartInstance = new Chart(document.getElementById("voltageChart"), {
    type: "line",
    data: {
      labels: time,
      datasets: vDataSets
    },
    options: baseOptions
  });

  // Current chart with reference lines (safe / warning / critical)
  // Example current limits based on dataset (~7 A typical).
  const SAFE_CURRENT = 8;      // normal operating current
  const WARNING_CURRENT = 9.5;
  const CRITICAL_CURRENT = 11;

  if (currentChartInstance) currentChartInstance.destroy();
  currentChartInstance = new Chart(document.getElementById("currentChart"), {
    type: "line",
    data: {
      labels: time,
      datasets: [
        {
          label: "Current (A)",
          data: current,
          borderColor: "#1d8cf8",
          fill: false
        },
        {
          label: "Safe Current Limit",
          data: new Array(time.length).fill(SAFE_CURRENT),
          borderColor: "#2ecc71",
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: "Warning Current Limit",
          data: new Array(time.length).fill(WARNING_CURRENT),
          borderColor: "#f1c40f",
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: "Critical Current Limit",
          data: new Array(time.length).fill(CRITICAL_CURRENT),
          borderColor: "#e74c3c",
          borderDash: [2, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: baseOptions
  });

  // Power chart with reference lines (safe / warning / critical)
  // Example power limits based on dataset (~30 W typical).
  const SAFE_POWER = 40;       // normal operating power
  const WARNING_POWER = 50;
  const CRITICAL_POWER = 60;

  if (powerChartInstance) powerChartInstance.destroy();
  powerChartInstance = new Chart(document.getElementById("powerChart"), {
    type: "line",
    data: {
      labels: time,
      datasets: [
        {
          label: "Power (W)",
          data: power,
          borderColor: "#ff9f43",
          fill: false
        },
        {
          label: "Safe Power Limit",
          data: new Array(time.length).fill(SAFE_POWER),
          borderColor: "#2ecc71",
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: "Warning Power Limit",
          data: new Array(time.length).fill(WARNING_POWER),
          borderColor: "#f1c40f",
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: "Critical Power Limit",
          data: new Array(time.length).fill(CRITICAL_POWER),
          borderColor: "#e74c3c",
          borderDash: [2, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: baseOptions
  });
}

// ---------------------------------------------------------
// Helper functions for analytics and health/status logic
// ---------------------------------------------------------

function average(arr) {
  if (!arr.length) return 0;
  const sum = arr.reduce((acc, v) => acc + v, 0);
  return sum / arr.length;
}

// Health score logic:
// - Voltage stability: smaller standard deviation is better.
// - Current variation: extreme spikes are penalised.
// The final score is scaled between 0 and 100 for easy interpretation.
function computeHealthScore(voltage, current) {
  const avgV = average(voltage);
  const avgC = average(current);

  const stdV = Math.sqrt(average(voltage.map(v => (v - avgV) ** 2)));
  const stdC = Math.sqrt(average(current.map(c => (c - avgC) ** 2)));

  // Map voltage stability to a score (lower std dev => higher score)
  const voltageComponent = Math.max(0, 100 - (stdV * 8)); // tune factor 8 as needed

  // Map current variation to a score (higher std dev => lower score)
  const currentComponent = Math.max(0, 100 - (stdC * 10)); // tune factor 10 as needed

  // Combine with equal weight
  const score = Math.max(0, Math.min(100, (voltageComponent * 0.6 + currentComponent * 0.4)));

  let label = "Healthy";
  if (score < 50) {
    label = "Critical";
  } else if (score < 80) {
    label = "Warning";
  }

  return { score, label };
}

// Battery status logic based on voltage and current thresholds.
// This is intentionally simple and easy to explain in viva.
function computeBatteryStatus(voltage, current) {
  const latestV = voltage[voltage.length - 1];
  const latestC = current[current.length - 1];

  // Example thresholds – adjust to match your pack:
  // These thresholds are set for a single Li-Ion cell (see CSV: ~3.8–3.9 V, ~7 A).
  const NOMINAL_V = 3.9;
  const MIN_SAFE_V = 3.7;
  const CRITICAL_V = 3.5;
  const HIGH_CURRENT = 9.5; // amps

  // Critical conditions
  if (latestV <= CRITICAL_V || Math.abs(latestC) >= HIGH_CURRENT * 1.5) {
    return {
      label: "Critical",
      cssClass: "status-critical",
      description: "Voltage or current in unsafe region. Reduce load / disconnect pack."
    };
  }

  // Warning conditions
  if (latestV < MIN_SAFE_V || Math.abs(latestC) >= HIGH_CURRENT) {
    return {
      label: "Warning",
      cssClass: "status-warning",
      description: "Voltage dropping or current high. Monitor operating conditions."
    };
  }

  // Normal
  return {
    label: "Normal",
    cssClass: "status-normal",
    description: "Battery operating within nominal voltage and current limits."
  };
}
