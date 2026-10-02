import { describe, expect, it } from 'vitest';
import { calcularDecimoTerceiro, calcularFolha } from './folha';
import { fatorRenda, projetarFunpresp } from './funpresp';
import { PARAMETROS_PADRAO as params } from './padrao';
import { indiceMes } from './progressao';

const OUT_2026 = indiceMes(2026, 10);

describe('Funpresp: acumulação', () => {
	it('primeiro ano: participante + contrapartida igual, menos FCBE (2,5%) e carregamento (6,5%)', () => {
		const [primeiro] = projetarFunpresp(params, 0, OUT_2026).saldosAnuais;
		const mensal = calcularFolha(21, params).funpresp;
		const decimo = calcularDecimoTerceiro(21, params).funpresp; // posse em janeiro: ano completo
		expect(primeiro.ano).toBe(2022);
		expect(primeiro.saldo).toBeCloseTo(2 * (12 * mensal + decimo) * (1 - 0.025 - 0.065), 1);
	});

	it('com saldo informado, parte dele no mês atual e ignora o histórico', () => {
		const simulado = projetarFunpresp(params, 0, OUT_2026);
		const doZeroHoje = projetarFunpresp({ ...params, saldoFunpresp: 0 }, 0, OUT_2026);
		const comSaldo = projetarFunpresp({ ...params, saldoFunpresp: 100000 }, 0, OUT_2026);
		expect(doZeroHoje.saldosAnuais[0].ano).toBe(2026);
		expect(doZeroHoje.saldoNaAposentadoria).toBeLessThan(simulado.saldoNaAposentadoria);
		expect(comSaldo.saldoNaAposentadoria).toBeCloseTo(doZeroHoje.saldoNaAposentadoria + 100000, 0);
	});

	it('composição: participante = União; aportes − custos + rendimentos = saldo', () => {
		const { composicao: c, saldoNaAposentadoria } = projetarFunpresp(params, 0.04, OUT_2026);
		expect(c.uniao).toBe(c.participante);
		expect(c.custos).toBeGreaterThan(0);
		expect(c.saldoInicial + c.participante + c.uniao - c.custos + c.rendimentos).toBeCloseTo(saldoNaAposentadoria, 0);
	});

	it('saldo hoje: simulado até o mês anterior, ou o informado; na inatividade o saldo zera no fim do prazo', () => {
		const simulado = projetarFunpresp(params, 0, OUT_2026);
		const set2026 = simulado.saldosAnuais.find((s) => s.ano === 2025)!.saldo;
		expect(simulado.saldoHoje).toBeGreaterThan(set2026);
		expect(projetarFunpresp({ ...params, saldoFunpresp: 123456 }, 0.04, OUT_2026).saldoHoje).toBe(123456);
		const r = projetarFunpresp(params, 0.04, OUT_2026);
		expect(r.saldosNaInatividade[0].saldo).toBeLessThan(r.saldoNaAposentadoria * 1.04);
		expect(r.saldosNaInatividade.at(-1)?.saldo).toBe(0);
	});

	it('rentabilidade maior gera saldo maior', () => {
		const pessimista = projetarFunpresp(params, 0.02, OUT_2026).saldoNaAposentadoria;
		const otimista = projetarFunpresp(params, 0.06, OUT_2026).saldoNaAposentadoria;
		expect(otimista).toBeGreaterThan(pessimista);
	});
});

describe('Funpresp: renda', () => {
	it('fator de renda é a anuidade mensal postecipada', () => {
		const i = 1.04 ** (1 / 12) - 1;
		expect(fatorRenda(324, 0.04)).toBeCloseTo((1 - (1 + i) ** -324) / i, 8);
		expect(fatorRenda(120, 0)).toBe(120);
	});

	it('renda inicial = saldo / fator; constante quando a rentabilidade iguala a taxa atuarial', () => {
		const r = projetarFunpresp(params, 0.04, OUT_2026);
		const prazo = 27 * 12;
		expect(r.rendaInicial).toBeCloseTo(r.saldoNaAposentadoria / fatorRenda(prazo, 0.04), 1);
		const temporarias = r.rendasMensais.slice(0, prazo);
		expect(Math.max(...temporarias) - Math.min(...temporarias)).toBeLessThan(0.05);
	});

	it('após o prazo paga 80% vitalício; rentabilidade acima da atuarial faz a renda crescer nos recálculos', () => {
		// aposentadoria aos 67 (01/2052) + 27 anos de prazo: o horizonte precisa passar dos 94
		const r = projetarFunpresp({ ...params, idadeHorizonte: 100 }, 0.06, OUT_2026);
		const prazo = 27 * 12;
		expect(r.rendasMensais[prazo]).toBe(r.rendaSobrevivencia);
		expect(r.rendaSobrevivencia).toBeCloseTo(r.rendasMensais[prazo - 1] * 0.8, 1);
		expect(r.rendasMensais[prazo - 1]).toBeGreaterThan(r.rendaInicial);
		// uma renda por mês até a idade-horizonte (100 anos; nascimento 01/1985 → 01/2085)
		expect(r.rendasMensais.length).toBe(indiceMes(2085, 1) - indiceMes(2052, 1));
	});
});
