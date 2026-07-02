// Estimativa de tempo de leitura a partir do corpo bruto do post (md/mdx),
// a ~200 palavras por minuto. Código, tags e imports não contam como leitura.
export function minutosDeLeitura(texto: string): number {
  const limpo = texto
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^import .*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_[\]()`]/g, ' ');
  const palavras = limpo.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}
