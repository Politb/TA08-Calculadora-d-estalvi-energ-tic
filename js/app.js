/**
 * LÒGICA DE NEGOCI: CALCULADORA DE SOSTENIBILITAT ASIX
 * Versió: 5.0 (Multiselecció + Resum Unificat + Gràfic Històric Chart.js)
 */

// Dades base 
const dadesBase = {
    electricitat: {
        consumDiariLectiu: 398.55,  
        consumDiariVacances: 185.64,
        produccioDiaria: 43.57      
    },
    aigua: 6245,          
    oficina: 225.50,      
    neteja: 110.55,       
    manteniment: 283.45   
};

// Preus estimats per unificar el cronograma en EUROS (€)
const tarifes = {
    electricitat: 0.16, // €/kWh
    aigua: 0.0025       // €/Litre
};

const diesTotalsMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const diesLaborablesMes = [17, 20, 23, 16, 23, 20, 10, 0, 17, 23, 22, 15];

const estacionalitat = {
    electricitat: [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.2, 0.0, 0.8, 1.0, 1.2, 1.3],
    aigua:        [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 0.2, 0.0, 1.1, 1.0, 0.9, 0.9], 
    oficina:      [1.1, 1.0, 1.0, 1.0, 1.0, 1.2, 0.0, 0.0, 1.5, 1.0, 1.0, 0.8], 
    neteja:       [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 0.0, 1.2, 1.0, 1.0, 1.0],
    manteniment:  [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] 
};

// Variable per emmagatzemar la instància del gràfic i poder-lo actualitzar
let chartInstance = null;

/**
 * Mostra o amaga els grups d'opcions en funció dels checkboxes seleccionats
 */
function gestionarFiltres() {
    const checkboxes = document.querySelectorAll('.indicator-chk:checked');
    const seleccio = Array.from(checkboxes).map(cb => cb.value);
    
    const solarGroup = document.getElementById("solar-control-group");
    const waterGroup = document.getElementById("water-control-group");

    // Si hi ha electricitat seleccionada, mostrem plaques
    if (seleccio.includes('electricitat')) solarGroup.style.display = 'flex';
    else solarGroup.style.display = 'none';

    // Si hi ha aigua seleccionada, mostrem eficiència hídrica
    if (seleccio.includes('aigua')) waterGroup.style.display = 'flex';
    else waterGroup.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', gestionarFiltres);

/**
 * Càlcul principal: Ara processa TOTS els indicadors seleccionats
 */
function calcularConsum() {
    const checkboxes = document.querySelectorAll('.indicator-chk:checked');
    const seleccio = Array.from(checkboxes).map(cb => cb.value);
    
    if (seleccio.length === 0) {
        alert("Si us plau, selecciona com a mínim una àrea a avaluar.");
        return;
    }

    const periode = document.getElementById("period-select").value;
    const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
    const factorIPC = 1 + (ipc / 100);
    let mesosACalcular = (periode === "any") ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];

    let outputHTML = "";
    let dadesGrafic = {
        labels: ["Històric 2024", "Històric 2025", "Projecció Optimitada (Ara)"],
        datasets: []
    };

    // Iterem per cada àrea seleccionada per generar el resum i les dades del gràfic
    seleccio.forEach(tipus => {
        let totalAcumulat = 0;

        // --- Lògica Específica per Àrea ---
        if (tipus === 'electricitat') {
            const extraSolarPercent = parseFloat(document.getElementById("solar-input").value) || 0;
            const factorSolar = 1 + (extraSolarPercent / 100);
            
            mesosACalcular.forEach(mesIndex => {
                let multEst = estacionalitat.electricitat[mesIndex];
                let lectius = Math.min((diesLaborablesMes[mesIndex] / 5) * 7, diesTotalsMes[mesIndex]);
                let vac = diesTotalsMes[mesIndex] - lectius;
                
                let consumMes = (dadesBase.electricitat.consumDiariLectiu * lectius) + 
                                (dadesBase.electricitat.consumDiariVacances * vac);
                let produccioMes = (dadesBase.electricitat.produccioDiaria * factorSolar) * diesTotalsMes[mesIndex];
                
                totalAcumulat += Math.max(0, consumMes - produccioMes) * multEst;
            });

            const costMantenimentInversio = extraSolarPercent > 0 ? "Inversió inclosa" : "Sense Plaques";
            
            outputHTML += `
                <div class="summary-item">
                    <h4>⚡ Electricitat</h4>
                    <div class="value">${totalAcumulat.toLocaleString('ca-ES', {maximumFractionDigits: 0})} kWh</div>
                    <div class="sub-value">Impacte Estimat: ${(totalAcumulat * tarifes.electricitat).toLocaleString('ca-ES', {maximumFractionDigits: 0})} €</div>
                </div>
            `;

            afegirDadesAlGrafic(dadesGrafic, 'Electricitat (€)', totalAcumulat * tarifes.electricitat, '#f59e0b');

        } else if (tipus === 'aigua') {
            let estalviPercent = 0;
            if (document.getElementById("chk-aireadores").checked) estalviPercent += 12; 
            if (document.getElementById("chk-cisternas").checked) estalviPercent += 20;  
            if (document.getElementById("chk-sensores").checked) estalviPercent += 15;
            
            const factorAigua = 1 - (estalviPercent / 100);

            mesosACalcular.forEach(mesIndex => {
                totalAcumulat += dadesBase.aigua * diesLaborablesMes[mesIndex] * estacionalitat.aigua[mesIndex];
            });
            
            totalAcumulat = totalAcumulat * factorAigua;

            outputHTML += `
                <div class="summary-item" style="border-left-color: #0ea5e9;">
                    <h4>💧 Aigua</h4>
                    <div class="value">${totalAcumulat.toLocaleString('ca-ES', {maximumFractionDigits: 0})} L</div>
                    <div class="sub-value">Impacte Estimat: ${(totalAcumulat * tarifes.aigua).toLocaleString('ca-ES', {maximumFractionDigits: 0})} €</div>
                </div>
            `;

            afegirDadesAlGrafic(dadesGrafic, 'Aigua (€)', totalAcumulat * tarifes.aigua, '#0ea5e9');

        } else {
            // Oficina, Neteja, Manteniment
            mesosACalcular.forEach(mesIndex => {
                totalAcumulat += dadesBase[tipus] * estacionalitat[tipus][mesIndex];
            });
            totalAcumulat = totalAcumulat * factorIPC;

            let nomLabel = tipus === 'oficina' ? 'Material Oficina' : tipus === 'neteja' ? 'Neteja' : 'Manteniment';
            let colorStr = tipus === 'oficina' ? '#8b5cf6' : tipus === 'neteja' ? '#10b981' : '#64748b';

            outputHTML += `
                <div class="summary-item" style="border-left-color: ${colorStr};">
                    <h4>📦 ${nomLabel}</h4>
                    <div class="value">${totalAcumulat.toLocaleString('ca-ES', {maximumFractionDigits: 0})} €</div>
                    <div class="sub-value">IPC inclòs (${ipc}%)</div>
                </div>
            `;

            afegirDadesAlGrafic(dadesGrafic, nomLabel + ' (€)', totalAcumulat, colorStr);
        }
    });

    document.getElementById("calc-output").innerHTML = outputHTML;
    document.getElementById("result-box").classList.remove("hidden");
    
    // Generar o actualitzar el cronograma
    renderitzarGrafic(dadesGrafic);
}

/**
 * Funció d'ajuda per crear les dades històriques simulades per al gràfic
 */
function afegirDadesAlGrafic(dadesGrafic, label, valorOptimitzat, color) {
    // Simulem que el 2024 es va gastar un 25% més, i el 2025 un 15% més que la projecció optimitzada
    let valor2024 = valorOptimitzat * 1.25; 
    let valor2025 = valorOptimitzat * 1.15; 

    dadesGrafic.datasets.push({
        label: label,
        data: [valor2024, valor2025, valorOptimitzat],
        backgroundColor: color,
        borderRadius: 4
    });
}

/**
 * Dibuixa el Cronograma utilitzant Chart.js
 */
function renderitzarGrafic(dadesGrafic) {
    const ctx = document.getElementById('history-chart').getContext('2d');
    
    // Si ja existeix un gràfic previ, el destruïm per no encavalcar-los
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: dadesGrafic,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Cronograma Comparatiu de Costos Operatius (€)',
                    font: { size: 16, family: '-apple-system' }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cost Anual (€)'
                    }
                }
            }
        }
    });
}

/**
 * Genera l'informe global (Vinyetes)
 */
function aplicarPlaReduccio() {
    const resultContainer = document.getElementById("plan-results");
    
    resultContainer.innerHTML = `
        <div class="plan-grid">
            <div class="plan-card-item">
                <h3>⚡ Consum Elèctric</h3>
                <ul>
                    <li><strong>Plaques Solars:</strong> Instal·lació de mòduls fotovoltaics per a l'autoconsum, reduint dràsticament la dependència de la xarxa.</li>
                    <li><strong>Llum Automàtica:</strong> Implementació de sensors de presència intel·ligents a les aules i passadissos per evitar el consum fantasma.</li>
                </ul>
            </div>
            
            <div class="plan-card-item">
                <h3>💧 Consum d'Aigua</h3>
                <ul>
                    <li><strong>Instal·lació d'airejadors:</strong> Col·locació de filtres d'alta eficiència a les aixetes que redueixen el cabal sense perdre pressió.</li>
                    <li><strong>Electrovàlvules de tall automàtic:</strong> Sistema de seguretat que talla l'aigua dels banys fora de l'horari escolar.</li>
                    <li><strong>Monitorització de fugues (IoT):</strong> Sensors de cabal que detecten fluxos constants inusuals i envien alertes al manteniment.</li>
                </ul>
            </div>

            <div class="plan-card-item">
                <h3>📦 Gestió de Material</h3>
                <ul>
                    <li style="color: var(--text-muted); font-style: italic;">
                        <strong>Fase d'estudi:</strong> Les mesures per a l'optimització de material d'oficina, productes de neteja i manteniment es troben en fase d'anàlisi pel comitè de sostenibilitat.
                    </li>
                </ul>
            </div>
        </div>
    `;

    resultContainer.classList.remove("hidden");
}