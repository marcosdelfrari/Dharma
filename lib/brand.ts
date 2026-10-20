/** Symbol claro — fundos escuros */
export const DHARMA_LOGO = "/dharma.webp";

/** Symbol escuro — fundos claros (tema light) */
export const DHARMA_LOGO_ON_LIGHT = "/dharmapreto.webp";

/**
 * Diretriz de marca: use o symbol OU o wordmark — nunca os dois juntos.
 * No tema claro, o symbol preto; no escuro, o symbol claro.
 */
export function dharmaSymbol(theme: "light" | "dark" = "dark") {
  return theme === "light" ? DHARMA_LOGO_ON_LIGHT : DHARMA_LOGO;
}
