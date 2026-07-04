/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/konsta/**/*.{js,svelte}'  // Add this line
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}