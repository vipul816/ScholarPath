/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                display: ['Roboto', 'sans-serif'],
            },
            colors: {
                // Google-inspired color palette
                primary: {
                    50: '#f3f3f3',
                    100: '#e8eaed',
                    200: '#dadce0',
                    300: '#c6c6c6',
                    400: '#9aa0a6',
                    500: '#5f6368',
                    600: '#3c4043',
                    700: '#202124',
                    800: '#1f1f1f',
                    900: '#000000',
                },
                accent: {
                    50: '#f8f9fa',
                    100: '#f3f3f3',
                    200: '#e8eaed',
                    300: '#dadce0',
                    400: '#6f7175',
                    500: '#4285f4',
                    600: '#1f71ed',
                    700: '#1757a0',
                    800: '#1d3aa0',
                    900: '#1a1a1a',
                },
                success: {
                    50: '#f0f7f0',
                    500: '#34a853',
                    600: '#239b5c',
                    700: '#137333',
                },
                warning: {
                    50: '#fef7f0',
                    500: '#fbbc04',
                    600: '#f9ab00',
                    700: '#e37400',
                },
                error: {
                    50: '#faf8f7',
                    500: '#ea4335',
                    600: '#d33a27',
                    700: '#a50e0e',
                },
            },
            boxShadow: {
                'google-sm': '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
                'google': '0 1px 3px rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)',
                'google-lg': '0 1px 3px rgba(60,64,67,.3), 0 8px 16px 8px rgba(60,64,67,.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            },
            borderRadius: {
                'google': '8px',
            }
        },
    },
    plugins: [],
}
