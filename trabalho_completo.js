import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =======================================================
// === FUNÇÕES DE UTILIDADE E ESTRUTURAS DE DADOS (TSP) ===
// =======================================================

// Tipos base para o problema
// Em JS, usamos comentários para simular tipagem (JSDoc)
/** @typedef {number} Distancia */
/** @typedef {Distancia[][]} MatrizAdjacencia */
/** @typedef {{caminho: number[], custo: number}} Rota */
/** @typedef {[number, number, number]} Aresta - [u, v, peso] */

/**
 * Calcula o custo total de um ciclo TSP dado um caminho e a matriz de distâncias.
 * @param {MatrizAdjacencia} matriz
 * @param {number[]} caminho
 * @returns {number}
 */
function calcularCusto(matriz, caminho) {
    let custoTotal = 0;
    for (let i = 0; i < caminho.length - 1; i++) {
        const u = caminho[i];
        const v = caminho[i + 1];
        custoTotal += matriz[u][v];
    }
    return custoTotal;
}

/**
 * Gera uma Matriz de Adjacência para 'n' cidades com distâncias aleatórias.
 * @param {number} n
 * @returns {MatrizAdjacencia}
 */
function gerarInstancia(n) {
    const matriz = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const peso = Math.floor(Math.random() * 100) + 1; 
            matriz[i][j] = peso;
            matriz[j][i] = peso; 
        }
    }
    return matriz;
}

/**
 * Analisa (parse) o conteúdo de um arquivo .tsp (TSPLIB) para construir a Matriz de Adjacência.
 * Suporta formatos UPPER_ROW/UPPER_DIAG_ROW e LOWER_ROW/LOWER_DIAG_ROW.
 * @param {string} fileContent
 * @returns {MatrizAdjacencia}
 */
function parseTSP(fileContent) {
    // Lógica de parsing (copiada da Parte 2)
    const lines = fileContent.split('\n');
    let n = 0;
    let edgeWeightFormat = '';
    let readingData = false;
    const data = [];

    for (const line of lines) {
        if (line.includes('DIMENSION')) {
            n = parseInt(line.split(':')[1].trim());
        }
        if (line.includes('EDGE_WEIGHT_FORMAT')) {
            edgeWeightFormat = line.split(':')[1].trim();
        }
        if (line.includes('EDGE_WEIGHT_SECTION')) {
            readingData = true;
            continue;
        }
        if (line.includes('EOF') || (readingData && line.trim() === '')) {
            readingData = false;
            break;
        }
        if (readingData) {
            const parts = line.trim().split(/\s+/).map(p => parseInt(p)).filter(p => !isNaN(p));
            data.push(...parts);
        }
    }

    if (n === 0 || data.length === 0) {
        throw new Error("Formato TSP inválido ou dados ausentes.");
    }
    
    const matriz = Array(n).fill(0).map(() => Array(n).fill(0));
    let dataIndex = 0;

    if (edgeWeightFormat.includes('UPPER_')) {
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const peso = data[dataIndex++];
                matriz[i][j] = peso;
                matriz[j][i] = peso;
            }
        }
    } else if (edgeWeightFormat.includes('LOWER_')) {
         for (let i = 1; i < n; i++) {
            for (let j = 0; j < i; j++) {
                const peso = data[dataIndex++];
                matriz[i][j] = peso;
                matriz[j][i] = peso;
            }
        }
    } else {
        throw new Error(`EDGE_WEIGHT_FORMAT ${edgeWeightFormat} não suportado.`);
    }

    return matriz;
}


// =======================================================
// === PARTE 1: FORÇA BRUTA (Para Gráfico de Crescimento) ===
// =======================================================

/**
 * Gera todas as permutações possíveis de um array. (Recursão com Backtracking)
 * @param {number[]} arr
 * @returns {number[][]}
 */
function permutar(arr) {
    const resultados = []; 
    const n = arr.length;

    function gerarPermutacoes(k) {
        if (k === n) {
            resultados.push([...arr]);
            return;
        }

        for (let i = k; i < n; i++) {
            // Troca (Swap)
            [arr[k], arr[i]] = [arr[i], arr[k]]; 

            // Chamada Recursiva
            gerarPermutacoes(k + 1);

            // Backtrack (Desfaz a Troca)
            [arr[k], arr[i]] = [arr[i], arr[k]];
        }
    }

    gerarPermutacoes(0);

    return resultados;
}

/**
 * Implementa o PCV por Força Bruta.
 * @param {MatrizAdjacencia} matriz
 * @returns {Rota}
 */
function forcaBrutaTSP(matriz) {
    const n = matriz.length;
    if (n < 2) return { caminho: [0], custo: 0 }; 
    
    const cidadesIntermediarias = Array.from({ length: n - 1 }, (_, i) => i + 1); 
    const todasPermutacoes = permutar(cidadesIntermediarias); 
    
    let melhorRota = { custo: Infinity, caminho: [] };
    
    for (const p of todasPermutacoes) {
        const rotaCompleta = [0, ...p, 0];
        const custoAtual = calcularCusto(matriz, rotaCompleta);
        
        if (custoAtual < melhorRota.custo) {
            melhorRota = { custo: custoAtual, caminho: rotaCompleta };
        }
    }
    
    return melhorRota;
}

// =======================================================
// === PARTE 2: HEURÍSTICA (Vizinho Mais Próximo) ===
// =======================================================

/**
 * Heurística do Vizinho Mais Próximo (Nearest Neighbor).
 * @param {MatrizAdjacencia} matriz
 * @returns {Rota}
 */
function nearestNeighborTSP(matriz) {
    const n = matriz.length;
    const visitado = Array(n).fill(false);
    
    let rota = [0]; 
    visitado[0] = true;
    let cidadeAtual = 0;

    for (let i = 0; i < n - 1; i++) {
        let menorDistancia = Infinity;
        let proximaCidade = -1;

        for (let j = 0; j < n; j++) {
            if (!visitado[j] && matriz[cidadeAtual][j] < menorDistancia) {
                menorDistancia = matriz[cidadeAtual][j];
                proximaCidade = j;
            }
        }

        if (proximaCidade !== -1) {
            cidadeAtual = proximaCidade;
            visitado[cidadeAtual] = true;
            rota.push(cidadeAtual);
        } else {
             break; 
        }
    }

    rota.push(0); 
    const custoTotal = calcularCusto(matriz, rota);

    return { caminho: rota, custo: custoTotal };
}

// =======================================================
// === PARTE 3: ALGORITMO APROXIMADO (AGM - Kruskal) ===
// =======================================================

// --- Auxiliares de Kruskal (Union-Find) ---
function makeSet(n) {
    return Array(n).fill(0).map((_, i) => i);
}
function findSet(parent, i) {
    if (parent[i] === i) return i;
    parent[i] = findSet(parent, parent[i]);
    return parent[i];
}
function unionSet(parent, i, j) {
    const rootI = findSet(parent, i);
    const rootJ = findSet(parent, j);
    if (rootI !== rootJ) {
        parent[rootI] = rootJ;
        return true;
    }
    return false;
}

/**
 * Implementa Kruskal para encontrar a Árvore Geradora Mínima (AGM).
 * @param {MatrizAdjacencia} matriz
 * @returns {Aresta[]}
 */
function encontrarAGM(matriz) {
    const n = matriz.length;
    const arestas = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            arestas.push([i, j, matriz[i][j]]); 
        }
    }
    arestas.sort((a, b) => a[2] - b[2]);

    const agmArestas = [];
    const parent = makeSet(n);
    let numArestas = 0;

    for (const aresta of arestas) {
        const [u, v] = aresta;
        if (findSet(parent, u) !== findSet(parent, v)) {
            unionSet(parent, u, v);
            agmArestas.push(aresta);
            numArestas++;
            if (numArestas === n - 1) break;
        }
    }
    return agmArestas;
}

/**
 * Converte a lista de arestas da AGM para uma Lista de Adjacência.
 * @param {number} n
 * @param {Aresta[]} agmArestas
 * @returns {number[][]}
 */
function converterArestasParaListaAdj(n, agmArestas) {
    const listaAdj = Array(n).fill(0).map(() => []);
    for (const [u, v] of agmArestas) {
        listaAdj[u].push(v);
        listaAdj[v].push(u); 
    }
    return listaAdj;
}

/**
 * Realiza um Caminhamento em Profundidade (DFS) em Pré-Ordem.
 * @param {number} n
 * @param {number[][]} agmListaAdj
 * @returns {number[]}
 */
function dfsPreOrder(n, agmListaAdj) {
    const rota = [];
    const visitado = Array(n).fill(false);

    function dfsRec(u) {
        visitado[u] = true;
        rota.push(u);
        for (const v of agmListaAdj[u]) {
            if (!visitado[v]) {
                dfsRec(v);
            }
        }
    }
    dfsRec(0);
    return rota;
}

/**
 * Implementa o Algoritmo Aproximado para o PCV (2-approximation based on MST).
 * @param {MatrizAdjacencia} matriz
 * @returns {Rota}
 */
function aproximadoTSPAgm(matriz) {
    const n = matriz.length;
    if (n < 2) return { caminho: [0], custo: 0 };
    
    // 1. Encontra a AGM
    const agmArestas = encontrarAGM(matriz);
    
    // 2. Converte para Lista de Adjacência e faz o DFS
    const agmListaAdj = converterArestasParaListaAdj(n, agmArestas);
    const ordemVisita = dfsPreOrder(n, agmListaAdj);
    
    // 3. Constrói a rota final e calcula o custo
    const rotaCompleta = [...ordemVisita, 0];
    const custoTotal = calcularCusto(matriz, rotaCompleta);

    return { caminho: rotaCompleta, custo: custoTotal };
}

// =======================================================
// === FUNÇÃO PRINCIPAL DE EXECUÇÃO E RELATÓRIO ===
// =======================================================

const INSTANCIAS_MODDLE = ['si535.tsp', 'pa561.tsp', 'si1032.tsp'];

function executarTrabalho() {
    
    // ----------------------------------------------------------------
    // 1. DADOS PARA O GRÁFICO DE CRESCIMENTO EXPONENCIAL (FORÇA BRUTA)
    // ----------------------------------------------------------------
    
    console.log("=========================================================================================");
    console.log("  1. RELATÓRIO: Crescimento Exponencial do PCV (Força Bruta)");
    console.log("=========================================================================================");
    console.log("Tamanho (N) | Tempo de Execução (ms)");
    console.log("------------------------------------");
    
    // Limite o N a 10 ou 11 no máximo, pois o tempo cresce exponencialmente (N! vezes mais lento)
    const MAX_N_BRUTE_FORCE = 11;
    const dadosGrafico = [];

    for (let n = 2; n <= MAX_N_BRUTE_FORCE; n++) {
        try {
            const instancia = gerarInstancia(n);
            const t0 = process.hrtime.bigint();
            forcaBrutaTSP(instancia); // Executa o algoritmo
            const t1 = process.hrtime.bigint();
            
            const tempoExecucaoMs = Number(t1 - t0) / 1_000_000;
            
            console.log(`  ${n.toString().padEnd(10)}| ${tempoExecucaoMs.toFixed(3)}`);
            dadosGrafico.push({ n, tempo: tempoExecucaoMs });

        } catch (error) {
            console.log(`  ${n.toString().padEnd(10)}| *Abortado (Memória/Tempo limite)*`);
            break; 
        }
    }
    

    // 

    
    // ----------------------------------------------------------------
    // 2. DISTÂNCIAS ENCONTRADAS (HEURÍSTICA e ALGORITMO APROXIMADO)
    // ----------------------------------------------------------------
    
    console.log("=========================================================================================");
    console.log("  2. RELATÓRIO: Distâncias para Instâncias Grandes (TSP)");
    console.log("=========================================================================================");
    console.log("Instância  | N Cidades | Heurística (Viz. Próximo) | Aproximado (AGM)");
    console.log("-----------------------------------------------------------------------------------------");

    for (const fileName of INSTANCIAS_MODDLE) {
        try {
            const filePath = path.join(__dirname, fileName); 
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            
            const matriz = parseTSP(fileContent);
            const n = matriz.length;
            
            // --- Heurística ---
            const resultadoHeuristica = nearestNeighborTSP(matriz);
            
            // --- Algoritmo Aproximado ---
            const resultadoAproximado = aproximadoTSPAgm(matriz);
            
            // --- Exibe os Resultados ---
            console.log(
                `${fileName.padEnd(9)} | ${n.toString().padEnd(9)} | ${resultadoHeuristica.custo.toLocaleString().padEnd(25)} | ${resultadoAproximado.custo.toLocaleString()}`
            );

        } catch (error) {
            console.error(`\nERRO FATAL ao processar ${fileName}: ${error.message}`);
            console.error("Verifique se os arquivos TSP foram baixados e estão na mesma pasta.");
        }
    }
}

// Inicia a execução do trabalho
executarTrabalho();