/**
 * BUSINESS LOGIC: ASIX SUSTAINABILITY CALCULATOR
 * Version: 13.1 (Professional UI, Full English Translation, Multi-Year Simulation + Solar Investment)
 */

const baseData = {
    electricity: { baseloadSchoolDay: 398.55, baseloadHolidays: 185.64, baselineProduction: 43.57 },
    water: 6245,          
    supplies_cleaning: 336.05,
    maintenance: 283.45   
};

// Internal theoretical breakdown of supplies for paper and marker slider calculations
const monthlyCostPaper = 140.00;     
const monthlyCostMarkers = 60.00;  
const monthlyCostOther = 136.05;

const rates = { electricity: 0.16, water: 0.0025 }; // EUR per unit

const totalDaysMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const schoolDaysMonth = [17, 20, 23, 16, 23, 20, 10, 0, 17, 23, 22, 15];

const seasonality = {
    electricity:       [1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.2, 0.0, 0.8, 1.0, 1.2, 1.3],
    water:             [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 0.2, 0.0, 1.1, 1.0, 0.9, 0.9], 
    supplies_cleaning: [1.07, 1.0, 1.0, 1.0, 1.0, 1.13, 0.17, 0.0, 1.4, 1.0, 1.0, 0.87], 
    maintenance:       [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0] 
};

let chartInstance = null;

// GLOBAL STATE FOR PROGRESSIVE SIMULATION
let currentSimYear = 0;
let globalChartData = null;

/**
 * Handles toggling visibility of sub-options based on KPI selection
 */
function manageFilters() {
    const checkboxes = document.querySelectorAll('.indicator-chk:checked');
    const selection = Array.from(checkboxes).map(cb => cb.value);
    
    const solarGroup = document.getElementById("solar-control-group");
    const electricSensorsGroup = document.getElementById("electric-sensors-group");
    const waterGroup = document.getElementById("water-control-group");
    const materialGroup = document.getElementById("material-control-group");

    // Electricity
    if (selection.includes('electricitat')) {
        solarGroup.style.display = 'flex';
        electricSensorsGroup.style.display = 'flex'; 
    } else {
        solarGroup.style.display = 'none';
        electricSensorsGroup.style.display = 'none';
    }

    // Water
    if (selection.includes('aigua')) waterGroup.style.display = 'flex'; else waterGroup.style.display = 'none';
    
    // Supplies
    if (selection.includes('material_neteja')) materialGroup.style.display = 'flex'; else materialGroup.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', manageFilters);

/**
 * Helper to format percentage variation vs baseline
 */
function formatVariation(baseline, optimized) {
    if (baseline === 0) return '';
    let variation = ((optimized - baseline) / baseline) * 100;
    
    if (variation < -0.1) {
        return `<div style="font-size: 0.9rem; font-weight: 700; color: #16a34a; margin-top: 0.5rem;">📉 -${Math.abs(variation).toFixed(1)}% vs baseline</div>`;
    } else if (variation > 0.1) {
        return `<div style="font-size: 0.9rem; font-weight: 700; color: #dc2626; margin-top: 0.5rem;">📈 +${variation.toFixed(1)}% vs baseline</div>`;
    } else {
        return `<div style="font-size: 0.9rem; font-weight: 700; color: var(--text-muted); margin-top: 0.5rem;">➖ No real variation</div>`;
    }
}

/**
 * Main calculation logic for multi-year projection
 */
function calculateAndProject() {
    const checkboxes = document.querySelectorAll('.indicator-chk:checked');
    const selection = Array.from(checkboxes).map(cb => cb.value);
    
    if (selection.length === 0) {
        alert("Please select at least one KPI to evaluate before starting.");
        return;
    }

    currentSimYear++; // Advance simulation year
    document.getElementById("year-badge").innerText = `Projection: Year ${currentSimYear} (${2025 + currentSimYear})`;

    const period = document.getElementById("period-select").value;
    const inflationRate = parseFloat(document.getElementById("ipc-input").value) || 0;
    
    // COMPOUND INFLATION: (1 + 0.03)^1, (1 + 0.03)^2, etc.
    const inflationFactor = Math.pow(1 + (inflationRate / 100), currentSimYear); 
    
    let monthsToCalculate = (period === "any") ? [0,1,2,3,4,5,6,7,8,9,10,11] : [8,9,10,11,0,1,2,3,4,5];
    let outputHTML = "";
    
    // Initialize chart structure on Year 1
    let isFirstYear = (currentSimYear === 1);
    if (isFirstYear) {
        globalChartData = {
            labels: ["Baseline 2024", "Baseline 2025"],
            datasets: []
        };
    }
    
    // Add new year label to X axis
    globalChartData.labels.push(`Proj. ${2025 + currentSimYear}`);

    // Process each selected KPI
    selection.forEach(type => {
        let totalBaseline = 0;       
        let totalOptimized = 0; 

        if (type === 'electricitat') {
            const extraSolarPercent = parseFloat(document.getElementById("solar-input").value) || 0;
            const solarFactor = 1 + (extraSolarPercent / 100);
            let lightingSavingsPercent = 0;
            let totalInvestment = 0;

            // ADDING SOLAR PANEL COST:
            // Estimate that each 1% of capacity costs €500 (you can change this value)
            totalInvestment += (extraSolarPercent * 500);

            let chkRestrooms = document.getElementById("chk-luces-banos");
            let chkHallways = document.getElementById("chk-luces-pasillos");

            // Savings apply if checked (whether newly checked or locked from previous years)
            if (chkRestrooms.checked) lightingSavingsPercent += 3;
            if (chkHallways.checked) lightingSavingsPercent += 5;
            
            // INVESTMENT is only charged the year it's installed (when checkbox is NOT disabled)
            if (chkRestrooms.checked && !chkRestrooms.disabled) totalInvestment += 480;
            if (chkHallways.checked && !chkHallways.disabled) totalInvestment += 720;

            const lightingLoadFactor = 1 - (lightingSavingsPercent / 100);
            
            monthsToCalculate.forEach(monthIndex => {
                let seasonMult = seasonality.electricity[monthIndex];
                let schoolDays = Math.min((schoolDaysMonth[monthIndex] / 5) * 7, totalDaysMonth[monthIndex]);
                let holidays = totalDaysMonth[monthIndex] - schoolDays;
                
                // Baseline consumption (without lighting efficiency)
                let baseloadMonth = (baseData.electricity.baseloadSchoolDay * schoolDays) + (baseData.electricity.baseloadHolidays * holidays);
                
                // Optimized consumption (reduced by lighting efficiency)
                let baseloadMonthOpt = baseloadMonth * lightingLoadFactor;

                // Baseline production vs optimized production (Solar)
                let prodBase = baseData.electricity.baselineProduction * totalDaysMonth[monthIndex];
                let prodOpt = (baseData.electricity.baselineProduction * solarFactor) * totalDaysMonth[monthIndex];
                
                // Final calculation: (Load - Production) * seasonality
                totalBaseline += Math.max(0, baseloadMonth - prodBase) * seasonMult;
                totalOptimized += Math.max(0, baseloadMonthOpt - prodOpt) * seasonMult;
            });

            // Colors for bar chart (Teal palette)
            const electricColor = '#0d9488'; // teal-600

            outputHTML += createSummaryCard('⚡ Electricity', `${totalOptimized.toLocaleString('en-US', {maximumFractionDigits: 0})} kWh`, `Est. Impact: ${(totalOptimized * rates.electricity).toLocaleString('en-US', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0})}`, formatVariation(totalBaseline, totalOptimized), totalInvestment > 0 ? `New Investment: €${totalInvestment.toLocaleString('en-US')}` : '', electricColor);

            addOrManageDataset('Electricity (kWh)', totalBaseline, totalOptimized, electricColor, 'y', isFirstYear);

        } else if (type === 'aigua') {
            let waterSavingsPercent = 0;
            if (document.getElementById("chk-aireadores").checked) waterSavingsPercent += 12; 
            if (document.getElementById("chk-cisternas").checked) waterSavingsPercent += 20;  
            if (document.getElementById("chk-sensores").checked) waterSavingsPercent += 15;
            
            const waterFactor = 1 - (waterSavingsPercent / 100);
            
            monthsToCalculate.forEach(monthIndex => {
                // Baseline water assumes seasonality * baseline daily avg * working days
                totalBaseline += baseData.water * schoolDaysMonth[monthIndex] * seasonality.water[monthIndex];
            });
            totalOptimized = totalBaseline * waterFactor;

            const waterColor = '#0ea5e9'; // sky-500

            outputHTML += createSummaryCard('💧 Water', `${totalOptimized.toLocaleString('en-US', {maximumFractionDigits: 0})} L`, `Est. Impact: ${(totalOptimized * rates.water).toLocaleString('en-US', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0})}`, formatVariation(totalBaseline, totalOptimized), '', waterColor);

            addOrManageDataset('Water (L)', totalBaseline, totalOptimized, waterColor, 'y', isFirstYear);

        } else if (type === 'material_neteja') {
            let paperFactor = document.getElementById("input-papel").value / 100;
            let markerFactor = document.getElementById("input-rotuladores").value / 100;

            monthsToCalculate.forEach(monthIndex => {
                let seasonMult = seasonality.supplies_cleaning[monthIndex];
                
                // Baseline cost (no sliders applied)
                totalBaseline += baseData.supplies_cleaning * seasonMult;
                
                // Optimized cost based on sliders + applied compound inflation
                let monthlyCostOpt = (monthlyCostPaper * paperFactor) + (monthlyCostMarkers * markerFactor) + monthlyCostOther;
                totalOptimized += monthlyCostOpt * seasonMult * inflationFactor;
            });

            // Calculate pure usage reduction % (without inflation) for UI display
            let baseNoInflation = totalBaseline;
            let optNoInflation = totalOptimized / inflationFactor;
            let usageReductionPercent = Math.max(0, ((baseNoInflation - optNoInflation) / baseNoInflation) * 100);
            let currentUsagePercent = 100 - usageReductionPercent;

            const materialColor = '#8b5cf6'; // violet-500

            outputHTML += createSummaryCard('📦 Supplies & Cleaning', totalOptimized.toLocaleString('en-US', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0}), `Incl. Compound Inflation`, `<div style="font-size: 0.85rem; color: #8b5cf6; margin-top: 0.2rem; font-weight: bold;">🔻 ${usageReductionPercent.toFixed(1)}% real usage reduction vs base</div>`, '', materialColor);

            addOrManageDataset('Supplies (€)', totalBaseline, totalOptimized, materialColor, 'y', isFirstYear);
            // Percentage usage dataset (renders on y1 axis)
            addOrManageDataset('Supplies Usage (%)', 100, currentUsagePercent, '#ec4899', 'y1', isFirstYear); // pink-500

        } else {
            // Maintenance KPI
            monthsToCalculate.forEach(monthIndex => {
                totalBaseline += baseData.maintenance * seasonality.maintenance[monthIndex];
            });
            // Applied compound inflation
            totalOptimized = totalBaseline * inflationFactor;

            const maintenanceColor = '#64748b'; // slate-500

            outputHTML += createSummaryCard('🔧 Maintenance', totalOptimized.toLocaleString('en-US', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0}), `Incl. Compound Inflation`, formatVariation(totalBaseline, totalOptimized), '', maintenanceColor);

            addOrManageDataset('Maintenance (€)', totalBaseline, totalOptimized, maintenanceColor, 'y', isFirstYear);
        }
    });

    // Update UI
    document.getElementById("calc-output").innerHTML = outputHTML;
    document.getElementById("result-box").classList.remove("hidden");
    document.getElementById("btn-reiniciar").classList.remove("hidden");
    document.getElementById("btn-calcular").innerText = `Calculate Year ${currentSimYear + 1} (${2026 + currentSimYear})`;

    renderChart(globalChartData);

    // Lock controls that represent irreversible installations
    lockAppliedControls();
    
    // Update textual action plan if visible
    if (!document.getElementById("plan-results").classList.contains("hidden")) applyReductionPlan();
}

/**
 * Handles dataset creation or update for the multi-year chart
 */
function addOrManageDataset(label, baseValue, optimizedValue, color, axisID, isFirstYear) {
    let dataset = globalChartData.datasets.find(ds => ds.label === label);
    
    // If first year of simulation, create dataset and add historical baselines
    if (!dataset) {
        dataset = {
            label: label,
            data: [baseValue * (axisID === 'y1' ? 1 : 1.02), baseValue], // Invent slight variation for 2024 historical
            backgroundColor: color,
            borderRadius: 4,
            yAxisID: axisID
        };
        globalChartData.datasets.push(dataset);
    }
    
    // Append newly projected year value to dataset
    dataset.data.push(optimizedValue);
}

/**
 * Locks UI controls for main KPIs and "one-time" installations
 */
function lockAppliedControls() {
    // KPI area selection cannot be changed once simulation starts
    document.querySelectorAll('.indicator-chk').forEach(chk => chk.disabled = true);
    document.getElementById("period-select").disabled = true;
    document.getElementById("ipc-input").disabled = true; // Lock inflation rate

    // Lock one-time installation checkboxes once checked
    document.querySelectorAll('#chk-luces-banos, #chk-luces-pasillos, #chk-aireadores, #chk-cisternas, #chk-sensores').forEach(chk => {
        if (chk.checked) chk.disabled = true;
    });
}

/**
 * Resets simulation state to zero
 */
function resetState() {
    currentSimYear = 0;
    globalChartData = null;
    
    // Unlock everything
    document.querySelectorAll('input, select').forEach(element => element.disabled = false);
    
    // Reset buttons and panels
    document.getElementById('btn-calcular').innerText = "Calculate Year 1 (2026)";
    document.getElementById('btn-reiniciar').classList.add('hidden');
    document.getElementById('result-box').classList.add('hidden');
    
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    manageFilters(); // Re-apply KPI visibility logic
}

/**
 * Generates HTML for a result summary card
 */
function createSummaryCard(title, value, subValue, extra1, extra2, color) {
    return `
        <div class="summary-item" style="border-left-color: ${color};">
            <h4>${title}</h4>
            <div class="value">${value}</div>
            <div class="sub-value">${subValue}</div>
            ${extra1}
            ${extra2 ? `<div class="investment-tag">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                            ${extra2}
                         </div>` : ''}
        </div>
    `;
}

/**
 * Renders/Updates the bar chart using Chart.js
 */
function renderChart(data) {
    const ctx = document.getElementById('history-chart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Professional Chart styling
    Chart.defaults.font.family = '"Inter", sans-serif';
    Chart.defaults.color = '#64748b'; // slate-500

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Multi-Year Comparative Resource Projection',
                    font: { size: 16, weight: '700' },
                    color: '#0f172a', // slate-900
                    padding: { bottom: 20 }
                },
                legend: { 
                    position: 'bottom',
                    labels: { padding: 15, boxWidth: 12, usePointStyle: true, pointStyle: 'rectRounded' }
                },
                tooltip: {
                    backgroundColor: '#0f172a', // slate-900
                    titleFont: { size: 13 },
                    bodyFont: { size: 13 },
                    padding: 10,
                    cornerRadius: 4,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                // Add % symbol for usage dataset
                                if (context.dataset.yAxisID === 'y1') {
                                    label += context.parsed.y.toFixed(1) + '%';
                                } else if (label.includes('€') || label.includes('Investment')) {
                                     label += context.parsed.y.toLocaleString('en-US', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});
                                } else {
                                    label += context.parsed.y.toLocaleString('en-US', {maximumFractionDigits: 0});
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'logarithmic',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Consumption / Cost (Log Scale: L, kWh, €)', font: { weight: '600' } },
                    grid: { color: '#e2e8f0' } // slate-200
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Usage Percentage (%)', font: { weight: '600' } },
                    grid: { drawOnChartArea: false } // Only draw grid lines for main axis
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: '500' } }
                }
            }
        }
    });
}

/**
 * Generates the textual Action Plan summary
 */
function applyReductionPlan() {
    const resultContainer = document.getElementById("plan-results");
    
    // Get current slider values for dynamic text
    const percPaper = document.getElementById("input-papel") ? document.getElementById("input-papel").value : 100;
    const percMarkers = document.getElementById("input-rotuladores") ? document.getElementById("input-rotuladores").value : 100;
    
    resultContainer.innerHTML = `
        <div class="plan-grid">
            <div class="plan-card-item">
                <h3>⚡ Energy & Water</h3>
                <ul>
                    <li><strong>Solar Panels:</strong> Install photovoltaic modules for self-consumption, drastically reducing grid dependency. Baseline fixed at 100%.</li>
                    <li><strong>Smart Lighting:</strong> Implement occupancy sensors in restrooms and corridors to eliminate baseline passive consumption.</li>
                    <li><strong>Water Systems:</strong> Retrofit faucets with high-efficiency aerators, install automatic shut-off valves, and IoT leak sensors.</li>
                </ul>
            </div>
            
            <div class="plan-card-item">
                <h3>📦 Supplies & Cleaning</h3>
                <div class="action-callout">
                    <p>
                        <strong>💡 Regarding Consumables Reduction:</strong> The <strong>100%</strong> baseline represents the historical maximum usage by the institution. Lowering the percentage simulates usage reduction. A floor of <strong>10%</strong> is set to ensure minimum necessary stock for daily operations.
                    </p>
                </div>
                <ul>
                    <li><strong>Digitalization (Current Usage: ${percPaper}%):</strong> Reduce paper consumption by promoting digital submissions via VLE and enforcing "think before you print" policies.</li>
                    <li><strong>Smart Stationery (Current Usage: ${percMarkers}%):</strong> Implement rigorous inventory control for whiteboard markers, prioritizing refillable options.</li>
                    <li><strong>Centralized Procurement:</strong> Consolidate cleaning supply orders to reduce packaging waste and transport carbon footprint. baseline assumed fixed.</li>
                </ul>
            </div>
        </div>
    `;

    resultContainer.classList.remove("hidden");
}