/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                accent: {
                    primary: 'var(--accent-primary)',
                    secondary: 'var(--accent-secondary)',
                    light: 'var(--accent-light)',
                },
            },
        },
    },
    plugins: [],
}
