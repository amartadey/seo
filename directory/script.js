document.addEventListener('DOMContentLoaded', () => {
    const directoryList = document.getElementById('directory-list');
    const searchInput = document.getElementById('search');
    const categorySelect = document.getElementById('category');
    const sortSelect = document.getElementById('sort');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const pageInfo = document.getElementById('page-info');
    const resultsCount = document.getElementById('results-count');
    
    let data = [];
    let filteredData = [];
    const itemsPerPage = 100;
    let currentPage = 1;
    
    // Fetch data from JSON file
    fetch('data.json')
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
            filteredData = [...data];
            renderDirectory();
            updateResultsCount();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            directoryList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load directory data. Please try again later.</p>
                </div>
            `;
        });
    
    // Render directory items
    function renderDirectory() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = filteredData.slice(start, end);
        
        if (paginatedData.length === 0) {
            directoryList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No matching sites found. Try adjusting your filters.</p>
                </div>
            `;
            return;
        }
        
        directoryList.innerHTML = '';
        
        paginatedData.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('card');
            
            // Format URL for display
            const displayUrl = item.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
            
            card.innerHTML = `
                <img src="https://www.google.com/s2/favicons?sz=64&domain_url=${item.url}" 
                     alt="${item.name} favicon"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'38\' height=\'38\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23d1d5db\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Crect x=\'3\' y=\'3\' width=\'18\' height=\'18\' rx=\'2\' ry=\'2\'%3E%3C/rect%3E%3Cline x1=\'8\' y1=\'12\' x2=\'16\' y2=\'12\'%3E%3C/line%3E%3Cline x1=\'12\' y1=\'8\' x2=\'12\' y2=\'16\'%3E%3C/line%3E%3C/svg%3E'">
                <div class="card-content">
                    <h3 title="${item.name}">${item.name}</h3>
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" title="${item.url}">${displayUrl}</a>
                    <div class="stats">
                        <p><strong>DA:</strong> ${item.da}</p>
                        <p><strong>PA:</strong> ${item.pa}</p>
                    </div>
                    ${getCategoryBadge(item.category)}
                    ${item.extra ? `<p>${item.extra}</p>` : ''}
                </div>
            `;
            
            directoryList.appendChild(card);
        });
        
        updatePagination();
    }
    
    // Get category badge HTML
    function getCategoryBadge(category) {
        if (!category) return '';
        
        const categoryLabels = {
            'doc': 'Document Submission',
            'blog': 'Blog Submission',
            'infographic': 'Infographic Submission',
            'social': 'Social Media',
            'article': 'Article Submission'
        };
        
        const label = categoryLabels[category] || category;
        
        return `<p class="category-badge">${label}</p>`;
    }
    
    // Update pagination controls
    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
    
    // Update results count
    function updateResultsCount() {
        resultsCount.textContent = `${filteredData.length} sites found`;
    }
    
    // Filter and sort data
    function filterAndSort() {
        let tempData = [...data];
        
        // Filter by category
        const category = categorySelect.value;
        if (category !== 'all') {
            tempData = tempData.filter(item => item.category === category);
        }
        
        // Filter by search
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            tempData = tempData.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                item.url.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort data
        const [sortKey, sortOrder] = sortSelect.value.split('-');
        tempData.sort((a, b) => {
            const valA = sortKey === 'da' ? a.da : a.pa;
            const valB = sortKey === 'da' ? b.da : b.pa;
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });
        
        filteredData = tempData;
        currentPage = 1;
        renderDirectory();
        updateResultsCount();
    }
    
    // Delay function for search input
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Event listeners
    searchInput.addEventListener('input', debounce(filterAndSort, 300));
    categorySelect.addEventListener('change', filterAndSort);
    sortSelect.addEventListener('change', filterAndSort);
    
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderDirectory();
            
            // Scroll to top of results
            document.querySelector('.results-container').scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderDirectory();
            
            // Scroll to top of results
            document.querySelector('.results-container').scrollIntoView({ behavior: 'smooth' });
        }
    });
});