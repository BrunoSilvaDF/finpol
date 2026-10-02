import { describe, expect, it } from 'vitest';
import { anoAposentadoria } from './aposentadoria';
import { calcularDecimoTerceiro, calcularFolha } from './folha';
import { PARAMETROS_PADRAO as params } from './padrao';
import { anoPadraoMaximo, padraoEm } from './progressao';
import { calcularMarcos, projetar } from './projecao';

// Padrões: posse em 01/2022 no P21, progressão em janeiro, nascimento em 01/1985, sem contribuição anterior.

describe('folha', () => {
	// Âncora: técnico P24 com 26% de especialização, conferido ao centavo com folha real do Senado (2026).
	it('reproduz a folha de um técnico P24 com especialização de 26%', () => {
		const folha = calcularFolha(24, params);
		expect(folha.vencimento).toBe(7446.65);
		expect(folha.gdae).toBe(2978.66);
		expect(folha.especializacao).toBe(1936.12); // a folha trunca: 26% de 7.446,65 = 1.936,129
		expect(folha.periculosidade).toBe(744.66);
		expect(folha.psss).toBe(988.1);
		expect(folha.funpresp).toBe(1863.8);
		expect(folha.irpf).toBe(6872.5); // truncado: 6.872,507
		expect(folha.bruto).toBe(32980.85);
		expect(folha.liquido).toBe(22526.45); // − R$ 730 de plano de saúde, sindicato etc.
	});

	it('integralidade: PSSS progressivo sobre a base inteira e sem Funpresp', () => {
		const folha = calcularFolha(24, { ...params, regime: 'integralidade' });
		expect(folha.psss).toBe(4519.65);
		expect(folha.funpresp).toBe(0);
		expect(folha.irpf).toBe(6413.87);
		expect(folha.liquido).toBe(21317.33);
	});

	it('limita a especialização a 30%', () => {
		const folha = calcularFolha(24, { ...params, especializacao: 0.5 });
		expect(folha.especializacao).toBe(2233.99);
	});
});

describe('progressão', () => {
	it('sobe um padrão a cada mês de progressão, após 12 meses da posse', () => {
		expect(padraoEm(params, 2022, 1)).toBe(21);
		expect(padraoEm(params, 2022, 12)).toBe(21);
		expect(padraoEm(params, 2023, 1)).toBe(22);
		expect(padraoEm(params, 2026, 10)).toBe(25);
	});

	it('chega ao padrão máximo em 2037 e não passa dele', () => {
		expect(anoPadraoMaximo(params)).toBe(2037);
		expect(padraoEm(params, 2050, 12)).toBe(36);
	});

	it('posse no meio do ano: a primeira progressão espera o mês de progressão após 12 meses', () => {
		const p = { ...params, dataPosse: '2024-03-01', mesProgressao: 9 };
		expect(padraoEm(p, 2024, 9)).toBe(21); // só 6 meses de exercício
		expect(padraoEm(p, 2025, 8)).toBe(21);
		expect(padraoEm(p, 2025, 9)).toBe(22);
	});
});

describe('aposentadoria', () => {
	it('usa o requisito mais tardio', () => {
		expect(anoAposentadoria(params)).toBe(2052); // contribuição: 2022 + 30
		expect(anoAposentadoria({ ...params, anoNascimento: 2000 })).toBe(2055); // idade: 2000 + 55
		expect(anoAposentadoria({ ...params, anoNascimento: 1980, contribuicaoAnteriorOutra: 10 })).toBe(2047); // exercício policial: 2022 + 25
	});

	it('tempo policial anterior conta para contribuição e exercício; o de fora, só para contribuição', () => {
		const base = { ...params, anoNascimento: 1980 };
		// 5 anos fora: contribuição 01/2047 = exercício 01/2047
		expect(calcularMarcos({ ...base, contribuicaoAnteriorOutra: 5 })).toMatchObject({ anoAposentadoria: 2047, mesAposentadoria: 1 });
		// 5 anos policiais: contribuição 01/2047, exercício 01/2042 → 2047
		expect(calcularMarcos({ ...base, contribuicaoAnteriorPolicial: 5 })).toMatchObject({ anoAposentadoria: 2047 });
		// 10 policiais: contribuição 01/2042, exercício 01/2037, idade 01/2035 → 2042
		expect(calcularMarcos({ ...base, contribuicaoAnteriorPolicial: 10 })).toMatchObject({ anoAposentadoria: 2042, mesAposentadoria: 1 });
	});

	it('idade informada substitui a regra (aposenta no mês do aniversário); a regra continua para comparação', () => {
		const informada = { ...params, mesNascimento: 3, idadeAposentadoriaInformada: 65 }; // 03/1985 + 65 = 03/2050
		const marcos = calcularMarcos(informada);
		expect(marcos).toMatchObject({
			anoAposentadoria: 2050,
			mesAposentadoria: 3,
			aposentadoriaInformada: true,
			anoAposentadoriaRegra: 2052,
			mesAposentadoriaRegra: 1
		});
		const linhas = projetar(informada);
		expect(linhas.at(-1)).toMatchObject({ ano: 2050, mesesAtivos: 2 });
	});
});

describe('projeção', () => {
	const linhas = projetar(params, 2026);

	it('por padrão começa no ano da posse', () => {
		const desdePosse = projetar(params);
		expect(desdePosse[0]).toMatchObject({ ano: 2022, mesesAtivos: 12, padrao: 21, tercoFeriasLiquido: 0 });
		expect(desdePosse.find((l) => l.ano === 2025)?.padrao).toBe(24);
	});

	it('aposentadoria em janeiro/2052 (30 anos de contribuição desde 01/2022)', () => {
		expect(calcularMarcos(params)).toMatchObject({ anoAposentadoria: 2052, mesAposentadoria: 1 });
	});

	it('vai do ano inicial até o último ano ativo (aposentadoria em janeiro: o ano anterior)', () => {
		expect(linhas[0].ano).toBe(2026);
		expect(linhas.at(-1)).toMatchObject({ ano: 2051, mesesAtivos: 12 });
		expect(linhas.find((l) => l.ano === 2037)?.padrao).toBe(36);
	});

	it('no ano da aposentadoria contam só os meses ativos, com 13º proporcional', () => {
		const p = { ...params, mesNascimento: 6, idadeAposentadoriaInformada: 67 }; // 06/2052
		const comInformada = projetar(p, 2026);
		const ultima = comInformada.at(-1)!;
		expect(ultima).toMatchObject({ ano: 2052, mesesAtivos: 5, mesReferencia: 5 });
		expect(ultima.decimoTerceiroLiquido).toBe(calcularDecimoTerceiro(36, p, 5 / 12, 2052).liquido);
		expect(ultima.liquidoAnual).toBeLessThan(comInformada.at(-2)!.liquidoAnual / 2);
	});

	it('idade completada no ano, mesmo que o aniversário seja depois do último mês ativo', () => {
		const linhasP = projetar({ ...params, anoNascimento: 1990, mesNascimento: 8 }, 2026);
		expect(linhasP[0].idade).toBe(36);
		expect(linhasP.at(-1)?.idade).toBe(61); // último ano ativo: 2051
	});

	it('bruto anual inclui 12 meses, 13º e 1/3 de férias', () => {
		const ano = linhas.find((l) => l.ano === 2040)!;
		const mensal = calcularFolha(36, params).bruto;
		const remuneracao = mensal - 1833.54;
		expect(ano.brutoAnual).toBeCloseTo(12 * mensal + remuneracao + remuneracao / 3, 1);
	});

	it('13º integral: IR exclusivo, sem auxílio nem outros descontos', () => {
		expect(calcularDecimoTerceiro(24, params).liquido).toBe(21422.91);
	});

	it('se aposentar em janeiro, o último ano projetado é o anterior', () => {
		const p = { ...params, anoNascimento: 2000, mesNascimento: 1 };
		expect(projetar(p, 2026).at(-1)?.ano).toBe(2054);
	});
});
