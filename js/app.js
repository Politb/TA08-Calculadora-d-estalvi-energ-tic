/**
 * ASIX SUSTAINABILITY CALCULATOR - COMPLETE FULL LOGIC
 * Totes les variables i càlculs inclosos
 */

// 1. VARIABLES GLOBALS I DADES BASE
let currentSimYear = 0;
let chartInstance = null;
let globalChartData = {
    labels: ["Base 2024", "Base 2025"],
    datasets: []
};

// Dades de consum per defecte
const dadesBase = {
    electricitat: { consumDiari: 398.55, festiu: 185.64, produccio: 43.57, anual: 105642 },
    aigua: { anual: 62450 },
    material: { anual: 4032 },
    manteniment: { anual: 3400 }
};

const tarifes = { electricitat: 0.16, aigua: 0.0025 }; 

// 2. INICIALITZACIÓ
document.addEventListener('DOMContentLoaded', () => {
    gestionarFiltres();
    
    // Assignem els events change als checkboxes
    const checkboxes = document.querySelectorAll('.indicator-chk');
    checkboxes.forEach(chk => {
        chk.addEventListener('change', gestionarFiltres);
    });
});

// 3. MOSTRAR/AMAGAR OPCIONS
function gestionarFiltres() {
    const selection = Array.from(document.querySelectorAll('.indicator-chk:checked')).map(cb => cb.value);
    
    const solarGroup = document.getElementById("solar-group");
    const lightingGroup = document.getElementById("lighting-group");

    if (solarGroup) solarGroup.style.display = selection.includes('electricitat') ? 'flex' : 'none';
    if (lightingGroup) lightingGroup.style.display = selection.includes('electricitat') ? 'block' : 'none';
}

// 4. REINICIAR
function reiniciarSimulacio() {
    location.reload();
}

// 5. FUNCIÓ PRINCIPAL DE CÀLCUL
function calcularIProjectar() {
    // Agafar selectors
    const checkboxes = document.querySelectorAll('.indicator-chk:checked');
    const selection = Array.from(checkboxes).map(cb => cb.value);
    
    if (selection.length === 0) {
        alert("Si us plau, selecciona com a mínim un indicador per avaluar.");
        return;
    }

    // Avançar any
    currentSimYear++;
    const actualYear = 2025 + currentSimYear;
    
    // Actualitzar textos UI
    document.getElementById("btn-calcular").innerText = `Calcular Any ${currentSimYear + 1} (${actualYear + 1})`;
    document.getElementById("year-badge").innerText = `Resultats: Any ${currentSimYear} (${actualYear})`;

    // Variables de càlcul general
    const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
    const factorInflacio = Math.pow(1 + (ipc / 100), currentSimYear);
    const isAcademic = document.getElementById("period-select").value === "10";
    const multiplicadorTemps = isAcademic ? 0.83 : 1; // Ajust per 10 mesos
    
    let htmlResultats = "";

    // Afegir etiqueta al gràfic
    globalChartData.labels.push(`Proj. ${actualYear}`);

    // --- CÀLCUL PER A CADA INDICADOR SELECCIONAT ---
    selection.forEach(tipus => {
        let inversio = 0;
        let consumBase = 0;
        let consumOptimitzat = 0;
        let impacteEuros = 0;

        if (tipus === 'electricitat') {
            // Lògica Inversió
            const plaquesSolars = parseFloat(document.getElementById("solar-input").value) || 0;
            const chkBanys = document.getElementById("chk-luces-banos");
            const chkPassadissos = document.getElementById("chk-luces-pasillos");

            inversio += (plaquesSolars * 500); // 500€ per cada 1% de plaques
            
            let estalviPercentual = 0;
            if (chkBanys && chkBanys.checked) {
                estalviPercentual += 3;
                if (!chkBanys.disabled) inversio += 480; // Cost només el primer cop
            }
            if (chkPassadissos && chkPassadissos.checked) {
                estalviPercentual += 5;
                if (!chkPassadissos.disabled) inversio += 720; // Cost només el primer cop
            }

            // Lògica Consum
            consumBase = dadesBase.electricitat.anual * multiplicadorTemps;
            const factorReduccio = 1 - (estalviPercentual / 100);
            const produccioExtra = (dadesBase.electricitat.anual * (plaquesSolars / 100));
            
            consumOptimitzat = (consumBase * factorReduccio) - produccioExtra;
            if (consumOptimitzat < 0) consumOptimitzat = 0;
            
            impacteEuros = consumOptimitzat * tarifes.electricitat * factorInflacio;
            
            // Render Card i Gràfic
            htmlResultats += generarCard("⚡ Electricitat", consumOptimitzat, "kWh", impacteEuros, inversio, "#eab308");
            afegirDadesGrafic("Electricitat (kWh)", consumBase, consumOptimitzat, "#eab308");

        } 
        else if (tipus === 'aigua') {
            consumBase = dadesBase.aigua.anual * multiplicadorTemps;
            consumOptimitzat = consumBase; // Pots afegir lògica d'estalvi d'aigua aquí
            impacteEuros = consumOptimitzat * tarifes.aigua * factorInflacio;
            
            htmlResultats += generarCard("💧 Aigua", consumOptimitzat, "L", impacteEuros, 0, "#3b82f6");
            afegirDadesGrafic("Aigua (L)", consumBase, consumOptimitzat, "#3b82f6");
        }
        else if (tipus === 'material') {
            consumBase = dadesBase.material.anual * multiplicadorTemps;
            consumOptimitzat = consumBase; // Podries afegir inputs de paper/retoladors
            impacteEuros = consumOptimitzat * factorInflacio;
            
            htmlResultats += generarCard("📦 Material i Neteja", impacteEuros, "€", impacteEuros, 0, "#8b5cf6");
            afegirDadesGrafic("Material (€)", consumBase, impacteEuros, "#8b5cf6");
        }
        else if (tipus === 'manteniment') {
            consumBase = dadesBase.manteniment.anual * multiplicadorTemps;
            consumOptimitzat = consumBase;
            impacteEuros = consumOptimitzat * factorInflacio;
            
            htmlResultats += generarCard("🔧 Manteniment", impacteEuros, "€", impacteEuros, 0, "#64748b");
            afegirDadesGrafic("Manteniment (€)", consumBase, impacteEuros, "#64748b");
        }
    });

    // Mostrar resultats a l'HTML
    document.getElementById("calc-output").innerHTML = htmlResultats;
    document.getElementById("result-box").classList.remove("hidden");
    
    // Renderitzar Gràfic
    actualitzarGrafic();

    // Bloquejar controls d'inversió per no cobrar-los dos cops el següent any
    bloquejarInversionsFixes();
}

// 6. FUNCIONS AUXILIARS DE RENDERITZAT
function generarCard(títol, valor, unitat, impacte, inversio, color) {
    let html = `
    <div class="summary-card" style="border-top-color: ${color}">
        <h3>${títol}</h3>
        <div class="val">${valor.toLocaleString('es-ES', {maximumFractionDigits: 0})} ${unitat}</div>
        <div class="impact">Impacte Estimat: ${impacte.toLocaleString('es-ES', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0})}</div>`;
    
    if (inversio > 0) {
        html += `<div class="invest">Inversió Requerida: ${inversio.toLocaleString('es-ES', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0})}</div>`;
    }
    
    html += `</div>`;
    return html;
}

function afegirDadesGrafic(label, base, optimitzat, color) {
    let dataset = globalChartData.datasets.find(ds => ds.label === label);
    if (!dataset) {
        // Si és el primer cop, afegim l'històric (Base 2024 i Base 2025)
        dataset = {
            label: label,
            data: [base * 0.98, base], // Simulem un petit increment històric
            backgroundColor: color,
            borderRadius: 4
        };
        globalChartData.datasets.push(dataset);
    }
    // Afegim la projecció
    dataset.data.push(optimitzat);
}

function actualitzarGrafic() {
    const ctx = document.getElementById('history-chart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: globalChartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: { type: 'logarithmic', display: true } // Logarithmic va bé quan barreges L d'aigua amb €
            }
        }
    });
}

function bloquejarInversionsFixes() {
    // Un cop calculat, no deixem desmarcar els indicadors principals actius
    document.querySelectorAll('.indicator-chk:checked').forEach(chk => chk.disabled = true);
    
    // Bloquegem les instal·lacions ja "comprades"
    const banys = document.getElementById("chk-luces-banos");
    const pass = document.getElementById("chk-luces-pasillos");
    
    if (banys && banys.checked) banys.disabled = true;
    if (pass && pass.checked) pass.disabled = true;
}