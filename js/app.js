/**
 * BUSINESS LOGIC: ASIX SUSTAINABILITY CALCULATOR
 * Update: Comparative chart and English translation
 */

const dadesBase = {
  electricitat: { consumDiariLectiu: 398.55, consumDiariVacances: 185.64, produccioDiaria: 43.57 },
  aigua: 6245,
  material_neteja: 336.05,
  manteniment: 283.45
};

const costMensualPaper = 140.0;
const costMensualRotuladors = 60.0;
const costMensualResta = 136.05;
const tarifes = { electricitat: 0.16, aigua: 0.0025 };

const diesTotalsMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const diesLaborablesMes = [17, 20, 23, 16, 23, 20, 10, 0, 17, 23, 22, 15];
const estacionalitat = {
  electricitat: [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.2, 0.0, 0.8, 1.0, 1.2, 1.3],
  aigua: [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 0.2, 0.0, 1.1, 1.0, 0.9, 0.9],
  material_neteja: [1.07, 1.0, 1.0, 1.0, 1.0, 1.13, 0.17, 0.0, 1.4, 1.0, 1.0, 0.87],
  manteniment: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
};

let chartInstance = null;
let anyActual = 0;
let dadesGraficGlobal = null;

function gestionarFiltres() {
  const checkboxes = document.querySelectorAll(".indicator-chk:checked");
  const seleccio = Array.from(checkboxes).map((cb) => cb.value);

  document.getElementById("solar-control-group").style.display = seleccio.includes("electricitat") ? "flex" : "none";
  document.getElementById("electric-sensors-group").style.display = seleccio.includes("electricitat") ? "flex" : "none";
  document.getElementById("water-control-group").style.display = seleccio.includes("aigua") ? "flex" : "none";
  document.getElementById("material-control-group").style.display = seleccio.includes("material_neteja") ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", gestionarFiltres);

function calcularIProjectar() {
  if (anyActual >= 50) return alert("50-year limit reached.");
  
  const checkboxes = document.querySelectorAll(".indicator-chk:checked");
  const seleccio = Array.from(checkboxes).map((cb) => cb.value);
  if (seleccio.length === 0) return alert("Please select at least one area.");

  anyActual++;
  document.getElementById("year-badge").innerText = `Projection: Year ${anyActual} (${2025 + anyActual})`;

  const factorIPC = Math.pow(1 + (parseFloat(document.getElementById("ipc-input").value) || 0) / 100, anyActual);
  let mesos = document.getElementById("period-select").value === "any" ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];
  
  if (anyActual === 1) {
    dadesGraficGlobal = { labels: ["Historical 2024", "Historical 2025"], datasets: [] };
  }
  dadesGraficGlobal.labels.push(`Year ${anyActual}`);

  let outputHTML = "";

  seleccio.forEach((tipus) => {
    let totalBase = 0, totalOpt = 0;

    if (tipus === "electricitat") {
      let redLlum = (document.getElementById("chk-luces-banos").checked ? 0.03 : 0) + (document.getElementById("chk-luces-pasillos").checked ? 0.05 : 0);
      let factorSolar = 1 + (parseFloat(document.getElementById("solar-input").value) || 0) / 100;
      mesos.forEach(m => {
        let lectius = (diesLaborablesMes[m]/5)*7;
        let vac = diesTotalsMes[m] - lectius;
        let consum = (dadesBase.electricitat.consumDiariLectiu * lectius + dadesBase.electricitat.consumDiariVacances * vac) * estacionalitat.electricitat[m];
        totalBase += Math.max(0, consum - (dadesBase.electricitat.produccioDiaria * diesTotalsMes[m])) * factorIPC;
        totalOpt += Math.max(0, (consum * (1-redLlum)) - (dadesBase.electricitat.produccioDiaria * factorSolar * diesTotalsMes[m])) * factorIPC;
      });
      outputHTML += crearCard("⚡ Electricity", `${totalOpt.toFixed(0)} kWh`, `#f59e0b`, `Est. Cost: ${(totalOpt * tarifes.electricitat).toFixed(0)}€`);
      afegirDatasetComparatiu("Electricity (kWh)", totalBase, totalOpt, "#f59e0b");

    } else if (tipus === "aigua") {
      let red = (document.getElementById("chk-aireadores").checked ? 0.12 : 0) + (document.getElementById("chk-cisternas").checked ? 0.20 : 0) + (document.getElementById("chk-sensores").checked ? 0.15 : 0);
      mesos.forEach(m => totalBase += dadesBase.aigua * diesLaborablesMes[m] * estacionalitat.aigua[m] * factorIPC);
      totalOpt = totalBase * (1 - red);
      outputHTML += crearCard("💧 Water", `${totalOpt.toFixed(0)} L`, `#0ea5e9`, `Est. Cost: ${(totalOpt * tarifes.aigua).toFixed(0)}€`);
      afegirDatasetComparatiu("Water (L)", totalBase, totalOpt, "#0ea5e9");

    } else if (tipus === "material_neteja") {
      let fPapel = document.getElementById("input-papel").value / 100;
      let fRotu = document.getElementById("input-rotuladores").value / 100;
      mesos.forEach(m => {
        totalBase += dadesBase.material_neteja * estacionalitat.material_neteja[m] * factorIPC;
        totalOpt += (costMensualPaper * fPapel + costMensualRotuladors * fRotu + costMensualResta) * estacionalitat.material_neteja[m] * factorIPC;
      });
      outputHTML += crearCard("📦 Material & Cleaning", `${totalOpt.toFixed(0)} €`, `#8b5cf6`, `Usage reduction applied`);
      afegirDatasetComparatiu("Material (€)", totalBase, totalOpt, "#8b5cf6");
    }
  });

  document.getElementById("calc-output").innerHTML = outputHTML;
  document.getElementById("result-box").classList.remove("hidden");
  document.getElementById("btn-reiniciar").classList.remove("hidden"); 
  
  renderitzarGrafic();
  bloquejarFiltres();
}

/**
 * Gestiona dos datasets per categoria: el real (color) i el teòric sense canvis (gris)
 */
function afegirDatasetComparatiu(label, vBase, vOpt, color) {
  // 1. Dataset de mesures (COLOR)
  let dsOpt = dadesGraficGlobal.datasets.find(d => d.label === label);
  if (!dsOpt) {
    dsOpt = { label: label, data: [vBase * 0.98, vBase], backgroundColor: color, borderRadius: 4 };
    dadesGraficGlobal.datasets.push(dsOpt);
  }
  dsOpt.data.push(vOpt);

  // 2. Dataset sense mesures (GREY)
  let labelGris = label + " (No changes)";
  let dsGris = dadesGraficGlobal.datasets.find(d => d.label === labelGris);
  if (!dsGris) {
    dsGris = { 
        label: labelGris, 
        data: [null, null], // No té històric, només projecció
        backgroundColor: "#cbd5e1", 
        borderRadius: 4 
    };
    dadesGraficGlobal.datasets.push(dsGris);
  }
  dsGris.data.push(vBase);
}

function crearCard(t, v, c, sub) {
  return `
    <div class="summary-item" style="border-left: 4px solid ${c}">
      <h4>${t}</h4>
      <div class="value">${v}</div>
      <div class="sub-value">${sub}</div>
    </div>`;
}

function renderitzarGrafic() {
  const ctx = document.getElementById("history-chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: dadesGraficGlobal,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { 
        y: { 
          type: 'logarithmic',
          title: { display: true, text: 'Consumption & Costs (Log Scale)' }
        } 
      },
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function bloquejarFiltres() {
  // Només bloquegem selectors d'àrea i període. Sliders lliures.
  document.querySelectorAll(".indicator-chk, #period-select").forEach(i => i.disabled = true);
  document.querySelectorAll(".measure-chk:checked").forEach(i => i.disabled = true);
}

function resetEstat() { 
  location.reload(); 
}

function aplicarPlaReduccio() {
    const res = document.getElementById("plan-results");
    const p = document.getElementById("input-papel").value;
    const r = document.getElementById("input-rotuladores").value;
    
    res.innerHTML = `
      <div class="plan-grid">
        <div class="plan-card-item">
          <h3>Strategy</h3>
          <ul>
            <li>Digitalization: Paper usage level at ${p}%.</li>
            <li>Materials: Marker usage level at ${r}%.</li>
            <li>Electricity: Efficiency measures and active solar panels.</li>
          </ul>
        </div>
      </div>`;
    res.classList.remove("hidden");
}