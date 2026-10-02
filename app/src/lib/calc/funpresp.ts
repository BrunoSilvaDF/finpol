import { FUNPRESP_CARREGAMENTO, FUNPRESP_FCBE, FUNPRESP_PERCENTUAL_SOBREVIVENCIA } from '$lib/data/tabela-2026';
import { mesIndiceAposentadoria } from './aposentadoria';
import { calcularDecimoTerceiro, calcularFolha } from './folha';
import { indiceMes, padraoEm } from './progressao';
import type { Parametros } from './tipos';

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;
const taxaMensal = (anual: number): number => (1 + anual) ** (1 / 12) - 1;

export interface SaldoAnual {
	ano: number;
	saldo: number;
}

/** De onde vem o saldo na aposentadoria: aportes, custos do plano e rendimentos. */
export interface ComposicaoSaldo {
	/** saldo informado do extrato (0 quando simulado desde a posse) */
	saldoInicial: number;
	participante: number;
	/** contrapartida paritária da União */
	uniao: number;
	/** FCBE e taxa de carregamento descontados das contribuições */
	custos: number;
	rendimentos: number;
}

export interface CenarioFunpresp {
	/** saldo da conta individual (RAP) em dezembro de cada ano ativo, ou no último mês ativo */
	saldosAnuais: SaldoAnual[];
	/** saldo no fim de cada ano da fase de renda temporária, até zerar */
	saldosNaInatividade: SaldoAnual[];
	/** saldo no mês anterior ao atual (ou o informado do extrato) */
	saldoHoje: number;
	saldoNaAposentadoria: number;
	composicao: ComposicaoSaldo;
	rendaInicial: number;
	/** índice (`indiceMes`) do primeiro mês do Benefício por Sobrevivência */
	inicioSobrevivencia: number;
	rendaSobrevivencia: number;
	/** renda de cada mês, da aposentadoria até a idade-horizonte */
	rendasMensais: number[];
}

function carregamento(anoDePlano: number): number {
	const { inicial, final, anos } = FUNPRESP_CARREGAMENTO;
	return inicial - ((inicial - final) * Math.min(anoDePlano, anos)) / anos;
}

/** Fator de conversão de saldo em renda: anuidade mensal postecipada (Regulamento, art. 21 §1º). */
export function fatorRenda(meses: number, taxaAtuarialAnual: number): number {
	const i = taxaMensal(taxaAtuarialAnual);
	return i === 0 ? meses : (1 - (1 + i) ** -meses) / i;
}

function mesesAtivosNoAno(ano: number, posse: number, aposentadoria: number): number {
	return Math.max(0, Math.min(aposentadoria, indiceMes(ano, 12) + 1) - Math.max(posse, indiceMes(ano, 1)));
}

// Contribuição do participante + contrapartida igual da União, menos FCBE e carregamento.
function aporteDoMes(indice: number, params: Parametros, posse: number, aposentadoria: number): { participante: number; liquido: number } {
	const ano = Math.floor(indice / 12);
	const mes = (indice % 12) + 1;
	const padrao = padraoEm(params, ano, mes);
	let contribuicao = calcularFolha(padrao, params, { ano }).funpresp;
	if (mes === 12 || indice === aposentadoria - 1) {
		const fracao = mesesAtivosNoAno(ano, posse, aposentadoria) / 12;
		contribuicao += calcularDecimoTerceiro(padrao, params, fracao, ano).funpresp;
	}
	const anoDePlano = Math.floor((indice - posse) / 12);
	return { participante: contribuicao, liquido: 2 * contribuicao * (1 - FUNPRESP_FCBE - carregamento(anoDePlano)) };
}

function acumular(params: Parametros, rentabilidade: number, mesAtual: number, posse: number, aposentadoria: number) {
	const juros = taxaMensal(rentabilidade);
	const informado = params.saldoFunpresp !== null && params.saldoFunpresp !== undefined;
	const saldoInicial = informado ? params.saldoFunpresp! : 0;
	let saldo = saldoInicial;
	let saldoHoje = informado || mesAtual <= posse ? saldoInicial : 0;
	let participante = 0;
	let liquidoAportado = 0;
	const saldosAnuais: SaldoAnual[] = [];
	for (let indice = informado ? Math.max(mesAtual, posse) : posse; indice < aposentadoria; indice++) {
		const aporte = aporteDoMes(indice, params, posse, aposentadoria);
		saldo = saldo * (1 + juros) + aporte.liquido;
		participante += aporte.participante;
		liquidoAportado += aporte.liquido;
		if (indice === mesAtual - 1) saldoHoje = saldo;
		if (indice % 12 === 11 || indice === aposentadoria - 1) saldosAnuais.push({ ano: Math.floor(indice / 12), saldo: arredondar(saldo) });
	}
	const composicao: ComposicaoSaldo = {
		saldoInicial,
		participante: arredondar(participante),
		uniao: arredondar(participante),
		custos: arredondar(2 * participante - liquidoAportado),
		rendimentos: arredondar(saldo - saldoInicial - liquidoAportado)
	};
	return { saldo, saldosAnuais, saldoHoje: arredondar(saldoHoje), composicao };
}

// Renda temporária pelo prazo da expectativa de sobrevida, recalculada todo janeiro com o saldo e o
// prazo restantes (art. 21 §3º); depois, Benefício por Sobrevivência vitalício de 80% (art. 25).
function pagar(saldoInicial: number, params: Parametros, rentabilidade: number, aposentadoria: number, horizonte: number) {
	const juros = taxaMensal(rentabilidade);
	const prazo = Math.round(params.expectativaSobrevida * 12);
	let saldo = saldoInicial;
	let renda = saldoInicial / fatorRenda(prazo, params.taxaAtuarial);
	const rendaInicial = renda;
	const rendasMensais: number[] = [];
	const saldosNaInatividade: SaldoAnual[] = [];
	for (let k = 0; k < prazo; k++) {
		const indice = aposentadoria + k;
		if (k > 0 && indice % 12 === 0) renda = saldo / fatorRenda(prazo - k, params.taxaAtuarial);
		saldo = saldo * (1 + juros) - renda;
		if (indice < horizonte) rendasMensais.push(arredondar(renda));
		// Na última parcela o saldo zera; o resíduo de arredondamento não é exibido.
		if (indice % 12 === 11 || k === prazo - 1) saldosNaInatividade.push({ ano: Math.floor(indice / 12), saldo: k === prazo - 1 ? 0 : arredondar(saldo) });
	}
	const rendaSobrevivencia = arredondar(renda * FUNPRESP_PERCENTUAL_SOBREVIVENCIA);
	for (let indice = aposentadoria + prazo; indice < horizonte; indice++) rendasMensais.push(rendaSobrevivencia);
	return { rendaInicial: arredondar(rendaInicial), inicioSobrevivencia: aposentadoria + prazo, rendaSobrevivencia, rendasMensais, saldosNaInatividade };
}

/** Projeção da conta Funpresp (sempre no regime complementar) para uma rentabilidade real anual. */
export function projetarFunpresp(params: Parametros, rentabilidade: number, mesAtual: number): CenarioFunpresp {
	const complementar: Parametros = { ...params, regime: 'complementar' };
	const [anoPosse, mesPosse] = params.dataPosse.split('-').map(Number);
	const posse = indiceMes(anoPosse, mesPosse);
	const aposentadoria = mesIndiceAposentadoria(params);
	const horizonte = indiceMes(params.anoNascimento + params.idadeHorizonte, params.mesNascimento);
	const { saldo, saldosAnuais, saldoHoje, composicao } = acumular(complementar, rentabilidade, mesAtual, posse, aposentadoria);
	return {
		saldosAnuais,
		saldoHoje,
		composicao,
		saldoNaAposentadoria: arredondar(saldo),
		...pagar(saldo, params, rentabilidade, aposentadoria, horizonte)
	};
}
