import { fatorRenda } from './funpresp';
import type { ProjecaoInatividade } from './inatividade';
import type { LinhaAnual } from './tipos';

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;
const somar = (valores: number[]): number => valores.reduce((a, b) => a + b, 0);

export interface InvestimentoDiferenca {
	/** soma simples do que foi investido na ativa (sem rendimento) */
	totalAportado: number;
	/** investimento mensal médio: a diferença de líquido, ou o valor informado */
	aporteMensalMedio: number;
	/** true quando o valor investido foi informado em vez de usar a diferença */
	aporteInformado: boolean;
	saldoNaAposentadoria: number;
	/** saque mensal constante que zera o saldo na idade-horizonte */
	saqueMensal: number;
	/** renda média mensal na aposentadoria (13º incluído) */
	mediaIntegralidade: number;
	mediaComplementar: number;
	mediaComplementarInvestindo: number;
	/** mediaComplementarInvestindo − mediaIntegralidade: positivo, o complementar vence */
	vantagemMensal: number;
	/** aporte mensal constante na ativa que faria o complementar empatar com a integralidade */
	aporteMensalParaEmpatar: number;
	/** diferença média mensal de líquido na ativa (o que de fato sobra para investir) */
	diferencaMensalMedia: number;
}

interface Entrada {
	ativaComplementar: LinhaAnual[];
	ativaIntegralidade: LinhaAnual[];
	inatividadeComplementar: ProjecaoInatividade;
	inatividadeIntegralidade: ProjecaoInatividade;
	rentabilidade: number;
	/** investimento mensal fixo informado; null = investir a diferença de líquido de cada ano */
	aporteMensal: number | null;
}

// Padrão: a diferença de cada ano é aplicada em parcelas iguais nos meses ativos do ano.
// Com valor informado, aplica-se esse valor todo mês ativo.
function acumular(entrada: Entrada): { saldo: number; aportado: number; diferenca: number; mesesAtivos: number } {
	const juros = (1 + entrada.rentabilidade) ** (1 / 12) - 1;
	const integral = new Map(entrada.ativaIntegralidade.map((l) => [l.ano, l.liquidoAnual]));
	let saldo = 0;
	let aportado = 0;
	let diferencaTotal = 0;
	let mesesAtivos = 0;
	for (const linha of entrada.ativaComplementar) {
		mesesAtivos += linha.mesesAtivos;
		const diferenca = linha.liquidoAnual - (integral.get(linha.ano) ?? 0);
		diferencaTotal += diferenca;
		const aporte = entrada.aporteMensal ?? diferenca / linha.mesesAtivos;
		for (let m = 0; m < linha.mesesAtivos; m++) {
			saldo = saldo * (1 + juros) + aporte;
			aportado += aporte;
		}
	}
	return { saldo, aportado, diferenca: diferencaTotal, mesesAtivos };
}

/** Valor futuro de um aporte mensal de 1 ao longo de `meses`, à taxa anual dada. */
function valorFuturoDeAportes(meses: number, taxaAnual: number): number {
	const j = (1 + taxaAnual) ** (1 / 12) - 1;
	return j === 0 ? meses : ((1 + j) ** meses - 1) / j;
}

/**
 * E se, no complementar, a pessoa vivesse com o mesmo líquido da integralidade e investisse a
 * diferença? Na ativa os dois consomem o mesmo; a comparação fica na renda da aposentadoria.
 */
export function investirDiferenca(entrada: Entrada): InvestimentoDiferenca {
	const { saldo, aportado, diferenca, mesesAtivos } = acumular(entrada);
	const meses = somar(entrada.inatividadeIntegralidade.linhas.map((l) => l.mesesAposentado));
	const saqueMensal = meses > 0 ? saldo / fatorRenda(meses, entrada.rentabilidade) : 0;
	const media = (p: ProjecaoInatividade): number => (meses > 0 ? somar(p.linhas.map((l) => l.liquidoAnual)) / meses : 0);
	const mediaComplementar = media(entrada.inatividadeComplementar);
	const mediaIntegralidade = media(entrada.inatividadeIntegralidade);
	return {
		totalAportado: arredondar(aportado),
		aporteMensalMedio: arredondar(mesesAtivos > 0 ? aportado / mesesAtivos : 0),
		aporteInformado: entrada.aporteMensal !== null,
		saldoNaAposentadoria: arredondar(saldo),
		saqueMensal: arredondar(saqueMensal),
		mediaIntegralidade: arredondar(mediaIntegralidade),
		mediaComplementar: arredondar(mediaComplementar),
		mediaComplementarInvestindo: arredondar(mediaComplementar + saqueMensal),
		vantagemMensal: arredondar(mediaComplementar + saqueMensal - mediaIntegralidade),
		aporteMensalParaEmpatar: arredondar(aporteParaEmpatar(mediaIntegralidade - mediaComplementar, meses, mesesAtivos, entrada.rentabilidade)),
		diferencaMensalMedia: arredondar(mesesAtivos > 0 ? diferenca / mesesAtivos : 0)
	};
}

// Saldo necessário na aposentadoria para cobrir a falta mensal até o horizonte, dividido pelo
// valor futuro de um aporte mensal durante a ativa.
function aporteParaEmpatar(faltaMensal: number, mesesAposentado: number, mesesAtivos: number, taxa: number): number {
	if (faltaMensal <= 0 || mesesAposentado === 0 || mesesAtivos === 0) return 0;
	return (faltaMensal * fatorRenda(mesesAposentado, taxa)) / valorFuturoDeAportes(mesesAtivos, taxa);
}
