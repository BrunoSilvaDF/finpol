import { TETO_RGPS } from '$lib/data/tabela-2026';
import type { Parametros } from './tipos';

// Ano da tabela de remunerações e do teto usados como base (ADR-001: valores em reais de 2026).
export const ANO_BASE = 2026;

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;
const anosAposBase = (ano: number): number => Math.max(0, ano - ANO_BASE);

/**
 * Teto e faixas do RPPS são reajustados todo janeiro pelo INPC (Lei 8.212, art. 20 §1º).
 * Em reais de 2026, só o ganho real (INPC − IPCA) altera o valor (ADR-002).
 */
export const fatorTeto = (params: Parametros, ano: number): number => (1 + params.reajusteRealTeto) ** anosAposBase(ano);

/** Ganho (ou perda) real dos salários do Senado em relação à inflação, a partir de 2027. */
export const fatorSalario = (params: Parametros, ano: number): number => (1 + params.reajusteRealSalarios) ** anosAposBase(ano);

/** Plano de saúde, sindicato e associações no ano, com o reajuste real informado. */
export const outrosDescontosNoAno = (params: Parametros, ano: number): number =>
	arredondar(params.outrosDescontos * (1 + params.reajusteRealOutrosDescontos) ** anosAposBase(ano));

export const tetoRgps = (params: Parametros, ano: number): number => arredondar(TETO_RGPS * fatorTeto(params, ano));
