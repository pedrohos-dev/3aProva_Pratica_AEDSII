/**
 * Função utilitária para gerar uma Matriz de Adjacência para 'n' cidades
 * com distâncias aleatórias.
 * @param n O número de cidades.
 * @returns Matriz de Adjacência.
 */
export function gerarInstancia(n) {
    var matriz = Array(n).fill(0).map(function () { return Array(n).fill(0); });
    // As distancias devem ser positivas
    for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
            // gera um peso aleatorio e positivo
            var peso = Math.floor(Math.random() * 100) + 1;
            matriz[i][j] = peso;
            matriz[j][i] = peso;
        }
    }
    return matriz;
}
