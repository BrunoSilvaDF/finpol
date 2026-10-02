export type Regime = 'complementar' | 'integralidade';
export type Cenario = 'pessimista' | 'base' | 'otimista';

export interface Parametros {
	/** ISO yyyy-mm-dd */
	dataPosse: string;
	padraoInicial: number;
	/** 1–12 */
	mesProgressao: number;
	/** fração, ex.: 0.26 */
	especializacao: number;
	dependentesIr: number;
	/** complementar: RPPS até o teto + Funpresp; integralidade: regime anterior */
	regime: Regime;
	/** contribuição básica Funpresp: 0.075, 0.08 ou 0.085 */
	aliquotaFunpresp: number;
	/** saldo atual da conta Funpresp (RAP) no extrato; null = simular desde a posse */
	saldoFunpresp: number | null;
	/** rentabilidade real anual (acima da inflação) da Funpresp em cada cenário */
	rentabilidades: Record<Cenario, number>;
	/** taxa de juros atuarial anual do plano, usada para converter saldo em renda */
	taxaAtuarial: number;
	/** expectativa de sobrevida na aposentadoria (anos), pela tábua do plano */
	expectativaSobrevida: number;
	/** ganho real anual do teto do RGPS (INPC − IPCA), a partir de 2027 */
	reajusteRealTeto: number;
	/** ganho real anual dos salários do Senado (reajuste − IPCA), a partir de 2027 */
	reajusteRealSalarios: number;
	/** investimento mensal no complementar; null = investir a diferença de líquido entre os regimes */
	aporteMensalInvestimento: number | null;
	/** idade até a qual a inatividade é projetada */
	idadeHorizonte: number;
	/** regime de IR escolhido na Funpresp (regressiva simplificada como 10%) */
	tributacaoFunpresp: 'progressiva' | 'regressiva';
	/** percentual do benefício RPPS sobre a média; null = 60% + 2% por ano acima de 20 */
	percentualRppsInformado: number | null;
	/** média das remunerações de contribuição ao RPPS; null = teto do RGPS */
	mediaRppsInformada: number | null;
	/** SIS, sindicato, associações etc., em valores de 2026 */
	outrosDescontos: number;
	/** ganho real anual dos outros descontos (ex.: plano de saúde acima da inflação), a partir de 2027 */
	reajusteRealOutrosDescontos: number;
	anoNascimento: number;
	/** 1–12 */
	mesNascimento: number;
	/** anos de contribuição anteriores à posse em atividade policial (averbados) */
	contribuicaoAnteriorPolicial: number;
	/** anos de contribuição anteriores à posse fora da atividade policial */
	contribuicaoAnteriorOutra: number;
	/** idade em que pretende se aposentar (no mês do aniversário); null = regra da aposentadoria policial */
	idadeAposentadoriaInformada: number | null;
	idadeMinimaAposentadoria: number;
	contribuicaoMinima: number;
	exercicioPolicialMinimo: number;
}

export interface Folha {
	ano: number;
	/** teto do RGPS vigente no ano da competência */
	teto: number;
	gal: number;
	gr: number;
	vpi: number;
	auxilioAlimentacao: number;
	padrao: number;
	vencimento: number;
	gdae: number;
	especializacao: number;
	periculosidade: number;
	bruto: number;
	psss: number;
	funpresp: number;
	irpf: number;
	outrosDescontos: number;
	liquido: number;
}

export interface LinhaAnual {
	ano: number;
	/** padrão vigente no último mês ativo do ano */
	padrao: number;
	/** último mês ativo do ano (1–12): dezembro, ou o mês anterior à aposentadoria */
	mesReferencia: number;
	/** meses em atividade no ano */
	mesesAtivos: number;
	/** idade completada no ano (ano − ano de nascimento) */
	idade: number;
	liquidoMensal: number;
	brutoAnual: number;
	liquidoAnual: number;
	decimoTerceiroLiquido: number;
	tercoFeriasLiquido: number;
}

export interface Marcos {
	anoPadraoMaximo: number;
	anoAposentadoria: number;
	/** 1–12 */
	mesAposentadoria: number;
	aposentadoriaInformada: boolean;
	/** data pela regra policial, para comparação quando a data é informada */
	anoAposentadoriaRegra: number;
	mesAposentadoriaRegra: number;
}
