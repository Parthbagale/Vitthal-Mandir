// tailwind.config.js
// Provided to satisfy templates that reference /static/tailwind.config.js.
// This file mirrors the config used elsewhere.
const config = {
  content: ["./index.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: '#FF9100',
        secondary: '#F3E9DD',
        gold: '#B8860B',
        saffron: '#FF6347',
        maroon: '#800000',
        'temple-brown': '#5A3D2B',
        'temple-brown-dark': '#3D2A1F',
        'saffron-deep': '#D4533A',
        'saffron-light': '#FF9980',
        'gold-light': '#F0E68C',
        'gold-deep': '#B8860B',
        'temple-cream': '#F8F4E3',
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        playfair: ["Playfair Display", 'serif']
      }
    }
  },
  plugins: [],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
