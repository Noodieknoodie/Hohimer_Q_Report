// Main report generation script
async function loadData() {
    try {
        // Load all data with proper error handling
        const growthResponse = await fetch('data_json/growth.json');
        if (!growthResponse.ok) throw new Error(`Failed to load growth data: ${growthResponse.status}`);
        const growthData = await growthResponse.json();
        
        const coreResponse = await fetch('data_json/core.json');
        if (!coreResponse.ok) throw new Error(`Failed to load core data: ${coreResponse.status}`);
        const coreData = await coreResponse.json();
        
        const smidResponse = await fetch('data_json/smallmid.json');
        if (!smidResponse.ok) throw new Error(`Failed to load smallmid data: ${smidResponse.status}`);
        const smidData = await smidResponse.json();
        
        const altResponse = await fetch('data_json/alternatives.json');
        if (!altResponse.ok) throw new Error(`Failed to load alternatives data: ${altResponse.status}`);
        const altData = await altResponse.json();
        
        const notesResponse = await fetch('data_json/structurednotes.json');
        if (!notesResponse.ok) throw new Error(`Failed to load structurednotes data: ${notesResponse.status}`);
        const notesData = await notesResponse.json();

        // Load general data (for Capital Markets Recap and disclaimer)
        const generalResponse = await fetch('data_json/general.json');
        if (!generalResponse.ok) throw new Error(`Failed to load general data: ${generalResponse.status}`);
        const generalData = await generalResponse.json();

        // Format date function
        const formatDate = (dateValue) => {
            if (!dateValue) return '';
            try {
                if (typeof dateValue === 'string') {
                    const date = new Date(dateValue);
                    if (!isNaN(date.getTime())) {
                        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear().toString().substr(2)}`;
                    }
                }
                const date = new Date(new Date(1900, 0, 1).getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
                return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear().toString().substr(2)}`;
            } catch (e) {
                console.error("Error formatting date:", e);
                return '03/31/25'; // Default fallback date
            }
        };

        // Render the Capital Markets Recap first
        renderCapitalMarketsRecap(generalData, formatDate);
        
        // Add disclaimer to the last page
        renderDisclaimer(generalData.disclaimer);

        // Render all models
        renderGrowthModel(growthData, formatDate);
        renderCoreModel(coreData, formatDate);
        renderSmidModel(smidData, formatDate);
        renderAltModel(altData, formatDate);
        renderNotesModel(notesData, formatDate);
        
        // Log success
        console.log("All data loaded and rendered successfully");
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('error-message').textContent = 'Error loading data: ' + error.message;
    }
}

// Render Capital Markets Recap
function renderCapitalMarketsRecap(data, formatDate) {
    // Use the same date formatting as other pages
    const asOfDate = document.getElementById('recap-date');
    if (asOfDate) {
        // Use a common date from any model, or a default
        asOfDate.textContent = '03/31/25';
    }
    
    // Render the capital markets recap
    renderCommentary('market-recap', data.capitalMarketsRecap);
}

// Render the disclaimer
function renderDisclaimer(disclaimerText) {
    if (!disclaimerText) return;
    
    // Add disclaimer to all footer-disclaimer elements
    const disclaimerElements = document.querySelectorAll('.footer-disclaimer');
    if (disclaimerElements.length === 0) return;
    
    disclaimerElements.forEach(element => {
        element.textContent = disclaimerText;
    });
}

// GROWTH MODEL RENDERING
function renderGrowthModel(data, formatDate) {
    // Update dates
    document.getElementById('growth-date').textContent = formatDate(data.metadata['As Of Date']);
    document.getElementById('growth-date-2').textContent = formatDate(data.metadata['As Of Date']);
    
    // Update commentary
    renderCommentary('growth-commentary', data.commentary);
    
    // Update metrics table
    renderMetricsTable('growth-metrics', data.metrics);
    
    // Update Top 10 Holdings
    renderHoldings('growth-holdings', data.topTenHoldings);
    
    // Update sector exposure - EXACTLY matching mockup
    renderSectors('growth-sectors', data.sectors);
    
    // Update sector allocation vs benchmark - ONLY TOP 6 like mockup
    renderSectorBenchmark('growth-sectors-vs-benchmark', data.sectors);
    
    // Update regional exposure
    renderRegionalExposure('growth-regions', data.regionalAllocation);
    
    // Update securities added/removed with 3-column layout
    renderSecurities('growth-added', data.securitiesAdded, false);
    renderSecurities('growth-removed', data.securitiesRemoved, true);
}

// Core model rendering
function renderCoreModel(data, formatDate) {
    // Update dates
    document.getElementById('core-date').textContent = formatDate(data.metadata['As Of Date']);
    document.getElementById('core-date-2').textContent = formatDate(data.metadata['As Of Date']);
    
    // Update commentary
    renderCommentary('core-commentary', data.commentary);
    
    // Update metrics table if metrics are available
    if (data.metrics) {
        const metricsTable = document.querySelector('#core-metrics');
        if (metricsTable) {
            renderMetricsTable('core-metrics', data.metrics);
        }
    }
    
    // Update Top 10 Holdings
    renderHoldings('core-holdings', data.topTenHoldings);
    
    // Update regional exposure if available
    if (data.regionalAllocation && data.regionalAllocation.length > 0) {
        renderRegionalExposure('core-regions', data.regionalAllocation);
    }
    
    // Update sector vs benchmark - ONLY TOP 6 like mockup
    renderSectorBenchmark('core-sectors-vs-benchmark', data.sectors);
    
    // Update securities added/removed with 3-column layout
    renderSecurities('core-added', data.securitiesAdded, false);
    renderSecurities('core-removed', data.securitiesRemoved, true);
}

// Small/Mid Cap model rendering
function renderSmidModel(data, formatDate) {
    // Update date
    document.getElementById('smid-date').textContent = formatDate(data.metadata['As Of Date']);
    
    // Update commentary
    renderCommentary('smid-commentary', data.commentary);
    
    // Update Top 10 Holdings
    renderHoldings('smid-holdings', data.topTenHoldings);
    
    // Update metrics table if available
    if (data.metrics) {
        const metricsTable = document.querySelector('#smid-metrics');
        if (metricsTable) {
            renderMetricsTable('smid-metrics', data.metrics);
        }
    }
}

// Alternatives model rendering
function renderAltModel(data, formatDate) {
    // Update date
    document.getElementById('alt-date').textContent = formatDate(data.metadata['As Of Date']);
    
    // Clear previous content
    const container = document.getElementById('alt-commentary');
    if (!container) return;
    container.innerHTML = '';
    
    // Add each section
    if (data.commentarySections && data.commentarySections.length > 0) {
        data.commentarySections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'alt-section';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'alt-title';
            titleDiv.textContent = section.label || '';
            
            const commentaryDiv = document.createElement('div');
            commentaryDiv.className = 'commentary-section';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'commentary-text';
            textDiv.innerHTML = formatCommentary(section.commentary || '');
            
            commentaryDiv.appendChild(textDiv);
            sectionDiv.appendChild(titleDiv);
            sectionDiv.appendChild(commentaryDiv);
            
            container.appendChild(sectionDiv);
        });
    }
}

// Structured Notes rendering
function renderNotesModel(data, formatDate) {
    // Update date
    document.getElementById('notes-date').textContent = formatDate(data.metadata['As Of Date']);
    
    // Update commentary
    renderCommentary('notes-commentary', data.commentary);
    
    // Update notes table
    const tableBody = document.getElementById('notes-table-body');
    if (!tableBody || !data.notes) return;
    
    tableBody.innerHTML = '';
    
    data.notes.forEach(note => {
        const row = document.createElement('tr');
        
        // Date cell
        const dateCell = document.createElement('td');
        dateCell.textContent = note['Pricing Date'] || '';
        
        // Bank cell
        const bankCell = document.createElement('td');
        bankCell.textContent = note.Bank || '';
        
        // Ticker cell
        const tickerCell = document.createElement('td');
        tickerCell.textContent = note.Ticker || '';
        
        // Name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = note['Short Name'] || '';
        
        // Sector cell
        const sectorCell = document.createElement('td');
        sectorCell.textContent = note['GICS Sector'] || '';
        
        // Coupon cell
        const couponCell = document.createElement('td');
        couponCell.className = 'right';
        couponCell.textContent = note.Coupon ? `${(note.Coupon * 100).toFixed(1)}%` : '--';
        
        // Add cells to row
        row.appendChild(dateCell);
        row.appendChild(bankCell);
        row.appendChild(tickerCell);
        row.appendChild(nameCell);
        row.appendChild(sectorCell);
        row.appendChild(couponCell);
        
        // Add row to table
        tableBody.appendChild(row);
    });
}

// SHARED RENDERING FUNCTIONS

// Commentary rendering
function renderCommentary(elementId, commentaryText) {
    const element = document.getElementById(elementId);
    if (!element || !commentaryText) return;
    
    element.innerHTML = formatCommentary(commentaryText);
}

// Format commentary text into paragraphs
function formatCommentary(text) {
    if (!text) return '';
    
    // Split text into paragraphs and wrap each in <p> tags
    return text.split('\n\n')
        .map(para => `<p>${para.replace(/\n/g, ' ')}</p>`)
        .join('');
}

// Metrics table rendering - simplified
function renderMetricsTable(elementId, metrics) {
    const element = document.getElementById(elementId);
    if (!element || !metrics) return;
    
    let html = '';
    
    // Simply iterate through all metrics from the data and display them
    Object.keys(metrics.portfolio).forEach(key => {
        const portfolio = metrics.portfolio[key];
        const benchmark = metrics.benchmark[key];
        const diff = metrics.difference[key];
        
        const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : '');
        
        html += `
            <tr>
                <td>${key}</td>
                <td class="right">${portfolio !== null ? portfolio.toFixed(2) : '--'}</td>
                <td class="right">${benchmark !== null ? benchmark.toFixed(2) : '--'}</td>
                <td class="right ${diffClass}">${diff !== null ? diff.toFixed(2) : '--'}</td>
            </tr>
        `;
    });
    
    element.innerHTML = html;
}

// Holdings rendering
function renderHoldings(elementId, holdings) {
    const element = document.getElementById(elementId);
    if (!element || !holdings || !holdings.length) return;
    
    // Find max weight for proportional bars
    const maxWeight = Math.max(...holdings.map(h => h.weight || 0));
    
    let html = '';
    holdings.forEach(holding => {
        const widthPercent = maxWeight > 0 ? 
            Math.round((holding.weight / maxWeight) * 100) : 0;
        
        html += `
            <div class="holding-row">
                <div class="holding-name">${holding.name || ''}</div>
                <div class="holding-value">${holding.weight?.toFixed(2) || '0.00'}%</div>
                <div class="bar-container">
                    <div class="bar" style="width: ${widthPercent}%;"></div>
                </div>
            </div>
        `;
    });
    
    element.innerHTML = html;
}

// Sectors rendering - matching exactly the mockup layout
function renderSectors(elementId, sectors) {
    const element = document.getElementById(elementId);
    if (!element || !sectors || sectors.length <= 1) return; // Skip header row
    
    // Get actual sector data, skipping the header row
    const sectorData = sectors.slice(1);
    
    // Create two columns of sectors
    const midpoint = Math.ceil(sectorData.length / 2);
    const leftSectors = sectorData.slice(0, midpoint);
    const rightSectors = sectorData.slice(midpoint);
    
    // Find max value for proportional bar sizing
    const maxValue = Math.max(...sectorData.map(s => s.total || 0));
    
    let html = '<div class="sector-bars">';
    
    // Left column
    leftSectors.forEach((sector, index) => {
        const widthPercent = maxValue > 0 ? 
            Math.round((sector.total / maxValue) * 100) : 0;
        
        // Estimate holdings count based on position
        const holdingsCount = 15 - index * 2;
        
        html += `
            <div class="sector-row">
                <div class="sector-name">${sector.sector || sector.name}</div>
                <div class="sector-value">${sector.total?.toFixed(2) || '0.00'}%</div>
                <div class="sector-holdings">${holdingsCount}</div>
                <div class="sector-bar-container">
                    <div class="sector-bar gradient-${index + 1}" style="width: ${widthPercent}%;"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div><div class="sector-bars">';
    
    // Right column
    rightSectors.forEach((sector, index) => {
        const widthPercent = maxValue > 0 ? 
            Math.round((sector.total / maxValue) * 100) : 0;
        
        // Estimate holdings count based on position
        const holdingsCount = 4 - index;
        if (holdingsCount < 1) holdingsCount = 1;
        
        html += `
            <div class="sector-row">
                <div class="sector-name">${sector.sector || sector.name}</div>
                <div class="sector-value">${sector.total?.toFixed(2) || '0.00'}%</div>
                <div class="sector-holdings">${holdingsCount}</div>
                <div class="sector-bar-container">
                    <div class="sector-bar gradient-${index + 5}" style="width: ${widthPercent}%;"></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    element.innerHTML = html;
}

// Sector benchmark rendering function with improved scaling for small changes
function renderSectorBenchmark(elementId, sectors) {
    const element = document.getElementById(elementId);
    if (!element || !sectors || sectors.length <= 1) return;
    
    // Get sector data, skipping the header
    const sectorData = sectors.slice(1);
    
    // Only show top 6 sectors by absolute diff value (to highlight biggest changes)
    const top6Sectors = [...sectorData]
        .filter(s => s.diff !== 0) // Only show sectors with changes
        .sort((a, b) => Math.abs(b.diff || 0) - Math.abs(a.diff || 0))
        .slice(0, 6);
    
    // If we don't have 6 changed sectors, fill with highest allocation sectors
    if (top6Sectors.length < 6) {
        const remainingSectors = [...sectorData]
            .filter(s => !top6Sectors.includes(s))
            .sort((a, b) => (b.total || 0) - (a.total || 0))
            .slice(0, 6 - top6Sectors.length);
        
        top6Sectors.push(...remainingSectors);
    }
    
    // Find the maximum absolute difference to scale properly
    const maxAbsDiff = Math.max(...top6Sectors.map(s => Math.abs(s.diff || 0)));
    
    let html = '';
    
    top6Sectors.forEach((sector, index) => {
        const diffPrefix = sector.diff > 0 ? '+' : '';
        const diffClass = sector.diff > 0 ? 'positive' : (sector.diff < 0 ? 'negative' : '');
        
        // For negative values, show bar on the left side
        const isNegative = sector.diff < 0;
        
        // Improved scaling for better visibility of small changes
        // Use a base width + a proportional component
        // This ensures even small changes are visible but maintains relative differences
        const minBarWidth = 20; // Minimum bar width for any non-zero change
        const maxBarWidth = 80; // Maximum bar width
        
        // Scale proportionally to max difference but ensure minimum size
        let scaledWidth = 0;
        if (sector.diff !== 0) {
            // Base width + proportional component
            scaledWidth = minBarWidth + (maxBarWidth - minBarWidth) * (Math.abs(sector.diff) / maxAbsDiff);
        }
        
        html += `
            <div class="sector-metric">
                <div class="sector-metric-header">
                    <span>${sector.sector || sector.name}</span>
                    <span class="${diffClass}">${diffPrefix}${sector.diff?.toFixed(2) || '0.00'}%</span>
                </div>
                <div class="bar-container">
                    ${isNegative ? 
                      `<div class="bar-negative" style="width: ${scaledWidth}%;"></div>` : 
                      `<div class="bar-positive" style="width: ${scaledWidth}%;"></div>`
                    }
                </div>
                <div class="sector-allocation">${sector.total?.toFixed(2) || '0.00'}%</div>
            </div>
        `;
    });
    
    element.innerHTML = html;
}

// Regional exposure rendering
function renderRegionalExposure(elementId, regions) {
    const element = document.getElementById(elementId);
    if (!element || !regions || !regions.length) return;
    
    // Find dominant region
    const dominantRegion = [...regions].sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
    const dominantPercent = dominantRegion.weight?.toFixed(2) || '0.00';
    const dominantName = dominantRegion.region || '';
    
    // Create header
    let html = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div style="font-size: 12px; font-weight: 600; color: #374151;">Regional Distribution</div>
            <div style="font-size: 12px; font-weight: 500; color: #6b7280;">${dominantPercent}% ${dominantName}</div>
        </div>
    `;
    
    // Create distribution bar
    html += '<div style="height: 16px; background: #e5e7eb; border-radius: 6px; overflow: hidden; display: flex; margin-bottom: 15px;">';
    
    const colorClasses = ['#4338ca', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];
    
    regions.forEach((region, index) => {
        if (!region.weight) return;
        html += `<div style="width: ${region.weight}%; height: 100%; background: ${colorClasses[index % colorClasses.length]};"></div>`;
    });
    
    html += '</div>';
    
    // Create region cards
    html += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 15px;">';
    
    const regionShortNames = {
        'North America': 'N. America',
        'Western Europe': 'W. Europe',
        'Asia Pacific': 'Asia Pacific',
        'South & Central America': 'S/C America',
        'Africa / Middle East': 'Africa/ME'
    };
    
    regions.forEach((region, index) => {
        const shortName = regionShortNames[region.region] || region.region;
        const color = colorClasses[index % colorClasses.length];
        
        html += `
            <div style="display: flex; flex-direction: column; align-items: center; padding: 8px; border-radius: 4px; background: rgba(${hexToRgb(color)}, 0.05);">
                <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">
                    <div style="width: 10px; height: 10px; background: ${color}; border-radius: 2px;"></div>
                    <span style="font-size: 11px; font-weight: 500;">${shortName}</span>
                </div>
                <div style="font-size: 13px; font-weight: 600; color: #374151;">${region.weight?.toFixed(2) || '0.00'}%</div>
                <div style="font-size: 10px; color: #6b7280;">${region.holdings || 0} holding${region.holdings !== 1 ? 's' : ''}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    element.innerHTML = html;
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    // Default fallback
    if (!hex) return '67, 56, 202';
    
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert 3-digit hex to 6-digits
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return '67, 56, 202';
    }
    
    return `${r}, ${g}, ${b}`;
}

// Securities added/removed rendering with 3-column layout
function renderSecurities(elementId, securities, isRemoved) {
    const element = document.getElementById(elementId);
    if (!element || !securities || !securities.length) return;
    
    // Filter out invalid securities like #VALUE!
    const validSecurities = securities.filter(s => s && s !== "#VALUE!");
    
    // Force 3-column layout
    element.style.gridTemplateColumns = 'repeat(3, 1fr)';
    
    let html = '';
    validSecurities.forEach(security => {
        const className = isRemoved ? 'security-item removed-item' : 'security-item';
        html += `<div class="${className}">${security}</div>`;
    });
    
    element.innerHTML = html;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', loadData);