import type { Parametros } from './tipos';

// Valores não sensíveis; o ano de nascimento é só um ponto de partida a ser ajustado na tela.
export const PARAMETROS_PADRAO: Parametros = {
	dataPosse: '2022-01-01',
	padraoInicial: 21,
	mesProgressao: 1,
	especializacao: 0.26,
	dependentesIr: 0,
	regime: 'complementar',
	aliquotaFunpresp: 0.085,
	saldoFunpresp: null,
	rentabilidades: { pessimista: 0.02, base: 0.04, otimista: 0.06 },
	taxaAtuarial: 0.04,
	expectativaSobrevida: 27,
	idadeHorizonte: 90,
	aporteMensalInvestimento: null,
	reajusteRealTeto: 0,
	reajusteRealSalarios: 0,
	tributacaoFunpresp: 'progressiva',
	percentualRppsInformado: null,
	mediaRppsInformada: null,
	outrosDescontos: 730,
	reajusteRealOutrosDescontos: 0,
	anoNascimento: 1985,
	mesNascimento: 1,
	contribuicaoAnteriorPolicial: 0,
	contribuicaoAnteriorOutra: 0,
	idadeAposentadoriaInformada: null,
	idadeMinimaAposentadoria: 55,
	contribuicaoMinima: 30,
	exercicioPolicialMinimo: 25
};
