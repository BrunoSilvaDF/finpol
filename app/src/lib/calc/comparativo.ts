import { calcularFolha } from './folha';
import { projetarFunpresp, type CenarioFunpresp } from './funpresp';
import { beneficioRppsNoAno, calcularRendaAposentado, projetarInatividade, type ProjecaoInatividade, type RendaAposentado } from './inatividade';
import { investirDiferenca, type InvestimentoDiferenca } from './investimento';
import { padraoEm } from './progressao';
import { projetar } from './projecao';
import type { Cenario, LinhaAnual, Parametros, Regime } from './tipos';

export const CENARIOS: Cenario[] = ['pessimista', 'base', 'otimista'];

export interface ResultadoComplementar {
	funpresp: CenarioFunpresp;
	inatividade: ProjecaoInatividade;
	/** renda depois do prazo da Funpresp, com o Benefício por Sobrevivência (80%) */
	aposFimDoPrazo: RendaAposentado;
	/** primeiro ano em que a integralidade acumula mais líquido na vida toda; null se não ocorre até o horizonte */
	anoEquilibrio: number | null;
	/** diferença de líquido da ativa investida na mesma rentabilidade do cenário */
	investimento: InvestimentoDiferenca;
}

export interface Comparativo {
	/** linhas anuais da vida ativa em cada regime, da posse à aposentadoria */
	ativa: Record<Regime, LinhaAnual[]>;
	/** líquido somado na vida ativa (com 13º e férias) */
	liquidoAtiva: Record<Regime, number>;
	/** líquido do mês atual em cada regime */
	liquidoMensalAtual: Record<Regime, number>;
	integralidade: ProjecaoInatividade;
	complementar: Record<Cenario, ResultadoComplementar>;
}
// Soma, ano a ano, quanto a integralidade dá a mais (negativo na ativa, positivo na inatividade).
function anoEquilibrio(ativa: Record<Regime, LinhaAnual[]>, integral: ProjecaoInatividade, complementar: ProjecaoInatividade): number | null {
	let acumulado = somarLiquido(ativa.integralidade) - somarLiquido(ativa.complementar);
	const complementarPorAno = new Map(complementar.linhas.map((l) => [l.ano, l.liquidoAnual]));
	for (const linha of integral.linhas) {
		acumulado += linha.liquidoAnual - (complementarPorAno.get(linha.ano) ?? 0);
		if (acumulado >= 0) return linha.ano;
	}
	return null;
}

function rendaAposFimDoPrazo(params: Parametros, funpresp: CenarioFunpresp): RendaAposentado {
	const ano = Math.floor(funpresp.inicioSobrevivencia / 12);
	return calcularRendaAposentado(beneficioRppsNoAno(params, 'complementar', ano), funpresp.rendaSobrevivencia, params, ano);
}

const somarLiquido = (linhas: { liquidoAnual: number }[]): number => linhas.reduce((soma, l) => soma + l.liquidoAnual, 0);

export function compararRegimes(params: Parametros, mesAtual: number): Comparativo {
	const ativa = { complementar: projetar({ ...params, regime: 'complementar' }), integralidade: projetar({ ...params, regime: 'integralidade' }) };
	const padraoAtual = padraoEm(params, Math.floor(mesAtual / 12), (mesAtual % 12) + 1);
	const anoAtual = Math.floor(mesAtual / 12);
	const liquidoAtual = (regime: Regime): number => calcularFolha(padraoAtual, { ...params, regime }, { ano: anoAtual }).liquido;
	const integralidade = projetarInatividade(params, 'integralidade', null);
	const complementar = Object.fromEntries(
		CENARIOS.map((cenario) => {
			const funpresp = projetarFunpresp(params, params.rentabilidades[cenario], mesAtual);
			const inatividade = projetarInatividade(params, 'complementar', funpresp);
			return [
				cenario,
				{
					funpresp,
					inatividade,
					aposFimDoPrazo: rendaAposFimDoPrazo(params, funpresp),
					anoEquilibrio: anoEquilibrio(ativa, integralidade, inatividade),
					investimento: investirDiferenca({
						ativaComplementar: ativa.complementar,
						ativaIntegralidade: ativa.integralidade,
						inatividadeComplementar: inatividade,
						inatividadeIntegralidade: integralidade,
						rentabilidade: params.rentabilidades[cenario],
						aporteMensal: params.aporteMensalInvestimento ?? null
					})
				}
			];
		})
	) as Record<Cenario, ResultadoComplementar>;
	return {
		ativa,
		liquidoAtiva: { complementar: somarLiquido(ativa.complementar), integralidade: somarLiquido(ativa.integralidade) },
		liquidoMensalAtual: { complementar: liquidoAtual('complementar'), integralidade: liquidoAtual('integralidade') },
		integralidade,
		complementar
	};
}
