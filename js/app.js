// 1. Dades base (Dades definitives: Mitjanes diàries globals)
const dadesBase = {
    electricitat: {
        consumDiariLectiu: 398.55,  // kWh/dia durant el curs (dilluns a diumenge)
        consumDiariVacances: 185.64,// kWh/dia durant vacances (Nadal, Estiu, Setmana Santa...)
        produccioDiaria: 43.57      // kWh/dia generats per plaques solars (tot l'any)
    },
    aigua: 6245,          // L/dia lectiu
    oficina: 75.98,       // €/mes (Preu base abans d'IPC)
    neteja: 110.55,       // €/mes (Preu base abans d'IPC)
    manteniment: 283.45   // €/mes (Preu base abans d'IPC)
};

// 2. Calendari Escolar i Dies Totals
const diesTotalsMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Gener a Desembre
const diesLaborablesMes = [17, 20, 23, 16, 23, 20, 10, 0, 17, 23, 22, 15]; // Gener a Desembre

// 3. Multiplicadors d'Estacionalitat
const estacionalitat = {
    electricitat: [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.2, 0.0, 0.8, 1.0, 1.2, 1.3],
    aigua:        [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 0.2, 0.0, 1.1, 1.0, 0.9, 0.9], 
    oficina:      [1.1, 1.0, 1.0, 1.0, 1.0, 1.2, 0.0, 0.0, 1.5, 1.0, 1.0, 0.8], 
    neteja:       [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 0.0, 1.2, 1.0, 1.0, 1.0],
    manteniment:  [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] 
};

// Consells de reducció personalitzats
const consells = {
    electricitat: "💡 Dada clau: Es produeixen 43,57 kWh/dia. S'ha usat un càlcul proporcional per dividir cada mes entre períodes de setmanes lectives i períodes de vacances.",
    aigua: "⚠️ ALERTA: Consum superior a 1 milió de litres anuals. És URGENT instal·lar airejadors i revisar possibles fuites ocultes.",
    oficina: "📎 Consell: Passar exclusivament a recanvis de tinta líquida Pilot Begreen.",
    neteja: "🧹 Consell: Substituir els fardos de paper eixugamans per assecadors d'aire.",
    manteniment: "🗑️ Consell: Un bon manteniment preventiu des d'ASIX evita urgències com la del compressor AACC."
};

function calcularConsum() {
    const tipus = document.getElementById("indicator-select").value;
    const periode = document.getElementById("period-select").value;
    const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
    const factorIPC = 1 + (ipc / 100);
    
    let total = 0;
    let mesosACalcular = periode === "any" ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];

    mesosACalcular.forEach(mesIndex => {
        let multiplicador = estacionalitat[tipus] ? estacionalitat[tipus][mesIndex] : 1;
        let variabilitatAleatoria = 1 + (Math.random() * 0.1 - 0.05); 
        
        if (tipus === 'electricitat') {
            // Passem els dies lectius purs a "dies de setmana lectiva globals" (regla de 3: 5 dies classe = 7 dies setmana)
            let diesLectiusGlobals = (diesLaborablesMes[mesIndex] / 5) * 7;
            
            // Ens assegurem de no comptar més dies dels que té el mes realment
            diesLectiusGlobals = Math.min(diesLectiusGlobals, diesTotalsMes[mesIndex]);
            
            // Els dies restants del mes es consideren període de vacances
            let diesVacances = diesTotalsMes[mesIndex] - diesLectiusGlobals;
            
            // Càlcul del consum BRUT
            let consumMes = (dadesBase.electricitat.consumDiariLectiu * diesLectiusGlobals) + 
                            (dadesBase.electricitat.consumDiariVacances * diesVacances);
                            
            // Càlcul de la producció d'aquest mes
            let produccioMes = dadesBase.electricitat.produccioDiaria * diesTotalsMes[mesIndex];
            
            // Consum NET
            let consumNet = consumMes - produccioMes;
            
            // Apliquem la variabilitat/estacionalitat
            total += consumNet * multiplicador * variabilitatAleatoria;

        } else if (tipus === 'aigua') {
            total += dadesBase[tipus] * diesLaborablesMes[mesIndex] * multiplicador * variabilitatAleatoria;
        } else {
            total += dadesBase[tipus] * multiplicador * variabilitatAleatoria;
        }
    });

    // Si l'indicador es mesura en €, apliquem l'increment de l'IPC
    if (tipus === 'oficina' || tipus === 'neteja' || tipus === 'manteniment') {
        total = total * factorIPC;
    }

    let unitat = tipus === 'electricitat' ? 'kWh nets' : tipus === 'aigua' ? 'L' : '€';
    let decimals = tipus === 'aigua' || tipus === 'electricitat' ? 0 : 2; 
    
    let extraInfo = (unitat === '€') ? ` (Inclou IPC del ${ipc}%)` : '';
    
    document.getElementById("calc-output").innerText = `${total.toLocaleString('ca-ES', {maximumFractionDigits: decimals})} ${unitat}${extraInfo}`;
    document.getElementById("tips-box").innerText = consells[tipus];
    document.getElementById("result-box").classList.remove("hidden");
}

function aplicarPlaReduccio() {
    const tbody = document.getElementById("plan-table-body");
    tbody.innerHTML = ""; 
    
    const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
    const factorIPC_3Anys = Math.pow(1 + (ipc / 100), 3); 

    const indicadors = ['electricitat', 'aigua', 'oficina', 'neteja', 'manteniment'];
    const unitats = ['kWh nets', 'L', '€', '€', '€'];
    
    indicadors.forEach((ind, index) => {
        let totalAnual = 0;
        
        for(let i=0; i<12; i++) {
            let variabilitatAleatoria = 1 + (Math.random() * 0.1 - 0.05);
            
            if (ind === 'electricitat') {
                let diesLectiusGlobals = (diesLaborablesMes[i] / 5) * 7;
                diesLectiusGlobals = Math.min(diesLectiusGlobals, diesTotalsMes[i]);
                let diesVacances = diesTotalsMes[i] - diesLectiusGlobals;
                
                let consumMes = (dadesBase.electricitat.consumDiariLectiu * diesLectiusGlobals) + 
                                (dadesBase.electricitat.consumDiariVacances * diesVacances);
                let produccioMes = dadesBase.electricitat.produccioDiaria * diesTotalsMes[i];
                
                let consumNet = consumMes - produccioMes;
                totalAnual += consumNet * estacionalitat[ind][i] * variabilitatAleatoria;

            } else if (ind === 'aigua') {
                totalAnual += dadesBase[ind] * diesLaborablesMes[i] * estacionalitat[ind][i] * variabilitatAleatoria;
            } else {
                totalAnual += dadesBase[ind] * estacionalitat[ind][i] * variabilitatAleatoria;
            }
        }

        if (unitats[index] === '€') {
            totalAnual = totalAnual * factorIPC_3Anys;
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