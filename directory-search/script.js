// Directory Search Operators Generator
class DirectorySearchGenerator {
    constructor() {
        this.form = document.getElementById('searchForm');
        this.resultsContainer = document.getElementById('results');
        this.copyAllBtn = document.getElementById('copyAllBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.themeSwitcher = document.getElementById('themeSwitcher');
        this.regionSelect = document.getElementById('region');
        this.searchEngineSelect = document.getElementById('searchEngine');

        this.directoryOperators = [
            '"add your business"', '"add site"', '"add url"', '"add website"',
            '"favorite links"', '"favorite sites"', '"favorite websites"',
            '"listing"', '"recommended links"', '"recommended sites"',
            '"submit website"', '"submit"', '"suggest site"', '"suggest website"',
            '* directory', 'directory', 'intitle:directory', 'inurl:directory',
            'inurl:submit.php', 'directory + add/', 'intitle:"directory"',
            'Listings', 'coupons + intitle:list', '"deals for" + " *" + intitle:submit',
            '"coupons for" + " *" + intitle:submit', 'sweeps* + intitle:submit',
            'giveaways + intitle:submit'
        ];
        
        this.eduGovOperators = [
            '"add your business" site:.edu', '"add your business" site:.gov', 'inurl:".gov" "add your business"'
        ];

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyAllBtn.addEventListener('click', () => this.copyAll());
        this.exportBtn.addEventListener('click', () => this.exportResults());
        this.themeSwitcher.addEventListener('click', () => this.toggleTheme());
        this.searchEngineSelect.addEventListener('change', () => this.handleEngineChange());

        this.loadTheme();
        this.fetchCountries();
        this.handleEngineChange(); // Set initial state
    }
    
    // --- Major Functionalities ---

    async handleSubmit(e) {
        e.preventDefault();
        const keywords = this.getKeywords();
        if (keywords.length === 0) {
            this.showError('Please enter at least one keyword.');
            return;
        }

        this.setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
            const operators = this.generateOperators(keywords);
            this.displayResults(operators);
        } catch (error) {
            console.error("Error generating operators:", error);
            this.showError("An unexpected error occurred while generating results.");
        } finally {
            this.setLoading(false);
        }
    }
    
    generateOperators(keywords) {
        const results = [];
        const searchEngine = this.searchEngineSelect.value;
        const options = this.getSearchOptions();
        const tlds = this.getSelectedTlds();
        const region = this.regionSelect.value;
        const language = document.getElementById('language').value;
        const resultsPerPage = document.getElementById('resultsPerPage').value;
        const timeRange = document.getElementById('timeRange').value;

        keywords.forEach(keyword => {
            const keywordResults = { keyword, operators: [] };
            const allOperators = [...this.directoryOperators, ...this.eduGovOperators];
            
            allOperators.forEach(operator => {
                const query = this.buildSearchQuery(keyword, operator, options, tlds, region, language, resultsPerPage, timeRange, searchEngine);
                keywordResults.operators.push({ query });
            });
            
            results.push(keywordResults);
        });
        return results;
    }

    displayResults(results) {
        if (results.length === 0) {
            this.showError('No results generated.');
            return;
        }

        let html = '';
        results.forEach(keywordResult => {
            html += `
                <div class="keyword-section">
                    <div class="keyword-header">
                        <span>
                            <span class="iconify me-1" data-icon="material-symbols:label-outline"></span>
                            ${this.escapeHtml(keywordResult.keyword)}
                            <span class="badge bg-secondary ms-2">${keywordResult.operators.length} operators</span>
                        </span>
                    </div>
                    <div class="operators-list">
                        ${keywordResult.operators.map(op => this.createOperatorItem(op)).join('')}
                    </div>
                </div>`;
        });
        
        this.resultsContainer.innerHTML = html;
        this.copyAllBtn.style.display = 'inline-block';
        this.exportBtn.style.display = 'inline-block';
        this.attachButtonListeners();
    }
    
    // --- UI & UX Helpers ---

    handleEngineChange() {
        const selectedEngine = this.searchEngineSelect.value;
        const isGoogle = selectedEngine === 'google';
        // Disable options not supported by Bing/DDG
        document.getElementById('resultsPerPage').disabled = !isGoogle;
    }

    setLoading(isLoading) {
        this.generateBtn.disabled = isLoading;
        if (isLoading) {
            this.resultsContainer.innerHTML = `<div class="spinner-container"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
            this.generateBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Generating...`;
        } else {
            this.generateBtn.innerHTML = `<span class="iconify me-1" data-icon="material-symbols:magic-button"></span> Generate Operators`;
        }
    }

    createOperatorItem(op) {
        const displayQuery = decodeURIComponent(op.query.split('?q=')[1].split('&')[0]);
        const escapedQuery = this.escapeHtml(displayQuery);
        const escapedUrl = this.escapeHtml(op.query);
        return `<div class="operator-item"><code class="operator-code">${escapedQuery}</code><div class="operator-actions"><button class="btn btn-sm btn-outline-secondary copy-btn" data-query="${escapedQuery}" title="Copy query"><span class="iconify" data-icon="material-symbols:content-copy-outline"></span></button><a href="${escapedUrl}" target="_blank" class="btn btn-sm btn-outline-primary search-btn" title="Search"><span class="iconify" data-icon="material-symbols:open-in-new"></span></a></div></div>`;
    }

    clearAll() {
        this.form.reset();
        document.getElementById('intitle').checked = true;
        this.resultsContainer.innerHTML = `<div class="text-center text-muted p-4 initial-message"><span class="iconify" data-icon="material-symbols:search-off" style="font-size: 2.5rem;"></span><p class="mb-0 mt-2">Enter keywords and click Generate to see results.</p></div>`;
        this.copyAllBtn.style.display = 'none';
        this.exportBtn.style.display = 'none';
        this.handleEngineChange(); // Reset disabled state
        this.showToast('Form cleared!', 'info');
    }

    attachButtonListeners() {
        this.resultsContainer.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                this.copyToClipboard(e.currentTarget.dataset.query);
                this.showToast('Query copied to clipboard!');
            });
        });
    }

    // --- Data & API Handling ---

    async fetchCountries() {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const countries = await response.json();
            this.regionSelect.innerHTML = '<option value="">Any Region</option>';
            countries.sort((a, b) => a.name.common.localeCompare(b.name.common)).forEach(country => {
                const option = document.createElement('option');
                option.value = `country${country.cca2}`;
                option.textContent = country.name.common;
                this.regionSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Could not fetch countries:", error);
            this.regionSelect.innerHTML = '<option value="">Could not load countries</option>';
            this.showToast('Failed to load country list.', 'danger');
        }
    }

    buildSearchQuery(keyword, operator, options, tlds, region, language, resultsPerPage, timeRange, searchEngine) {
        let query = options[options.selected] ? `${options.selected}:"${keyword}" ${operator}` : `"${keyword}" ${operator}`;
        if (tlds.length > 0) {
            query += tlds.map(tld => ` site:*${tld}`).join('');
        }
        
        const params = new URLSearchParams();
        params.append('q', query.trim());
        let baseUrl = '';

        switch (searchEngine) {
            case 'bing':
                baseUrl = 'https://www.bing.com/search';
                break;

            case 'duckduckgo':
                baseUrl = 'https://duckduckgo.com/';
                // Map time filter for DDG
                const timeMap = { 'qdr:d': 'd', 'qdr:w': 'w', 'qdr:m': 'm', 'qdr:y': 'y' };
                if (timeRange && timeMap[timeRange]) {
                    params.append('df', timeMap[timeRange]);
                }
                // Map region for DDG
                if (region) {
                    const regionCode = region.replace('country', '').toLowerCase();
                    params.append('kl', regionCode);
                }
                break;
            
            default: // Google
                baseUrl = 'https://www.google.com/search';
                if (resultsPerPage && resultsPerPage !== '10') params.append('num', resultsPerPage);
                if (timeRange) params.append('tbs', timeRange);
                if (region) params.append('cr', region);
                if (language) params.append('lr', language);
                break;
        }
        
        return `${baseUrl}?${params.toString()}`;
    }

    // --- Getters & Helpers ---

    getKeywords() { return document.getElementById('keywords').value.trim().split('\n').filter(k => k.trim() !== ''); }
    getSearchOptions() { const selected = document.querySelector('input[name="searchOption"]:checked'); return { selected: selected ? selected.value : 'intitle', intitle: selected?.value === 'intitle', inurl: selected?.value === 'inurl', intext: selected?.value === 'intext', any: selected?.value === 'any' }; }
    getSelectedTlds() { return Array.from(document.querySelectorAll('.tld-check:checked')).map(cb => cb.value); }
    
    // --- Clipboard and Export ---
    
    copyAll() { const allQueries = Array.from(document.querySelectorAll('.operator-code')).map(code => code.textContent).join('\n'); this.copyToClipboard(allQueries); this.showToast('All queries copied to clipboard!'); }
    exportResults() { const keywords = this.getKeywords(); const keywordString = keywords.length > 0 ? `${keywords[0].replace(/\s+/g, '_')}-` : ''; const allQueries = Array.from(document.querySelectorAll('.operator-code')).map(code => code.textContent).join('\n'); const blob = new Blob([allQueries], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `directory-search-operators-${keywordString}${new Date().toISOString().split('T')[0]}.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); this.showToast('Queries exported successfully!', 'success'); }
    copyToClipboard(text) { navigator.clipboard.writeText(text).catch(err => { console.error('Clipboard copy failed:', err); this.showToast('Failed to copy to clipboard.', 'danger'); }); }

    // --- Theme Management ---

    loadTheme() { const theme = localStorage.getItem('theme') || 'light'; document.body.setAttribute('data-bs-theme', theme); this.updateThemeIcon(theme); }
    toggleTheme() { const currentTheme = document.body.getAttribute('data-bs-theme'); const newTheme = currentTheme === 'dark' ? 'light' : 'dark'; document.body.setAttribute('data-bs-theme', newTheme); localStorage.setItem('theme', newTheme); this.updateThemeIcon(newTheme); }
    updateThemeIcon(theme) { const icon = this.themeSwitcher.querySelector('.iconify'); if (theme === 'dark') { icon.dataset.icon = 'material-symbols:light-mode-outline'; } else { icon.dataset.icon = 'material-symbols:dark-mode-outline'; } }

    // --- Notifications & Misc ---

    showError(message) { this.resultsContainer.innerHTML = `<div class="text-center text-danger p-4 error-message"><span class="iconify" data-icon="material-symbols:error-outline" style="font-size: 2.5rem;"></span><p class="mb-0 mt-2">${this.escapeHtml(message)}</p></div>`; }
    showToast(message, type = 'success') { const toastContainer = document.querySelector('.toast-container'); const toastEl = document.createElement('div'); toastEl.className = `toast align-items-center text-bg-${type} border-0`; toastEl.setAttribute('role', 'alert'); toastEl.setAttribute('aria-live', 'assertive'); toastEl.setAttribute('aria-atomic', 'true'); toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${this.escapeHtml(message)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`; toastContainer.appendChild(toastEl); const toast = new bootstrap.Toast(toastEl); toast.show(); toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove()); }
    escapeHtml = (text) => { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
}

document.addEventListener('DOMContentLoaded', () => { new DirectorySearchGenerator(); });