import { Prize, MatchConfig } from './types';

export const DEFAULT_MATCH: MatchConfig = {
  team1Name: 'Brasil',
  team1Flag: '🇧🇷',
  team2Name: 'Haiti',
  team2Flag: '🇭🇹'
};

export function getLoadedMatch(): MatchConfig {
  try {
    const saved = localStorage.getItem('boutique_match_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading custom match', e);
  }
  return DEFAULT_MATCH;
}

export const PRIZES: Prize[] = [
  {
    id: 'FREE_BEER',
    title: 'Uma Cerveja Trincando! 🍺',
    label: 'Cerveja Grátis',
    description: 'Parabéns! Você ganhou uma cerveja artesanal trincando de gelada! Retirada em loja.',
    couponCode: 'CERVEJA_BOUTIQUE',
    icon: 'Beer',
    color: '#012169',
    bgGradient: 'from-orange-600 to-orange-850',
  },
  {
    id: '10_PERCENT',
    title: '10% de Desconto! 🥩',
    label: '10% OFF',
    description: 'Você ganhou 10% de desconto em qualquer corte de carne na Boutique! Retirada em loja.',
    couponCode: 'BOUTIQUE10',
    icon: 'Percent',
    color: '#009739',
    bgGradient: 'from-amber-500 to-amber-700',
  },
  {
    id: '15_PERCENT',
    title: '15% de Desconto! 🔥',
    label: '15% OFF',
    description: 'Sensacional! Você ganhou 15% de desconto para compras na Boutique! Retirada em loja.',
    couponCode: 'BOUTIQUE15',
    icon: 'Zap',
    color: '#9B1B1B',
    bgGradient: 'from-red-600 to-red-800',
  },
  {
    id: 'FREE_SHIPPING',
    title: 'Entrega Grátis! 🛵',
    label: 'Frete Grátis',
    description: 'Parabéns! Você ganhou entrega grátis em toda a região para o seu churrasco especial! Retirada em loja / Pedido.',
    couponCode: 'ENTREGA_BOUTIQUE',
    icon: 'Truck',
    color: '#012169',
    bgGradient: 'from-blue-600 to-blue-850',
  },
  {
    id: 'SURPRISE_GIFT',
    title: 'Presente Surpresa! 🎁',
    label: 'Brinde Surpresa',
    description: 'Parabéns! Você ganhou um Presente Surpresa especial do churrasqueiro! Retirada em loja.',
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
