var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * Função para calcular o custo total de uma rota.
 * @param matriz Matriz de Adjacência.
 * @param caminho A sequência de cidades (ex: [0, 2, 1, 3, 0]).
 * @returns O custo total da rota.
 */
export function calcularCusto(matriz, caminho) {
    var custoTotal = 0;
    for (var i = 0; i < caminho.length - 1; i++) {
        // soma a distancia da cidade atual para a proxima
        custoTotal += matriz[caminho[i]][caminho[i + 1]];
    }
    // adiciona o custo de volta a cidade inicial (ja incluida na ultima posicao)
    return custoTotal;
}
/**
 *  Função para gerar todas as permutações.
 * Ex: para cidades [1, 2, 3], deve gerar [[1, 2, 3], [1, 3, 2], [2, 1, 3], ...]
 */
export function permutar(arr) {
    var resultados = []; // Armazena todas as permutações encontradas.
    var n = arr.length;
    /**
     * Função recursiva que gera as permutações.
     * @param k O índice atual que está sendo considerado para a troca (começa em 0).
     */
    function gerarPermutacoes(k) {
        var _a, _b;
        // Caso Base: Se 'k' for igual ao tamanho do array, significa que uma permutação completa foi formada.
        if (k === n) {
            // Adiciona uma cópia do array atualizado (permutado) aos resultados.
            // É essencial usar .slice() ou [..arr] para copiar, pois o array 'arr' continua sendo modificado.
            resultados.push(__spreadArray([], arr, true));
            return;
        }
        // Caso Recursivo: Tenta colocar todos os elementos restantes na posição 'k'.
        for (var i = k; i < n; i++) {
            // 1. Troca (Swap): Coloca o elemento 'i' na posição 'k'.
            _a = [arr[i], arr[k]], arr[k] = _a[0], arr[i] = _a[1];
            // 2. Chamada Recursiva: Fixa o elemento na posição 'k' e gera as permutações do restante (k+1).
            gerarPermutacoes(k + 1);
            // 3. Backtrack (Desfazer a Troca): Volta o array ao estado anterior para que a próxima iteração do 'for'
            // possa começar com o estado correto. Isso garante que não percamos permutações.
            _b = [arr[i], arr[k]], arr[k] = _b[0], arr[i] = _b[1];
        }
    }
    // Inicia o processo recursivo a partir do índice 0.
    gerarPermutacoes(0);
    return resultados;
}
export function forcaBrutaTSP(matriz) {
    var n = matriz.length;
    if (n < 2)
        return { caminho: [0], custo: 0 }; // Caso trivial
    // Cidades que não são a inicial.
    var cidadesIntermediarias = Array.from({ length: n - 1 }, function (_, i) { return i + 1; });
    // Gera todas as ordens possíveis para as cidades intermediárias.
    var todasPermutacoes = permutar(cidadesIntermediarias);
    var melhorRota = { custo: Infinity, caminho: [] };
    for (var _i = 0, todasPermutacoes_1 = todasPermutacoes; _i < todasPermutacoes_1.length; _i++) {
        var p = todasPermutacoes_1[_i];
        // Constrói a rota completa: Cidade Inicial (0) -> Permutação -> Cidade Inicial (0)
        var rotaCompleta = __spreadArray(__spreadArray([0], p, true), [0], false);
        var custoAtual = calcularCusto(matriz, rotaCompleta);
        if (custoAtual < melhorRota.custo) {
            melhorRota = { custo: custoAtual, caminho: rotaCompleta };
        }
    }
    return melhorRota;
}
