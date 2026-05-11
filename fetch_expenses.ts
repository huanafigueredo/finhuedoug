import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zpkiayaliicipxcjetqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa2lheWFsaWljaXB4Y2pldHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTE1NDAsImV4cCI6MjA4MDg4NzU0MH0.WlW5XknC8eJlMqGh_qigV3moWgZF_HBahoYqS2TXL9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'expense')
    .is('is_couple', false)
    .gte('date', '2026-05-01')
    .lte('date', '2026-05-31');

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  const missingExpenses = data.filter(t => t.for_who !== 'Huana' && t.for_who !== 'Douglas');
  
  console.log("Total expenses found:", missingExpenses.length);
  let totalSum = 0;
  missingExpenses.forEach(t => {
    totalSum += t.total_value;
    console.log(`- Data: ${t.date} | Descrição: ${t.description} | Valor: R$ ${(t.total_value / 100).toFixed(2)} | Para quem: ${t.for_who === null ? 'N/A' : t.for_who} | ID: ${t.id}`);
  });
  console.log(`Sum of total_value: R$ ${(totalSum / 100).toFixed(2)}`);
}

main();
