import { Prize, MatchConfig } from './types';

export const CONFIRMED_MATCHES: MatchConfig[] = [
  {
    id: 'bra_mar',
    team1Name: 'Brasil',
    team1Flag: '🇧🇷',
    team2Name: 'Marrocos',
    team2Flag: '🇲🇦',
    dateStr: '13/06 às 19:00',
    location: 'Nova Jersey'
  },
  {
    id: 'bra_hai',
    team1Name: 'Brasil',
    team1Flag: '🇧🇷',
    team2Name: 'Haiti',
    team2Flag: '🇭🇹',
    dateStr: '19/06 às 21:30',
    location: 'Filadélfia'
  },
  {
    id: 'esc_bra',
    team1Name: 'Escócia',
    team1Flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    team2Name: 'Brasil',
    team2Flag: '🇧🇷',
    dateStr: '24/06 às 19:00',
    location: 'Miami'
  }
];

export function getLoadedMatches(): MatchConfig[] {
  try {
    const saved = localStorage.getItem('boutique_matches_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading custom matches', e);
  }
  return CONFIRMED_MATCHES;
}

export function getLoadedMatch(): MatchConfig {
  const matches = getLoadedMatches();
  return matches[0]; // Fallback for single match references
}

export const PRIZES: Prize[] = [
  {
    id: 'FREE_BEER',
    title: 'Uma Cerveja Trincando! 🍺',
    label: 'Cerveja Grátis',
    description: 'Parabéns! Você ganhou uma cerveja artesanal trincando de gelada! RETIRADA HOJE (no dia do sorteio mesmo).',
    couponCode: 'CERVEJA_BOUTIQUE',
    icon: 'Beer',
    color: '#012169',
    bgGradient: 'from-orange-600 to-orange-850',
  },
  {
    id: '10_PERCENT',
    title: '10% de Desconto! 🥩',
    label: '10% OFF',
    description: 'Você ganhou 10% de desconto em qualquer corte de carne na Boutique! Válido para retirada HOJE no dia do sorteio.',
    couponCode: 'BOUTIQUE10',
    icon: 'Percent',
    color: '#009739',
    bgGradient: 'from-amber-500 to-amber-700',
  },
  {
    id: '15_PERCENT',
    title: '15% de Desconto! 🔥',
    label: '15% OFF',
    description: 'Sensacional! Você ganhou 15% de desconto para compras na Boutique! Válido para retirada HOJE no dia do sorteio.',
    couponCode: 'BOUTIQUE15',
    icon: 'Zap',
    color: '#9B1B1B',
    bgGradient: 'from-red-600 to-red-800',
  },
  {
    id: 'FREE_SHIPPING',
    title: 'Entrega Grátis! 🛵',
    label: 'Frete Grátis',
    description: 'Parabéns! Você ganhou entrega grátis em toda a região para o seu churrasco! Válido para pedido/retirada HOJE no dia do sorteio.',
    couponCode: 'ENTREGA_BOUTIQUE',
    icon: 'Truck',
    color: '#012169',
    bgGradient: 'from-blue-600 to-blue-850',
  },
  {
    id: 'SURPRISE_GIFT',
    title: 'Presente Surpresa! 🎁',
    label: 'Brinde Surpresa',
    description: 'Parabéns! Você ganhou um Presente Surpresa especial do churrasqueiro! Válido para retirada HOJE no dia do sorteio.',
    couponCode: 'BRINDE_BOUTIQUE',
    icon: 'Gift',
    color: '#009739',
    bgGradient: 'from-green-600 to-green-800',
  },
  {
    id: 'TRY_AGAIN',
    title: 'Não foi dessa vez! 😢',
    label: 'Mais uma vez',
    description: 'Bateu na trave! Mas relaxe, você receberá nossas novidades exclusivas e promoções da Boutique!',
    couponCode: 'ROLETA_NOVO_GIRAR',
    icon: 'Smile',
    color: '#78716c',
    bgGradient: 'from-zinc-500 to-stone-700',
  }
];

export const INSTAGRAM_HANDLE = 'boutiquedascarnes.bc'; // Updated handle as requested
export const STORE_PHONE_NUMBER = '5511999999999'; // Simulated store number for direct submissions
