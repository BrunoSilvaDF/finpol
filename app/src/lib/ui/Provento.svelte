<script lang="ts">
	import type { RendaAposentado } from '$lib/calc/inatividade';
	import { anosDeContribuicao, percentualBeneficioRpps } from '$lib/calc/rpps';
	import type { Parametros } from '$lib/calc/tipos';
	import { tetoRgps } from '$lib/calc/reajuste';
	import { reaisCentavos } from './formato';
	import Rubricas, { type Rubrica } from './Rubricas.svelte';

	let { renda, params, ano }: { renda: RendaAposentado; params: Parametros; ano: number } = $props();

	const percentual = (fracao: number): string => `${(Math.round(fracao * 10000) / 100).toLocaleString('pt-BR')}%`;
	const teto = $derived(reaisCentavos(tetoRgps(params, ano)));
	const integral = $derived(params.regime === 'integralidade');
	const descontos = $derived(renda.contribuicao + renda.irpf + renda.outrosDescontos);

	const explicacaoBeneficio = $derived(
		integral
			? 'Igual à remuneração do cargo no último padrão (vencimento, GAL, GR, GDAE, especialização e VPI), sem periculosidade e auxílio. Vitalício.'
			: `${percentual(percentualBeneficioRpps(params))} da média das remunerações de contribuição (60% + 2% por ano acima de 20; serão ${Math.floor(anosDeContribuicao(params))} anos), limitado ao teto do INSS (${teto}). Vitalício.`
	);
	const explicacaoIr = $derived(
		!integral && params.tributacaoFunpresp === 'regressiva'
			? `Tabela mensal sobre o benefício do RPPS; a renda Funpresp paga 10% à parte (tabela regressiva, após 10 anos de acumulação): ${reaisCentavos(renda.funpresp * 0.1)}.`
			: `Tabela mensal sobre o total (${reaisCentavos(renda.bruto)}) menos a contribuição do aposentado e dependentes. Alíquota efetiva: ${percentual(renda.irpf / renda.bruto)}.`
	);

	const rubricas: Rubrica[] = $derived(
		(
			[
				{ rotulo: integral ? 'Provento integral' : 'Benefício RPPS', valor: renda.rpps, explicacao: explicacaoBeneficio },
				{ rotulo: 'Renda Funpresp', valor: renda.funpresp, explicacao: `Saldo da conta individual dividido pelo prazo da expectativa de sobrevida (${params.expectativaSobrevida} anos, taxa atuarial de ${percentual(params.taxaAtuarial)}), recalculado todo janeiro. Depois do prazo, 80% da última parcela, vitalício.` },
				{ rotulo: 'Bruto', valor: renda.bruto, tipo: 'total' },
				{ rotulo: 'Contribuição do aposentado', valor: renda.contribuicao, tipo: 'desconto', explicacao: `Só sobre o que passa do teto do INSS (${teto}), com a alíquota efetiva da tabela progressiva calculada sobre o total.` },
				{ rotulo: 'IRPF', valor: renda.irpf, tipo: 'desconto', explicacao: explicacaoIr },
				{ rotulo: 'Saúde, sindicato e associações', valor: renda.outrosDescontos, tipo: 'desconto', explicacao: params.reajusteRealOutrosDescontos ? `Plano de saúde (SIS), sindicato e associações: valor da lateral reajustado ${percentual(params.reajusteRealOutrosDescontos)} ao ano acima da inflação.` : 'Plano de saúde (SIS), sindicato e associações: o mesmo valor informado na lateral.' },
				{ rotulo: 'Total de descontos', valor: descontos, tipo: 'total desconto', explicacao: `${percentual(descontos / renda.bruto)} do bruto.` },
				{ rotulo: 'Líquido', valor: renda.liquido, tipo: 'liquido' }
			] satisfies Rubrica[]
		).filter((r) => r.valor !== 0 || r.rotulo === 'IRPF') as Rubrica[]
	);
</script>

<Rubricas {rubricas} />
