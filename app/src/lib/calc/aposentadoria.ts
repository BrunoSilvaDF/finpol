import { indiceMes } from './progressao';
import type { Parametros } from './tipos';

// Aposentadoria policial (EC 103/2019, art. 10, §2º, I): exige cumulativamente idade mínima,
// tempo de contribuição e tempo de exercício em cargo policial. Precisão mensal.
/** Índice (ver `indiceMes`) do primeiro mês em que os requisitos da regra estão cumpridos. */
export function mesIndiceAposentadoriaRegra(params: Parametros): number {
	const [anoPosse, mesPosse] = params.dataPosse.split('-').map(Number);
	const posse = indiceMes(anoPosse, mesPosse);
	// Tempo policial anterior conta para os dois requisitos; o de fora, só para a contribuição.
	const anterior = params.contribuicaoAnteriorPolicial + params.contribuicaoAnteriorOutra;
	const porIdade = indiceMes(params.anoNascimento + params.idadeMinimaAposentadoria, params.mesNascimento);
	const porContribuicao = posse + Math.round((params.contribuicaoMinima - anterior) * 12);
	const porExercicio = posse + Math.round((params.exercicioPolicialMinimo - params.contribuicaoAnteriorPolicial) * 12);
	return Math.max(porIdade, porContribuicao, porExercicio);
}

/** Índice do primeiro mês já aposentado: o aniversário da idade informada, ou a data da regra policial. */
export function mesIndiceAposentadoria(params: Parametros): number {
	if (!params.idadeAposentadoriaInformada) return mesIndiceAposentadoriaRegra(params);
	return indiceMes(params.anoNascimento + params.idadeAposentadoriaInformada, params.mesNascimento);
}

export function anoAposentadoria(params: Parametros): number {
	return Math.floor(mesIndiceAposentadoria(params) / 12);
}
