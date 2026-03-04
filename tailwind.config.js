import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Lato', ...defaultTheme.fontFamily.sans],
                heading: ['Montserrat', ...defaultTheme.fontFamily.sans],
                body: ['Lato', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    primary: '#495B67',
                    'primary-light': '#5a6f7c',
                    'primary-dark': '#3a4a54',
                    secondary: '#515151',
                    accent: '#71858E',
                    white: '#FFFFFF',
                },
            },
        },
    },

    plugins: [forms],
};
