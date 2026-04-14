// tailwind.config.js
const config = {
  content: ["./index.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: '#FF9100', // Saffron-orange
        secondary: '#F3E9DD', // Light cream/beige
        gold: '#B8860B', // Darker gold
        saffron: '#FF6347', // Tomato/Brighter saffron
        maroon: '#800000', // Deep red
        'temple-brown': '#5A3D2B', // A new custom brown for readability
        'temple-brown-dark': '#3D2A1F',
        'saffron-deep': '#D4533A', // Deeper saffron tone
        'saffron-light': '#FF9980', // Lighter saffron tone
        'gold-light': '#F0E68C', // Light gold
        'gold-deep': '#B8860B', // Deep gold
        'temple-cream': '#F8F4E3', // A soft cream
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        playfair: ["Playfair Display", 'serif']
      },
      backgroundImage: {
        'gradient-sacred': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'gradient-divine': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'gradient-temple': 'linear-gradient(to top left, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'sacred': '0 10px 15px -3px rgba(255, 145, 0, 0.3), 0 4px 6px -2px rgba(255, 145, 0, 0.1)',
        'divine': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'gentle': '0 5px 10px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        'glow': {
          'from': { 'boxShadow': '0 0 5px rgba(255, 139, 43, 0.4)' },
          'to': { 'boxShadow': '0 0 15px rgba(255, 139, 43, 0.6)' },
        },
        'dot-typing': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)', opacity: '.5' },
          '100%': { transform: 'scale(1)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 1s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse': 'pulse 2s infinite',
        'glow': 'glow 2s infinite alternate',
        'dot-typing': 'dot-typing 1.5s infinite linear',
      }
    }
  },
  plugins: [],
};

// For browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}