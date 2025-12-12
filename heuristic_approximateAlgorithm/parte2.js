const fs = require('fs');
const path = require('path');



// --- Função Auxiliar: Cálculo de Custo ---

/**
 * Calcula o custo total de um ciclo TSP dado um caminho e a matriz de distâncias.
 */
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

// ------------------------------------------
// --- PARSER DE ARQUIVOS .TSP (TSPLIB) ---
// ------------------------------------------

/**
 * Analisa (parse) o conteúdo de um arquivo .tsp para construir a Matriz de Adjacência.
 * Implementa a lógica para preencher a matriz baseada apenas na diagonal superior ou inferior.
 */
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

// ------------------------------------------
// --- PARTE 2: IMPLEMENTAÇÃO DA HEURÍSTICA ---
// ------------------------------------------

/**
 * Heurística do Vizinho Mais Próximo (Nearest Neighbor).
 * Encontra a rota visitando a cidade não visitada mais próxima a cada passo.
 *
 * @param matriz A Matriz de Adjacência do problema.
 * @returns O objeto Rota com o caminho encontrado e seu custo.
 */
function nearestNeighborTSP(matriz) {
    const n = matriz.length;
    // O array 'visitado' marca quais cidades já foram incluídas na rota.
    const visitado = Array(n).fill(false);
    
    // Começa na cidade 0 (pode ser qualquer cidade, 0 é o padrão)
    let rota = [0]; 
    visitado[0] = true;
    let cidadeAtual = 0;

    // Repete n-1 vezes para visitar todas as n cidades
    for (let i = 0; i < n - 1; i++) {
        let menorDistancia = Infinity;
        let proximaCidade = -1;

        // Procura o vizinho não visitado mais próximo da cidadeAtual
        for (let j = 0; j < n; j++) {
            if (!visitado[j] && matriz[cidadeAtual][j] < menorDistancia) {
                menorDistancia = matriz[cidadeAtual][j];
                proximaCidade = j;
            }
        }

        // Adiciona a cidade mais próxima à rota
        if (proximaCidade !== -1) {
            cidadeAtual = proximaCidade;
            visitado[cidadeAtual] = true;
            rota.push(cidadeAtual);
        } else {
             // Isso não deve acontecer em um grafo conexo completo.
            break; 
        }
    }

    // Fecha o ciclo, retornando à cidade inicial (0)
    rota.push(0); 
    
    // Calcula o custo total da rota completa.
    const custoTotal = calcularCusto(matriz, rota);

    return { caminho: rota, custo: custoTotal };
}

// ------------------------------------------
// --- EXECUÇÃO (Aplicação nas Instâncias) ---
// ------------------------------------------

const INSTANCIAS_MODDLE = ['si535.tsp', 'pa561.tsp', 'si1032.tsp'];

function executarParte2() {
    console.log("---  Parte 2: Heurística do Vizinho Mais Próximo ---");
    console.log("Instância | N Cidades | Custo Encontrado");
    console.log("---------------------------------------");

    for (const fileName of INSTANCIAS_MODDLE) {
        try {
            // Assuma que os arquivos .tsp estão na mesma pasta do script TS
            const filePath = path.join(__dirname, fileName); 
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            
            // 1. Constrói a Matriz de Adjacência (Parser)
            const matriz = parseTSP(fileContent);
            const n = matriz.length;
            
            // 2. Aplica a Heurística
            const t0 = process.hrtime.bigint();
            const resultado = nearestNeighborTSP(matriz);
            const t1 = process.hrtime.bigint();
            
            const tempoExecucaoMs = Number(t1 - t0) / 1_000_000;
            
            // 3. Exibe os Resultados
            console.log(
                `${fileName.padEnd(9)} | ${n.toString().padEnd(9)} | ${resultado.custo.toLocaleString()} (Tempo: ${tempoExecucaoMs.toFixed(2)} ms)`
            );

        } catch (error) {
            console.error(`Erro ao processar ${fileName}:`, error.message);
        }
    }
    
}

// Executar
executarParte2();