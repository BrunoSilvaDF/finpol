import { IR_REGRESSIVO_FUNPRESP } from '$lib/data/tabela-2026';
import { mesIndiceAposentadoria } from './aposentadoria';
import { baseDeContribuicao, calcularFolha } from './folha';
import { type CenarioFunpresp } from './funpresp';
import { calcularIrpf } from './irpf';
import { indiceMes, padraoEm } from './progressao';
import { fatorSalario, fatorTeto, outrosDescontosNoAno } from './reajuste';
import { beneficioRppsComplementar, contribuicaoAposentado } from './rpps';
import type { Parametros, Regime } from './tipos';

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;

/** Composição de um mês de aposentadoria. */
export interface RendaAposentado {
	/** benefício RPPS (complementar) ou provento integral (integralidade) */
	rpps: number;
	funpresp: number;
	bruto: number;
	contribuicao: number;
	irpf: number;
	outrosDescontos: number;
	liquido: number;
}

export interface LinhaInativa {
	ano: number;
	idade: number;
	mesesAposentado: number;
	/** composição do último mês do ano (ou do mês de horizonte) */
	mensal: RendaAposentado;
	decimoTerceiroLiquido: number;
	liquidoAnual: number;
}

export interface ProjecaoInatividade {
	regime: Regime;
	inicial: RendaAposentado;
	linhas: LinhaInativa[];
}

/** Provento integral: remuneração do cargo no último padrão, sem periculosidade e sem auxílio. */
export function proventoIntegral(params: Parametros): number {
	const ultimoMesAtivo = mesIndiceAposentadoria(params) - 1;
	const ano = Math.floor(ultimoMesAtivo / 12);
	const padrao = padraoEm(params, ano, (ultimoMesAtivo % 12) + 1);
	return baseDeContribuicao(calcularFolha(padrao, params, { ano }));
}

/**
 * Benefício do RPPS no ano: o valor da concessão reajustado depois dela. Complementar: pelo índice
 * do RGPS, como o teto (sem paridade). Integralidade: junto com os salários da ativa (paridade).
 */
export function beneficioRppsNoAno(params: Parametros, regime: Regime, ano: number): number {
	const anoConcessao = Math.floor(mesIndiceAposentadoria(params) / 12);
	if (regime === 'complementar') {
		return arredondar((beneficioRppsComplementar(params) * fatorTeto(params, ano)) / fatorTeto(params, anoConcessao));
	}
	const ultimoAnoAtivo = Math.floor((mesIndiceAposentadoria(params) - 1) / 12);
	return arredondar((proventoIntegral(params) * fatorSalario(params, ano)) / fatorSalario(params, ultimoAnoAtivo));
}

export function calcularRendaAposentado(rpps: number, funpresp: number, params: Parametros, ano: number): RendaAposentado {
	const contribuicao = contribuicaoAposentado(rpps, params, ano);
	// Regressiva: a renda Funpresp sai da tabela progressiva e paga alíquota própria, na fonte.
	const regressiva = params.tributacaoFunpresp === 'regressiva';
	const tributavelProgressivo = regressiva ? rpps : rpps + funpresp;
	const irpf = arredondar(
		calcularIrpf(tributavelProgressivo, contribuicao, params.dependentesIr) + (regressiva ? funpresp * IR_REGRESSIVO_FUNPRESP : 0)
	);
	const bruto = arredondar(rpps + funpresp);
	return {
		rpps,
		funpresp,
		bruto,
		contribuicao,
		irpf,
		outrosDescontos: outrosDescontosNoAno(params, ano),
		liquido: arredondar(bruto - contribuicao - irpf - outrosDescontosNoAno(params, ano))
	};
}

// O 13º do aposentado incide só sobre o benefício do RPPS (a Funpresp paga 12 parcelas), com IR exclusivo.
function decimoTerceiroLiquido(rpps: number, fracao: number, params: Parametros, ano: number): number {
	const bruto = arredondar(rpps * fracao);
	const contribuicao = arredondar(contribuicaoAposentado(rpps, params, ano) * fracao);
	return arredondar(bruto - contribuicao - calcularIrpf(bruto, contribuicao, params.dependentesIr));
}

/**
 * Inatividade de um regime, da aposentadoria até a idade-horizonte, em reais de 2026.
 * No complementar, `funpresp` traz a renda mensal do cenário de rentabilidade escolhido.
 */
export function projetarInatividade(params: Parametros, regime: Regime, funpresp: CenarioFunpresp | null): ProjecaoInatividade {
	const aposentadoria = mesIndiceAposentadoria(params);
	const rendas = funpresp?.rendasMensais ?? [];
	const horizonte = indiceMes(params.anoNascimento + params.idadeHorizonte, params.mesNascimento);
	const doMes = (indice: number): RendaAposentado => {
		const ano = Math.floor(indice / 12);
		return calcularRendaAposentado(beneficioRppsNoAno(params, regime, ano), rendas[indice - aposentadoria] ?? 0, params, ano);
	};

	const linhas: LinhaInativa[] = [];
	for (let ano = Math.floor(aposentadoria / 12); ano * 12 < horizonte; ano++) {
		const inicio = Math.max(aposentadoria, ano * 12);
		const fim = Math.min(horizonte, ano * 12 + 12);
		let liquidoMeses = 0;
		for (let indice = inicio; indice < fim; indice++) liquidoMeses += doMes(indice).liquido;
		const meses = fim - inicio;
		const decimo = decimoTerceiroLiquido(beneficioRppsNoAno(params, regime, ano), meses / 12, params, ano);
		linhas.push({
			ano,
			idade: ano - params.anoNascimento,
			mesesAposentado: meses,
			mensal: doMes(fim - 1),
			decimoTerceiroLiquido: decimo,
			liquidoAnual: arredondar(liquidoMeses + decimo)
		});
	}
	return { regime, inicial: doMes(aposentadoria), linhas };
}
