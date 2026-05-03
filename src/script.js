(function(){
  const salarioEl = document.getElementById('salario');
  const inicioEl = document.getElementById('inicio');
  const terminoEl = document.getElementById('termino');
  const motivoEl = document.getElementById('motivo');
  const calcularBtn = document.getElementById('calcular');

  const saldoEl = document.getElementById('saldo');
  const multaEl = document.getElementById('multa');
  const totalEl = document.getElementById('total');

  const incluir13El = document.getElementById('incluir13');
  const incluirFeriasEl = document.getElementById('incluirFerias');
  const saqueAniversarioEl = document.getElementById('saqueAniversario');

  const donut = document.getElementById('donut');
  const toggleTheme = document.getElementById('toggleTheme');
  const modalOverlay = document.getElementById('modal');

  // 1. Controle de Tema Blindado (Direto na tag Body)
  function applyTheme(dark){
    if (dark) {
      document.body.setAttribute('data-theme', 'dark');
      toggleTheme.textContent = 'Tema Claro';
    } else {
      document.body.setAttribute('data-theme', 'light');
      toggleTheme.textContent = 'Tema Escuro';
    }
  }

  toggleTheme.addEventListener('click', () => {
    // Agora ele checa e altera a tag <body> em vez da tag <html>
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
  });

  // 2. Lógica de Datas e Cálculo

  /**
   * Converte valor monetário (string ou float) para inteiro em centavos.
   * Ex: "1250.50" -> 125050, 1250.5 -> 125050
   */
  function toCents(value) {
    if (typeof value === 'string') {
      // Remove formatação brasileira (R$, pontos, espaços) e troca vírgula por ponto
      const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
      value = parseFloat(cleaned);
    }
    if (isNaN(value)) return 0;
    // Math.round para garantir arredondamento correto para centavos
    return Math.round(value * 100);
  }

  /**
   * Formata inteiro em centavos para string monetária BRL usando Intl.NumberFormat
   * Ex: 125050 -> "R$ 1.250,50"
   */
  function formatBRLFromCents(cents) {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return formatter.format(cents / 100);
  }

  function parseDate(dateString) {
    if(!dateString) return null;
    const parts = dateString.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function monthsBetween(start, end){
    if (!start || !end) return 0;
    let y1 = start.getFullYear(), m1 = start.getMonth(), d1 = start.getDate();
    let y2 = end.getFullYear(), m2 = end.getMonth(), d2 = end.getDate();
    let months = (y2 - y1) * 12 + (m2 - m1);
    if (d2 < d1) months--;
    return Math.max(0, months);
  }

  /**
   * Calcula depósito mensal do FGTS (8%) usando aritmética inteira.
   * @param {number} salarioCents - Salário em centavos
   * @param {number} meses - Número de meses trabalhados
   * @returns {number} - Total depositado em centavos
   */
  function calcularFGTS(salarioCents, meses) {
    // 8% do salário por mês, trabalhando com inteiros
    // depositoMensal = salario * 0.08 = salario * 8 / 100
    // Usamos Math.round para arredondar cada depósito mensal para centavos
    const depositoMensal = Math.round((salarioCents * 8) / 100);
    return depositoMensal * meses;
  }

  /**
   * Calcula multa rescisória de 40% sobre o saldo do FGTS.
   * @param {number} saldoCents - Saldo do FGTS em centavos
   * @returns {number} - Multa em centavos
   */
  function calcularMulta(saldoCents) {
    // 40% do saldo, arredondado para centavos
    return Math.round((saldoCents * 40) / 100);
  }

  /**
   * Calcula 13º salário proporcional em centavos.
   * @param {number} salarioCents - Salário em centavos
   * @param {number} meses - Meses trabalhados no ano
   * @returns {number} - 13º proporcional em centavos
   */
  function calcularDecimoTerceiro(salarioCents, meses) {
    // 13º = salario * (meses / 12)
    // Para evitar float: (salarioCents * meses) / 12
    return Math.round((salarioCents * meses) / 12);
  }

  /**
   * Calcula férias proporcionais + 1/3 constitucional em centavos.
   * @param {number} salarioCents - Salário em centavos
   * @param {number} meses - Meses trabalhados
   * @returns {number} - Férias + 1/3 em centavos
   */
  function calcularFerias(salarioCents, meses) {
    // Férias = salario * (meses / 12)
    // 1/3 constitucional = férias / 3
    // Total = férias + 1/3 = férias * (4/3)
    // Fórmula direta: (salarioCents * meses * 4) / (12 * 3) = (salarioCents * meses * 4) / 36
    return Math.round((salarioCents * meses * 4) / 36);
  }

  calcularBtn.addEventListener('click', () => {
    // Converter entrada para centavos
    const salarioCents = toCents(salarioEl.value);
    const inicio = parseDate(inicioEl.value);
    const termino = parseDate(terminoEl.value);
    const motivo = motivoEl.value;

    if (salarioCents <= 0 || !inicio || !termino) {
      alert('Por favor, preencha o Salário e as Datas corretamente.');
      return;
    }

    if (termino < inicio) {
      alert('A Data de Término não pode ser antes do Início.');
      return;
    }

    const meses = monthsBetween(inicio, termino);

    // Cálculos principais usando estratégia de inteiros
    const saldoBaseCents = calcularFGTS(salarioCents, meses);

    // Verificar se deve incluir verbas rescisórias
    const incluirVerbas = incluir13El.checked || incluirFeriasEl.checked;
    let decimoTerceiroCents = 0;
    let feriasCents = 0;

    if (incluir13El.checked) {
      decimoTerceiroCents = calcularDecimoTerceiro(salarioCents, meses);
    }

    if (incluirFeriasEl.checked) {
      feriasCents = calcularFerias(salarioCents, meses);
    }

    const propsTotalCents = decimoTerceiroCents + feriasCents;

    // Calcular multa rescisória (apenas se dispensa sem justa causa)
    let multaBaseCents = (motivo === 'dispensa_sem_causa') ? calcularMulta(saldoBaseCents) : 0;

    let saldoFinalCents = saldoBaseCents;
    let multaFinalCents = multaBaseCents;

    // Aplicar regras do Saque Aniversário
    if (saqueAniversarioEl.checked) {
      // No saque aniversário, saca-se até 40% do saldo, mantendo 60%
      // A multa também é reduzida pois incide apenas sobre o que foi sacado
      saldoFinalCents = Math.round(saldoBaseCents * 60 / 100);
      multaFinalCents = Math.round(multaBaseCents * 50 / 100);
    }

    // Total geral em centavos
    const totalCents = saldoFinalCents + multaFinalCents + propsTotalCents;

    // Exibir resultados formatados na UI
    saldoEl.textContent = formatBRLFromCents(saldoFinalCents);
    multaEl.textContent = formatBRLFromCents(multaFinalCents + propsTotalCents);
    totalEl.textContent = formatBRLFromCents(totalCents);

    // Atualizar gráfico donut
    const denom = totalCents || 1;
    donut.style.setProperty('--pSaldo', ((saldoFinalCents / denom) * 100).toFixed(2) + '%');
    donut.style.setProperty('--pMulta', ((multaFinalCents / denom) * 100).toFixed(2) + '%');
    donut.style.setProperty('--pProp', ((propsTotalCents / denom) * 100).toFixed(2) + '%');
  });

  // 3. Modal
  document.getElementById('explicar').addEventListener('click', () => { modalOverlay.style.display = 'grid'; });
  document.getElementById('closeModal').addEventListener('click', () => { modalOverlay.style.display = 'none'; });

  // 4. FORÇAR MODO CLARO NO INÍCIO: Evita que o openDesign estrague as cores ao carregar
  document.body.setAttribute('data-theme', 'light');
})();