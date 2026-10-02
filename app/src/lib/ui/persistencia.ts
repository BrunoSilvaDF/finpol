import { PARAMETROS_PADRAO } from '$lib/calc/padrao';
import type { Parametros } from '$lib/calc/tipos';

// Só datas e percentuais ficam no navegador — nenhum dado de identificação pessoal.
const CHAVE = 'finpol:parametros';

// Versões anteriores tinham um único `contribuicaoAnterior`; sem saber a natureza, vai para "fora".
// Campos que deixaram de existir (ex.: `psss`, hoje calculado) são descartados.
// O ano de aposentadoria informado virou idade (ano − ano de nascimento).
function migrar(salvo: Parametros & { contribuicaoAnterior?: number; anoAposentadoriaInformado?: number | null }): Parametros {
	const { contribuicaoAnterior, anoAposentadoriaInformado, ...params } = salvo;
	if (contribuicaoAnterior) params.contribuicaoAnteriorOutra ||= contribuicaoAnterior;
	if (anoAposentadoriaInformado) params.idadeAposentadoriaInformada ??= anoAposentadoriaInformado - params.anoNascimento;
	const conhecidos = Object.entries(params).filter(([chave]) => chave in PARAMETROS_PADRAO);
	return Object.fromEntries(conhecidos) as unknown as Parametros;
}

export function carregarParametros(): Parametros {
	try {
		const salvo = localStorage.getItem(CHAVE);
		return salvo ? migrar({ ...structuredClone(PARAMETROS_PADRAO), ...JSON.parse(salvo) }) : structuredClone(PARAMETROS_PADRAO);
	} catch {
		return structuredClone(PARAMETROS_PADRAO);
	}
}

export function salvarParametros(params: Parametros): void {
	try {
		localStorage.setItem(CHAVE, JSON.stringify(params));
	} catch {
		// Sem armazenamento disponível: a projeção continua funcionando nesta sessão.
	}
}
