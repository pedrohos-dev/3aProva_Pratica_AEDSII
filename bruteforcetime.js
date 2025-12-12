import { performance } from 'perf_hooks';
import { gerarInstancia } from "./matrizadj.js";
import { forcaBrutaTSP } from "./bruteforce.js";


for (var n = 2; n <= 11; n++) {
    var instancia = gerarInstancia(n);
    var t0 = performance.now(); // Início da medição
    var resultado = forcaBrutaTSP(instancia);
    var t1 = performance.now(); // Fim da medição
    var tempoExecucao = t1 - t0;
    console.log("N=".concat(n, ", Tempo: ").concat(tempoExecucao.toFixed(2), " ms, Custo \u00D3timo: ").concat(resultado.custo));
    // Armazene N e TempoExecucao para o gráfico de crescimento exponencial.
}
