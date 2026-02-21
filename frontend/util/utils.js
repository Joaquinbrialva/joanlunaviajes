export function formatCurrency({ amount, currency = 'USD', locale = 'es-AR' }) {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		currencyDisplay: 'code',
	}).format(amount);
}
