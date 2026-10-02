import { mesIndiceAposentadoria, mesIndiceAposentadoriaRegra } from './aposentadoria';
import { calcularDecimoTerceiro, calcularFolha, type Verba } from './folha';
import { anoPadraoMaximo, indiceMes, padraoEm } from './progressao';
import type { LinhaAnual, Marcos, Parametros } from './tipos';

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;

export function calcularMarcos(params: Parametros): Marcos {
	const aposentadoria = mesIndiceAposentadoria(params);
	const regra = mesIndiceAposentadoriaRegra(params);
	return {
		anoPadraoMaximo: anoPadraoMaximo(params),
		anoAposentadoria: Math.floor(aposentadoria / 12),
		mesAposentadoria: (aposentadoria % 12) + 1,
		aposentadoriaInformada: Boolean(params.idadeAposentadoriaInformada),
		anoAposentadoriaRegra: Math.floor(regra / 12),
		mesAposentadoriaRegra: (regra % 12) + 1
	};
}

// 1/3 de férias líquido = diferença do líquido do mês com e sem o adicional (tributação conjunta).
function tercoFerias(padrao: number, params: Parametros, fracao: number, ano: number): Verba {
	const semFerias = calcularFolha(padrao, params, { ano });
	const bruto = arredondar(((semFerias.bruto - semFerias.auxilioAlimentacao) / 3) * fracao);
	const comFerias = calcularFolha(padrao, params, { ano, tributaveis: bruto });
	return { bruto, liquido: arredondar(comFerias.liquido - semFerias.liquido) };
}

interface Periodo {
	posse: number;
	/** primeiro mês já aposentado */
	aposentadoria: number;
}

function linhaDoAno(ano: number, params: Parametros, periodo: Periodo): LinhaAnual {
	let brutoMeses = 0;
	let liquidoMeses = 0;
	let mesesAtivos = 0;
	let mesReferencia = 12;
	for (let mes = 1; mes <= 12; mes++) {
		const indice = indiceMes(ano, mes);
		if (indice < periodo.posse || indice >= periodo.aposentadoria) continue;
		const folha = calcularFolha(padraoEm(params, ano, mes), params, { ano });
		brutoMeses += folha.bruto;
		liquidoMeses += folha.liquido;
		mesesAtivos++;
		mesReferencia = mes;
	}
	const padrao = padraoEm(params, ano, mesReferencia);
	// No ano da aposentadoria, 13º e férias são proporcionais aos meses trabalhados.
	const fracao = mesesAtivos / 12;
	const decimoTerceiro = calcularDecimoTerceiro(padrao, params, fracao, ano);
	// Férias só a partir do 2º ano de exercício.
	const temFerias = indiceMes(ano, mesReferencia) - periodo.posse >= 12;
	const ferias = temFerias ? tercoFerias(padrao, params, fracao, ano) : { bruto: 0, liquido: 0 };
	return {
		ano,
		padrao,
		mesReferencia,
		mesesAtivos,
		idade: ano - params.anoNascimento,
		liquidoMensal: calcularFolha(padrao, params, { ano }).liquido,
		brutoAnual: arredondar(brutoMeses + decimoTerceiro.bruto + ferias.bruto),
		liquidoAnual: arredondar(liquidoMeses + decimoTerceiro.liquido + ferias.liquido),
		decimoTerceiroLiquido: decimoTerceiro.liquido,
		tercoFeriasLiquido: ferias.liquido
	};
}

// Vai do ano da posse (ou de `anoInicial`) até o ano do último mês em atividade.
// Anos passados também usam a tabela 2026, então são estimativas do que foi pago.
export function projetar(params: Parametros, anoInicial = 0): LinhaAnual[] {
	const [anoPosse, mesPosse] = params.dataPosse.split('-').map(Number);
	const periodo: Periodo = { posse: indiceMes(anoPosse, mesPosse), aposentadoria: mesIndiceAposentadoria(params) };
	const anoFinal = Math.floor((periodo.aposentadoria - 1) / 12);
	const linhas: LinhaAnual[] = [];
	for (let ano = Math.max(anoPosse, anoInicial); ano <= anoFinal; ano++) linhas.push(linhaDoAno(ano, params, periodo));
	return linhas;
}
