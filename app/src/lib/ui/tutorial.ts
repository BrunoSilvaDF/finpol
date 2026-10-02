import { driver, type DriveStep, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tutorial.css';

interface Passo {
	/** seletor do elemento destacado; sem alvo, o balão aparece no centro da tela */
	alvo?: string;
	titulo: string;
	texto: string;
	lado?: 'top' | 'right' | 'bottom' | 'left';
}

const PASSOS: Passo[] = [
	{
		titulo: 'Boas-vindas ao FinPol',
		texto: 'Em um minuto você vê onde informar seus dados e onde acompanhar os resultados. Use as setas do teclado ou os botões.'
	},
	{
		alvo: '[data-tour="carreira"]',
		titulo: 'Sua carreira',
		texto: 'Comece aqui: data de posse, padrão em que entrou, mês da progressão e o adicional de especialização.',
		lado: 'right'
	},
	{
		alvo: '[data-tour="descontos"]',
		titulo: 'Descontos',
		texto: 'Plano de saúde, sindicato e associações, além dos dependentes no imposto de renda.',
		lado: 'right'
	},
	{
		alvo: '[data-tour="aposentadoria"]',
		titulo: 'Quando você se aposenta',
		texto:
			'Nascimento e tempo de contribuição antes da posse definem a data pela regra policial. Para simular outra, informe a idade da aposentadoria.',
		lado: 'right'
	},
	{
		alvo: '[data-tour="previdencia"]',
		titulo: 'Previdência',
		texto:
			'Seu regime, a alíquota e o saldo da Funpresp. Em "Premissas da projeção" ficam rentabilidade, reajustes e outras hipóteses.',
		lado: 'right'
	},
	{
		alvo: '[data-tour="menu"]',
		titulo: 'Temos mais opções para você ver mais detalhes',
		texto:
			'Nas abas Resumo, Vida ativa, Aposentadoria e Como calculamos estão os resultados, recalculados a cada dado que você muda. Para rever este tutorial, use o botão "Ver tutorial".',
		lado: 'bottom'
	}
];

const CHAVE = 'finpol:tutorial-visto';

/** Sem armazenamento disponível, trata como visto para não abrir o tour a cada visita. */
export function tutorialVisto(): boolean {
	try {
		return localStorage.getItem(CHAVE) === '1';
	} catch {
		return true;
	}
}

function marcarVisto(): void {
	try {
		localStorage.setItem(CHAVE, '1');
	} catch {
		// Sem armazenamento: nada a fazer.
	}
}

const paraDriver = (p: Passo): DriveStep => ({
	element: p.alvo,
	popover: { title: p.titulo, description: p.texto, side: p.lado, align: 'start' }
});

// Uma única instância, reaproveitada a cada abertura (evita tours sobrepostos).
let tour: Driver | null = null;

/** Abre o tour pelos campos da lateral e pelo menu de abas. */
export function iniciarTutorial(): void {
	tour ??= driver({
		steps: PASSOS.map(paraDriver),
		showProgress: true,
		progressText: '{{current}} de {{total}}',
		nextBtnText: 'Próximo',
		prevBtnText: 'Anterior',
		doneBtnText: 'Concluir',
		popoverClass: 'finpol-tour',
		overlayOpacity: 0.65,
		stagePadding: 6,
		stageRadius: 8,
		allowKeyboardControl: true,
		onDestroyed: marcarVisto
	});
	if (!tour.isActive()) tour.drive();
}
