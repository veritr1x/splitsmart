/**
 * Formats a number as currency based on the provided currency settings
 * 
 * @param {number} amount - The amount to format
 * @param {object} currency - The currency object with symbol and code
 * @returns {string} - Formatted currency string with symbol and proper formatting
 */
export const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency.symbol}0.00`;
  }

  // Format amount based on currency
  switch (currency.code) {
    case 'JPY':
      // Japanese Yen typically doesn't use decimal places
      return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
    
    case 'INR':
      // Indian Rupee uses different thousand separators (lakhs, crores)
      return `${currency.symbol}${formatIndianCurrency(amount)}`;
    
    default:
      // Default format with 2 decimal places
      return `${currency.symbol}${parseFloat(amount).toFixed(2)}`;
  }
};

/**
 * Formats a number according to Indian numbering system (lakhs and crores)
 * 
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted amount according to Indian numbering system
 */
const formatIndianCurrency = (amount) => {
  const num = parseFloat(amount).toFixed(2);
  const parts = num.toString().split('.');
  const lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  const formatted = otherNumbers !== '' 
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree 
    : lastThree;
  
  return `${formatted}.${parts[1]}`;
};

/**
 * Removes currency symbol and formatting from a string
 * 
 * @param {string} formattedValue - The formatted currency string
 * @returns {number} - The numeric value
 */
export const parseCurrencyValue = (formattedValue) => {
  if (!formattedValue) return 0;
  
  // Remove currency symbols and all non-numeric characters except dots
  const numericString = formattedValue
    .replace(/[^\d.-]/g, '')
    .replace(/,/g, '');
  
  return parseFloat(numericString) || 0;
}; 