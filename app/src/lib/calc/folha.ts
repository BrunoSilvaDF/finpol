import {
	AUXILIO_ALIMENTACAO,
	GAL,
	GR,
	PERCENTUAL_ESPECIALIZACAO_MAXIMO,
	PERCENTUAL_GDAE,
	PERCENTUAL_PERICULOSIDADE,
	VENCIMENTO_POR_PADRAO,
	VPI
} from '$lib/data/tabela-2026';
import { calcularIrpf } from './irpf';
import { ANO_BASE, fatorSalario, fatorTeto, outrosDescontosNoAno, tetoRgps } from './reajuste';
import { contribuicaoRpps } from './rpps';
import type { Folha, Parametros } from './tipos';

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;
// A folha do Senado trunca os centavos das rubricas percentuais (ex.: 26% de 7.446,65 = 1.936,12).
const truncar = (valor: number): number => Math.floor(valor * 100 + 1e-6) / 100;

export interface Contribuicoes {
	psss: number;
	funpresp: number;
}

// Complementar: RPPS só até o teto e Funpresp sobre o excedente. Integralidade: RPPS sobre tudo.
export function calcularContribuicoes(base: number, params: Parametros, ano: number = ANO_BASE): Contribuicoes {
	const fator = fatorTeto(params, ano);
	if (params.regime === 'integralidade') return { psss: contribuicaoRpps(base, fator), funpresp: 0 };
	const teto = tetoRgps(params, ano);
	return {
		psss: contribuicaoRpps(Math.min(base, teto), fator),
		funpresp: arredondar(Math.max(0, base - teto) * params.aliquotaFunpresp)
	};
}

/** Ano da competência (define teto e reajuste salarial) e valores eventuais tributáveis (ex.: 1/3 de férias). */
export interface Competencia {
	ano?: number;
	tributaveis?: number;
}

export function calcularFolha(padrao: number, params: Parametros, { ano = ANO_BASE, tributaveis = 0 }: Competencia = {}): Folha {
	const reajustar = (valor: number): number => arredondar(valor * fatorSalario(params, ano));
	const vencimento = reajustar(VENCIMENTO_POR_PADRAO[padrao]);
	const [gal, gr, vpi, auxilioAlimentacao] = [GAL, GR, VPI, AUXILIO_ALIMENTACAO].map(reajustar);
	const especializacaoPct = Math.min(params.especializacao, PERCENTUAL_ESPECIALIZACAO_MAXIMO);
	const gdae = truncar(vencimento * PERCENTUAL_GDAE);
	const especializacao = truncar(vencimento * especializacaoPct);
	const periculosidade = truncar(vencimento * PERCENTUAL_PERICULOSIDADE);

	// Periculosidade e auxílio não compõem a base de contribuição (Lei 10.887, art. 4º; conferido em folhas reais, nos dois regimes).
	const baseContribuicao = vencimento + gal + gr + gdae + especializacao + vpi;
	const { psss, funpresp } = calcularContribuicoes(baseContribuicao, params, ano);

	const tributavel = baseContribuicao + periculosidade + tributaveis;
	const irpf = calcularIrpf(tributavel, psss + funpresp, params.dependentesIr);
	const bruto = arredondar(tributavel + auxilioAlimentacao);
	const outrosDescontos = outrosDescontosNoAno(params, ano);
	const liquido = arredondar(bruto - psss - funpresp - irpf - outrosDescontos);

	return {
		ano,
		teto: tetoRgps(params, ano),
		padrao,
		vencimento,
		gal,
		gr,
		gdae,
		especializacao,
		vpi,
		periculosidade,
		auxilioAlimentacao,
		bruto,
		psss,
		funpresp,
		irpf,
		outrosDescontos,
		liquido
	};
}

/** Remuneração do cargo sem periculosidade e sem auxílio: base da previdência e do provento integral. */
export const baseDeContribuicao = (folha: Folha): number => arredondar(folha.bruto - folha.auxilioAlimentacao - folha.periculosidade);

export interface Verba {
	bruto: number;
	liquido: number;
}

export interface DecimoTerceiro extends Verba, Contribuicoes {}

/**
 * 13º: mesma base remuneratória, sem auxílio-alimentação, com IR exclusivo na fonte.
 * `fracao` = avos/12, para os anos incompletos (posse e aposentadoria).
 */
export function calcularDecimoTerceiro(padrao: number, params: Parametros, fracao = 1, ano: number = ANO_BASE): DecimoTerceiro {
	const folha = calcularFolha(padrao, params, { ano });
	const bruto = arredondar((folha.bruto - folha.auxilioAlimentacao) * fracao);
	const { psss, funpresp } = calcularContribuicoes(baseDeContribuicao(folha) * fracao, params, ano);
	const irpf = calcularIrpf(bruto, psss + funpresp, params.dependentesIr);
	return { bruto, liquido: arredondar(bruto - psss - funpresp - irpf), psss, funpresp };
}
