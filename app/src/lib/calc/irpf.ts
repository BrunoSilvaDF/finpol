import { DEDUCAO_DEPENDENTE_IRPF, REDUTOR_IRPF, TABELA_IRPF } from '$lib/data/tabela-2026';

// A folha do Senado trunca os centavos do imposto (conferido em folhas reais).
const truncar = (valor: number): number => Math.floor(valor * 100 + 1e-6) / 100;

function impostoPelaTabela(base: number): number {
	const [, aliquota, deducao] = TABELA_IRPF.find(([limite]) => base <= limite)!;
	return Math.max(0, base * aliquota - deducao);
}

// O redutor da Lei 15.270/2025 incide sobre o rendimento tributável bruto, não sobre a base.
function redutor(rendimentoTributavel: number): number {
	const { isencaoAte, reducaoMaxima, faixaAte, a, b } = REDUTOR_IRPF;
	if (rendimentoTributavel <= isencaoAte) return reducaoMaxima;
	if (rendimentoTributavel <= faixaAte) return Math.max(0, a - b * rendimentoTributavel);
	return 0;
}

export function calcularIrpf(rendimentoTributavel: number, deducoes: number, dependentes: number): number {
	const base = rendimentoTributavel - deducoes - dependentes * DEDUCAO_DEPENDENTE_IRPF;
	const imposto = impostoPelaTabela(base) - redutor(rendimentoTributavel);
	return truncar(Math.max(0, imposto));
}
