import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function calcularCusto(matriz, caminho) {
    let custoTotal = 0;
    // O caminho deve ser um ciclo (ex: [0, 2, 1, 0])
    for (let i = 0; i < caminho.length - 1; i++) {
        const u = caminho[i];
        const v = caminho[i + 1];
        custoTotal += matriz[u][v];
    }
    return custoTotal;
}

function parseTSP(fileContent) {
    const lines = fileContent.split('\n');
    let n = 0;
    let edgeWeightFormat = '';
    let readingData = false;
    const data = []; // números dos pesos


    // 1. Extrai cabeçalho (DIMENSION e EDGE_WEIGHT_FORMAT)
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
        if (line.includes('EOF')) {
            readingData = false;
            break;
        }

        // 2. Extrai os dados da seção de pesos
        if (readingData) {
            // Divide a linha, remove espaços vazios e converte para número
            const parts = line.trim().split(/\s+/).map(p => parseInt(p)).filter(p => !isNaN(p));
            data.push(...parts);
        }
    }

    if (n === 0 || data.length === 0) {
        throw new Error("Formato TSP inválido ou dados ausentes.");
    }
    
    // 3. Constrói a Matriz de Adjacência
    const matriz = Array(n).fill(0).map(() => Array(n).fill(0));
    let dataIndex = 0;

    if (edgeWeightFormat === 'UPPER_ROW' || edgeWeightFormat === 'UPPER_DIAG_ROW') {
        // A sequência de dados é [0][1], [0][2], ..., [0][n-1], [1][2], ..., [1][n-1], ...
        // Usado por si535.tsp e si1032.tsp
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const peso = data[dataIndex++];
                matriz[i][j] = peso;
                matriz[j][i] = peso; // Simetria
            }
        }
    } else if (edgeWeightFormat === 'LOWER_ROW' || edgeWeightFormat === 'LOWER_DIAG_ROW') {
        // A sequência de dados é [1][0], [2][0], [2][1], [3][0], ..., [n-1][n-2], ...
        // Usado por pa561.tsp
         for (let i = 1; i < n; i++) {
            for (let j = 0; j < i; j++) {
                const peso = data[dataIndex++];
                matriz[i][j] = peso;
                matriz[j][i] = peso; // Simetria
            }
        }
    } else {
        throw new Error(`EDGE_WEIGHT_FORMAT ${edgeWeightFormat} não suportado.`);
    }

    return matriz;
}

// --- Funções Auxiliares de Kruskal (Union-Find) ---

/**
 * Cria a estrutura Union-Find.
 * parent[i] armazena o pai do elemento i.
 */
function makeSet(n) {
    const parent = Array(n).fill(0).map((_, i) => i);
    return parent;
}

/**
 * Encontra o representante (raiz) do conjunto ao qual o elemento i pertence.
 * @param parent Array de pais.
 * @param i Elemento a ser encontrado.
 * @returns O índice do representante (raiz).
 */
function findSet(parent, i) {
    if (parent[i] === i) {
        return i;
    }
    // Compressão de caminho (Path Compression)
    parent[i] = findSet(parent, parent[i]);
    return parent[i];
}

/**
 * Une os conjuntos que contêm i e j.
 * @param parent Array de pais.
 * @param i Elemento do primeiro conjunto.
 * @param j Elemento do segundo conjunto.
 */
function unionSet(parent, i, j) {
    const rootI = findSet(parent, i);
    const rootJ = findSet(parent, j);
    if (rootI !== rootJ) {
        // Simples união por rank/tamanho não implementada, apenas união.
        parent[rootI] = rootJ;
        return true; // União bem-sucedida
    }
    return false; // Já estão no mesmo conjunto
}

// ------------------------------------------
// --- Algoritmo de Kruskal (Encontrar AGM) ---
// ------------------------------------------

/**
 * Implementa o Algoritmo de Kruskal para encontrar a Árvore Geradora Mínima (AGM).
 * @param matriz A Matriz de Adjacência.
 * @returns A lista de arestas que formam a AGM. Aresta: [u, v, peso].
 */
function encontrarAGM(matriz) {
    const n = matriz.length;
    const arestas = [];

    // 1. Coleta todas as arestas do grafo
    for (let i = 0; i < n; i++) {
        // Começa de i+1 para evitar arestas duplicadas (i, j) e (j, i)
        for (let j = i + 1; j < n; j++) {
            arestas.push([i, j, matriz[i][j]]); // [u, v, peso]
        }
    }

    // 2. Ordena as arestas por peso crescente
    arestas.sort((a, b) => a[2] - b[2]);

    // 3. Aplica o Union-Find (Kruskal)
    const agmArestas = [];
    const parent = makeSet(n);
    let numArestas = 0;

    for (const aresta of arestas) {
        const [u, v, peso] = aresta;
        
        // Verifica se adicionar a aresta (u, v) não forma um ciclo
        if (findSet(parent, u) !== findSet(parent, v)) {
            unionSet(parent, u, v);
            agmArestas.push(aresta);
            numArestas++;
            
            // A AGM tem n-1 arestas em um grafo conexo
            if (numArestas === n - 1) {
                break;
            }
        }
    }
    return agmArestas;
}

// ------------------------------------------
// --- Caminhamento em Pré-Ordem (DFS) ---
// ------------------------------------------

/**
 * Converte a lista de arestas da AGM para uma Lista de Adjacência.
 * @param n Número de cidades.
 * @param agmArestas A lista de arestas da AGM.
 * @returns A AGM representada como Lista de Adjacência (Array de Arrays).
 */
function converterArestasParaListaAdj(n, agmArestas) {
    const listaAdj = Array(n).fill(0).map(() => []);

    for (const [u, v] of agmArestas) {
        listaAdj[u].push(v);
        listaAdj[v].push(u); // Arestas da AGM são bidirecionais
    }
    return listaAdj;
}

/**
 * Realiza um Caminhamento em Profundidade (DFS) em Pré-Ordem na AGM.
 * A ordem de primeira visita é a nossa rota aproximada.
 * @param n Número de cidades.
 * @param agmListaAdj A AGM em formato de Lista de Adjacência.
 * @returns A sequência de cidades visitadas (Pré-Ordem).
 */
function dfsPreOrder(n, agmListaAdj) {
    const rota = [];
    const visitado = Array(n).fill(false);

    function dfsRec(u) {
        visitado[u] = true;
        rota.push(u); // A cidade é adicionada na primeira visita (Pré-Ordem)

        for (const v of agmListaAdj[u]) {
            if (!visitado[v]) {
                dfsRec(v);
            }
        }
    }

    dfsRec(0); // Começa na cidade 0

    return rota;
}


// ------------------------------------------
// --- Algoritmo Aproximado TSP (Baseado em AGM) ---
// ------------------------------------------

/**
 * Implementa o Algoritmo Aproximado para o PCV (2-approximation based on MST).
 * 1. Encontra a AGM.
 * 2. Realiza um caminhamento DFS (Pré-Ordem) na AGM.
 * 3. Constrói o ciclo com o retorno ao início.
 * * @param matriz A Matriz de Adjacência.
 * @returns O objeto Rota com o caminho aproximado e seu custo.
 */
function aproximadoTSPAgm(matriz) {
    const n = matriz.length;
    if (n < 2) return { caminho: [0], custo: 0 };
    
    // 1. Encontra a AGM (Árvore Geradora Mínima)
    const agmArestas = encontrarAGM(matriz);
    // 

    // 2. Converte para Lista de Adjacência para o DFS
    const agmListaAdj = converterArestasParaListaAdj(n, agmArestas);

    // 3. Caminhamento DFS (Pré-Ordem)
    const ordemVisita = dfsPreOrder(n, agmListaAdj);
    
    // 4. Constrói a rota final e calcula o custo
    const rotaCompleta = [...ordemVisita, 0]; // Ordem de visita + volta ao início (0)
    
    const custoTotal = calcularCusto(matriz, rotaCompleta);

    return { caminho: rotaCompleta, custo: custoTotal };
}

const INSTANCIAS_MODDLE = ['si535.tsp', 'pa561.tsp', 'si1032.tsp'];

function executarParte3() {
    console.log("\n--- Parte 3: Algoritmo Aproximado (AGM) ---");
    console.log("Instância | N Cidades | Custo Encontrado");
    console.log("---------------------------------------");

    for (const fileName of INSTANCIAS_MODDLE) {
        try {
            const filePath = path.join(__dirname, fileName); 
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            
            const matriz = parseTSP(fileContent);
            const n = matriz.length;
            
            // Aplica o Algoritmo Aproximado baseado em AGM
            const t0 = process.hrtime.bigint();
            const resultado = aproximadoTSPAgm(matriz);
            const t1 = process.hrtime.bigint();
            
            const tempoExecucaoMs = Number(t1 - t0) / 1_000_000;
            
            // Exibe os Resultados 
            console.log(
                `${fileName.padEnd(9)} | ${n.toString().padEnd(9)} | ${resultado.custo.toLocaleString()} (Tempo: ${tempoExecucaoMs.toFixed(2)} ms)`
            );

        } catch (error) {
            console.error(`Erro ao processar ${fileName}:`, error.message);
        }
    }
    

}

// Executar
executarParte3();