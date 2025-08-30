/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}", "./node_modules/flowbite/**/*.js"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        azul: "#5394cf",
        azul_claro: "#c6d8e7",
        celeste: "#34bceb",
        amarillo: "#ECCD50",
        celeste_claro: "#D8EAF4",
        gris_claro: "#ecf1f4",
        naranja: "#ff793f",
        naranja_claro: "#ffbea4",
        verde: "#4ac07b",
        verde_claro: "#e4f5ec",
        rojo: "#842315",
        rojo_claro: "#dea69e",
      },
      fontFamily: {
        parrafo: ["Quicksand", "sans-serif"],
        test_fuente: ["Gloria Hallelujah", "cursive"],
        subtitulo: ["Quicksand", "sans-serif"],
        texto: ["Quicksand", "sans-serif"],
        titulo: ["Quicksand", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
      backgroundImage: {
        "close-menu": "url('/assets/images/icons/icon-close.svg')",
        "open-menu": "url('/assets/images/icons/icon-hamburger.svg')",
      },
      animation: {
        blob: "blob 7s infinite",
        float: "float 2s ease-in-out infinite",
        fadeIn: "fadeIn 1s ease-out forwards",
        slideInLeft: "slideInLeft 1s ease-out forwards",
        zoomIn: "zoomIn 1s ease-out forwards",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "tranlate(0px, 0px) scale(1)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        zoomIn: {
          "0%": { transform: "scale(0)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant("peer", ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.peer + .${className} ~ .peer-checked:${separator}${className}`;
        });
      });
    },
    require("flowbite/plugin"), // add this line
  ],
};
