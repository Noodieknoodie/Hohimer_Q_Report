async function loadData() {
    try {
        const [growthResponse, coreResponse, smidResponse, altResponse, notesResponse, generalResponse] = await Promise.all([
            fetch('data_json/growth.json'),
            fetch('data_json/core.json'),
            fetch('data_json/smallmid.json'),
            fetch('data_json/alternatives.json'),
            fetch('data_json/structurednotes.json'),
            fetch('data_json/general.json')
        ]);

        if (!growthResponse.ok) throw new Error(`Failed to load growth data: ${growthResponse.status}`);
        const growthData = await growthResponse.json();
        if (!coreResponse.ok) throw new Error(`Failed to load core data: ${coreResponse.status}`);
        const coreData = await coreResponse.json();
        if (!smidResponse.ok) throw new Error(`Failed to load smallmid data: ${smidResponse.status}`);
        const smidData = await smidResponse.json();
        if (!altResponse.ok) throw new Error(`Failed to load alternatives data: ${altResponse.status}`);
        const altData = await altResponse.json();
        if (!notesResponse.ok) throw new Error(`Failed to load structurednotes data: ${notesResponse.status}`);
        const notesData = await notesResponse.json();
        if (!generalResponse.ok) throw new Error(`Failed to load general data: ${generalResponse.status}`);
        const generalData = await generalResponse.json();

        const formatDate = (dateValue) => {
            if (!dateValue) return 'N/A';
            try {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    return `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}/${date.getUTCFullYear().toString().substr(2)}`;
                }
                return 'Invalid Date';
            } catch (e) {
                console.error("Error formatting date:", dateValue, e);
                return 'Error Date';
            }
        };

        renderCapitalMarketsRecap(generalData, formatDate);
        renderDisclaimer(generalData.disclaimer);
        renderGrowthModel(growthData, formatDate);
        renderCoreModel(coreData, formatDate);
        renderSmidModel(smidData, formatDate);
        renderAltModel(altData, formatDate);
        renderNotesModel(notesData, formatDate);
        console.log("All data loaded and rendered successfully");

    } catch (error) {
        console.error('Error loading data:', error);
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) errorDiv.textContent = 'Error loading report data: ' + error.message;
    }
}

function renderCapitalMarketsRecap(data, formatDate) {
    const asOfDateEl = document.getElementById('recap-date');
    if (asOfDateEl) asOfDateEl.textContent = '03/31/25'; // Keep hardcoded as per original
    renderCommentary('market-recap', data.capitalMarketsRecap);
}

function renderDisclaimer(disclaimerText) {
    if (!disclaimerText) return;
    document.querySelectorAll('.footer-disclaimer').forEach(element => {
        element.textContent = disclaimerText;
    });
}

function renderGrowthModel(data, formatDate) {
    const dateStr = formatDate(data.metadata['As Of Date']);
    document.getElementById('growth-date').textContent = dateStr;
    document.getElementById('growth-date-2').textContent = dateStr;
    renderCommentary('growth-commentary', data.commentary);
    renderMetricsTable('growth-metrics', data.metrics);
    renderHoldings('growth-holdings', data.topTenHoldings);
    renderSectors('growth-sectors', data.sectors);
    renderRegionalExposure('growth-regions', data.regionalAllocation);
    renderSecurities('growth-added', data.securitiesAdded, false);
    renderSecurities('growth-removed', data.securitiesRemoved, true);
}

function renderCoreModel(data, formatDate) {
    const dateStr = formatDate(data.metadata['As Of Date']);
    document.getElementById('core-date').textContent = dateStr;
    document.getElementById('core-date-2').textContent = dateStr;
    renderCommentary('core-commentary', data.commentary);
    if (data.metrics) renderMetricsTable('core-metrics', data.metrics);
    renderHoldings('core-holdings', data.topTenHoldings);
    if (data.sectors) renderSectors('core-sectors', data.sectors);
    if (data.regionalAllocation) renderRegionalExposure('core-regions', data.regionalAllocation);
    renderSecurities('core-added', data.securitiesAdded, false);
    renderSecurities('core-removed', data.securitiesRemoved, true);
}

function renderSmidModel(data, formatDate) {
    const dateStr = formatDate(data.metadata['As Of Date']);
    document.getElementById('smid-date').textContent = dateStr;
    renderCommentary('smid-commentary', data.commentary);
    if (data.metrics) renderMetricsTable('smid-metrics', data.metrics);
    renderHoldings('smid-holdings', data.topTenHoldings);
}

function renderAltModel(data, formatDate) {
    const dateStr = formatDate(data.metadata['As Of Date']);
    document.getElementById('alt-date').textContent = dateStr;
    const container = document.getElementById('alt-commentary');
    if (!container || !data.commentarySections) return;
    container.innerHTML = '';
    data.commentarySections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'alt-section';
        sectionDiv.innerHTML = `
            <div class="alt-title">${section.label || ''}</div>
            <div class="commentary-section">
                <div class="commentary-text">${formatCommentary(section.commentary || '')}</div>
            </div>`;
        container.appendChild(sectionDiv);
    });
}

function renderNotesModel(data, formatDate) {
    const dateStr = formatDate(data.metadata['As Of Date']);
    document.getElementById('notes-date').textContent = dateStr;
    renderCommentary('notes-commentary', data.commentary);
    const tableBody = document.getElementById('notes-table-body');
    if (!tableBody || !data.notes) return;
    tableBody.innerHTML = '';
    data.notes.forEach(note => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${note['Pricing Date'] ? formatDate(note['Pricing Date']) : '--'}</td>
            <td>${note.Bank || '--'}</td>
            <td>${note.Ticker || '--'}</td>
            <td>${note['Short Name'] || '--'}</td>
            <td>${note['GICS Sector'] || '--'}</td>
            <td class="right">${note.Coupon ? `${(note.Coupon * 100).toFixed(1)}%` : '--'}</td>
        `;
    });
}

function formatCommentary(text) {
    if (!text) return '';
    return text.split('\n\n')
        .map(para => `<p>${para.replace(/\n/g, ' ').trim()}</p>`)
        .join('');
}

function renderCommentary(elementId, commentaryText) {
    const element = document.getElementById(elementId);
    if (element && commentaryText) {
        element.innerHTML = formatCommentary(commentaryText);
    } else if (element) {
        element.innerHTML = '<p>Commentary not available.</p>';
    }
}

function renderMetricsTable(elementId, metrics) {
    const element = document.getElementById(elementId);
    if (!element || !metrics || !metrics.portfolio) return;
    let html = '';
    Object.keys(metrics.portfolio).forEach(key => {
        const portfolioVal = metrics.portfolio[key];
        const benchmarkVal = metrics.benchmark ? metrics.benchmark[key] : null;
        const diffVal = metrics.difference ? metrics.difference[key] : null;

        const formatValue = (val) => (val !== null && val !== undefined) ? val.toFixed(1) : '--';
        const diffClass = (diffVal !== null && diffVal !== undefined) ? (diffVal > 0 ? 'positive' : (diffVal < 0 ? 'negative' : '')) : '';

        html += `
            <tr>
                <td>${key}</td>
                <td class="right">${formatValue(portfolioVal)}</td>
                <td class="right">${formatValue(benchmarkVal)}</td>
                <td class="right ${diffClass}">${formatValue(diffVal)}</td>
            </tr>
        `;
    });
    element.innerHTML = html;
}

function renderHoldings(elementId, holdings) {
    const element = document.getElementById(elementId);
    if (!element || !holdings || !holdings.length) return;
    const FIXED_MAX_WEIGHT = 3.0; // Scale relative to 3.0%
    let html = '';
    holdings.forEach(holding => {
        const weight = holding.weight || 0;
        const widthPercent = FIXED_MAX_WEIGHT > 0 ? Math.min(100, Math.round((weight / FIXED_MAX_WEIGHT) * 100)) : 0;
        html += `
            <div class="holding-row">
                <div class="holding-name">${holding.name || ''}</div>
                <div class="holding-value">${weight.toFixed(1)}%</div>
                <div class="bar-container">
                    <div class="bar" style="width: ${widthPercent}%;"></div>
                </div>
            </div>
        `;
    });
    element.innerHTML = html;
}

function renderSectors(elementId, sectors) {
    const element = document.getElementById(elementId);
    if (!element || !sectors || sectors.length <= 1) {
        if(element) element.innerHTML = '<p>Sector data not available.</p>';
        return;
    }
    const sectorData = sectors.slice(1).filter(s => s && (s.total !== undefined && s.total !== null));
    if (!sectorData.length) {
        if(element) element.innerHTML = '<p>Sector data not available.</p>';
        return;
    }
    
    // Sort sectors by total percentage
    const sortedSectors = [...sectorData].sort((a, b) => (b.total || 0) - (a.total || 0));
    const globalMaxValue = sortedSectors[0]?.total || 1; 
    const midpoint = Math.ceil(sortedSectors.length / 2);
    const leftSectors = sortedSectors.slice(0, midpoint);
    const rightSectors = sortedSectors.slice(midpoint);
    
    // IMPROVED: Color gradient based on percentage values instead of index
    const sectorGradientMap = new Map();
    const maxPercentage = Math.max(...sortedSectors.map(s => s.total || 0));
    
    sortedSectors.forEach((sector) => {
        // Calculate percentage ratio (0-1 range)
        const percentageRatio = (sector.total || 0) / maxPercentage;
        // Map to 1-7 range, with higher percentages getting higher numbers (darker colors)
        const gradientIndex = Math.max(1, Math.min(7, Math.ceil(percentageRatio * 7)));
        sectorGradientMap.set(sector, `gradient-${gradientIndex}`);
    });
    
    const generateHtml = (sectorList) => {
        let colHtml = '<div class="sector-bars">';
        sectorList.forEach((sector) => {
            const widthPercent = globalMaxValue > 0 ? Math.max(1, Math.round(((sector.total || 0) / globalMaxValue) * 100)) : 1;
            const gradientClass = sectorGradientMap.get(sector);
            
            // Add a default holdings value if not available
            const holdingsDisplay = sector.holdings || '0';
            
            colHtml += `
                <div class="sector-row">
                    <div class="sector-name">${sector.sector || sector.name || 'N/A'}</div>
                    <div class="sector-value">${(sector.total || 0).toFixed(1)}%</div>
                    <div class="sector-holdings">${holdingsDisplay}</div>
                    <div class="sector-bar-container">
                        <div class="sector-bar ${gradientClass}" style="width: ${widthPercent}%;"></div>
                    </div>
                </div>
            `;
        });
        colHtml += '</div>';
        return colHtml;
    };
    
    element.innerHTML = generateHtml(leftSectors) + generateHtml(rightSectors);
}

function renderRegionalExposure(elementId, regions) {
    const element = document.getElementById(elementId);
    if (!element || !regions || !regions.length) {
         if(element) element.innerHTML = '<div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin-top: 5px; margin-bottom: 20px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280;">Regional exposure data not available.</div>';
         return;
    }

    const validRegions = regions.filter(r => r && r.weight !== undefined && r.weight !== null && r.weight > 0);
     if (!validRegions.length) {
         if(element) element.innerHTML = '<div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin-top: 5px; margin-bottom: 20px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280;">Regional exposure data not available.</div>';
         return;
    }

    const sortedRegions = [...validRegions].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    const dominantRegion = sortedRegions[0];
    const dominantPercent = dominantRegion.weight?.toFixed(1) || '0.0';
    const dominantName = dominantRegion.region || '';

    // Standard colors for regions
    const regionColors = ['#2563eb', '#059669', '#dc2626', '#9333ea', '#0891b2']; 

    let html = `
        <div style="background: var(--color-gray-50); border-radius: var(--border-radius-lg); padding: var(--spacing-lg); margin-top: 5px; margin-bottom: 18px; border: 1px solid var(--color-gray-200);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size: 11.5px; font-weight: 600; color: var(--color-gray-800);">Regional Distribution</div>
                <div style="font-size: 11.5px; font-weight: 500; color: var(--color-gray-700);">${dominantPercent}% ${dominantName}</div>
            </div>
            <div style="height: 16px; background: var(--color-gray-200); border-radius: var(--border-radius-md); overflow: hidden; display: flex; margin-bottom: 15px;">`;

    // Standard coloring for the regional distribution bar
    sortedRegions.forEach((region, index) => {
        if (!region.weight) return;
        const color = regionColors[index % regionColors.length];
        html += `<div style="width: ${region.weight}%; height: 100%; background: ${color};" title="${region.region}: ${region.weight.toFixed(1)}%"></div>`;
    });
    html += '</div>';

    const regionShortNames = {
        'North America': 'N. America', 'Western Europe': 'W. Europe', 'Asia Pacific': 'Asia Pac',
        'South & Central America': 'LatAm', 'Africa / Middle East': 'Africa/ME', 'Emerging Markets': 'EM', 'Other': 'Other'
    };

    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; margin-top: 15px;">';
    sortedRegions.forEach((region, index) => {
        const shortName = regionShortNames[region.region] || region.region || 'N/A';
        const colorClass = `c${index + 1}`;
        const holdingsText = region.holdings ? `${region.holdings} holding${region.holdings !== 1 ? 's' : ''}` : '';
        html += `
            <div class="region-item">
                <div class="region-item-header">
                    <div class="region-color-dot ${colorClass}"></div>
                    <span class="region-name">${shortName}</span>
                </div>
                <div class="region-weight">${region.weight?.toFixed(1) || '0.0'}%</div>
                <div class="region-holdings">${holdingsText}</div>
            </div>
        `;
    });
    html += '</div></div>';
    element.innerHTML = html;
}

function renderSecurities(elementId, securities, isRemoved) {
    const element = document.getElementById(elementId);
    if (!element || !securities || !securities.length) {
        if(element) element.innerHTML = '<span>None</span>';
        return;
    }
    const validSecurities = securities.filter(s => s && typeof s === 'string' && s.trim() !== "" && s !== "#VALUE!");
     if (!validSecurities.length) {
        if(element) element.innerHTML = '<span>None</span>';
        return;
    }
    const className = isRemoved ? 'security-item removed-item' : 'security-item';
    element.innerHTML = validSecurities.map(security => `<div class="${className}">${security}</div>`).join('');
}

document.addEventListener('DOMContentLoaded', loadData);