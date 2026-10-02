import { describe, expect, it } from 'vitest';
import { calcularFolha } from './folha';
import { beneficioRppsNoAno, calcularRendaAposentado, proventoIntegral } from './inatividade';
import { PARAMETROS_PADRAO as params } from './padrao';
import { tetoRgps } from './reajuste';
import { beneficioRppsComplementar } from './rpps';

const tetoMaisUm = { ...params, reajusteRealTeto: 0.01 };
const salarioMenosUm = { ...params, reajusteRealSalarios: -0.01 };

describe('teto do RGPS por ano', () => {
	it('até 2026 vale o teto de 2026; depois cresce pelo reajuste real', () => {
		expect(tetoRgps(tetoMaisUm, 2023)).toBe(8475.55);
		expect(tetoRgps(tetoMaisUm, 2026)).toBe(8475.55);
		expect(tetoRgps(tetoMaisUm, 2030)).toBeCloseTo(8475.55 * 1.01 ** 4, 2);
	});

	it('com reajuste real zero, a folha de qualquer ano é igual à de 2026', () => {
		expect(calcularFolha(30, params, { ano: 2040 })).toEqual({ ...calcularFolha(30, params), ano: 2040 });
	});

	it('Funpresp incide sobre o que passa do teto do ano; PSSS acompanha as faixas reajustadas', () => {
		const folha = calcularFolha(24, tetoMaisUm, { ano: 2030 });
		const base = folha.bruto - folha.auxilioAlimentacao - folha.periculosidade;
		expect(folha.teto).toBeCloseTo(8475.55 * 1.01 ** 4, 2);
		expect(folha.funpresp).toBeCloseTo((base - folha.teto) * 0.085, 1);
		expect(folha.psss).toBeGreaterThan(988.1);
	});
});

describe('salários por ano', () => {
	it('perda real de 1% ao ano reduz todas as parcelas a partir de 2027', () => {
		const folha = calcularFolha(24, salarioMenosUm, { ano: 2030 });
		expect(folha.vencimento).toBeCloseTo(7446.65 * 0.99 ** 4, 2);
		expect(folha.gal).toBeCloseTo(14951.97 * 0.99 ** 4, 2);
		expect(calcularFolha(24, salarioMenosUm, { ano: 2026 }).vencimento).toBe(7446.65);
	});
});

describe('outros descontos', () => {
	it('plano de saúde etc. sobem pelo reajuste real a partir de 2027, na ativa e na aposentadoria', () => {
		const p = { ...params, reajusteRealOutrosDescontos: 0.03 };
		expect(calcularFolha(24, p, { ano: 2026 }).outrosDescontos).toBe(730);
		expect(calcularFolha(24, p, { ano: 2036 }).outrosDescontos).toBeCloseTo(730 * 1.03 ** 10, 2);
		const ativa = calcularFolha(24, params, { ano: 2036 });
		expect(calcularFolha(24, p, { ano: 2036 }).liquido).toBeCloseTo(ativa.liquido - (730 * 1.03 ** 10 - 730), 1);
		expect(calcularRendaAposentado(6780.44, 0, p, 2060).outrosDescontos).toBeCloseTo(730 * 1.03 ** 34, 2);
	});
});

describe('benefícios reajustados', () => {
	it('complementar: média dos tetos limitada ao teto da concessão e reajuste pelo índice do RGPS depois', () => {
		const concessao = beneficioRppsComplementar(tetoMaisUm); // aposentadoria em 01/2052
		expect(concessao).toBeLessThan(tetoRgps(tetoMaisUm, 2052) * 0.8);
		expect(beneficioRppsNoAno(tetoMaisUm, 'complementar', 2062)).toBeCloseTo(concessao * 1.01 ** 10, 0);
	});

	it('integralidade: provento acompanha os salários (paridade)', () => {
		const provento = proventoIntegral(salarioMenosUm); // último salário: 12/2051
		expect(beneficioRppsNoAno(salarioMenosUm, 'integralidade', 2051)).toBeCloseTo(provento, 2);
		expect(beneficioRppsNoAno(salarioMenosUm, 'integralidade', 2061)).toBeCloseTo(provento * 0.99 ** 10, 0);
	});
});
