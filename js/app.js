/**
 * LÒGICA DE NEGOCI: CALCULADORA DE SOSTENIBILITAT ASIX
 * Versió: 4.0 (Amb Vinyetes al Pla d'Acció)
 */

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

const consells = {
    electricitat: "Nota d'Anàlisi: El cost d'inversió segueix els barems de potència instal·lada (kWp) ajustats per l'IPC seleccionat. El consum en kWh es manté aliè a la inflació.",
    aigua: "Seguretat Hídrica: L'aplicació de talls automatitzats i sensors IoT té un impacte massiu en edificis de gran afluència, evitant la pèrdua de centenars de milers de litres anuals.",
    oficina: "Recomanació Operativa: L'impacte de l'IPC suggereix una centralització de compres per volum de material no fungible.",
    neteja: "Recomanació Operativa: Prioritzar productes concentrats per reduir el cost logístic afectat per la inflació.",
    manteniment: "Recomanació Operativa: El manteniment preventiu dels sensors IoT allarga la vida útil de la instal·lació un 25%."
};

function gestionarFiltres() {
    const tipus = document.getElementById("indicator-select").value;
    const ipcGroup = document.getElementById("ipc-control-group");
    const solarGroup = document.getElementById("solar-control-group");
    const waterGroup = document.getElementById("water-control-group");

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
    
    let estalviAiguaPercent = 0;
    const chkAireadors = document.getElementById("chk-aireadores").checked; 
    const chkValvules = document.getElementById("chk-cisternas").checked;   
    const chkIoT = document.getElementById("chk-sensores").checked;         

    if (tipus === 'aigua') {
        if (chkAireadors) estalviAiguaPercent += 12; 
        if (chkValvules) estalviAiguaPercent += 20;  
        if (chkIoT) estalviAiguaPercent += 15;       
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
            totalAcumulat += dadesBase[tipus] * diesLaborablesMes[mesIndex] * multEstacional * variabilitat;
        } else {
            totalAcumulat += dadesBase[tipus] * multEstacional * variabilitat;
        }
    });

    const outputDiv = document.getElementById("calc-output");
    
    if (tipus === 'electricitat') {
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
                        Ajustat amb un IPC del <strong>${ipc}%</strong> sobre el mercat actual.
                    </p>
                </div>
            `;
        }
        outputDiv.innerHTML = html;

    } else if (tipus === 'aigua') {
        totalAcumulat = totalAcumulat * factorAigua; 
        
        let inversioBaseAigua = 0;
        if (chkAireadors) inversioBaseAigua += (24 * 15);  
        if (chkValvules) inversioBaseAigua += (8 * 175);   
        if (chkIoT) inversioBaseAigua += (8 * 250);        

        const inversioFinalAigua = inversioBaseAigua * factorIPC;

        let html = `
            <div class="res-item" style="margin-bottom: 1.5rem;">
                <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Consum Hídric Estimat</span>
                <span style="font-size: 2.25rem; font-weight: 600; display: block; color: var(--text-main);">${totalAcumulat.toLocaleString('ca-ES', {maximumFractionDigits: 0})} L</span>
            </div>
        `;

        if (inversioFinalAigua > 0) {
            html += `
                <div class="res-item" style="padding-top: 1.25rem; border-top: 1px dotted var(--border);">
                    <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Inversió en Seguretat Hídrica</span>
                    <span style="font-size: 1.75rem; font-weight: 600; display: block; color: var(--primary-dark);">${inversioFinalAigua.toLocaleString('ca-ES', {maximumFractionDigits: 2})} €</span>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                        Prevenció per a <strong>8 blocs sanitaris</strong> (24 aixetes).<br>
                        Ajustat amb un IPC del <strong>${ipc}%</strong> sobre el preu de maquinari.
                    </p>
                </div>
            `;
        }
        outputDiv.innerHTML = html;

    } else {
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

/**
 * Genera l'informe global (Ara inyecta vinyetes descriptives en lloc d'una taula)
 */
function aplicarPlaReduccio() {
    const resultContainer = document.getElementById("plan-results");
    
    // Inyectem el codi HTML de les 3 vinyetes explicatives
    resultContainer.innerHTML = `
        <div class="plan-grid">
            <div class="plan-card-item">
                <h3>⚡ Consum Elèctric</h3>
                <ul>
                    <li><strong>Plaques Solars:</strong> Instal·lació de mòduls fotovoltaics per a l'autoconsum, reduint dràsticament la dependència de la xarxa elèctrica i aprofitant les hores de major radiació solar durant la jornada lectiva de l'institut.</li>
                    <li><strong>Llum Automàtica:</strong> Implementació de sensors de presència intel·ligents a les aules i passadissos per garantir que la il·luminació s'apaga automàticament quan els espais queden buits, evitant el consum fantasma.</li>
                </ul>
            </div>
            
            <div class="plan-card-item">
                <h3>💧 Consum d'Aigua</h3>
                <ul>
                    <li><strong>Instal·lació d'airejadors:</strong> Col·locació de filtres d'alta eficiència a les aixetes que barregen l'aigua amb aire. Redueixen el cabal sense perdre la sensació de pressió al rentar-se les mans.</li>
                    <li><strong>Electrovàlvules de tall automàtic:</strong> Sistema de seguretat que talla el subministrament general d'aigua dels banys fora de l'horari escolar i caps de setmana per evitar pèrdues i vandalisme.</li>
                    <li><strong>Monitorització de fugues (IoT):</strong> Sensors de cabal connectats que detecten fluxos d'aigua constants inusuals (com una cisterna trencada) i envien una alerta immediata a l'equip de manteniment.</li>
                </ul>
            </div>

            <div class="plan-card-item">
                <h3>📦 Gestió de Material</h3>
                <ul>
                    <li style="color: var(--text-muted); font-style: italic;">
                        <strong>Fase d'estudi:</strong> Les mesures específiques per a l'optimització de material d'oficina, productes de neteja i pressupost de manteniment general encara no estan definides. Actualment es troben en fase d'anàlisi i avaluació per part del comitè de sostenibilitat de l'institut per garantir la seva viabilitat.
                    </li>
                </ul>
            </div>
        </div>
    `;

    // Mostrem el contenidor
    resultContainer.classList.remove("hidden");
}