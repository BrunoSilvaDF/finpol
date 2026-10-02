import { PADRAO_MAXIMO } from '$lib/data/tabela-2026';
import type { Parametros } from './tipos';

const MESES_INTERSTICIO = 12;

/** Índice absoluto do mês (mes 1–12) para comparar datas por competência. */
export const indiceMes = (ano: number, mes: number): number => ano * 12 + (mes - 1);

function indicePosse(params: Parametros): number {
	const [ano, mes] = params.dataPosse.split('-').map(Number);
	return indiceMes(ano, mes);
}

// Uma progressão ocorre em cada mês de progressão que diste ao menos 12 meses da posse
// (ex.: posse em 03/2024 e progressão em setembro → primeira progressão em 09/2025).
function progressoesAte(params: Parametros, ano: number, mes: number): number {
	const posse = indicePosse(params);
	const alvo = indiceMes(ano, mes);
	let total = 0;
	for (let a = Math.floor(posse / 12); indiceMes(a, params.mesProgressao) <= alvo; a++) {
		if (indiceMes(a, params.mesProgressao) - posse >= MESES_INTERSTICIO) total++;
	}
	return total;
}

export function padraoEm(params: Parametros, ano: number, mes: number): number {
	return Math.min(params.padraoInicial + progressoesAte(params, ano, mes), PADRAO_MAXIMO);
}

export function anoPadraoMaximo(params: Parametros): number {
	let ano = Number(params.dataPosse.slice(0, 4));
	while (padraoEm(params, ano, 12) < PADRAO_MAXIMO) ano++;
	return ano;
}
