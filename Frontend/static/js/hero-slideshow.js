/**
 * Hero Slideshow - Dedicated script for home page hero slider
 */

(function() {
    'use strict';
    
    function initHeroSlideshow() {
        console.log('Initializing hero slideshow...');
        
        const slider = document.getElementById('home-hero-slider');
        if (!slider) {
            console.log('Slider element not found');
            return;
        }
        
        const slides = slider.querySelectorAll('.hero-bg-slide');
        console.log('Found slides:', slides.length);
        
        if (slides.length === 0) {
            console.log('No slides found');
            return;
        }
        
        let currentIndex = 0;
        
        // Make sure first slide is visible
        slides[0].classList.add('is-active');
        
        function showSlide(index) {
            // Remove active class from all slides
            slides.forEach(slide => {
                slide.classList.remove('is-active');
            });
            
            // Add active class to current slide
            slides[index].classList.add('is-active');
            console.log('Showing slide:', index);
        }
        
        // Start slideshow
        setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            showSlide(currentIndex);
        }, 2000);
        
        console.log('Hero slideshow initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroSlideshow);
    } else {
        initHeroSlideshow();
    }
})();
