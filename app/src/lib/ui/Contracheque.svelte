<script lang="ts">
	import type { Folha, Parametros } from '$lib/calc/tipos';
	import { DEDUCAO_DEPENDENTE_IRPF } from '$lib/data/tabela-2026';
	import { reaisCentavos } from './formato';
	import Rubricas, { type Rubrica } from './Rubricas.svelte';

	let { folha, params }: { folha: Folha; params: Parametros } = $props();

	const percentual = (fracao: number): string => `${(Math.round(fracao * 10000) / 100).toLocaleString('pt-BR')}%`;

	const baseContribuicao = $derived(folha.bruto - folha.auxilioAlimentacao - folha.periculosidade);
	const tributavel = $derived(folha.bruto - folha.auxilioAlimentacao);
	const baseIr = $derived(tributavel - folha.psss - folha.funpresp - params.dependentesIr * DEDUCAO_DEPENDENTE_IRPF);
	const totalDescontos = $derived(folha.psss + folha.funpresp + folha.irpf + folha.outrosDescontos);
	const teto = $derived(reaisCentavos(folha.teto));

	const explicacaoPsss = $derived(
		params.regime === 'integralidade'
			? `Contribuição ao regime próprio (RPPS) pela tabela progressiva de 2026 (7,5% a 22% por faixa) sobre a base inteira de ${reaisCentavos(baseContribuicao)}, sem periculosidade e auxílio. Alíquota efetiva: ${percentual(folha.psss / baseContribuicao)}.`
			: `Contribuição ao regime próprio (RPPS) pela tabela progressiva de 2026 (7,5% a 14%), só até o teto do INSS de ${folha.ano} (${teto}). O que passa do teto vai para a Funpresp.`
	);

	const rubricas: Rubrica[] = $derived(
		(
		[
			{ rotulo: 'Vencimento', valor: folha.vencimento, explicacao: `Valor-base do cargo no padrão ${folha.padrao} (Lei 15.350/2026). Sobe cerca de 3% a cada progressão anual e serve de base para GDAE, especialização e periculosidade.` },
			{ rotulo: 'GAL', valor: folha.gal, explicacao: 'Gratificação de Atividade Legislativa: valor fixo do cargo de Técnico Legislativo, igual em todos os padrões.' },
			{ rotulo: 'GR', valor: folha.gr, explicacao: 'Gratificação de Representação: valor fixo do cargo, igual em todos os padrões.' },
			{ rotulo: 'GDAE (40%)', valor: folha.gdae, explicacao: 'Gratificação de Desempenho e Alinhamento Estratégico: 40% do vencimento.' },
			{ rotulo: `Adic. Especialização (${percentual(params.especializacao)})`, valor: folha.especializacao, explicacao: 'Adicional por títulos e capacitação: percentual do vencimento, até 30%.' },
			{ rotulo: 'VPI', valor: folha.vpi, explicacao: 'Vantagem Pecuniária Individual (Lei 10.698/2003): valor fixo pago aos servidores federais.' },
			{ rotulo: 'Adicional de Periculosidade (10%)', valor: folha.periculosidade, explicacao: '10% do vencimento pela atividade policial. Paga IR, mas não entra na base da previdência.' },
			{ rotulo: 'Auxílio-alimentação', valor: folha.auxilioAlimentacao, explicacao: 'Verba indenizatória: não paga IR nem previdência e não entra no 13º.' },
			{ rotulo: 'Bruto', valor: folha.bruto, tipo: 'total', explicacao: `Soma dos proventos. A base da previdência (sem periculosidade e auxílio) é ${reaisCentavos(baseContribuicao)}.` },
			{ rotulo: 'PSSS', valor: folha.psss, tipo: 'desconto', explicacao: explicacaoPsss },
			{ rotulo: `Funpresp (${percentual(params.aliquotaFunpresp)})`, valor: folha.funpresp, tipo: 'desconto', explicacao: `Previdência complementar: ${percentual(params.aliquotaFunpresp)} sobre o que passa do teto (${reaisCentavos(baseContribuicao - folha.teto)}). A União deposita o mesmo valor na sua conta, e a contribuição reduz o IR.` },
			{ rotulo: 'IRPF', valor: folha.irpf, tipo: 'desconto', explicacao: `Tabela mensal de 2026 (27,5% menos R$ 908,73 nesta faixa) sobre a base de ${reaisCentavos(baseIr)}: tributável de ${reaisCentavos(tributavel)} menos PSSS, Funpresp e dependentes. Alíquota efetiva sobre o tributável: ${percentual(folha.irpf / tributavel)}.` },
			{ rotulo: 'Saúde, sindicato e associações', valor: folha.outrosDescontos, tipo: 'desconto', explicacao: params.reajusteRealOutrosDescontos ? `Plano de saúde (SIS), sindicato e associações: valor informado na lateral, reajustado ${percentual(params.reajusteRealOutrosDescontos)} ao ano acima da inflação a partir de 2027.` : 'Plano de saúde (SIS), sindicato e associações: valor informado na lateral.' },
			{ rotulo: 'Total de descontos', valor: totalDescontos, tipo: 'total desconto', explicacao: `${percentual(totalDescontos / folha.bruto)} do bruto.` },
			{ rotulo: 'Líquido', valor: folha.liquido, tipo: 'liquido' }
		] satisfies Rubrica[]
		).filter((r) => r.valor !== 0 || r.rotulo === 'IRPF') as Rubrica[]
	);
</script>

<Rubricas {rubricas} />
