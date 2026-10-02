import { describe, expect, it } from 'vitest';
import { compararRegimes } from './comparativo';
import { projetarFunpresp } from './funpresp';
import { projetarInatividade, proventoIntegral } from './inatividade';
import { PARAMETROS_PADRAO as params } from './padrao';
import { indiceMes } from './progressao';
import { anosDeContribuicao, beneficioRppsComplementar, contribuicaoAposentado, percentualBeneficioRpps } from './rpps';

const OUT_2026 = indiceMes(2026, 10);

describe('RPPS na aposentadoria', () => {
	it('60% + 2% por ano acima de 20: 30 anos de contribuição → 80% do teto', () => {
		expect(anosDeContribuicao(params)).toBe(30);
		expect(percentualBeneficioRpps(params)).toBeCloseTo(0.8, 10);
		expect(beneficioRppsComplementar(params)).toBe(6780.44);
	});

	it('percentual e média informados substituem a regra', () => {
		expect(beneficioRppsComplementar({ ...params, percentualRppsInformado: 1, mediaRppsInformada: 7000 })).toBe(7000);
		expect(beneficioRppsComplementar({ ...params, mediaRppsInformada: 20000 })).toBe(6780.44); // limitada ao teto
	});

	it('aposentado contribui só sobre o que excede o teto, com a alíquota efetiva do total', () => {
		expect(contribuicaoAposentado(8000, params, 2026)).toBe(0);
		// 35.398,06: tabela dá 5.468,77 (15,449%) aplicada a 26.922,51
		expect(contribuicaoAposentado(35398.06, params, 2026)).toBeCloseTo(4159.33, 1);
	});
});

describe('renda do aposentado', () => {
	it('integralidade: provento = remuneração do cargo no padrão 36, sem periculosidade e auxílio', () => {
		expect(proventoIntegral(params)).toBe(35398.06);
		const { inicial } = projetarInatividade(params, 'integralidade', null);
		expect(inicial.contribuicao).toBeCloseTo(4159.33, 1);
		expect(inicial.irpf).toBeCloseTo(7681.92, 1);
		expect(inicial.liquido).toBeCloseTo(35398.06 - 4159.33 - 7681.92 - 730, 0);
	});

	it('complementar progressiva: IR sobre RPPS + Funpresp; regressiva: tabela só no RPPS + 10% da Funpresp', () => {
		const funpresp = projetarFunpresp(params, 0.04, OUT_2026);
		const progressiva = projetarInatividade(params, 'complementar', funpresp).inicial;
		const regressiva = projetarInatividade({ ...params, tributacaoFunpresp: 'regressiva' }, 'complementar', funpresp).inicial;
		expect(progressiva.rpps).toBe(6780.44);
		expect(progressiva.funpresp).toBe(funpresp.rendaInicial);
		expect(progressiva.contribuicao).toBe(0);
		// IR do RPPS sozinho = 880,04 (27,5% − 908,73 − redutor da Lei 15.270)
		expect(regressiva.irpf).toBeCloseTo(880.04 + funpresp.rendaInicial * 0.1, 1);
		expect(progressiva.irpf).toBeGreaterThan(regressiva.irpf);
	});

	it('série anual vai da aposentadoria à idade-horizonte; ano de início incompleto é proporcional', () => {
		const { linhas } = projetarInatividade(params, 'integralidade', null);
		expect(linhas[0]).toMatchObject({ ano: 2052, mesesAposentado: 12, idade: 67 });
		expect(linhas.at(-1)?.ano).toBe(2074); // horizonte: 90 anos em 01/2075 (exclusivo)
		const tardia = projetarInatividade({ ...params, mesNascimento: 6, idadeAposentadoriaInformada: 67 }, 'integralidade', null);
		expect(tardia.linhas[0]).toMatchObject({ ano: 2052, mesesAposentado: 7 });
	});
});

describe('comparativo', () => {
	const c = compararRegimes(params, OUT_2026);

	it('na ativa o complementar rende mais líquido', () => {
		expect(c.liquidoAtiva.complementar).toBeGreaterThan(c.liquidoAtiva.integralidade);
	});

	it('cenários de rentabilidade ordenam a renda inicial da Funpresp', () => {
		const renda = (cenario: 'pessimista' | 'base' | 'otimista') => c.complementar[cenario].funpresp.rendaInicial;
		expect(renda('pessimista')).toBeLessThan(renda('base'));
		expect(renda('base')).toBeLessThan(renda('otimista'));
	});

	it('investir a diferença: com juros zero, o saldo é a soma das diferenças da ativa', () => {
		const semJuros = compararRegimes({ ...params, rentabilidades: { pessimista: 0, base: 0, otimista: 0 } }, OUT_2026);
		const { investimento } = semJuros.complementar.base;
		expect(investimento.saldoNaAposentadoria).toBeCloseTo(semJuros.liquidoAtiva.complementar - semJuros.liquidoAtiva.integralidade, 0);
		expect(investimento.totalAportado).toBeCloseTo(investimento.saldoNaAposentadoria, 0);
	});

	it('investir a diferença: saque zera o saldo no horizonte e entra na média do complementar', () => {
		const { investimento } = c.complementar.base;
		expect(investimento.saldoNaAposentadoria).toBeGreaterThan(investimento.totalAportado); // rendeu 4% real
		expect(investimento.mediaComplementarInvestindo).toBeCloseTo(investimento.mediaComplementar + investimento.saqueMensal, 1);
		expect(investimento.vantagemMensal).toBeCloseTo(investimento.mediaComplementarInvestindo - investimento.mediaIntegralidade, 1);
	});

	it('investimento informado: aplica o valor fixo todo mês ativo, sem mudar a diferença de referência', () => {
		const zero = { rentabilidades: { pessimista: 0, base: 0, otimista: 0 } };
		const padrao = compararRegimes({ ...params, ...zero }, OUT_2026).complementar.base.investimento;
		const fixo = compararRegimes({ ...params, ...zero, aporteMensalInvestimento: 3000 }, OUT_2026).complementar.base.investimento;
		expect(fixo).toMatchObject({ aporteInformado: true, aporteMensalMedio: 3000, totalAportado: 3000 * 360 });
		expect(fixo.saldoNaAposentadoria).toBeCloseTo(3000 * 360, 0);
		expect(fixo.diferencaMensalMedia).toBe(padrao.diferencaMensalMedia);
		expect(padrao.aporteInformado).toBe(false);
		expect(padrao.aporteMensalMedio).toBe(padrao.diferencaMensalMedia);
	});

	it('aporte para empatar: investir esse valor por mês zera a desvantagem (juros zero)', () => {
		const p = { ...params, rentabilidades: { pessimista: 0, base: 0, otimista: 0 } };
		const r = compararRegimes(p, OUT_2026).complementar.base;
		const mesesAtivos = 30 * 12; // 01/2022 a 12/2051
		const mesesAposentado = r.inatividade.linhas.reduce((s, l) => s + l.mesesAposentado, 0);
		const falta = r.investimento.mediaIntegralidade - r.investimento.mediaComplementar;
		expect(r.investimento.aporteMensalParaEmpatar * mesesAtivos).toBeCloseTo(falta * mesesAposentado, -1);
	});

	it('ponto de equilíbrio, quando existe, cai na aposentadoria', () => {
		for (const { anoEquilibrio } of Object.values(c.complementar)) {
			if (anoEquilibrio !== null) expect(anoEquilibrio).toBeGreaterThanOrEqual(2052);
		}
	});
});
