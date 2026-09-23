import type { QuizQuestionDto } from '../../src/learning-activity/learning-activity.dto';
// Source mapping and reviewed adaptations: README.md.
export const quizzes: Record<'architecture' | 'sql', QuizQuestionDto[]> = {
  architecture: [
    {
      id: 'architecture-01',
      prompt:
        'Os computadores da Primeira Geração (aproximadamente 1945–1955) eram caracterizados pelo uso de qual componente eletrônico principal e por quais limitações fundamentais? ',
      choices: [
        {
          id: 'A',
          text: 'Transistores; alto consumo de energia e velocidade na ordem de nanosegundos.',
        },
        {
          id: 'B',
          text: 'Válvulas a vácuo; grande dimensão física, alto consumo de energia e alta geração de calor.',
        },
        {
          id: 'C',
          text: 'Circuitos Integrados (CI); necessidade de refrigeração líquida e programação em assembly.',
        },
        {
          id: 'D',
          text: 'Microprocessadores; falta de sistema operacional e uso de cartões perfurados.',
        },
        {
          id: 'E',
          text: 'Válvulas a vácuo; suporte pleno a multiprocessamento e memória magnética de núcleo.',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'A primeira geração utilizava válvulas, com grande consumo de energia e dissipação de calor.',
    },
    {
      id: 'architecture-02',
      prompt:
        'A Segunda Geração de computadores (década de 1950 a 1960) substituiu as válvulas eletrônicas por qual tecnologia, trazendo maior confiabilidade e menor consumo de energia? ',
      choices: [
        {
          id: 'A',
          text: 'Circuitos Integrados de Larga Escala (LSI).',
        },
        {
          id: 'B',
          text: 'Transistores.',
        },
        {
          id: 'C',
          text: 'Microprocessadores monocip.',
        },
        {
          id: 'D',
          text: 'Relés eletromecânicos.',
        },
        {
          id: 'E',
          text: 'Valvulas termoionicas compactas.',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'Os transistores substituíram as válvulas na segunda geração.',
    },
    {
      id: 'architecture-03',
      prompt:
        'O marco inicial da Terceira Geração de computadores foi o desenvolvimento e emprego comercial dos: ',
      choices: [
        {
          id: 'A',
          text: 'Processadores Intel 8086.',
        },
        {
          id: 'B',
          text: 'Circuitos Integrados (CIs) ou Chips de Silício.',
        },
        {
          id: 'C',
          text: 'Cartões perfurados padrão IBM.',
        },
        {
          id: 'D',
          text: 'Microprocessadores VLSI.',
        },
        {
          id: 'E',
          text: 'Computadores quânticos de supercondução.',
        },
      ],
      correctChoiceId: 'B',
      explanation: 'Circuitos integrados caracterizam a terceira geração.',
    },
    {
      id: 'architecture-04',
      prompt:
        'A Quarta Geração de computadores (a partir da década de 1970) é marcada pelo surgimento dos microprocessadores graças ao avanço das tecnologias: ',
      choices: [
        {
          id: 'A',
          text: 'LSI (Large Scale Integration) e VLSI (Very Large Scale Integration).',
        },
        {
          id: 'B',
          text: 'Válvulas termoionicas miniaturizadas.',
        },
        {
          id: 'C',
          text: 'Lógicas de lógica nebulosa (Fuzzy Logic) nativas.',
        },
        {
          id: 'D',
          text: 'Processamento óptico de fotões.',
        },
        {
          id: 'E',
          text: 'Relés de estado sólido sem semicondutores.',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'LSI e VLSI permitiram integrar a CPU em um microprocessador.',
    },
    {
      id: 'architecture-05',
      prompt:
        'A Quinta Geração de computadores é conceitualmente associada a avanços na área de: ',
      choices: [
        {
          id: 'A',
          text: 'Substituição total de linguagens de alto nível por código de máquina puro.',
        },
        {
          id: 'B',
          text: 'Inteligência Artificial, processamento paralelo maciço e computação quântica/neomórfica.',
        },
        {
          id: 'C',
          text: 'Retorno ao processamento sequencial em lote (batch processing).',
        },
        {
          id: 'D',
          text: 'Uso exclusivo de tubos de raios catódicos para armazenamento primário.',
        },
        {
          id: 'E',
          text: 'Eliminação completa de barramentos de dados em prol de conexões seriais mecânicas.',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'Na classificação didática da lista, a quinta geração é associada à inteligência artificial e ao processamento paralelo.',
    },
    {
      id: 'architecture-06',
      prompt:
        'O computador ENIAC (Electronic Numerical Integrator and Computer) é classificado historicamente como um marco de qual geração de computadores?',
      choices: [
        {
          id: 'A',
          text: 'Primeira Geração.',
        },
        {
          id: 'B',
          text: 'Segunda Geração.',
        },
        {
          id: 'C',
          text: 'Terceira Geração.',
        },
        {
          id: 'D',
          text: 'Quarta Geração.',
        },
        {
          id: 'E',
          text: 'Geração Zero (Mecânica).',
        },
      ],
      correctChoiceId: 'A',
      explanation: 'O ENIAC pertence à primeira geração, baseada em válvulas.',
    },
    {
      id: 'architecture-07',
      prompt:
        'Em arquitetura de computadores, qual é a diferença fundamental entre as definições de prefixos decimais (SI) e binários (IEC) para unidades de armazenamento (ex: Kilobyte vs Kibibyte)? ',
      choices: [
        {
          id: 'A',
          text: '1 Kilobyte (KB) equivale a 10³ = 1000 bytes, enquanto 1 Kibibyte (KiB) equivale a 2¹⁰ = 1024 bytes.',
        },
        {
          id: 'B',
          text: '1 Kibibyte (KiB) equivale a 1000 bytes, enquanto 1 Kilobyte (KB) equivale a 1024 bytes.',
        },
        {
          id: 'C',
          text: 'Ambos representam rigorosamente 1024 bytes, variando apenas o idioma da nomenclatura.',
        },
        {
          id: 'D',
          text: 'Kilobyte refere-se à memória RAM e Kibibyte refere-se exclusivamente a discos rígidos.',
        },
        {
          id: 'E',
          text: 'Kibibyte é a unidade oficial para transmissão de dados de rede, e Kilobyte para barramentos.',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'O prefixo decimal k corresponde a 1000; Ki corresponde a 1024.',
    },
    {
      id: 'architecture-08',
      prompt:
        'Um arquivo possui exatamente 4 MiB (Mebibytes). Quantos bytes esse arquivo contém?',
      choices: [
        {
          id: 'A',
          text: '4.000.000 bytes',
        },
        {
          id: 'B',
          text: '4.096.000 bytes',
        },
        {
          id: 'C',
          text: '4.194.304 bytes',
        },
        {
          id: 'D',
          text: '4.000.102 bytes',
        },
        {
          id: 'E',
          text: '8.388.608 bytes',
        },
      ],
      correctChoiceId: 'C',
      explanation: '4 × 1024 × 1024 = 4194304 bytes.',
    },
    {
      id: 'architecture-09',
      prompt:
        'Se um link de internet possui taxa de transmissão de 100 Mbps (Megabits por segundo), qual o tempo teórico mínimo necessário para realizar o download de um arquivo de 300 MB (Megabytes)? ',
      choices: [
        {
          id: 'A',
          text: '3 segundos.',
        },
        {
          id: 'B',
          text: '8 segundos.',
        },
        {
          id: 'C',
          text: '24 segundos.',
        },
        {
          id: 'D',
          text: '30 segundos.',
        },
        {
          id: 'E',
          text: '240 segundos.',
        },
      ],
      correctChoiceId: 'C',
      explanation:
        '300 MB × 8 = 2400 Mb; 2400 / 100 = 24 segundos, desconsiderando overhead.',
    },
    {
      id: 'architecture-10',
      prompt:
        'O clock de um processador é medido em Hertz (Hz). Se um processador opera a uma frequência de 3,2 GHz, qual é o tempo aproximado de duração de um ciclo de clock (período T = 1/f)?',
      choices: [
        {
          id: 'A',
          text: '0,3125 nanosegundos (ns).',
        },
        {
          id: 'B',
          text: '3,125 microsegundos (µs).',
        },
        {
          id: 'C',
          text: '0,3125 milissegundos (ms).',
        },
        {
          id: 'D',
          text: '3,2 picosegundos (ps).',
        },
        {
          id: 'E',
          text: '31,25 nanosegundos (ns).',
        },
      ],
      correctChoiceId: 'A',
      explanation: '1 / (3,2 × 10⁹) s = 0,3125 ns.',
    },
    {
      id: 'architecture-11',
      prompt:
        'Quantos bits existem em um registro de memória composto por 16 Bytes e 4 Nibbles?',
      choices: [
        {
          id: 'A',
          text: '128 bits',
        },
        {
          id: 'B',
          text: '144 bits',
        },
        {
          id: 'C',
          text: '160 bits',
        },
        {
          id: 'D',
          text: '200 bits',
        },
        {
          id: 'E',
          text: '256 bits',
        },
      ],
      correctChoiceId: 'B',
      explanation: '16 × 8 + 4 × 4 = 144 bits.',
    },
    {
      id: 'architecture-12',
      prompt:
        'A taxa de transferência de um barramento de dados é calculada pelo produto da largura do barramento (em bytes) pela sua frequência de operação. Um barramento de 64 bits operando a 800 MHz possui uma largura de banda teórica de: ',
      choices: [
        {
          id: 'A',
          text: '51,2 GB/s',
        },
        {
          id: 'B',
          text: '6,4 GB/s',
        },
        {
          id: 'C',
          text: '12,8 GB/s',
        },
        {
          id: 'D',
          text: '800 MB/s',
        },
        {
          id: 'E',
          text: '3,2 GB/s',
        },
      ],
      correctChoiceId: 'B',
      explanation: '64 / 8 × 800 milhões = 6,4 bilhões de bytes/s.',
    },
    {
      id: 'architecture-13',
      prompt:
        'A conversão do número decimal 45₁₀ para a base binária resulta em: ',
      choices: [
        {
          id: 'A',
          text: '101101₂',
        },
        {
          id: 'B',
          text: '110101₂',
        },
        {
          id: 'C',
          text: '101011₂',
        },
        {
          id: 'D',
          text: '111001₂',
        },
        {
          id: 'E',
          text: '100111₂',
        },
      ],
      correctChoiceId: 'A',
      explanation: '45 = 32 + 8 + 4 + 1, portanto 101101₂.',
    },
    {
      id: 'architecture-14',
      prompt:
        'Qual é a representação binária de 8 bits (byte) do número decimal 117₁₀?',
      choices: [
        {
          id: 'A',
          text: '01110101₂',
        },
        {
          id: 'B',
          text: '01101101₂',
        },
        {
          id: 'C',
          text: '01110110₂',
        },
        {
          id: 'D',
          text: '10000101₂',
        },
        {
          id: 'E',
          text: '01011101₂',
        },
      ],
      correctChoiceId: 'A',
      explanation: '117 = 64 + 32 + 16 + 4 + 1, portanto 01110101₂.',
    },
    {
      id: 'architecture-15',
      prompt: 'O valor decimal 255₁₀ em binário corresponde a: ',
      choices: [
        {
          id: 'A',
          text: '10000000₂',
        },
        {
          id: 'B',
          text: '11111111₂',
        },
        {
          id: 'C',
          text: '11111110₂',
        },
        {
          id: 'D',
          text: '10101010₂',
        },
        {
          id: 'E',
          text: '01111111₂',
        },
      ],
      correctChoiceId: 'B',
      explanation: '255 = 2⁸ − 1, portanto 11111111₂.',
    },
    {
      id: 'architecture-16',
      prompt:
        'Convertendo a parte fracionária do número decimal 0,625₁₀ para binário, obtém-se exatamente:',
      choices: [
        {
          id: 'A',
          text: '0,101₂',
        },
        {
          id: 'B',
          text: '0,110₂',
        },
        {
          id: 'C',
          text: '0,011₂',
        },
        {
          id: 'D',
          text: '0,111₂',
        },
        {
          id: 'E',
          text: '0,1001₂',
        },
      ],
      correctChoiceId: 'A',
      explanation: '0,625 = 1/2 + 1/8, portanto 0,101₂.',
    },
    {
      id: 'architecture-17',
      prompt: 'O valor decimal correspondente ao número binário 1101011₂ é: ',
      choices: [
        {
          id: 'A',
          text: '107₁₀',
        },
        {
          id: 'B',
          text: '214₁₀',
        },
        {
          id: 'C',
          text: '105₁₀',
        },
        {
          id: 'D',
          text: '99₁₀',
        },
        {
          id: 'E',
          text: '111₁₀',
        },
      ],
      correctChoiceId: 'A',
      explanation: '64 + 32 + 8 + 2 + 1 = 107.',
    },
    {
      id: 'architecture-18',
      prompt:
        'Convertendo o número binário sem sinal 10011100₂ para a base decimal, encontra-se:',
      choices: [
        {
          id: 'A',
          text: '156₁₀',
        },
        {
          id: 'B',
          text: '148₁₀',
        },
        {
          id: 'C',
          text: '164₁₀',
        },
        {
          id: 'D',
          text: '152₁₀',
        },
        {
          id: 'E',
          text: '160₁₀',
        },
      ],
      correctChoiceId: 'A',
      explanation: '128 + 16 + 8 + 4 = 156.',
    },
    {
      id: 'architecture-19',
      prompt:
        'Em um circuito digital, um barramento de 5 bits apresenta o sinal lógico 11101₂. Qual o equivalente decimal desse sinal? ',
      choices: [
        {
          id: 'A',
          text: '27₁₀',
        },
        {
          id: 'B',
          text: '29₁₀',
        },
        {
          id: 'C',
          text: '31₁₀',
        },
        {
          id: 'D',
          text: '25₁₀',
        },
        {
          id: 'E',
          text: '23₁₀',
        },
      ],
      correctChoiceId: 'B',
      explanation: '16 + 8 + 4 + 1 = 29.',
    },
    {
      id: 'architecture-20',
      prompt: 'Qual é o valor em base decimal da fração binária 0,011₂?',
      choices: [
        {
          id: 'A',
          text: '0,375₁₀',
        },
        {
          id: 'B',
          text: '0,250₁₀',
        },
        {
          id: 'C',
          text: '0,125₁₀',
        },
        {
          id: 'D',
          text: '0,625₁₀',
        },
        {
          id: 'E',
          text: '0,300₁₀',
        },
      ],
      correctChoiceId: 'A',
      explanation: '1/4 + 1/8 = 0,375.',
    },
    {
      id: 'architecture-21',
      prompt:
        'A conversão do número decimal 254₁₀ para a base Hexadecimal resulta em: ',
      choices: [
        {
          id: 'A',
          text: 'FE₁₆',
        },
        {
          id: 'B',
          text: 'FF₁₆',
        },
        {
          id: 'C',
          text: 'EF₁₆',
        },
        {
          id: 'D',
          text: 'E14₁₆',
        },
        {
          id: 'E',
          text: 'FD₁₆',
        },
      ],
      correctChoiceId: 'A',
      explanation: '254 = 15 × 16 + 14 = FE₁₆.',
    },
    {
      id: 'architecture-22',
      prompt:
        'O endereço de memória representado em decimal como 4095₁₀ equivale em Hexadecimal a: ',
      choices: [
        {
          id: 'A',
          text: 'FFF₁₆',
        },
        {
          id: 'B',
          text: '1000₁₆',
        },
        {
          id: 'C',
          text: 'EEE₁₆',
        },
        {
          id: 'D',
          text: 'FFA₁₆',
        },
        {
          id: 'E',
          text: 'ABC₁₆',
        },
      ],
      correctChoiceId: 'A',
      explanation: '4095 = 16³ − 1 = FFF₁₆.',
    },
    {
      id: 'architecture-23',
      prompt: 'O valor decimal 170₁₀ corresponde em Hexadecimal a:',
      choices: [
        {
          id: 'A',
          text: 'AA₁₆',
        },
        {
          id: 'B',
          text: 'BB₁₆',
        },
        {
          id: 'C',
          text: 'A5₁₆',
        },
        {
          id: 'D',
          text: '10A₁₆',
        },
        {
          id: 'E',
          text: '9B₁₆',
        },
      ],
      correctChoiceId: 'A',
      explanation: '170 = 10 × 16 + 10 = AA₁₆.',
    },
    {
      id: 'architecture-24',
      prompt:
        'Um registrador armazena o valor decimal 3054₁₀. Em Hexadecimal, esse valor é escrito como:',
      choices: [
        {
          id: 'A',
          text: 'BEE₁₆',
        },
        {
          id: 'B',
          text: 'CEE₁₆',
        },
        {
          id: 'C',
          text: 'BEEE₁₆',
        },
        {
          id: 'D',
          text: 'BED₁₆',
        },
        {
          id: 'E',
          text: 'BEF₁₆',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        '3054 = 11 × 256 + 14 × 16 + 14 = BEE₁₆. A alternativa D duplicada no original foi corrigida nesta versão.',
    },
    {
      id: 'architecture-25',
      prompt:
        'O endereço Hexadecimal de rede MAC 1A3F₁₆ equivale, em sua representação binária direta, a: ',
      choices: [
        {
          id: 'A',
          text: '0001 1010 0011 1111₂',
        },
        {
          id: 'B',
          text: '0001 1011 0011 1110₂',
        },
        {
          id: 'C',
          text: '0010 1010 0100 1111₂',
        },
        {
          id: 'D',
          text: '0001 1001 0011 1111₂',
        },
        {
          id: 'E',
          text: '0001 1010 0111 1111₂',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'Cada dígito hexadecimal corresponde a quatro bits: 1=0001, A=1010, 3=0011, F=1111.',
    },
    {
      id: 'architecture-26',
      prompt:
        'Ao converter a instrução Hexadecimal C7₁₆ para binário, obtém-se:',
      choices: [
        {
          id: 'A',
          text: '11000111₂',
        },
        {
          id: 'B',
          text: '11010111₂',
        },
        {
          id: 'C',
          text: '10100111₂',
        },
        {
          id: 'D',
          text: '11000110₂',
        },
        {
          id: 'E',
          text: '11100111₂',
        },
      ],
      correctChoiceId: 'A',
      explanation: 'C=1100 e 7=0111, portanto 11000111₂.',
    },
    {
      id: 'architecture-27',
      prompt:
        'A cor representável em HTML/CSS pelo código Hexadecimal #4B0082 (Indigo) possui o seguinte valor no primeiro byte (componente R = 4B₁₆) em binário:',
      choices: [
        {
          id: 'A',
          text: '01001011₂',
        },
        {
          id: 'B',
          text: '01001010₂',
        },
        {
          id: 'C',
          text: '01011011₂',
        },
        {
          id: 'D',
          text: '00101011₂',
        },
        {
          id: 'E',
          text: '01001100₂',
        },
      ],
      correctChoiceId: 'A',
      explanation: '4=0100 e B=1011, portanto 01001011₂.',
    },
    {
      id: 'architecture-28',
      prompt:
        'O código Hexadecimal 0x9F4A convertido bloco a bloco (4 bits por dígito) para binário é: ',
      choices: [
        {
          id: 'A',
          text: '1001 1111 0100 1010₂',
        },
        {
          id: 'B',
          text: '1001 1110 0100 1010₂',
        },
        {
          id: 'C',
          text: '1000 1111 0100 1010₂',
        },
        {
          id: 'D',
          text: '1001 1111 0101 1010₂',
        },
        {
          id: 'E',
          text: '1001 1111 0100 1100₂',
        },
      ],
      correctChoiceId: 'A',
      explanation: '9=1001, F=1111, 4=0100 e A=1010.',
    },
    {
      id: 'architecture-29',
      prompt:
        'Realize a soma entre os números em bases diferentes: 1A₁₆ (Hexadecimal) + 10110₂ (Binário). Qual o resultado final expresso em Decimal? ',
      choices: [
        {
          id: 'A',
          text: '48₁₀',
        },
        {
          id: 'B',
          text: '42₁₀',
        },
        {
          id: 'C',
          text: '52₁₀',
        },
        {
          id: 'D',
          text: '38₁₀',
        },
        {
          id: 'E',
          text: '46₁₀',
        },
      ],
      correctChoiceId: 'A',
      explanation: '1A₁₆ = 26; 10110₂ = 22; 26 + 22 = 48.',
    },
    {
      id: 'architecture-30',
      prompt:
        'Qual das seguintes igualdades entre representações em bases distintas está CORRETA? ',
      choices: [
        {
          id: 'A',
          text: '2B₁₆ = 101011₂ = 43₁₀',
        },
        {
          id: 'B',
          text: '3F₁₆ = 111111₂ = 65₁₀',
        },
        {
          id: 'C',
          text: '1F₁₆ = 10000₂ = 31₁₀',
        },
        {
          id: 'D',
          text: 'A0₁₆ = 10100000₂ = 150₁₀',
        },
        {
          id: 'E',
          text: '55₁₆ = 01010101₂ = 80₁₀',
        },
      ],
      correctChoiceId: 'A',
      explanation: '2B₁₆ = 32 + 11 = 43; 101011₂ = 32 + 8 + 2 + 1 = 43.',
    },
  ],
  sql: [
    {
      id: 'sql-01',
      prompt:
        'No contexto da linguagem SQL, qual das seguintes instruções é categorizada estritamente como um comando DML (Data Manipulation Language) utilizado para inserir novos registros em uma tabela?',
      choices: [
        {
          id: 'A',
          text: 'CREATE TABLE',
        },
        {
          id: 'B',
          text: 'INSERT INTO',
        },
        {
          id: 'C',
          text: 'ADD ROW',
        },
        {
          id: 'D',
          text: 'ALTER TABLE',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'INSERT INTO insere novas linhas; CREATE e ALTER alteram a estrutura.',
    },
    {
      id: 'sql-02',
      prompt:
        'Considere a tabela Livro (id_livro, titulo, autor, ano). Qual é a sintaxe SQL correta e padrão para inserir um novo registro nesta tabela informando todos os campos explicitamente?',
      choices: [
        {
          id: 'A',
          text: "INSERT INTO Livro (id_livro, titulo, autor, ano) VALUES (101, 'Banco de Dados', 'Silberschatz', 2020);",
        },
        {
          id: 'B',
          text: "ADD INTO Livro (101, 'Banco de Dados', 'Silberschatz', 2020);",
        },
        {
          id: 'C',
          text: "INSERT Livro SET id_livro=101, titulo='Banco de Dados', autor='Silberschatz', ano=2020;",
        },
        {
          id: 'D',
          text: "UPDATE Livro INSERT (101, 'Banco de Dados', 'Silberschatz', 2020);",
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'A lista de colunas associa explicitamente cada valor ao campo de destino.',
    },
    {
      id: 'sql-03',
      prompt:
        'O que acontece ao executar o comando DELETE FROM Usuarios; sem especificar uma cláusula WHERE em um banco de dados relacional (assumindo que não há restrições de integridade referencial impedindo a operação)?',
      choices: [
        {
          id: 'A',
          text: 'Ocorre um erro de sintaxe, pois a cláusula WHERE é obrigatória no comando DELETE.',
        },
        {
          id: 'B',
          text: 'Apenas o primeiro registro da tabela Usuarios é removido.',
        },
        {
          id: 'C',
          text: 'Todos os registros da tabela Usuarios são apagados, mantendo a estrutura da tabela.',
        },
        {
          id: 'D',
          text: 'A tabela Usuarios é completamente destruída e removida do esquema do banco de dados.',
        },
      ],
      correctChoiceId: 'C',
      explanation:
        'Sem WHERE, DELETE remove todas as linhas, mantendo a tabela.',
    },
    {
      id: 'sql-04',
      prompt:
        "Deseja-se atualizar o salário de todos os funcionários do departamento 'TI' para R$ 8.000,00 na tabela Funcionario. Qual instrução SQL realiza essa operação corretamente? Tabela: Funcionario (id, nome, departamento, salario)",
      choices: [
        {
          id: 'A',
          text: "UPDATE Funcionario SET salario = 8000 WHERE departamento = 'TI';",
        },
        {
          id: 'B',
          text: "MODIFY Funcionario SET salario = 8000 WHERE departamento = 'TI';",
        },
        {
          id: 'C',
          text: "CHANGE Funcionario SALARIO = 8000 IF departamento = 'TI';",
        },
        {
          id: 'D',
          text: "UPDATE salario = 8000 FROM Funcionario WHERE departamento = 'TI';",
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'SET define o valor e WHERE limita a alteração ao departamento TI.',
    },
    {
      id: 'sql-05',
      prompt:
        "Ao executar a instrução SQL INSERT INTO Clientes (id, nome) VALUES (1, 'Ana'), (2, 'Bruno'), (3, 'Carla'); em um SGBD compatível com o padrão ANSI SQL, qual é o resultado esperado?",
      choices: [
        {
          id: 'A',
          text: 'Ocorrerá um erro de sintaxe, pois o comando INSERT só aceita uma tupla por comando.',
        },
        {
          id: 'B',
          text: 'Serão inseridos três novos registros na tabela Clientes através de um único comando de inserção múltipla.',
        },
        {
          id: 'C',
          text: "Apenas a primeira tupla (1, 'Ana') será inserida e as outras serão ignoradas.",
        },
        {
          id: 'D',
          text: 'A tabela Clientes será recriada contendo apenas esses três registros.',
        },
      ],
      correctChoiceId: 'B',
      explanation: 'Cada grupo entre parênteses representa uma nova linha.',
    },
    {
      id: 'sql-06',
      prompt:
        "Considere a tabela Acervo (id_item, titulo, emprestado). Deseja-se alterar o status de todos os itens emprestados (emprestado = 'S') para disponível (emprestado = 'N'). Assinale a alternativa correta:",
      choices: [
        {
          id: 'A',
          text: "UPDATE Acervo WHERE emprestado = 'S' SET emprestado = 'N';",
        },
        {
          id: 'B',
          text: "UPDATE Acervo SET emprestado = 'N' WHERE emprestado = 'S';",
        },
        {
          id: 'C',
          text: "ALTER Acervo SET emprestado = 'N' IF emprestado = 'S';",
        },
        {
          id: 'D',
          text: "MODIFY Acervo VALUE emprestado = 'N' WHERE emprestado = 'S';",
        },
      ],
      correctChoiceId: 'B',
      explanation: 'A ordem é UPDATE tabela SET atribuições WHERE condição.',
    },
    {
      id: 'sql-07',
      prompt:
        'Em relação ao comando DELETE e ao comando DROP TABLE em SQL, assinale a afirmação correta:',
      choices: [
        {
          id: 'A',
          text: 'Ambas são instruções DDL que removem dados e metadados da tabela.',
        },
        {
          id: 'B',
          text: 'DELETE remove dados (linhas) da tabela, mantendo sua estrutura; DROP TABLE remove a tabela e sua estrutura do banco.',
        },
        {
          id: 'C',
          text: 'DROP TABLE remove apenas as linhas da tabela, enquanto DELETE apaga a tabela do catálogo do sistema.',
        },
        {
          id: 'D',
          text: 'O comando DELETE não permite a utilização de cláusula WHERE, enquanto o DROP TABLE permite.',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'DELETE remove linhas; DROP TABLE remove a estrutura e os dados.',
    },
    {
      id: 'sql-08',
      prompt:
        'Na gestão de sistemas de informação documental, necessita-se aumentar em 10% o valor da taxa de atraso na tabela Configuracao para todas as categorias. Qual comando executa essa alteração de forma reajustada?',
      choices: [
        {
          id: 'A',
          text: 'UPDATE Configuracao SET taxa = taxa * 1.10;',
        },
        {
          id: 'B',
          text: 'UPDATE Configuracao ADD 10% TO taxa;',
        },
        {
          id: 'C',
          text: 'ALTER TABLE Configuracao INCREASE taxa BY 10%;',
        },
        {
          id: 'D',
          text: 'INSERT INTO Configuracao (taxa) VALUES (taxa * 1.10);',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'Multiplicar por 1,10 aplica um aumento de 10% ao valor atual.',
    },
    {
      id: 'sql-09',
      prompt:
        "Se executarmos o comando INSERT INTO Alunos (id, nome) VALUES (NULL, 'Carlos'); em uma tabela onde a coluna id é definida como PRIMARY KEY sem auto-incremento, o que acontecerá?",
      choices: [
        {
          id: 'A',
          text: 'O banco atribui automaticamente o valor 0 para o id.',
        },
        {
          id: 'B',
          text: 'O registro é inserido normalmente com id nulo.',
        },
        {
          id: 'C',
          text: 'Ocorre um erro de restrição de integridade (not null / primary key), rejeitando a inserção.',
        },
        {
          id: 'D',
          text: 'O registro substitui a chave primária do último aluno cadastrado.',
        },
      ],
      correctChoiceId: 'C',
      explanation:
        'Uma chave primária não aceita NULL; sem geração automática, forneça o identificador.',
    },
    {
      id: 'sql-10',
      prompt:
        "Considere a instrução: DELETE FROM Documentos WHERE data_criacao < '2020-01-01' AND status = 'Archived';. O que essa instrução realiza?",
      choices: [
        {
          id: 'A',
          text: 'Apaga todos os documentos arquivados ou criados antes de 2020.',
        },
        {
          id: 'B',
          text: "Apaga os documentos criados estritamente antes de 01/01/2020 e cujo status seja 'Archived'.",
        },
        {
          id: 'C',
          text: 'Atualiza a data de criação dos documentos arquivados para 2020.',
        },
        {
          id: 'D',
          text: 'Remove a coluna status da tabela Documentos para datas anteriores a 2020.',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'AND exige simultaneamente a data anterior ao limite e o status Archived.',
    },
    {
      id: 'sql-11',
      prompt:
        'Para inserir o resultado de uma consulta SELECT realizada em uma tabela temporária diretamente dentro de uma tabela permanente Relatorio, qual padrão de comando SQL deve ser empregado?',
      choices: [
        {
          id: 'A',
          text: 'INSERT INTO Relatorio SELECT * FROM TempRelatorio;',
        },
        {
          id: 'B',
          text: 'INSERT INTO Relatorio VALUES (SELECT * FROM TempRelatorio);',
        },
        {
          id: 'C',
          text: 'UPDATE Relatorio SET DATA = (SELECT * FROM TempRelatorio);',
        },
        {
          id: 'D',
          text: 'MERGE INTO Relatorio VALUES FROM TempRelatorio;',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'INSERT INTO ... SELECT usa as linhas de uma consulta como origem; as colunas devem ser compatíveis.',
    },
    {
      id: 'sql-12',
      prompt:
        "Deseja-se atualizar simultaneamente duas colunas (status para 'Inativo' e data_modificacao para '2026-09-11') na tabela Usuarios para o id 45. Qual sintaxe é correta?",
      choices: [
        {
          id: 'A',
          text: "UPDATE Usuarios SET status = 'Inativo' AND data_modificacao = '2026-09-11' WHERE id = 45;",
        },
        {
          id: 'B',
          text: "UPDATE Usuarios SET status = 'Inativo', data_modificacao = '2026-09-11' WHERE id = 45;",
        },
        {
          id: 'C',
          text: "UPDATE Usuarios SET (status = 'Inativo', data_modificacao = '2026-09-11') WHERE id = 45;",
        },
        {
          id: 'D',
          text: "MODIFY Usuarios SET status = 'Inativo' THEN data_modificacao = '2026-09-11' WHERE id = 45;",
        },
      ],
      correctChoiceId: 'B',
      explanation: 'Atribuições no SET são separadas por vírgulas.',
    },
    {
      id: 'sql-13',
      prompt:
        'Considere uma chave estrangeira (Foreign Key) configurada com ON DELETE CASCADE. Se um registro da tabela pai for removido com um comando DELETE, o que ocorre com os registros associados na tabela filho?',
      choices: [
        {
          id: 'A',
          text: 'O comando DELETE falha e gera um erro de violação de chave estrangeira.',
        },
        {
          id: 'B',
          text: 'Os registros associados na tabela filho têm seus campos FK alterados para NULL.',
        },
        {
          id: 'C',
          text: 'Os registros correspondentes na tabela filho são automaticamente excluídos.',
        },
        {
          id: 'D',
          text: 'Os registros na tabela filho permanecem inalterados e órfãos.',
        },
      ],
      correctChoiceId: 'C',
      explanation:
        'ON DELETE CASCADE exclui os filhos que referenciam a linha removida.',
    },
    {
      id: 'sql-14',
      prompt:
        'O comando SQL UPDATE Produtos SET preco = preco - 5; sem a cláusula WHERE executará qual ação no banco de dados?',
      choices: [
        {
          id: 'A',
          text: 'Reduzirá R$ 5,00 do preço de todos os produtos cadastrados na tabela.',
        },
        {
          id: 'B',
          text: 'Causará um erro de execução por falta do parâmetro de busca WHERE.',
        },
        {
          id: 'C',
          text: 'Alterará apenas o preço do primeiro produto listado na tabela.',
        },
        {
          id: 'D',
          text: 'Reduzirá o preço dos produtos que possuem preço maior que 5.',
        },
      ],
      correctChoiceId: 'A',
      explanation: 'Sem WHERE, o desconto é aplicado a todas as linhas.',
    },
    {
      id: 'sql-15',
      prompt:
        'Assinale a alternativa contendo o comando correto para remover todos os registros da tabela Logs que possuem mais de 30 dias de criação, considerando o campo dias_criacao:',
      choices: [
        {
          id: 'A',
          text: 'REMOVE FROM Logs WHERE dias_criacao > 30;',
        },
        {
          id: 'B',
          text: 'DELETE FROM Logs WHERE dias_criacao > 30;',
        },
        {
          id: 'C',
          text: 'DROP FROM Logs WHERE dias_criacao > 30;',
        },
        {
          id: 'D',
          text: 'TRUNCATE Logs WHERE dias_criacao > 30;',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'DELETE ... WHERE dias_criacao > 30 preserva as linhas com até 30 dias.',
    },
    {
      id: 'sql-16',
      prompt:
        "Considere a tabela Autores (id_autor, nome, nacionalidade). Se executarmos INSERT INTO Autores (nome) VALUES ('Machado de Assis'); em uma tabela onde id_autor é auto-incremento e nacionalidade aceita valores nulos, qual será o resultado?",
      choices: [
        {
          id: 'A',
          text: 'Erro, pois é obrigatório informar todos os campos declarados na tabela no INSERT.',
        },
        {
          id: 'B',
          text: "O registro é inserido com id_autor gerado automaticamente, nome 'Machado de Assis' e nacionalidade NULL.",
        },
        {
          id: 'C',
          text: 'O registro é rejeitado por falta do valor da nacionalidade.',
        },
        {
          id: 'D',
          text: "Inserção ocorre, mas a nacionalidade assume uma string vazia ('').",
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'A identidade é gerada e a coluna omitida sem default recebe NULL se permitido.',
    },
    {
      id: 'sql-17',
      prompt:
        'Em uma transação SQL (utilizando BEGIN TRANSACTION), se executarmos um comando UPDATE seguido por um comando ROLLBACK;, qual será o estado dos dados?',
      choices: [
        {
          id: 'A',
          text: 'As alterações do UPDATE serão salvas permanentemente no disco.',
        },
        {
          id: 'B',
          text: 'As alterações feitas pelo UPDATE serão desfeitas, retornando os dados ao estado anterior à transação.',
        },
        {
          id: 'C',
          text: 'O banco de dados será corrompido devido à interrupção abrupta.',
        },
        {
          id: 'D',
          text: 'Os registros afetados serão excluídos da tabela automaticamente.',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'ROLLBACK desfaz as alterações da transação ainda não confirmada.',
    },
    {
      id: 'sql-18',
      prompt:
        'Qual subcláusula ou operador pode ser utilizado em conjunto com a instrução UPDATE para atualizar dados com base nos valores provenientes de outra tabela em SQL padrão?',
      choices: [
        {
          id: 'A',
          text: 'Cláusula JOIN ou Subconsultas (Subqueries).',
        },
        {
          id: 'B',
          text: 'Cláusula GROUP BY.',
        },
        {
          id: 'C',
          text: 'Operador UNION ALL.',
        },
        {
          id: 'D',
          text: 'Comando MERGE INDEX.',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'Subconsultas podem fornecer valores; no PostgreSQL também há UPDATE ... FROM. A sintaxe de JOIN varia por SGBD.',
    },
    {
      id: 'sql-19',
      prompt:
        'No PostgreSQL, qual afirmação descreve corretamente TRUNCATE TABLE e DELETE FROM?',
      choices: [
        {
          id: 'A',
          text: 'TRUNCATE permite remover linhas seletivas usando a cláusula WHERE.',
        },
        {
          id: 'B',
          text: 'DELETE é uma operação DDL mais rápida que TRUNCATE.',
        },
        {
          id: 'C',
          text: 'TRUNCATE remove todas as linhas sem aceitar WHERE; DELETE permite remover linhas selecionadas por WHERE.',
        },
        {
          id: 'D',
          text: 'TRUNCATE exclui os acionadores (triggers) e índices permanentemente da tabela.',
        },
      ],
      correctChoiceId: 'C',
      explanation:
        'TRUNCATE remove todas as linhas e não aceita WHERE; DELETE permite filtrar. No PostgreSQL, TRUNCATE é transacional e gera WAL.',
    },
    {
      id: 'sql-20',
      prompt:
        "A tabela Editoras possui exatamente duas colunas, nome e cidade, nessa ordem, e aceita os valores fornecidos. Por que INSERT INTO Editoras VALUES ('Editora A', 'Rio de Janeiro'); é válido?",
      choices: [
        {
          id: 'A',
          text: 'Os dois valores correspondem às duas colunas da tabela, na ordem em que foram definidas.',
        },
        {
          id: 'B',
          text: 'A tabela possuir mais de duas colunas com valores padrão definidos.',
        },
        {
          id: 'C',
          text: "A chave primária for a coluna 'Editora A'.",
        },
        {
          id: 'D',
          text: 'O comando for antecedido por um comando UPDATE.',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'Com exatamente essas duas colunas na ordem informada e sem impedimentos de integridade, os valores correspondem à definição.',
    },
    {
      id: 'sql-21',
      prompt:
        "Considere a tabela Acesso (id, usuario, ip, data_acesso). Deseja-se excluir todos os registros cujo IP comece com o prefixo '192.168.'. Qual comando SQL realiza essa filtragem e remoção?",
      choices: [
        {
          id: 'A',
          text: "DELETE FROM Acesso WHERE ip LIKE '192.168.%';",
        },
        {
          id: 'B',
          text: "DELETE FROM Acesso WHERE ip = '192.168.*';",
        },
        {
          id: 'C',
          text: "DROP FROM Acesso WHERE ip IN ('192.168.');",
        },
        {
          id: 'D',
          text: "REMOVE Acesso WHERE ip EQUALS '192.168.%';",
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'No LIKE, % representa qualquer sequência de caracteres após o prefixo.',
    },
    {
      id: 'sql-22',
      prompt:
        "O que ocorre ao tentar executar o comando UPDATE Emprestimos SET data_devolucao = '2026-09-10' WHERE id = 10; se o registro de id = 10 não existir na tabela?",
      choices: [
        {
          id: 'A',
          text: 'O SGBD retorna um erro fatal de "Registro não encontrado".',
        },
        {
          id: 'B',
          text: 'O SGBD insere automaticamente um novo registro com id = 10.',
        },
        {
          id: 'C',
          text: 'O comando executa com sucesso, mas 0 linhas são afetadas no banco de dados.',
        },
        {
          id: 'D',
          text: 'O banco bloqueia a tabela até que o registro seja inserido.',
        },
      ],
      correctChoiceId: 'C',
      explanation:
        'Sem linhas correspondentes ao WHERE, UPDATE termina afetando zero linhas.',
    },
    {
      id: 'sql-23',
      prompt:
        'Em linguagem SQL, quando desejamos realizar uma operação que insere um registro caso ele não exista, ou atualiza o registro caso ele já exista, qual comando/conceito do padrão ANSI é utilizado?',
      choices: [
        {
          id: 'A',
          text: 'MERGE (popularmente conhecido como UPSERT)',
        },
        {
          id: 'B',
          text: 'INSERT UPDATE JOIN',
        },
        {
          id: 'C',
          text: 'UPDATE OR INSERT INTO',
        },
        {
          id: 'D',
          text: 'ALTER INSERT CASCADE',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'MERGE expressa ações condicionais de atualização/inserção; PostgreSQL também oferece INSERT ... ON CONFLICT.',
    },
    {
      id: 'sql-24',
      prompt:
        'Ao utilizar o comando DELETE FROM Categorias WHERE id_categoria IN (1, 2, 3);, qual é a ação promovida no banco?',
      choices: [
        {
          id: 'A',
          text: 'Exclusão de todas as categorias cujos IDs sejam exatamente 1, 2 ou 3.',
        },
        {
          id: 'B',
          text: 'Exclusão das categorias com IDs entre 1 e 3 apenas se houver 3 registros.',
        },
        {
          id: 'C',
          text: 'Erro de sintaxe, pois o operador IN não pode ser aplicado em instruções DELETE.',
        },
        {
          id: 'D',
          text: 'Exclusão apenas do registro de ID igual a 1.',
        },
      ],
      correctChoiceId: 'A',
      explanation: 'IN seleciona qualquer um dos identificadores enumerados.',
    },
    {
      id: 'sql-25',
      prompt:
        'Considere a instrução UPDATE Funcionarios SET salario = salario * 1.05 WHERE tempo_servico > 5;. Assinale a opção que descreve corretamente seu efeito:',
      choices: [
        {
          id: 'A',
          text: 'Concede um aumento de 5% apenas aos funcionários com tempo de serviço superior a 5 anos.',
        },
        {
          id: 'B',
          text: 'Multiplica o tempo de serviço de todos os funcionários por 1.05.',
        },
        {
          id: 'C',
          text: 'Define o salário fixo de R$ 1,05 para quem tem mais de 5 anos de serviço.',
        },
        {
          id: 'D',
          text: 'Eleva o salário de todos os funcionários em R$ 5,00.',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'Multiplicar por 1,05 acrescenta 5%; o filtro exige mais de cinco anos.',
    },
    {
      id: 'sql-26',
      prompt:
        "Se uma instrução INSERT INTO Clientes (id, nome, email) VALUES (10, 'Maria', 'maria@email.com'); for executada e violar uma restrição UNIQUE no campo email, o que ocorrerá?",
      choices: [
        {
          id: 'A',
          text: 'O e-mail existente será sobrescrito com o novo valor.',
        },
        {
          id: 'B',
          text: 'A inserção será rejeitada pelo SGBD retornando uma exceção de violação de unicidade.',
        },
        {
          id: 'C',
          text: 'O cliente será inserido mas o campo email ficará em branco.',
        },
        {
          id: 'D',
          text: 'Será gerado um e-mail alternativo com sufixo numérico.',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'UNIQUE rejeita valores duplicados; um INSERT simples não sobrescreve a linha existente.',
    },
    {
      id: 'sql-27',
      prompt:
        'Qual dos seguintes comandos SQL é utilizado para modificar os valores de colunas existentes em linhas existentes de uma tabela?',
      choices: [
        {
          id: 'A',
          text: 'ALTER TABLE',
        },
        {
          id: 'B',
          text: 'UPDATE',
        },
        {
          id: 'C',
          text: 'MODIFY COLUMN',
        },
        {
          id: 'D',
          text: 'CHANGE',
        },
      ],
      correctChoiceId: 'B',
      explanation: 'UPDATE altera valores de linhas existentes.',
    },
    {
      id: 'sql-28',
      prompt:
        'Analise o comando: DELETE FROM Artigos WHERE conteudo IS NULL;. Qual é o resultado dessa instrução?',
      choices: [
        {
          id: 'A',
          text: 'Apaga todos os registros em que o campo conteudo tem valor nulo.',
        },
        {
          id: 'B',
          text: 'Apaga o conteúdo das colunas, mantendo as linhas na tabela.',
        },
        {
          id: 'C',
          text: 'Dá erro de sintaxe pois o correto seria WHERE conteudo = NULL.',
        },
        {
          id: 'D',
          text: 'Exclui a coluna conteudo da tabela Artigos.',
        },
      ],
      correctChoiceId: 'A',
      explanation:
        'IS NULL testa ausência de valor; = NULL não seleciona essas linhas.',
    },
    {
      id: 'sql-29',
      prompt:
        'Qual é a forma correta de inserir múltiplos registros em um único comando SQL no padrão ANSI?',
      choices: [
        {
          id: 'A',
          text: 'INSERT INTO Tabela (col1) VALUES (val1), (val2), (val3);',
        },
        {
          id: 'B',
          text: 'INSERT INTO Tabela (col1) VALUES (val1) AND VALUES (val2);',
        },
        {
          id: 'C',
          text: 'INSERT MULTIPLE INTO Tabela (col1) VALUES (val1, val2, val3);',
        },
        {
          id: 'D',
          text: 'INSERT INTO Tabela SET col1 = val1, val2, val3;',
        },
      ],
      correctChoiceId: 'A',
      explanation: 'VALUES aceita várias tuplas separadas por vírgulas.',
    },
    {
      id: 'sql-30',
      prompt:
        'Assinale a alternativa que representa uma boa prática de segurança ao executar comandos UPDATE ou DELETE diretamente em ambientes de produção:',
      choices: [
        {
          id: 'A',
          text: 'Desabilitar a checagem de chaves primárias antes da execução.',
        },
        {
          id: 'B',
          text: 'Executar previamente um SELECT com a mesma cláusula WHERE para conferir os registros afetados, e utilizar transações explícitas (BEGIN/COMMIT/ROLLBACK).',
        },
        {
          id: 'C',
          text: 'Substituir o comando DELETE por DROP TABLE seguido de CREATE TABLE.',
        },
        {
          id: 'D',
          text: 'Executar a operação sem a cláusula WHERE para garantir a consistência global dos dados.',
        },
      ],
      correctChoiceId: 'B',
      explanation:
        'Confira os registros com SELECT e use transações para controlar a confirmação ou reversão.',
    },
  ],
};
