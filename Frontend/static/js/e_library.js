/* E-Library Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializeELibrary();
});

function initializeELibrary() {
    // Book search functionality
    initializeBookSearch();
    
    // Book category filters
    initializeBookFilters();
    
    // Book download tracking
    initializeBookDownloads();
    
    // PDF viewer
    initializePDFViewer();
}

function initializeBookSearch() {
    const searchInput = document.getElementById('book-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterBooks(searchTerm);
        });
    }
}

function filterBooks(searchTerm) {
    const bookCards = document.querySelectorAll('.book-card');
    
    bookCards.forEach(card => {
        const title = card.dataset.title?.toLowerCase() || '';
        const author = card.dataset.author?.toLowerCase() || '';
        
        if (title.includes(searchTerm) || author.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function initializeBookFilters() {
    const filterButtons = document.querySelectorAll('.book-filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            filterBooksByCategory(category);
        });
    });
}

function filterBooksByCategory(category) {
    const bookCards = document.querySelectorAll('.book-card');
    
    bookCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function initializeBookDownloads() {
    const downloadButtons = document.querySelectorAll('.book-download-btn');
    
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const bookUrl = btn.dataset.url;
            const bookTitle = btn.dataset.title;
            
            trackDownload(bookTitle);
            window.open(bookUrl, '_blank');
        });
    });
}

function trackDownload(bookTitle) {
    console.log(`Book downloaded: ${bookTitle}`);
    // You can send analytics here
}

function initializePDFViewer() {
    const viewButtons = document.querySelectorAll('.book-view-btn');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const pdfUrl = btn.dataset.url;
            openPDFViewer(pdfUrl);
        });
    });
}

function openPDFViewer(pdfUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="w-full h-full flex flex-col">
            <div class="bg-gray-800 p-4 flex justify-between items-center">
                <h3 class="text-white font-semibold">PDF Viewer</h3>
                <button class="close-pdf-viewer text-white hover:text-gray-300">
                    <i class="ph ph-x text-2xl"></i>
                </button>
            </div>
            <iframe src="${pdfUrl}" class="flex-1 w-full" frameborder="0"></iframe>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-pdf-viewer').addEventListener('click', () => {
        modal.remove();
    });
}
