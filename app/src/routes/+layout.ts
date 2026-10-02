// Site estático: parâmetros vivem no localStorage, então a página é montada só no navegador
// e o build gera apenas o "casco" HTML (prerender).
export const ssr = false;
export const prerender = true;
