/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          primary_ink: '#131921',
          secondary_ink: '#232F3E',
          orange: '#FF9900',
          orange_hover: '#FA8900',
          accent_amber: '#FEBD69',
          amber_secondary: '#FFA41C',
          background_light: '#EAEDED',
          surface_white: '#FFFFFF',
          text_main: '#0F1111',
          text_muted: '#565959',
          link_blue: '#007185',
          link_blue_hover: '#C7511F',
          success_green: '#007600',
          alert_red: '#B12704',
          border_subtle: '#D5D9D9',
          border_divider: '#E7E7E7',
          card_hover: '#F7FAFA',
          active_tint: '#FEF8F2',
        },
      },
      fontFamily: {
        ember: ['"Amazon Ember"', 'Arial', 'sans-serif'],
        sans: ['"Amazon Ember"', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', 'Monaco', '"Consolas"', '"Liberation Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '14px' }],
        sm: ['12px', { lineHeight: '16px' }],
        base: ['14px', { lineHeight: '20px' }],
        md: ['16px', { lineHeight: '22px' }],
        lg: ['20px', { lineHeight: '26px' }],
        xl: ['24px', { lineHeight: '30px' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      borderRadius: {
        button: '8px',
        card: '4px',
        badge: '2px',
      },
      boxShadow: {
        amazon: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        amazon_card: '0 2px 5px 0 rgba(213, 217, 217, 0.5)',
        amazon_focus: '0 0 0 3px #F2CA8C, 0 1px 2px rgba(15, 17, 17, 0.15)',
        remote_focus: '0 0 0 4px #FF9900, 0 0 15px rgba(255, 153, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
