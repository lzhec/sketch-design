import { Currency } from '@shared/types/currency';
import { CurrencyCodes } from '@shared/types/preferences';

export const Currencies: Currency[] = [
  { code: CurrencyCodes.EUR, value: '€' },
  { code: CurrencyCodes.USD, value: '$' },
  { code: CurrencyCodes.RUB, value: '₽' },
];
