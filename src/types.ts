/**
 * Types representing the states and data of the Boutique das Carnes sweepstakes applet.
 */

export interface UserRegistration {
  name: string;
  phone: string;
  cpf: string;
}

export interface MatchGuess {
  brazilScore: number;
  haitiScore: number;
}

export interface MatchConfig {
  team1Name: string;
  team1Flag: string;
  team2Name: string;
  team2Flag: string;
}

export type PrizeId = '10_PERCENT' | '15_PERCENT' | 'FREE_BEER' | 'FREE_SHIPPING' | 'SURPRISE_GIFT' | 'TRY_AGAIN';

export interface Prize {
  id: PrizeId;
  title: string;
  label: string;
  description: string;
  couponCode: string;
  icon: string;
  color: string; // Tailwind class or hex color code
  bgGradient: string;
}

export type AppStep = 'INFO_FORM' | 'INSTAGRAM_UNLOCK' | 'SPIN_ROLETTE' | 'FINAL_SHARE';
