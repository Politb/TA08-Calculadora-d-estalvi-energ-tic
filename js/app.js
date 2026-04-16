// 1. Dades base 
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

const diesTotalsMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const diesLaborablesMes = [17, 20, 23, 16, 23, 20, 10, 0, 17, 23, 22, 15];

const estacionalitat = {
    electricitat: [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.2, 0.0, 0.8, 1.0, 1.2, 1.3],
    aigua:        [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 0.2, 0.0, 1.1, 1.0, 0.9, 0.9], 
    oficina:      [1.1, 1.0, 1.0, 1.0, 1.0, 1.2, 0.0, 0.0, 1.5, 1.0, 1.0, 0.8], 
    neteja:       [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5, 0.0, 1.2, 1.0, 1.0, 1.0],
    manteniment:  [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] 
};

// Textos formalitzats sense emojis
const consells = {
    electricitat: "Nota d'Anàlisi: Modifiqueu el paràmetre d'Ampliació Fotovoltaica per avaluar l'impacte directe sobre la reducció del consum net adquirit de la xarxa.",
    aigua: "Nota d'Anàlisi: Seleccioneu les diferents mesures del Pla d'Eficiència Hídrica per simular l'impacte acumulat en el consum global anual.",
    oficina: "Recomanació Operativa: Establir una política de transició exclusiva cap a consumibles recarregables i auditar l'ús de paper imprès.",
    neteja: "Recomanació Operativa: Es suggereix la substitució progressiva de consumibles de paper d'un sol ús per sistemes d'assecat d'alta eficiència energètica.",
    manteniment: "Recomanació Operativa: La implementació d'un protocol de manteniment preventiu auditat redueix significativament la incidència d'urgències tèrmiques."
};

function gestionarFiltres() {
    const tipus = document.getElementById("indicator-select").value;
    const ipcGroup = document.getElementById("ipc-control-group");
    const solarGroup = document.getElementById("solar-control-group");
    const waterGroup = document.getElementById("water-control-group");

    if (tipus === 'electricitat') {
        solarGroup.style.display = 'flex';
        ipcGroup.style.display = 'flex'; 
        waterGroup.style.display = 'none';
    } else if (tipus === 'aigua') {
        solarGroup.style.display = 'none';
        ipcGroup.style.display = 'none'; 
        waterGroup.style.display = 'flex';
    } else {
        solarGroup.style.display = 'none';
        ipcGroup.style.display = 'flex'; 
        waterGroup.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', gestionarFiltres);

function calcularConsum() {
    const tipus = document.getElementById("indicator-select").value;
    const periode = document.getElementById("period-select").value;
    const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
    
    const extraSolar = parseFloat(document.getElementById("solar-input").value) || 0;
    const factorSolar = 1 + (extraSolar / 100);
    const factorIPC = 1 + (ipc / 100);
    
    let percentatgeEstalviAigua = 0;
    if (tipus === 'aigua') {
        if (document.getElementById("chk-aireadores").checked) percentatgeEstalviAigua += 10;
        if (document.getElementById("chk-cisternas").checked) percentatgeEstalviAigua += 15;
        if (document.getElementById("chk-sensores").checked) percentatgeEstalviAigua += 10;
    }
    const factorAigua = 1 - (percentatgeEstalviAigua / 100);
    
    let total = 0;
    let mesosACalcular = periode === "any" ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];

    mesosACalcular.forEach(mesIndex => {
        let multiplicador = estacionalitat[tipus] ? estacionalitat[tipus][mesIndex] : 1;
        let variabilitatAleatoria = 1 + (Math.random() * 0.1 - 0.05); 
        
        if (tipus === 'electricitat') {
            let diesLectiusGlobals = (diesLaborablesMes[mesIndex] / 5) * 7;
            diesLectiusGlobals = Math.min(diesLectiusGlobals, diesTotalsMes[mesIndex]);
            let diesVacances = diesTotalsMes[mesIndex] - diesLectiusGlobals;
            
            let consumMes = (dadesBase.electricitat.consumDiariLectiu * diesLectiusGlobals) + 
                            (dadesBase.electricitat.consumDiariVacances * diesVacances);
                            
            let produccioMes = (dadesBase.electricitat.produccioDiaria * factorSolar) * diesTotalsMes[mesIndex];
            let consumNet = consumMes - produccioMes;
            
            if (consumNet < 0) consumNet = 0; 
            total += consumNet * multiplicador * variabilitatAleatoria;

        } else if (tipus === 'aigua') {
            total += dadesBase[tipus] * diesLaborablesMes[mesIndex] * multiplicador * variabilitatAleatoria;
        } else {
            total += dadesBase[tipus] * multiplicador * variabilitatAleatoria;
        }
    });

    if (tipus === 'oficina' || tipus === 'neteja' || tipus === 'manteniment') {
        total = total * factorIPC;
    } else if (tipus === 'aigua') {
        total = total * factorAigua; 
    }

    let unitat = tipus === 'electricitat' ? 'kWh nets' : tipus === 'aigua' ? 'L' : '€';
    let decimals = tipus === 'aigua' || tipus === 'electricitat' ? 0 : 2; 
    
    let extraInfo = '';
    if (unitat === '€') extraInfo = ` (Inclou IPC projectat del ${ipc}%)`;
    if (tipus === 'electricitat' && extraSolar > 0) extraInfo = ` (Base + ampliació fotovoltaica: ${extraSolar}%)`;
    if (tipus === 'aigua' && percentatgeEstalviAigua > 0) extraInfo = ` (Eficàcia del pla aplicat: -${percentatgeEstalviAigua}%)`;
    
    document.getElementById("calc-output").innerText = `${total.toLocaleString('ca-ES', {maximumFractionDigits: decimals})} ${unitat}${extraInfo}`;
    document.getElementById("tips-box").innerText = consells[tipus];
    document.getElementById("result-box").classList.remove("hidden");
}

function aplicarPlaReduccio() {
    const tbody = document.getElementById("plan-table-body");
    tbody.innerHTML = ""; 
    
    const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
    const factorIPC_3Anys = Math.pow(1 + (ipc / 100), 3); 
    
    const extraSolar = parseFloat(document.getElementById("solar-input").value) || 0;
    const factorSolar = 1 + (extraSolar / 100);

    let percentatgeEstalviAigua = 0;
    if (document.getElementById("chk-aireadores").checked) percentatgeEstalviAigua += 10;
    if (document.getElementById("chk-cisternas").checked) percentatgeEstalviAigua += 15;
    if (document.getElementById("chk-sensores").checked) percentatgeEstalviAigua += 10;

    // Noms formatats per la taula corporativa
    const indicadorsMap = {
        'electricitat': 'Consum Elèctric',
        'aigua': 'Recursos Hídrics',
        'oficina': 'Material d\'Oficina',
        'neteja': 'Productes de Neteja',
        'manteniment': 'Manteniment i Residus'
    };
    const indicadors = Object.keys(indicadorsMap);
    const unitats = ['kWh', 'L', '€', '€', '€'];
    
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
                
                let produccioMes = (dadesBase.electricitat.produccioDiaria * factorSolar) * diesTotalsMes[i];
                let consumNet = consumMes - produccioMes;
                if (consumNet < 0) consumNet = 0; 
                
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

        let percentatgeObjectiu = 30; 
        if (ind === 'aigua') {
            percentatgeObjectiu = percentatgeEstalviAigua; 
        }
        
        let objectiu = totalAnual * (1 - (percentatgeObjectiu / 100)); 
        let estalvi = totalAnual - objectiu;

        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${indicadorsMap[ind]}</strong></td>
            <td>${totalAnual.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]}</td>
            <td style="color: var(--primary-dark); font-weight: 500;">
                ${objectiu.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]} 
                <span style="color: var(--text-muted); font-size: 0.85em; margin-left: 0.5rem;">(-${percentatgeObjectiu}%)</span>
            </td>
            <td class="text-right" style="color: #15803d; font-weight: 600;">
                -${estalvi.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${unitats[index]}
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("plan-results").classList.remove("hidden");
}