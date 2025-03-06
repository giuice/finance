import Papa from 'papaparse';
import { NubankCSVRow, ParsedCSVRow } from '../types';

/**
 * Parses a Nubank CSV file and returns an array of parsed expense data
 */
export const parseNubankCSV = (csvContent: string): Promise<ParsedCSVRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedRows = (results.data as NubankCSVRow[]).map(row => {
            // Parse date (format: "DD MMM")
            const dateParts = row.Date.split(' ');
            const day = parseInt(dateParts[0], 10);
            const monthStr = dateParts[1];
            
            // Map Portuguese month abbreviation to month number (0-11)
            const monthMap: { [key: string]: number } = {
              'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
              'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11
            };
            
            // Get current year for the date
            const currentYear = new Date().getFullYear();
            const month = monthMap[monthStr] || 0;
            
            // Create date object
            const date = new Date(currentYear, month, day);
            
            // Parse amount (replace comma with period for decimal)
            const amountStr = row['Amount (BRL)'].replace('.', '').replace(',', '.');
            const amount = parseFloat(amountStr);
            
            // Extract installment information if present
            const installmentRegex = /Parcela (\d+)\/(\d+)/;
            const installmentMatch = row.Description.match(installmentRegex);
            
            let installment = undefined;
            if (installmentMatch) {
              installment = {
                current: parseInt(installmentMatch[1], 10),
                total: parseInt(installmentMatch[2], 10)
              };
            }
            
            // Auto-categorize based on description keywords
            const category = categorizeExpense(row.Description);
            
            return {
              date,
              description: row.Description,
              amount,
              category,
              isFixedExpense: false, // User will need to mark fixed expenses manually
              installment
            };
          });
          
          resolve(parsedRows);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Simple auto-categorization based on keywords in the description
 */
const categorizeExpense = (description: string): string => {
  const lowerDesc = description.toLowerCase();
  
  // Define category keywords
  const categories: { [key: string]: string[] } = {
    'Food': ['restaurante', 'ifood', 'rappi'],
    'Boteco': ['cerveja', 'bar', 'boteco', 'chopp', 'drink', 'bebida', 'magal'],
    'Supermercado': ['mercado', 'supermercado', 'pao', 'acucar','zona sul','super'],
    'Transportation': ['uber', '99', 'taxi', 'combustivel', 'gasolina', 'estacionamento', 'metro', 'onibus','rio card'],
    'Housing': ['aluguel', 'condominio', 'agua', 'luz', 'energia', 'gas'],
    'Entertainment': ['netflix', 'spotify', 'cinema', 'teatro', 'show', 'tidal', 'disney'],
    'Shopping': ['shopping', 'loja', 'magazine', 'americanas', 'amazon', 'aliexpress', 'parcela'],
    'Health': ['farmacia', 'medico', 'consulta', 'exame', 'academia', 'gym', 'metavet','raia', 'droga'],
    'Education': ['curso', 'livro', 'escola', 'faculdade', 'universidade'],
    'Bills': ['fatura', 'conta', 'telefone', 'internet', 'celular', 'seguro']
  };
  
  // Check if description contains any category keywords
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
};

/**
 * Converts a File object to a string
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
