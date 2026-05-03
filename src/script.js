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

  // 2. Lógica Blindada de Datas e Cálculo
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

  function formatBR(n) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  calcularBtn.addEventListener('click', () => {
    const s = parseFloat(salarioEl.value);
    const inicio = parseDate(inicioEl.value);
    const termino = parseDate(terminoEl.value);
    const motivo = motivoEl.value;

    if (isNaN(s) || s <= 0 || !inicio || !termino) {
      alert('Por favor, preencha o Salário e as Datas corretamente.');
      return;
    }
    
    if (termino < inicio) {
      alert('A Data de Término não pode ser antes do Início.');
      return;
    }

    const meses = monthsBetween(inicio, termino);
    const saldoBase = s * 0.08 * meses;

    let tres = incluir13El.checked ? s * (meses / 12) : 0;
    let ferias = incluirFeriasEl.checked ? s * (meses / 12) * (4/3) : 0;
    
    let multaBase = (motivo === 'dispensa_sem_causa') ? saldoBase * 0.40 : 0;
    
    let saldoFinal = saldoBase;
    let multaFinal = multaBase;
    let propsTotal = tres + ferias;

    if (saqueAniversarioEl.checked) {
      saldoFinal *= 0.6;
      multaFinal *= 0.5;
    }

    const total = saldoFinal + multaFinal + propsTotal;

    saldoEl.textContent = formatBR(saldoFinal);
    multaEl.textContent = formatBR(multaFinal + propsTotal);
    totalEl.textContent = formatBR(total);

    const denom = total || 1;
    donut.style.setProperty('--pSaldo', ((saldoFinal / denom) * 100).toFixed(2) + '%');
    donut.style.setProperty('--pMulta', ((multaFinal / denom) * 100).toFixed(2) + '%');
    donut.style.setProperty('--pProp', ((propsTotal / denom) * 100).toFixed(2) + '%');
  });

  // 3. Modal
  document.getElementById('explicar').addEventListener('click', () => { modalOverlay.style.display = 'grid'; });
  document.getElementById('closeModal').addEventListener('click', () => { modalOverlay.style.display = 'none'; });
  
  // 4. FORÇAR MODO CLARO NO INÍCIO: Evita que o openDesign estrague as cores ao carregar
  document.body.setAttribute('data-theme', 'light');
})();