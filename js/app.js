// 1. Dades base ajustades EXACTAMENT al teu JSON (ITB Leaks)
const dadesBase = {
    electricitat: 470,    // kWh/dia (Plant Report)
    aigua: 7185,          // L/dia (Gràfiques de consum horari)
    oficina: 75.98,       // €/mes aprox per clavar els 805,65€ anuals (Navigator/Faibo)
    neteja: 110.55,       // €/mes aprox per clavar els 1204,98€ anuals (Fardos paper)
    manteniment: 283.45   // €/mes aprox per clavar els 3401,45€ anuals (Urgències, quadres elèctrics)
};

// 2. Multiplicadors d'Estacionalitat i Tendències (Gener a Desembre)
const estacionalitat = {
    electricitat: [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.2, 0.1, 0.8, 1.0, 1.2, 1.3],
    aigua:        [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 0.2, 0.1, 1.1, 1.0, 0.9, 0.9], 
    oficina:      [1.1, 1.0, 1.0, 1.0, 1.0, 1.2, 0.0, 0.0, 1.5, 1.0, 1.0, 0.8], 
    neteja:       [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 0.2, 1.2, 1.0, 1.0, 1.0],
    manteniment:  [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] 
};

// Dies laborables estimats per mes
const diesLaborablesMes = [20, 20, 22, 18, 21, 20, 10, 0, 21, 22, 20, 15];

// Consells de reducció ràpids per al requadre de càlcul
const consells = {
    electricitat: "💡 Consell: Apliqueu polítiques GPO per forçar la hibernació dels PCs a les 15:00h.",
    aigua: "💧 Consell: Instal·lar airejadors a les aixetes permet reduir l'impacte visualitzat en hores de pati.",
    oficina: "📎 Consell: Passar exclusivament a recanvis de tinta líquida Pilot Begreen.",
    neteja: "🧹 Consell: Substituir els fardos de paper eixugamans per assecadors d'aire.",
    manteniment: "🗑️ Consell: Un bon manteniment preventiu des d'ASIX evita urgències com la del compressor AACC."
};

// Càlcul individual (Punt 3.1.a)
function calcularConsum() {
    const tipus = document.getElementById("indicator-select").value;
    const periode = document.getElementById("period-select").value;
    
    let total = 0;
    let mesosACalcular = periode === "any" ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];

    mesosACalcular.forEach(mesIndex => {
        let multiplicador = estacionalitat[tipus][mesIndex];
        // Variabilitat aleatòria (+/- 5%) per complir la rúbrica
        let variabilitatAleatoria = 1 + (Math.random() * 0.1 - 0.05); 
        
        if (tipus === 'electricitat' || tipus === 'aigua') {
            let consumMes = dadesBase[tipus] * diesLaborablesMes[mesIndex] * multiplicador * variabilitatAleatoria;
            total += consumMes;
        } else {
            let consumMes = dadesBase[tipus] * multiplicador * variabilitatAleatoria;
            total += consumMes;
        }
    });

    let unitat = tipus === 'electricitat' ? 'kWh' : tipus === 'aigua' ? 'L' : '€';
    let textResultat = `${total.toLocaleString('ca-ES', {maximumFractionDigits: 2})} ${unitat}`;

    document.getElementById("calc-output").innerText = textResultat;
    document.getElementById("tips-box").innerText = consells[tipus];
    document.getElementById("result-box").classList.remove("hidden");
}

// Càlcul del Pla de Reducció 30% (Punt 3.1.b)
function aplicarPlaReduccio() {
    const tbody = document.getElementById("plan-table-body");
    tbody.innerHTML = ""; 
    
    const indicadors = ['electricitat', 'aigua', 'oficina', 'neteja', 'manteniment'];
    const unitats = ['kWh', 'L', '€', '€', '€'];
    
    indicadors.forEach((ind, index) => {
        let totalAnual = 0;
        for(let i=0; i<12; i++) {
            let variabilitatAleatoria = 1 + (Math.random() * 0.1 - 0.05);
            if (ind === 'electricitat' || ind === 'aigua') {
                totalAnual += dadesBase[ind] * diesLaborablesMes[i] * estacionalitat[ind][i] * variabilitatAleatoria;
            } else {
                totalAnual += dadesBase[ind] * estacionalitat[ind][i] * variabilitatAleatoria;
            }
        }

        let objectiu = totalAnual * 0.70; // -30%
        let estalvi = totalAnual - objectiu;

        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${ind.charAt(0).toUpperCase() + ind.slice(1)}</strong></td>
            <td>${totalAnual.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]}</td>
            <td style="color: var(--primary); font-weight: bold;">${objectiu.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]}</td>
            <td style="color: #d32f2f;">-${estalvi.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("plan-results").classList.remove("hidden");
}