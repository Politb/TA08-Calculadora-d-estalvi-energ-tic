// 1. Dades base ajustades per ser realistes (Evitant el milió de litres)
const dadesBase = {
    electricitat: 470,    // kWh/dia 
    aigua: 2150,          // L/dia (Ajustat per donar un anual d'aprox 440.000 L)
    oficina: 75.98,       // €/mes
    neteja: 110.55,       // €/mes
    manteniment: 283.45   // €/mes
};

// 2. Calendari Escolar Real (Excloent caps de setmana i vacances)
const diesLaborablesMes = [17, 20, 23, 16, 23, 20, 10, 0, 17, 23, 22, 15];

// 3. Multiplicadors d'Estacionalitat
const estacionalitat = {
    electricitat: [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.2, 0.0, 0.8, 1.0, 1.2, 1.3],
    aigua:        [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 0.2, 0.0, 1.1, 1.0, 0.9, 0.9], 
    oficina:      [1.1, 1.0, 1.0, 1.0, 1.0, 1.2, 0.0, 0.0, 1.5, 1.0, 1.0, 0.8], 
    neteja:       [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 0.0, 1.2, 1.0, 1.0, 1.0],
    manteniment:  [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] 
};

// Consells de reducció
const consells = {
    electricitat: "💡 Consell: Apliqueu polítiques GPO per forçar la hibernació dels PCs a les 15:00h.",
    aigua: "💧 Consell: Instal·lar airejadors a les aixetes permet reduir el cabal sense que els alumnes ho notin.",
    oficina: "📎 Consell: Passar exclusivament a recanvis de tinta líquida Pilot Begreen.",
    neteja: "🧹 Consell: Substituir els fardos de paper eixugamans per assecadors d'aire.",
    manteniment: "🗑️ Consell: Un bon manteniment preventiu des d'ASIX evita urgències com la del compressor AACC."
};

// Càlcul individual interactiu
function calcularConsum() {
    const tipus = document.getElementById("indicator-select").value;
    const periode = document.getElementById("period-select").value;
    
    let total = 0;
    let mesosACalcular = periode === "any" ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];

    mesosACalcular.forEach(mesIndex => {
        let multiplicador = estacionalitat[tipus][mesIndex];
        let variabilitatAleatoria = 1 + (Math.random() * 0.1 - 0.05); 
        
        if (tipus === 'electricitat' || tipus === 'aigua') {
            total += dadesBase[tipus] * diesLaborablesMes[mesIndex] * multiplicador * variabilitatAleatoria;
        } else {
            total += dadesBase[tipus] * multiplicador * variabilitatAleatoria;
        }
    });

    let unitat = tipus === 'electricitat' ? 'kWh' : tipus === 'aigua' ? 'L' : '€';
    // Traiem els decimals per l'aigua perquè els litres quedin com a números enters clars
    let decimals = tipus === 'aigua' ? 0 : 2; 
    
    document.getElementById("calc-output").innerText = `${total.toLocaleString('ca-ES', {maximumFractionDigits: decimals})} ${unitat}`;
    document.getElementById("tips-box").innerText = consells[tipus];
    document.getElementById("result-box").classList.remove("hidden");
}

// Càlcul del Pla de Reducció 30%
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

        let objectiu = totalAnual * 0.70; 
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