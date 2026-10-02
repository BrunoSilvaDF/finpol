// Quadro de remunerações dos cargos efetivos do Senado Federal —
// Lei 15.350/2026, vigente a partir de 05/04/2026. Cargo: Técnico Legislativo.

export const PADRAO_MINIMO = 21;
export const PADRAO_MAXIMO = 36;

export const VENCIMENTO_POR_PADRAO: Record<number, number> = {
	21: 6796.37,
	22: 7006.56,
	23: 7223.24,
	24: 7446.65,
	25: 7676.97,
	26: 7914.39,
	27: 8159.16,
	28: 8411.53,
	29: 8671.68,
	30: 8941.46,
	31: 8978.86,
	32: 9256.52,
	33: 9542.84,
	34: 9837.96,
	35: 10142.23,
	36: 10455.93
};

export const GAL = 14951.97;
export const GR = 3005.17;
export const VPI = 84.08;
export const AUXILIO_ALIMENTACAO = 1833.54;

export const PERCENTUAL_GDAE = 0.4;
export const PERCENTUAL_PERICULOSIDADE = 0.1;
export const PERCENTUAL_ESPECIALIZACAO_MAXIMO = 0.3;

// Teto do RGPS e contribuição progressiva do RPPS da União em 2026
// (Portaria Interministerial MPS/MF nº 13/2026, Anexo III): [limite superior da faixa, alíquota].
export const TETO_RGPS = 8475.55;
export const TABELA_RPPS: ReadonlyArray<readonly [number, number]> = [
	[1621.0, 0.075],
	[2902.84, 0.09],
	[4354.27, 0.12],
	[TETO_RGPS, 0.14],
	[14514.3, 0.145],
	[29028.57, 0.165],
	[56605.73, 0.19],
	[Infinity, 0.22]
];

// Funpresp/LegisPrev: alíquotas de livre escolha da contribuição básica (Regulamento, art. 11 §1º).
export const ALIQUOTAS_FUNPRESP = [0.075, 0.08, 0.085] as const;
// Parte de cada contribuição básica que não vai para a conta individual (RAP):
// FCBE de 2,5% (desde 04/2026) e taxa de carregamento de 6,5% caindo a 2,45% em 8 anos de plano.
export const FUNPRESP_FCBE = 0.025;
export const FUNPRESP_CARREGAMENTO = { inicial: 0.065, final: 0.0245, anos: 8 };
// Benefício por Sobrevivência após o prazo da Aposentadoria Normal (Regulamento, art. 25 §1º).
export const FUNPRESP_PERCENTUAL_SOBREVIVENCIA = 0.8;
// Alíquota mínima da tabela regressiva (Lei 11.053/2004), atingida após 10 anos de acumulação.
export const IR_REGRESSIVO_FUNPRESP = 0.1;

// Benefício RPPS pós-EC 103 (art. 26 §2º): 60% da média + 2 pontos por ano de contribuição acima de 20.
export const RPPS_BENEFICIO = { base: 0.6, porAno: 0.02, anosSemAcrescimo: 20 };

// IRPF mensal vigente em 2026: [limite superior da faixa, alíquota, parcela a deduzir].
export const TABELA_IRPF: ReadonlyArray<readonly [number, number, number]> = [
	[2428.8, 0, 0],
	[2826.65, 0.075, 182.16],
	[3751.05, 0.15, 394.16],
	[4664.68, 0.225, 675.49],
	[Infinity, 0.275, 908.73]
];
export const DEDUCAO_DEPENDENTE_IRPF = 189.59;

// Redução do IRPF da Lei 15.270/2025 (isenção até R$ 5 mil, parcial até R$ 7.350).
export const REDUTOR_IRPF = { isencaoAte: 5000, reducaoMaxima: 312.89, faixaAte: 7350, a: 978.62, b: 0.133145 };
