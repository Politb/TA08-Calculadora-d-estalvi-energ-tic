/**
 * LÒGICA DE NEGOCI: CALCULADORA DE SOSTENIBILITAT ASIX
 * Versió: 12.1 (Simulador amb barres de comparació dinàmiques)
 */

const dadesBase = {
  electricitat: {
    consumDiariLectiu: 398.55,
    consumDiariVacances: 185.64,
    produccioDiaria: 43.57,
  },
  aigua: 6245,
  material_neteja: 336.05,
  manteniment: 283.45,
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
  material_neteja: [
    1.07, 1.0, 1.0, 1.0, 1.0, 1.13, 0.17, 0.0, 1.4, 1.0, 1.0, 0.87,
  ],
  manteniment: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
};

let chartInstance = null;

// ESTAT GLOBAL PER A LA SIMULACIÓ PROGRESSIVA
let anyActual = 0;
let dadesGraficGlobal = null;

function gestionarFiltres() {
  const checkboxes = document.querySelectorAll(".indicator-chk:checked");
  const seleccio = Array.from(checkboxes).map((cb) => cb.value);

  const solarGroup = document.getElementById("solar-control-group");
  const electricSensorsGroup = document.getElementById(
    "electric-sensors-group",
  );
  const waterGroup = document.getElementById("water-control-group");
  const materialGroup = document.getElementById("material-control-group");

  if (seleccio.includes("electricitat")) {
    solarGroup.style.display = "flex";
    electricSensorsGroup.style.display = "flex";
  } else {
    solarGroup.style.display = "none";
    electricSensorsGroup.style.display = "none";
  }

  if (seleccio.includes("aigua")) waterGroup.style.display = "flex";
  else waterGroup.style.display = "none";
  if (seleccio.includes("material_neteja"))
    materialGroup.style.display = "flex";
  else materialGroup.style.display = "none";
}

document.addEventListener("DOMContentLoaded", gestionarFiltres);

function formatarVariacio(base, optimitzat) {
  if (base === 0) return "";
  let variacio = ((optimitzat - base) / base) * 100;

  if (variacio < -0.1) {
    return `<div style="font-size: 0.9rem; font-weight: 700; color: #16a34a; margin-top: 0.5rem;">📉 -${Math.abs(variacio).toFixed(1)}% respecte la base inicial</div>`;
  } else if (variacio > 0.1) {
    return `<div style="font-size: 0.9rem; font-weight: 700; color: #dc2626; margin-top: 0.5rem;">📈 +${variacio.toFixed(1)}% respecte la base inicial</div>`;
  } else {
    return `<div style="font-size: 0.9rem; font-weight: 700; color: #64748b; margin-top: 0.5rem;">➖ Sense variació real</div>`;
  }
}

function calcularIProjectar() {
  if (anyActual >= 50) {
    alert("Has assolit el límit màxim de la simulació (50 anys).");
    return;
  }

  const checkboxes = document.querySelectorAll(".indicator-chk:checked");
  const seleccio = Array.from(checkboxes).map((cb) => cb.value);

  if (seleccio.length === 0) {
    alert(
      "Si us plau, selecciona com a mínim una àrea a avaluar abans de començar.",
    );
    return;
  }

  anyActual++; 
  document.getElementById("year-badge").innerText =
    `Projecció: Any ${anyActual} (${2025 + anyActual})`;

  const periode = document.getElementById("period-select").value;
  const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
  const factorIPC = Math.pow(1 + ipc / 100, anyActual);

  let mesosACalcular =
    periode === "any"
      ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : [8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
  let outputHTML = "";

  let isFirstYear = anyActual === 1;
  if (isFirstYear) {
    dadesGraficGlobal = {
      labels: ["Històric 2024", "Històric 2025"],
      datasets: [],
    };
  }

  dadesGraficGlobal.labels.push(`Proj. ${2025 + anyActual}`);

  seleccio.forEach((tipus) => {
    let totalBase = 0;
    let totalOptimitzat = 0;

    if (tipus === "electricitat") {
      const extraSolarPercent =
        parseFloat(document.getElementById("solar-input").value) || 0;
      const factorSolar = 1 + extraSolarPercent / 100;
      let estalviLlumPercent = 0;
      let inversioLlum = 0;

      let chkBanos = document.getElementById("chk-luces-banos");
      let chkPasillos = document.getElementById("chk-luces-pasillos");

      if (chkBanos.checked) estalviLlumPercent += 3;
      if (chkPasillos.checked) estalviLlumPercent += 5;
      if (chkBanos.checked && !chkBanos.disabled) inversioLlum += 480;
      if (chkPasillos.checked && !chkPasillos.disabled) inversioLlum += 720;

      const factorConsumLlum = 1 - estalviLlumPercent / 100;

      mesosACalcular.forEach((mesIndex) => {
        let multEst = estacionalitat.electricitat[mesIndex];
        let lectius = Math.min((diesLaborablesMes[mesIndex] / 5) * 7, diesTotalsMes[mesIndex]);
        let vac = diesTotalsMes[mesIndex] - lectius;
        let consumMes = dadesBase.electricitat.consumDiariLectiu * lectius + dadesBase.electricitat.consumDiariVacances * vac;
        let consumMesOpt = consumMes * factorConsumLlum;
        let prodBase = dadesBase.electricitat.produccioDiaria * diesTotalsMes[mesIndex];
        let prodOpt = dadesBase.electricitat.produccioDiaria * factorSolar * diesTotalsMes[mesIndex];

        totalBase += Math.max(0, consumMes - prodBase) * multEst;
        totalOptimitzat += Math.max(0, consumMesOpt - prodOpt) * multEst;
      });

      outputHTML += crearCardResum(
        "⚡ Electricitat",
        `${totalOptimitzat.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} kWh`,
        `Impacte Estimat: ${(totalOptimitzat * tarifes.electricitat).toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`,
        formatarVariacio(totalBase, totalOptimitzat),
        inversioLlum > 0 ? `Inversió aquest any: ${inversioLlum} €` : "",
        "#f59e0b",
      );

      afegirOGestionarDataset("Electricitat (kWh)", totalBase, totalOptimitzat, "#f59e0b", "y", isFirstYear);
    } else if (tipus === "aigua") {
      let estalviPercent = 0;
      if (document.getElementById("chk-aireadores").checked) estalviPercent += 12;
      if (document.getElementById("chk-cisternas").checked) estalviPercent += 20;
      if (document.getElementById("chk-sensores").checked) estalviPercent += 15;

      const factorAigua = 1 - estalviPercent / 100;
      mesosACalcular.forEach((mesIndex) => {
        totalBase += dadesBase.aigua * diesLaborablesMes[mesIndex] * estacionalitat.aigua[mesIndex];
      });
      totalOptimitzat = totalBase * factorAigua;

      outputHTML += crearCardResum(
        "💧 Aigua",
        `${totalOptimitzat.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} L`,
        `Impacte Estimat: ${(totalOptimitzat * tarifes.aigua).toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`,
        formatarVariacio(totalBase, totalOptimitzat),
        "",
        "#0ea5e9",
      );

      afegirOGestionarDataset("Aigua (L)", totalBase, totalOptimitzat, "#0ea5e9", "y", isFirstYear);
    } else if (tipus === "material_neteja") {
      let factorPapel = document.getElementById("input-papel").value / 100;
      let factorRotuladores = document.getElementById("input-rotuladores").value / 100;

      mesosACalcular.forEach((mesIndex) => {
        let est = estacionalitat.material_neteja[mesIndex];
        totalBase += dadesBase.material_neteja * est;
        let costMesOpt = costMensualPaper * factorPapel + costMensualRotuladores * factorRotuladores + costMensualResta;
        totalOptimitzat += costMesOpt * est * factorIPC;
      });

      let baseSenseIPC = totalBase;
      let optSenseIPC = totalOptimitzat / factorIPC;
      let usPercentual = (optSenseIPC / baseSenseIPC) * 100;

      outputHTML += crearCardResum(
        "📦 Material i Neteja",
        `${totalOptimitzat.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`,
        `IPC Acumulat aplicat (${((factorIPC - 1) * 100).toFixed(1)}%)`,
        `<div style="font-size: 0.85rem; color: #8b5cf6; margin-top: 0.2rem; font-weight: bold;">🔻 ${(100 - usPercentual).toFixed(1)}% reducció d'ús real vs base</div>`,
        "",
        "#8b5cf6",
      );

      afegirOGestionarDataset("Material i Neteja (€)", totalBase * factorIPC, totalOptimitzat, "#8b5cf6", "y", isFirstYear);
      afegirOGestionarDataset("Ús de Material (%)", 100, usPercentual, "#ec4899", "y1", isFirstYear);
    } else {
      mesosACalcular.forEach((mesIndex) => {
        totalBase += dadesBase.manteniment * estacionalitat.manteniment[mesIndex];
      });
      totalOptimitzat = totalBase * factorIPC;
      
      outputHTML += crearCardResum(
        "🔧 Manteniment",
        `${totalOptimitzat.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`,
        `IPC Acumulat aplicat (${((factorIPC - 1) * 100).toFixed(1)}%)`,
        formatarVariacio(totalBase, totalOptimitzat),
        "",
        "#64748b",
      );

      afegirOGestionarDataset("Manteniment (€)", totalBase * factorIPC, totalOptimitzat, "#64748b", "y", isFirstYear);
    }
  });

  document.getElementById("calc-output").innerHTML = outputHTML;
  document.getElementById("result-box").classList.remove("hidden");
  document.getElementById("btn-reiniciar").classList.remove("hidden");
  document.getElementById("btn-calcular").innerText = `Calcular Any ${anyActual + 1}`;
  renderitzarGrafic(dadesGraficGlobal);
  bloquejarControlsAplicats();
  if (!document.getElementById("plan-results").classList.contains("hidden")) aplicarPlaReduccio();
}

function afegirOGestionarDataset(label, valorBase, valorOptimitzat, color, axisID, isFirstYear) {
  // 1. Dataset OPTIMITZAT (Color principal)
  let datasetOpt = dadesGraficGlobal.datasets.find((ds) => ds.label === label);
  if (!datasetOpt) {
    datasetOpt = {
      label: label,
      data: [valorBase * (axisID === "y1" ? 1 : 1.02), valorBase], 
      backgroundColor: color,
      borderRadius: 4,
      yAxisID: axisID,
    };
    dadesGraficGlobal.datasets.push(datasetOpt);
  }
  datasetOpt.data.push(valorOptimitzat);

  // 2. Dataset BASE (Gris)
  let labelBase = label + " (Sense mesures)";
  let datasetBase = dadesGraficGlobal.datasets.find((ds) => ds.label === labelBase);
  if (!datasetBase) {
    datasetBase = {
      label: labelBase,
      data: [null, null], 
      backgroundColor: "#cbd5e1",
      borderRadius: 4,
      yAxisID: axisID,
      skipNull: true
    };
    dadesGraficGlobal.datasets.push(datasetBase);
  }

  // MODIFICACIÓ SOL·LICITADA:
  // Si el valor optimitzat és igual al base (no hi ha canvi), enviem 'null' per ocultar la barra gris.
  // Fem servir Math.abs per seguretat amb els decimals.
  if (Math.abs(valorBase - valorOptimitzat) < 0.1) {
    datasetBase.data.push(null);
  } else {
    datasetBase.data.push(valorBase);
  }
}

function bloquejarControlsAplicats() {
  document.querySelectorAll(".indicator-chk").forEach((chk) => (chk.disabled = true));
  document.getElementById("period-select").disabled = true;
  document.querySelectorAll("#chk-luces-banos, #chk-luces-pasillos, #chk-aireadores, #chk-cisternas, #chk-sensores").forEach((chk) => {
    if (chk.checked) chk.disabled = true;
  });
}

function resetEstat() {
  anyActual = 0;
  dadesGraficGlobal = null;
  document.querySelectorAll("input, select").forEach((element) => (element.disabled = false));
  document.getElementById("btn-calcular").innerText = "Calcular Any 1";
  document.getElementById("btn-reiniciar").classList.add("hidden");
  document.getElementById("result-box").classList.add("hidden");
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

function crearCardResum(titol, valor, subValor, extra1, extra2, color) {
  return `
        <div class="summary-item" style="border-left-color: ${color};">
            <h4>${titol}</h4>
            <div class="value">${valor}</div>
            <div class="sub-value">${subValor}</div>
            ${extra1}
            ${extra2 ? `<div class="investment" style="margin-top:0.75rem;display:inline-block;padding:0.25rem 0.5rem;background:#fee2e2;color:#ef4444;border-radius:4px;font-size:0.8rem;font-weight:bold;">${extra2}</div>` : ""}
        </div>
    `;
}

function renderitzarGrafic(dades) {
  const ctx = document.getElementById("history-chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: dades,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Cronograma Multi-Any de Consums i Despeses",
          font: { size: 16 }
        },
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.parsed.y !== null) {
                if (context.dataset.yAxisID === "y1") label += context.parsed.y.toFixed(1) + "%";
                else label += context.parsed.y.toLocaleString("ca-ES", { maximumFractionDigits: 0 });
              }
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          type: "logarithmic",
          display: true,
          position: "left",
          title: { display: true, text: "Consums i Despeses (L, kWh, €)" },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          min: 0,
          max: 100,
          title: { display: true, text: "Percentatge d'Ús (%)" },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

function aplicarPlaReduccio() {
  const resultContainer = document.getElementById("plan-results");
  const percPapel = document.getElementById("input-papel") ? document.getElementById("input-papel").value : 100;
  const percRotuladores = document.getElementById("input-rotuladores") ? document.getElementById("input-rotuladores").value : 100;

  resultContainer.innerHTML = `
        <div class="plan-grid">
            <div class="plan-card-item">
                <h3>⚡ Energia i Aigua</h3>
                <ul>
                    <li><strong>Plaques Solars:</strong> Instal·lació de mòduls fotovoltaics per a l'autoconsum.</li>
                    <li><strong>Llum Automàtica:</strong> Sensors de presència intel·ligents.</li>
                    <li><strong>Sistemes Hídrics:</strong> Airejadors i electrovàlvules de tall automàtic.</li>
                </ul>
            </div>
            <div class="plan-card-item">
                <h3>📦 Material i Neteja</h3>
                <ul>
                    <li><strong>Digitalització (Ús al ${percPapel}%):</strong> Reducció del consum de paper.</li>
                    <li><strong>Materials Reutilitzables (Ús al ${percRotuladores}%):</strong> Priorització de retoladors recarregables.</li>
                </ul>
            </div>
        </div>
    `;
  resultContainer.classList.remove("hidden");
}