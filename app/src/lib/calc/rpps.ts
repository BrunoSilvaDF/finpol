import { RPPS_BENEFICIO, TABELA_RPPS } from '$lib/data/tabela-2026';
import { mesIndiceAposentadoria } from './aposentadoria';
import { indiceMes } from './progressao';
import { fatorTeto, tetoRgps } from './reajuste';
import type { Parametros } from './tipos';

// Margem evita que meio centavo vire 0,4999… em ponto flutuante (ex.: 1.621,00 × 7,5% = 121,575).
const arredondar = (valor: number): number => Math.round(valor * 100 + 1e-6) / 100;

// Cada faixa é arredondada separadamente: assim o PSSS sobre o teto dá 988,10, como na folha do Senado.
// `fator` reajusta as faixas junto com o teto (mesma portaria anual).
export function contribuicaoRpps(base: number, fator = 1): number {
	let total = 0;
	let inferior = 0;
	for (const [limiteBase, aliquota] of TABELA_RPPS) {
		const limite = limiteBase === Infinity ? Infinity : arredondar(limiteBase * fator);
		if (base <= inferior) break;
		total += arredondar((Math.min(base, limite) - inferior) * aliquota);
		inferior = limite;
	}
	return arredondar(total);
}

// EC 103, art. 11 §4º: a alíquota é definida pelo total do benefício, mas incide só sobre o que excede o teto.
export function contribuicaoAposentado(proventos: number, params: Parametros, ano: number): number {
	const teto = tetoRgps(params, ano);
	if (proventos <= teto) return 0;
	const aliquotaEfetiva = contribuicaoRpps(proventos, fatorTeto(params, ano)) / proventos;
	return arredondar((proventos - teto) * aliquotaEfetiva);
}

export function anosDeContribuicao(params: Parametros): number {
	const [anoPosse, mesPosse] = params.dataPosse.split('-').map(Number);
	const meses = mesIndiceAposentadoria(params) - indiceMes(anoPosse, mesPosse);
	return meses / 12 + params.contribuicaoAnteriorPolicial + params.contribuicaoAnteriorOutra;
}

export function percentualBeneficioRpps(params: Parametros): number {
	if (params.percentualRppsInformado) return params.percentualRppsInformado;
	const { base, porAno, anosSemAcrescimo } = RPPS_BENEFICIO;
	const anosExcedentes = Math.max(0, Math.floor(anosDeContribuicao(params)) - anosSemAcrescimo);
	return Math.min(1, base + porAno * anosExcedentes);
}

// Quem contribui sempre no teto tem como média a média dos tetos dos anos de contribuição.
function mediaDosTetos(params: Parametros): number {
	const [anoPosse] = params.dataPosse.split('-').map(Number);
	const ultimoAno = Math.floor((mesIndiceAposentadoria(params) - 1) / 12);
	let soma = 0;
	for (let ano = anoPosse; ano <= ultimoAno; ano++) soma += tetoRgps(params, ano);
	return soma / (ultimoAno - anoPosse + 1);
}

/**
 * Benefício do RPPS no regime complementar, na concessão: percentual da média, limitada ao teto
 * do ano da aposentadoria. Depois é reajustado pelo índice do RGPS (sem paridade), ver `inatividade.ts`.
 */
export function beneficioRppsComplementar(params: Parametros): number {
	const anoAposentadoria = Math.floor(mesIndiceAposentadoria(params) / 12);
	const teto = tetoRgps(params, anoAposentadoria);
	const media = Math.min(params.mediaRppsInformada || mediaDosTetos(params), teto);
	return arredondar(media * percentualBeneficioRpps(params));
}
