/* Gallery Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializeGallery();
});

function initializeGallery() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    // Create lightbox
    const lightbox = createLightbox();
    
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (img) {
                showLightbox(lightbox, img.src, img.alt);
            }
        });
    });
    
    // Filter functionality
    initializeGalleryFilters();
}

function createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <button class="lightbox-close" style="position: absolute; top: 20px; right: 20px; color: white; font-size: 2rem; background: none; border: none; cursor: pointer;">
            <i class="ph ph-x"></i>
        </button>
        <img src="" alt="" class="lightbox-image">
        <button class="lightbox-prev" style="position: absolute; left: 20px; color: white; font-size: 2rem; background: none; border: none; cursor: pointer;">
            <i class="ph ph-caret-left"></i>
        </button>
        <button class="lightbox-next" style="position: absolute; right: 20px; color: white; font-size: 2rem; background: none; border: none; cursor: pointer;">
            <i class="ph ph-caret-right"></i>
        </button>
    `;
    
    document.body.appendChild(lightbox);
    
    lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
        lightbox.classList.remove('active');
    });
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
    
    return lightbox;
}

function showLightbox(lightbox, src, alt) {
    const img = lightbox.querySelector('.lightbox-image');
    img.src = src;
    img.alt = alt;
    lightbox.classList.add('active');
}

function initializeGalleryFilters() {
    const filterButtons = document.querySelectorAll('.gallery-filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            filterGalleryItems(filter);
        });
    });
}

function filterGalleryItems(filter) {
    const items = document.querySelectorAll('.gallery-item');
    
    items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = 'block';
            item.classList.add('animate-fade-in');
        } else {
            item.style.display = 'none';
        }
    });
}
