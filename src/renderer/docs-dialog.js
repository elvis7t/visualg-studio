export const DOCS_TABS = [
  {
    title: 'Linguagem',
    sections: [
      { title: 'Introdução', text: 'Um algoritmo Visualg usa algoritmo, var, inicio e fimalgoritmo. Declare variáveis no bloco var e escreva os comandos no bloco inicio.' },
      { title: 'Tipos', text: 'Tipos suportados: inteiro, real, caracter/caractere, logico, vetor e matrizes com vetor[1..N] de tipo.' },
      { title: 'Entrada e Saída', text: 'Use leia(nome) para entrada, escreva(...) para imprimir na mesma linha e escreval(...) para imprimir com quebra de linha. O comando arquivo "caminho" faz com que os próximos leia(...) leiam as linhas do arquivo especificado.' },
      { title: 'Ponto e vírgula', text: 'Comandos simples podem ficar na mesma linha separados por ponto e vírgula, por exemplo a <- 1; b <- 2.' },
      { title: 'Utilitários', text: 'Comandos compatíveis: limpatela, pausa, eco on/off, timer on/off, cronometro, aleatorio on/off (ou aleatorio minimo,maximo) e debug on/off.' },
      { title: 'Condicionais', text: 'Use se condição entao, opcionalmente senao, e finalize com fimse.' },
      { title: 'Repetição', text: 'Use para/fimpara, enquanto/fimenquanto e repita/ate para laços. O comando interrompa encerra o laço atual.' },
      { title: 'Subprogramas', text: 'Use procedimento para comandos reutilizáveis e funcao para retornar valores com retorne. Parâmetros var recebem variáveis, itens de vetor e vetores completos por referência.' }
    ]
  },
  {
    title: 'Editor',
    sections: [
      { title: 'Indentação', text: 'Use Indentar no cabeçalho do editor ou Alt+Shift+F para organizar o código mantendo comentários // e blocos Visualg alinhados.' },
      { title: 'Autocompletar', text: 'Ao digitar, o editor sugere comandos, tipos, funções nativas e variáveis declaradas no algoritmo atual.' },
      { title: 'Busca', text: 'Use Ctrl+F para abrir a busca no editor. Use próximo/anterior para navegar pelas ocorrências sem sair do código.' },
      { title: 'Substituição', text: 'Use Ctrl+H para abrir busca com substituir. Você pode substituir a ocorrência atual ou todas as ocorrências encontradas.' },
      { title: 'Exportar e imprimir', text: 'Na barra de atividades, clique no ícone de chave inglesa para abrir as Ferramentas. Lá você pode exportar o código atual como .alg/.txt ou enviar o algoritmo para impressão.' },
      { title: 'Fluxograma', text: 'Na barra de atividades, clique nas Ferramentas (ícone de chave inglesa) e escolha Gerar Fluxograma para ver a representação visual do algoritmo. Na janela do fluxograma, use Exportar SVG ou Exportar PNG para salvar.' }
    ]
  },
  {
    title: 'Depuração',
    sections: [
      { title: 'Passo a passo', text: 'Clique em Depurar para iniciar uma sessão pausável. Próximo resume a execução até o próximo passo; Voltar navega pelos passos já visitados.' },
      { title: 'Pontos de parada', text: 'Clique diretamente no número da linha para marcar ou remover um ponto de parada. O número recebe um ponto vermelho. Ao depurar, a sessão inicia no primeiro passo que atingir uma linha marcada ou no próximo comando executável depois dela.' },
      { title: 'Linha atual', text: 'Durante a depuração, a linha correspondente também fica destacada no editor, sem depender apenas da lista de passos.' },
      { title: 'Variáveis', text: 'O painel de depuração mostra nome, tipo e valor atual das variáveis, incluindo vetores e matrizes.' },
      { title: 'Inspeção', text: 'Digite uma expressão no campo Inspeção para ver o resultado no passo atual. Exemplos: baixo + alto, notas[meio] ou chute = item. O placeholder é apenas uma sugestão; é preciso digitar a expressão.' },
      { title: 'Navegação', text: 'Próximo executa o próximo passo real da sessão. Continuar executa até o próximo ponto de parada posterior ou até o fim do algoritmo. Use Próximo ponto de parada e Ponto de parada anterior para saltar entre linhas marcadas já visitadas.' },
      { title: 'Saída até agora', text: 'A área de detalhes mostra a saída acumulada até o passo selecionado, ajudando a comparar execução e estado.' }
    ]
  },
  {
    title: 'Atalhos',
    sections: [
      { title: 'Arquivos', text: 'Ctrl+N cria um novo algoritmo, Ctrl+O abre um arquivo .alg e Ctrl+S salva o arquivo atual.' },
      { title: 'Edição', text: 'Ctrl+Z desfaz, Ctrl+Y refaz, Ctrl+Shift+Z também refaz, Ctrl+D duplica a linha e Alt+Shift+F indenta o algoritmo.' },
      { title: 'Execução', text: 'F9 executa o algoritmo, F5 inicia a depuração, F8 avança para o próximo passo e Shift+F8 volta um passo.' },
      { title: 'Busca', text: 'Ctrl+F abre a busca, Enter avança para a próxima ocorrência e Shift+Enter volta para a anterior.' },
      { title: 'Substituir', text: 'Ctrl+H abre busca e substituir. Use Substituir para trocar a seleção atual ou Substituir tudo para atualizar todas as ocorrências.' }
    ]
  },
  {
    title: 'Dicas',
    sections: [
      { title: 'Leia', text: 'Para programas com leia(...), informe cada entrada por linha no campo Entrada para leia quando quiser pré-preencher valores. Se a execução chegar em um leia sem valor disponível, o app abre o modal apenas para aquele valor.' },
      { title: 'Vetores', text: 'Declare vetor[1..10] de inteiro e preencha dinamicamente com lacos, por exemplo notas[i] <- i, em vez de repetir dez atribuicoes.' },
      { title: 'Limpeza', text: 'O botão Limpeza da barra principal limpa console, entrada e depuração. As vassouras locais limpam apenas o console ou apenas a depuração.' },
      { title: 'Organização', text: 'Use exemplos por categoria na lateral para estudar desde algoritmos simples até subprogramas, vetores e casos mais completos.' }
    ]
  }
];

export function createDocsDialog({ dialog, content, openButton, closeButton }) {
  return {
    init() {
      renderTabs(content);
      openButton.addEventListener('click', () => dialog.showModal());
      closeButton.addEventListener('click', () => dialog.close());
    }
  };
}

function renderTabs(content) {
  const tabList = document.createElement('div');
  const panel = document.createElement('div');
  tabList.className = 'docs-tabs';
  panel.className = 'docs-tab-panel';

  DOCS_TABS.forEach((tab, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = tab.title;
    button.className = index === 0 ? 'active' : '';
    button.addEventListener('click', () => {
      tabList.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      panel.replaceChildren(...tab.sections.map(createSection));
    });
    tabList.append(button);
  });

  panel.replaceChildren(...DOCS_TABS[0].sections.map(createSection));
  content.replaceChildren(tabList, panel);
}

function createSection({ title, text }) {
  const section = document.createElement('section');
  const heading = document.createElement('h3');
  const paragraph = document.createElement('p');
  heading.textContent = title;
  paragraph.textContent = text;
  section.append(heading, paragraph);
  return section;
}
