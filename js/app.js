/**
 * LÒGICA DE NEGOCI: CALCULADORA DE SOSTENIBILITAT ASIX
 * Versió: 3.1 (Enterprise - Inversions Desdoblades)
 */

// 1. Dades base de consum diari i mensual
const dadesBase = {
    electricitat: {
        consumDiariLectiu: 398.55,  
        consumDiariVacances: 185.64,
        produccioDiaria: 43.57      
    },
    aigua: 6245,          // Litres totals mes base
    oficina: 225.50,      // € mes base
    neteja: 110.55,       // € mes base
    manteniment: 283.45   // € mes base
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

const consells = {
    electricitat: "Nota d'Anàlisi: El consum net s'ha calculat excloent la inflació. El cost d'inversió segueix els barems de potència instal·lada (kWp) ajustats per l'IPC seleccionat.",
    aigua: "Nota d'Anàlisi: Simulació basada en un complex de 8 banys (24 aixetes i 24 vàters totals). L'IPC només s'aplica a la inversió del nou equipament.",
    oficina: "Recomanació Operativa: L'impacte de l'IPC en material fungible suggereix una centralització de compres per volum.",
    neteja: "Recomanació Operativa: S'estima una reducció de costos mitjançant la transició a productes concentrats amb certificat EcoLabel.",
    manteniment: "Recomanació Operativa: Un increment en l'IPC del manteniment pot mitigar-se mitjançant contractes de servei de preu tancat plurianuals."
};

function gestionarFiltres() {
    const tipus = document.getElementById("indicator-select").value;
    const ipcGroup = document.getElementById("ipc-control-group");
    const solarGroup = document.getElementById("solar-control-group");
    const waterGroup = document.getElementById("water-control-group");

    // L'IPC ara és visible SEMPRE perquè afecta materials (oficina/neteja), plaques (llum) o aixetes (aigua)
    ipcGroup.style.display = 'flex';

    if (tipus === 'electricitat') {
        solarGroup.style.display = 'flex';
        waterGroup.style.display = 'none';
    } else if (tipus === 'aigua') {
        solarGroup.style.display = 'none';
        waterGroup.style.display = 'flex';
    } else {
        solarGroup.style.display = 'none';
        waterGroup.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', gestionarFiltres);

function calcularConsum() {
    const tipus = document.getElementById("indicator-select").value;
    const periode = document.getElementById("period-select").value;
    const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
    const extraSolarPercent = parseFloat(document.getElementById("solar-input").value) || 0;
    
    const factorIPC = 1 + (ipc / 100);
    const factorSolarProduccio = 1 + (extraSolarPercent / 100);
    
    // Validació de mesures d'aigua per al consum
    let estalviAiguaPercent = 0;
    const chkAireadors = document.getElementById("chk-aireadores").checked;
    const chkCisternes = document.getElementById("chk-cisternas").checked;
    const chkSensors = document.getElementById("chk-sensores").checked;

    if (tipus === 'aigua') {
        if (chkAireadors) estalviAiguaPercent += 10;
        if (chkCisternes) estalviAiguaPercent += 15;
        if (chkSensors) estalviAiguaPercent += 10;
    }
    const factorAigua = 1 - (estalviAiguaPercent / 100);
    
    let totalAcumulat = 0;
    let mesosACalcular = (periode === "any") ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];

    mesosACalcular.forEach(mesIndex => {
        let multEstacional = estacionalitat[tipus] ? estacionalitat[tipus][mesIndex] : 1;
        let variabilitat = 1 + (Math.random() * 0.06 - 0.03); 
        
        if (tipus === 'electricitat') {
            let diesLectiusMes = Math.min((diesLaborablesMes[mesIndex] / 5) * 7, diesTotalsMes[mesIndex]);
            let diesVacances = diesTotalsMes[mesIndex] - diesLectiusMes;
            
            let consumMes = (dadesBase.electricitat.consumDiariLectiu * diesLectiusMes) + 
                            (dadesBase.electricitat.consumDiariVacances * diesVacances);
                            
            let produccioMes = (dadesBase.electricitat.produccioDiaria * factorSolarProduccio) * diesTotalsMes[mesIndex];
            
            let consumNet = Math.max(0, consumMes - produccioMes);
            totalAcumulat += consumNet * multEstacional * variabilitat;

        } else if (tipus === 'aigua') {
            totalAcumulat += dadesBase[tipus] * (diesLaborablesMes[mesIndex] / 20) * multEstacional * variabilitat;
        } else {
            totalAcumulat += dadesBase[tipus] * multEstacional * variabilitat;
        }
    });

    const outputDiv = document.getElementById("calc-output");
    
    if (tipus === 'electricitat') {
        // --- INVERSIÓ ELÈCTRICA ---
        const numPlaques = Math.round((extraSolarPercent / 100) * 136);
        const kWpInstalats = numPlaques * 0.45; 
        
        let preuPerKWp = 0;
        if (kWpInstalats > 0 && kWpInstalats <= 3) preuPerKWp = 1700; 
        else if (kWpInstalats > 3 && kWpInstalats <= 6) preuPerKWp = 1500; 
        else if (kWpInstalats > 6) preuPerKWp = 1300; 

        const costInversioFinal = (kWpInstalats * preuPerKWp) * factorIPC;

        let html = `
            <div class="res-item" style="margin-bottom: 1.5rem;">
                <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Consum Net Estimat</span>
                <span style="font-size: 2.25rem; font-weight: 600; display: block; color: var(--text-main);">${totalAcumulat.toLocaleString('ca-ES', {maximumFractionDigits: 0})} kWh</span>
            </div>
        `;

        if (extraSolarPercent > 0) {
            html += `
                <div class="res-item" style="padding-top: 1.25rem; border-top: 1px dotted var(--border);">
                    <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Inversió Fotovoltaica (CAPEX)</span>
                    <span style="font-size: 1.75rem; font-weight: 600; display: block; color: var(--primary-dark);">${costInversioFinal.toLocaleString('ca-ES', {maximumFractionDigits: 0})} €</span>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                        Projecte: <strong>${numPlaques} plaques</strong> (~${kWpInstalats.toFixed(1)} kWp).<br>
                        Ajustat amb un IPC del <strong>${ipc}%</strong> sobre el cost de mercat.
                    </p>
                </div>
            `;
        }
        outputDiv.innerHTML = html;

    } else if (tipus === 'aigua') {
        // --- INVERSIÓ HÍDRICA (8 banys x 3 aixetes/vàters) ---
        totalAcumulat = totalAcumulat * factorAigua; // Apliquem estalvi de L
        
        const numAixetes = 8 * 3; // 24 aixetes
        const numVaters = 8 * 3;  // 24 vàters
        let inversioBaseAigua = 0;

        // Costos unitaris aproximats en euros
        if (chkAireadors) inversioBaseAigua += (numAixetes * 15);
        if (chkCisternes) inversioBaseAigua += (numVaters * 45);
        if (chkSensors) inversioBaseAigua += (numAixetes * 120);

        const inversioFinalAigua = inversioBaseAigua * factorIPC; // L'IPC només encareix les peces

        let html = `
            <div class="res-item" style="margin-bottom: 1.5rem;">
                <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Consum Hídric Estimat</span>
                <span style="font-size: 2.25rem; font-weight: 600; display: block; color: var(--text-main);">${totalAcumulat.toLocaleString('ca-ES', {maximumFractionDigits: 0})} L</span>
            </div>
        `;

        if (inversioFinalAigua > 0) {
            html += `
                <div class="res-item" style="padding-top: 1.25rem; border-top: 1px dotted var(--border);">
                    <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Inversió en Maquinari Sanitari</span>
                    <span style="font-size: 1.75rem; font-weight: 600; display: block; color: var(--primary-dark);">${inversioFinalAigua.toLocaleString('ca-ES', {maximumFractionDigits: 2})} €</span>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                        Renovació dissenyada per a <strong>24 aixetes</strong> i <strong>24 vàters</strong>.<br>
                        Ajustat amb un IPC del <strong>${ipc}%</strong> sobre el preu de distribució.
                    </p>
                </div>
            `;
        }
        outputDiv.innerHTML = html;

    } else {
        // --- RESTA D'INDICADORS (Material) ---
        totalAcumulat = totalAcumulat * factorIPC; 

        outputDiv.innerHTML = `
            <div>
                <span style="font-size: 2.25rem; font-weight: 600; color: var(--text-main);">${totalAcumulat.toLocaleString('ca-ES', {maximumFractionDigits: 2})} €</span>
                <span style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-top: 0.25rem;">Cost operatiu calculat amb una inflació del ${ipc}%</span>
            </div>
        `;
    }

    document.getElementById("tips-box").innerText = consells[tipus];
    document.getElementById("result-box").classList.remove("hidden");
}

function aplicarPlaReduccio() {
    const tbody = document.getElementById("plan-table-body");
    tbody.innerHTML = ""; 
    const ipc = parseFloat(document.getElementById("ipc-input").value) || 0;
    const factorIPC_Triennal = Math.pow(1 + (ipc/100), 3); 

    const indicadors = [
        { id: 'electricitat', nom: 'Consum Elèctric', unitat: 'kWh' },
        { id: 'aigua', nom: 'Recursos Hídrics', unitat: 'L' },
        { id: 'oficina', nom: 'Material d\'Oficina', unitat: '€' },
        { id: 'neteja', nom: 'Productes de Neteja', unitat: '€' },
        { id: 'manteniment', nom: 'Manteniment Global', unitat: '€' }
    ];

    indicadors.forEach(ind => {
        let baseAnual = 0;
        for(let i=0; i<12; i++) {
            let mult = estacionalitat[ind.id] ? estacionalitat[ind.id][i] : 1;
            if (ind.id === 'electricitat') baseAnual += (dadesBase.electricitat.consumDiariLectiu * 21 + dadesBase.electricitat.consumDiariVacances * 9) * mult;
            else if (ind.id === 'aigua') baseAnual += dadesBase.aigua * 20 * mult;
            else baseAnual += dadesBase[ind.id] * mult;
        }

        if (ind.unitat === '€') baseAnual *= factorIPC_Triennal;

        let objectiu = baseAnual * 0.75; 
        let estalvi = baseAnual - objectiu;

        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${ind.nom}</strong></td>
            <td>${baseAnual.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${ind.unitat}</td>
            <td style="color: var(--primary-dark); font-weight: 500;">${objectiu.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${ind.unitat}</td>
            <td class="text-right" style="color: #15803d; font-weight: 600;">-${estalvi.toLocaleString('ca-ES', {maximumFractionDigits: 0})} ${ind.unitat}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("plan-results").classList.remove("hidden");
}