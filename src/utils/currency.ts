export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

export const parseCurrencyInput = (value: string): number => {
  const cleanValue = value
    .replace(/[^\d,]/g, '')
    .replace(',', '.');

  return parseFloat(cleanValue) || 0;
};

export const maskCurrencyInput = (value: string): string => {
  let cleanValue = value.replace(/\D/g, '');

  if (cleanValue === '') return '';

  const numberValue = parseInt(cleanValue);
  const formatted = (numberValue / 100).toFixed(2);

  return formatted.replace('.', ',');
};
