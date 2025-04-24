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
    } catch (error) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = 'Error loading report data: ' + error.message;
            errorDiv.style.display = 'block';
        }
    }
}

function renderCapitalMarketsRecap(data, formatDate) {
    // Update title with new styling 
    const titleEl = document.getElementById('recap-title');
    if (titleEl) {
        titleEl.className = 'recap-title';
    }
    
    const asOfDateEl = document.getElementById('recap-date');
    if (asOfDateEl) asOfDateEl.textContent = '03/31/25';
    
    const element = document.getElementById('market-recap');
    if (element && data.capitalMarketsRecap) {
        element.innerHTML = `<p>${data.capitalMarketsRecap}</p>`;
    } else if (element) {
        element.innerHTML = '<p>Market recap information not available.</p>';
    }
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
    
    // Calculate total holdings from regional allocation
    let totalHoldings = 0;
    if (data.regionalAllocation && data.regionalAllocation.length) {
        totalHoldings = data.regionalAllocation.reduce((sum, region) => sum + (region.holdings || 0), 0);
    }
    
    renderSectors('growth-sectors', data.sectors, totalHoldings);
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
    
    // Calculate total holdings from regional allocation
    let totalHoldings = 0;
    if (data.regionalAllocation && data.regionalAllocation.length) {
        totalHoldings = data.regionalAllocation.reduce((sum, region) => sum + (region.holdings || 0), 0);
    }
    
    if (data.sectors) renderSectors('core-sectors', data.sectors, totalHoldings);
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
    
    // Pass false for showHoldingCounts parameter to exclude counts for SmallMid
    if (data.sectors) renderSectors('smid-sectors', data.sectors, 0, false);
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
    
    // Update title with new styling
    const titleEl = document.getElementById('notes-title');
    if (titleEl) {
        titleEl.className = 'notes-section-title';
    }
    
    document.getElementById('notes-date').textContent = dateStr;
    renderCommentary('notes-commentary', data.commentary);
    
    const tableBody = document.getElementById('notes-table-body');
    if (!tableBody || !data.notes) return;
    tableBody.innerHTML = '';
    
    data.notes.forEach(note => {
        const couponValue = note.Coupon || 0;
        const couponText = couponValue ? `${(couponValue * 100).toFixed(1)}%` : '--';
        
        // Use the same positive/negative classes for consistency
        let couponClass = '';
        if (couponValue >= 0.10) couponClass = 'positive'; // Changed from coupon-high to positive
        else if (couponValue >= 0.07) couponClass = 'coupon-medium';
        else if (couponValue > 0) couponClass = 'coupon-low';
        
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${note['Pricing Date'] ? formatDate(note['Pricing Date']) : '--'}</td>
            <td>${note.Bank || '--'}</td>
            <td>${note.Ticker || '--'}</td>
            <td>${note['Short Name'] || '--'}</td>
            <td>${note['GICS Sector'] || '--'}</td>
            <td class="right ${couponClass}">${couponText}</td>
        `;
    });
}

function formatCommentary(text) {
    if (!text) return '';
    const paragraphs = text.split('\n\n');
    
    if (paragraphs.length > 0) {
        // Format first paragraph with emphasis
        const firstPara = `<p class="commentary-first-para">${paragraphs[0].replace(/\n/g, ' ').trim()}</p>`;
        
        if (paragraphs.length > 1) {
            // Format remaining paragraphs
            const restParas = paragraphs.slice(1)
                .map(para => `<p>${para.replace(/\n/g, ' ').trim()}</p>`)
                .join('');
            
            return firstPara + restParas;
        }
        return firstPara;
    }
    return '';
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
    if (!element || !holdings || !holdings.length) {
        if(element) element.innerHTML = '<div class="empty-state-simple">No holdings data available.</div>';
        return;
    }
    const FIXED_MAX_WEIGHT = 3.0;
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

function renderSectors(elementId, sectors, totalHoldings, showHoldingCounts = true) {
    const element = document.getElementById(elementId);
    if (!element || !sectors || sectors.length <= 1) {
        if(element) element.innerHTML = '<div class="empty-state">Sector data not available.</div>';
        return;
    }
    
    const sectorData = sectors.slice(1).filter(s => s && (s.total !== undefined && s.total !== null));
    if (!sectorData.length) {
        if(element) element.innerHTML = '<div class="empty-state">Sector data not available.</div>';
        return;
    }
    
    const sortedSectors = [...sectorData].sort((a, b) => (b.total || 0) - (a.total || 0));
    const globalMaxValue = sortedSectors[0]?.total || 1;
    const midpoint = Math.ceil(sortedSectors.length / 2);
    const leftSectors = sortedSectors.slice(0, midpoint);
    const rightSectors = sortedSectors.slice(midpoint);
    
    // Improved gradient mapping based on weight ranking
    const sectorGradientMap = new Map();
    
    // Assign colors based on ranking to ensure visual hierarchy
    sortedSectors.forEach((sector, index) => {
        // Use position in sorted list to determine color (darker = higher value)
        const totalBuckets = 7; // Number of gradient options
        const bucketSize = Math.ceil(sortedSectors.length / totalBuckets);
        const bucketNumber = Math.floor(index / bucketSize) + 1;
        const gradientIndex = Math.min(totalBuckets, Math.max(1, totalBuckets - bucketNumber + 1));
        sectorGradientMap.set(sector, `gradient-${gradientIndex}`);
    });
    
    const generateHtml = (sectorList) => {
        let colHtml = '<div class="sector-bars">';
        sectorList.forEach((sector) => {
            // Ensure minimum width for visual clarity
            const widthPercent = globalMaxValue > 0 ? Math.max(5, Math.round(((sector.total || 0) / globalMaxValue) * 100)) : 5;
            const gradientClass = sectorGradientMap.get(sector);
            
            // Calculate the number of holdings for this sector based on percentage
            let holdingsDisplay = showHoldingCounts ? '0' : '';
            if (showHoldingCounts && totalHoldings && sector.total) {
                // Calculate holdings based on sector percentage and total holdings
                const sectorHoldings = Math.ceil((sector.total / 100) * totalHoldings);
                holdingsDisplay = sectorHoldings.toString();
            }
            
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
        if(element) element.innerHTML = '<div class="empty-state">Regional exposure data not available.</div>';
        return;
    }
    
    const validRegions = regions.filter(r => r && r.weight !== undefined && r.weight !== null && r.weight > 0);
    if (!validRegions.length) {
        if(element) element.innerHTML = '<div class="empty-state">Regional exposure data not available.</div>';
        return;
    }
    
    const sortedRegions = [...validRegions].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    const dominantRegion = sortedRegions[0];
    const dominantPercent = dominantRegion.weight?.toFixed(1) || '0.0';
    const dominantName = dominantRegion.region || '';
    
    const regionShortNames = {
        'North America': 'N. America', 'Western Europe': 'W. Europe', 'Asia Pacific': 'Asia Pac',
        'South & Central America': 'LatAm', 'Africa / Middle East': 'Africa/ME', 'Emerging Markets': 'EM', 'Other': 'Other'
    };
    
    let html = `
        <div class="region-wrapper">
            <div class="region-header">
                <div class="region-header-title">Regional Distribution</div>
                <div class="region-header-dominant">${dominantPercent}% ${dominantName}</div>
            </div>
            <div class="region-bar">`;
            
    sortedRegions.forEach((region, index) => {
        if (!region.weight) return;
        const segmentClass = `region-segment region-segment-${(index % 5) + 1}`;
        html += `<div class="${segmentClass}" style="width: ${region.weight}%;" title="${region.region}: ${region.weight.toFixed(1)}%"></div>`;
    });
    
    html += '</div>';
    html += '<div class="region-grid">';
    
    sortedRegions.forEach((region, index) => {
        const shortName = regionShortNames[region.region] || region.region || 'N/A';
        const colorClass = `c${(index % 5) + 1}`;
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
        if(element) element.innerHTML = '<span class="empty-state-simple">None</span>';
        return;
    }
    
    const validSecurities = securities.filter(s => s && typeof s === 'string' && s.trim() !== "" && s !== "#VALUE!");
    if (!validSecurities.length) {
        if(element) element.innerHTML = '<span class="empty-state-simple">None</span>';
        return;
    }
    
    const className = isRemoved ? 'security-item removed-item' : 'security-item';
    element.innerHTML = validSecurities.map(security => `<div class="${className}">${security}</div>`).join('');
}

document.addEventListener('DOMContentLoaded', loadData);