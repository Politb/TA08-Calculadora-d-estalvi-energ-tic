// 1. Dades base deduïdes del teu JSON (ITB Leaks)
// A la pràctica real, pots fer un fetch('data/dataclean.json') per carregar-ho dinàmicament.
// 1. Dades base ajustades EXACTAMENT al JSON de l'institut (ITB Leaks)
const dadesBase = {
    electricitat: 315,    // Mitjana de kWh/dia segons lectures "PV Electricity"
    aigua: 6245,          // Mitjana de L/dia segons lectures (7035, 7400, 4300)
    oficina: 85.13,       // Ajustat per donar un total anual exacte de 902,44 €
    neteja: 110.55,       // Ajustat per donar un total anual exacte de 1.204,98 €
    manteniment: 325.79   // Ajustat per donar un total anual exacte de 3.909,47 €
};

// 2. Multiplicadors d'Estacionalitat i Tendències (Gener a Desembre)
// Permet fer càlculs intel·ligents (ex: agost gairebé no hi ha consum, hivern puja la llum)
const estacionalitat = {
    // Gen, Feb, Mar, Abr, Mai, Jun, Jul, Ago, Set, Oct, Nov, Des
    electricitat: [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.2, 0.1, 0.8, 1.0, 1.2, 1.3], // Més a l'hivern per calefacció/llum
    aigua:        [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 0.2, 0.1, 1.1, 1.0, 0.9, 0.9], // Més a l'estiu
    oficina:      [1.1, 1.0, 1.0, 1.0, 1.0, 1.2, 0.0, 0.0, 1.5, 1.0, 1.0, 0.8], // Pics al setembre (inici curs) i juny (final)
    neteja:       [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 0.2, 1.2, 1.0, 1.0, 1.0]
};

// Dies laborables estimats per mes
const diesLaborablesMes = [20, 20, 22, 18, 21, 20, 10, 0, 21, 22, 20, 15];

// Consells de reducció per indicador
const consells = {
    electricitat: "💡 Acció: Apagar equips en standby, instal·lar sensors de presència i reduir la brillantor dels monitors.",
    aigua: "💧 Acció: Instal·lar airejadors a les aixetes dels lavabos i fer manteniment preventiu de fuites.",
    oficina: "📎 Acció: Digitalitzar tràmits (zero paper) i comprar tòners remanufacturats (Economia Circular).",
    neteja: "🧹 Acció: Comprar productes a granel concentrats per reduir envasos plàstics."
};

// Funció principal dels 8 càlculs
function calcularConsum() {
    const tipus = document.getElementById("indicator-select").value;
    const periode = document.getElementById("period-select").value;
    
    let total = 0;
    
    // Si és any complet (0 a 11), si és curs escolar (Setembre-Juny: mesos 8 a 11 i 0 a 5)
    let mesosACalcular = periode === "any" ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];

    mesosACalcular.forEach(mesIndex => {
        let multiplicador = estacionalitat[tipus][mesIndex];
        
        if (tipus === 'electricitat' || tipus === 'aigua') {
            // Càlcul diari per dies laborables
            let consumMes = dadesBase[tipus] * diesLaborablesMes[mesIndex] * multiplicador;
            total += consumMes;
        } else {
            // Càlcul mensual
            let consumMes = dadesBase[tipus] * multiplicador;
            total += consumMes;
        }
    });

    // Formatejar el resultat
    let unitat = tipus === 'electricitat' ? 'kWh' : tipus === 'aigua' ? 'L' : '€';
    let textResultat = `${total.toLocaleString('ca-ES', {maximumFractionDigits: 2})} ${unitat}`;

    // Mostrar a la interfície
    document.getElementById("calc-output").innerText = textResultat;
    document.getElementById("tips-box").innerText = consells[tipus];
    document.getElementById("result-box").classList.remove("hidden");
}

// Funció per la part B: Pla de reducció del 30%
function aplicarPlaReduccio() {
    const tbody = document.getElementById("plan-table-body");
    tbody.innerHTML = ""; // Netejar taula
    
    const indicadors = ['electricitat', 'aigua', 'oficina', 'neteja'];
    const unitats = ['kWh', 'L', '€', '€'];
    
    indicadors.forEach((ind, index) => {
        // Calcular consum anual actual simulant la lògica anterior
        let totalAnual = 0;
        for(let i=0; i<12; i++) {
            if (ind === 'electricitat' || ind === 'aigua') {
                totalAnual += dadesBase[ind] * diesLaborablesMes[i] * estacionalitat[ind][i];
            } else {
                totalAnual += dadesBase[ind] * estacionalitat[ind][i];
            }
        }

        let objectiu = totalAnual * 0.70; // -30%
        let estalvi = totalAnual - objectiu;

        // Crear fila
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${ind.charAt(0).toUpperCase() + ind.slice(1)}</td>
            <td>${totalAnual.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]}</td>
            <td style="color: var(--primary); font-weight: bold;">${objectiu.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]}</td>
            <td style="color: #d32f2f;">-${estalvi.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("plan-results").classList.remove("hidden");
}