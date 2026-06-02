import sharp from 'sharp';

export class WhatsappRendererService {
  /**
   * Formata um valor monetário para o padrão brasileiro (R$ 1.234,56).
   */
  private static formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Escapa caracteres especiais de XML/SVG para evitar erros de parse do Sharp (ex: & -> &amp;).
   */
  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  /**
   * Converte uma string SVG em buffer PNG e depois em String Base64.
   */
  private static async svgToBase64Png(svgString: string): Promise<string> {
    const pngBuffer = await sharp(Buffer.from(svgString)).png().toBuffer();
    return pngBuffer.toString('base64');
  }

  /**
   * Renderiza um GoalCard de Metas em uma imagem Base64.
   */
  static async renderGoal(goal: {
    title: string;
    category?: string;
    currentAmount: number;
    targetAmount: number;
    goalType: 'spending' | 'saving';
  }): Promise<string> {
    const rawPct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const percentage = Math.min(rawPct, 100);
    const progressWidth = (1000 * percentage) / 100;

    let stopStart = '#8b5cf6'; 
    let stopEnd = '#06b6d4';   
    let statusText = 'Em progresso';

    if (goal.goalType === 'saving') {
      if (percentage >= 100) {
        stopStart = '#9333EA'; 
        stopEnd = '#E879F9';   
        statusText = 'Meta Atingida!';
      } else {
        stopStart = '#2563EB'; 
        stopEnd = '#22D3EE';   
        statusText = 'Em progresso';
      }
    } else {
      const isOver = goal.currentAmount > goal.targetAmount;
      if (isOver) {
        stopStart = '#DC2626'; 
        stopEnd = '#FB7185';   
        statusText = `Excedido em ${(rawPct - 100).toFixed(1)}%`;
      } else if (percentage > 80) {
        stopStart = '#EA580C'; 
        stopEnd = '#FACC15';   
        statusText = 'Próximo ao limite';
      } else {
        stopStart = '#059669'; 
        stopEnd = '#A3E635';   
        statusText = 'Dentro do limite';
      }
    }

    const svgString = `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0B0D19" />
            <stop offset="100%" stop-color="#030408" />
          </linearGradient>
          <linearGradient id="card-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${stopStart}" />
            <stop offset="100%" stop-color="${stopEnd}" />
          </linearGradient>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect width="1920" height="1080" fill="url(#bg-grad)" />
        <circle cx="200" cy="200" r="300" fill="#8b5cf6" fill-opacity="0.03" filter="blur(80px)" />
        <circle cx="1720" cy="880" r="400" fill="#06b6d4" fill-opacity="0.03" filter="blur(100px)" />

        <text x="960" y="160" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="42" fill="#ffffff" letter-spacing="6" text-anchor="middle">FYNX</text>
        <text x="960" y="210" font-family="'Inter', 'Segoe UI', sans-serif" font-size="18" fill="#4B5563" letter-spacing="3" text-anchor="middle">ACOMPANHAMENTO DE META</text>

        <rect x="360" y="290" width="1200" height="560" rx="32" fill="#000000" fill-opacity="0.4" filter="blur(25px)" />
        <rect x="360" y="280" width="1200" height="560" rx="32" fill="#111524" fill-opacity="0.85" stroke="url(#card-border)" stroke-width="1.5" />

        <text x="440" y="380" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="38" fill="#ffffff">${this.escapeXml(goal.title)}</text>
        
        ${goal.category ? `
          <rect x="440" y="405" width="${(goal.category || '').length * 12 + 24}" height="28" rx="14" fill="#1E293B" />
          <text x="${440 + ((goal.category || '').length * 12 + 24) / 2}" y="423" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="600" font-size="12" fill="#94A3B8" text-anchor="middle">${this.escapeXml((goal.category || '').toUpperCase())}</text>
        ` : ''}

        <text x="440" y="530" font-family="'Inter', 'Segoe UI', sans-serif" font-size="16" fill="#94A3B8" font-weight="500" letter-spacing="1">
          ${goal.goalType === 'saving' ? 'ACUMULADO ATUAL' : 'GASTO ATUAL'}
        </text>
        <text x="440" y="590" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="54" fill="${goal.goalType === 'spending' && goal.currentAmount > goal.targetAmount ? '#EF4444' : '#ffffff'}">
          ${this.formatBRL(goal.currentAmount)}
        </text>

        <text x="1480" y="530" font-family="'Inter', 'Segoe UI', sans-serif" font-size="16" fill="#94A3B8" font-weight="500" letter-spacing="1" text-anchor="end">
          ${goal.goalType === 'saving' ? 'META ALVO' : 'LIMITE MÁXIMO'}
        </text>
        <text x="1480" y="590" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="36" fill="#ffffff" text-anchor="end">
          ${this.formatBRL(goal.targetAmount)}
        </text>

        <rect x="440" y="650" width="1040" height="24" rx="12" fill="#000000" fill-opacity="0.4" stroke="#ffffff" stroke-opacity="0.05" />
        <rect x="440" y="650" width="${progressWidth}" height="24" rx="12" fill="url(#progress-grad)" filter="url(#neon-glow)" />

        <text x="440" y="730" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="20" fill="${stopEnd}">
          ${statusText.toUpperCase()}
        </text>
        <text x="1480" y="730" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="600" font-size="20" fill="#94A3B8" text-anchor="end">
          ${rawPct.toFixed(1)}% CONCLUÍDO
        </text>

        <text x="960" y="980" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#374151" letter-spacing="1" text-anchor="middle">Gerado automaticamente pelo agente de inteligência Fynx</text>
      </svg>
    `;

    return this.svgToBase64Png(svgString);
  }

  /**
   * Renderiza o gráfico do histórico (daily com AreaChart; monthly com BarChart).
   */
  static async renderDashboardHistory(
    type: 'daily' | 'monthly',
    labels: string[],
    incomes: number[],
    expenses: number[]
  ): Promise<string> {
    const chartHeight = 280;
    const chartWidth = 960;
    const startX = 480;
    const startY = 660;

    const maxVal = Math.max(...incomes, ...expenses, 1) * 1.15; // Evita divisão por zero
    const incomeColor = '#8b5cf6'; // Roxo
    const expenseColor = '#84cc16'; // Limão

    const totalIncome = incomes.reduce((sum, v) => sum + v, 0);
    const totalExpense = expenses.reduce((sum, v) => sum + v, 0);
    const totalBalance = totalIncome - totalExpense;

    let chartContentSvg = '';

    if (type === 'daily') {
      const getPointsPath = (values: number[]) => {
        return values.map((val, idx) => {
          const x = startX + idx * (chartWidth / (values.length - 1 || 1));
          const y = startY - (val / maxVal) * chartHeight;
          return `${x},${y}`;
        });
      };

      const incomePoints = getPointsPath(incomes);
      const expensePoints = getPointsPath(expenses);

      const getAreaPathString = (points: string[]) => {
        if (points.length === 0) return '';
        const firstPoint = points[0]?.split(',') || ['0', '0'];
        const lastPoint = points[points.length - 1]?.split(',') || ['0', '0'];
        return `M ${firstPoint[0] || '0'},${startY} L ${points.join(' L ')} L ${lastPoint[0] || '0'},${startY} Z`;
      };

      const incomeAreaPath = getAreaPathString(incomePoints);
      const expenseAreaPath = getAreaPathString(expensePoints);

      chartContentSvg = `
        <path d="${incomeAreaPath}" fill="url(#income-area-grad)" />
        <path d="${expenseAreaPath}" fill="url(#expense-area-grad)" />
        <path d="M ${incomePoints.join(' L ')}" fill="none" stroke="${incomeColor}" stroke-width="4.5" filter="url(#neon-glow-income)" />
        <path d="M ${expensePoints.join(' L ')}" fill="none" stroke="${expenseColor}" stroke-width="4.5" filter="url(#neon-glow-expense)" />
      `;
    } else {
      const numMonths = labels.length || 1;
      const groupWidth = chartWidth / numMonths;
      const barWidth = Math.min(32, groupWidth * 0.35);

      chartContentSvg = labels.map((_, idx) => {
        const groupCenter = startX + (idx + 0.5) * groupWidth;
        
        const incVal = incomes[idx] || 0;
        const expVal = expenses[idx] || 0;

        const incHeight = (incVal / maxVal) * chartHeight;
        const expHeight = (expVal / maxVal) * chartHeight;

        const incX = groupCenter - barWidth - 4;
        const expX = groupCenter + 4;

        const incY = startY - incHeight;
        const expY = startY - expHeight;

        return `
          <rect x="${incX}" y="${incY}" width="${barWidth}" height="${incHeight}" rx="6" fill="${incomeColor}" />
          <text x="${incX + barWidth / 2}" y="${incY - 12}" font-family="'Inter', sans-serif" font-weight="700" font-size="12" fill="${incomeColor}" text-anchor="middle">${this.formatBRL(incVal)}</text>
          
          <rect x="${expX}" y="${expY}" width="${barWidth}" height="${expHeight}" rx="6" fill="${expenseColor}" />
          <text x="${expX + barWidth / 2}" y="${expY - 12}" font-family="'Inter', sans-serif" font-weight="700" font-size="12" fill="${expenseColor}" text-anchor="middle">${this.formatBRL(expVal)}</text>
        `;
      }).join('');
    }

    const svgString = `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0B0D19" />
            <stop offset="100%" stop-color="#030408" />
          </linearGradient>
          <linearGradient id="card-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
          </linearGradient>
          
          <linearGradient id="income-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${incomeColor}" stop-opacity="0.25" />
            <stop offset="100%" stop-color="${incomeColor}" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="expense-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${expenseColor}" stop-opacity="0.2" />
            <stop offset="100%" stop-color="${expenseColor}" stop-opacity="0.0" />
          </linearGradient>

          <filter id="neon-glow-income" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="neon-glow-expense" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect width="1920" height="1080" fill="url(#bg-grad)" />
        <circle cx="200" cy="200" r="300" fill="${incomeColor}" fill-opacity="0.03" filter="blur(80px)" />
        <circle cx="1720" cy="880" r="400" fill="${expenseColor}" fill-opacity="0.03" filter="blur(100px)" />

        <text x="960" y="140" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="42" fill="#ffffff" letter-spacing="6" text-anchor="middle">FYNX ANALYTICS</text>
        <text x="960" y="190" font-family="'Inter', 'Segoe UI', sans-serif" font-size="18" fill="#4B5563" letter-spacing="3" text-anchor="middle">
          ${type === 'daily' ? 'COMPARAÇÃO DIÁRIA (ÚLTIMOS 30 DIAS)' : 'COMPARAÇÃO MENSAL'}
        </text>

        <rect x="360" y="250" width="1200" height="620" rx="32" fill="#000000" fill-opacity="0.4" filter="blur(25px)" />
        <rect x="360" y="240" width="1200" height="620" rx="32" fill="#111524" fill-opacity="0.85" stroke="url(#card-border)" stroke-width="1.5" />

        <text x="440" y="320" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="28" fill="#ffffff">
          ${type === 'daily' ? 'Performance Diária' : 'Desempenho por Mês'}
        </text>
        <text x="440" y="355" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#94A3B8">
          Visualização de receitas e despesas consolidadas do banco de dados
        </text>

        <g transform="translate(1180, 305)">
          <circle cx="0" cy="0" r="8" fill="${incomeColor}" />
          <text x="20" y="5" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#ffffff">Receitas</text>
          
          <circle cx="120" cy="0" r="8" fill="${expenseColor}" />
          <text x="140" y="5" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#ffffff">Despesas</text>
        </g>

        <line x1="480" y1="380" x2="1440" y2="380" stroke="#1E293B" stroke-dasharray="4" stroke-width="1" />
        <line x1="480" y1="470" x2="1440" y2="470" stroke="#1E293B" stroke-dasharray="4" stroke-width="1" />
        <line x1="480" y1="560" x2="1440" y2="560" stroke="#1E293B" stroke-dasharray="4" stroke-width="1" />
        <line x1="480" y1="660" x2="1440" y2="660" stroke="#334155" stroke-width="1.5" />

        ${chartContentSvg}

        ${labels.map((label, idx) => {
          const x = startX + (idx + 0.5) * (chartWidth / (labels.length || 1));
          const xArea = startX + idx * (chartWidth / ((labels.length - 1) || 1));
          const pos = type === 'daily' ? xArea : x;
          if (type === 'daily' && idx % 5 !== 0 && idx !== labels.length - 1) return '';
          return `<text x="${pos}" y="700" font-family="'Inter', sans-serif" font-weight="600" font-size="14" fill="#64748B" text-anchor="middle">${label.toUpperCase()}</text>`;
        }).join('')}

        <g transform="translate(440, 770)">
          <text x="0" y="20" font-family="'Inter', sans-serif" font-size="12" fill="#64748B" font-weight="600">SALDO CONSOLIDADO</text>
          <text x="0" y="55" font-family="'Inter', sans-serif" font-weight="800" font-size="30" fill="${totalBalance >= 0 ? '#34D399' : '#EF4444'}">${totalBalance >= 0 ? '+' : ''}${this.formatBRL(totalBalance)}</text>
        </g>
        
        <g transform="translate(820, 770)">
          <text x="0" y="20" font-family="'Inter', sans-serif" font-size="12" fill="#64748B" font-weight="600">ENTRADAS DO PERÍODO</text>
          <text x="0" y="55" font-family="'Inter', sans-serif" font-weight="800" font-size="30" fill="${incomeColor}">${this.formatBRL(totalIncome)}</text>
        </g>

        <g transform="translate(1200, 770)">
          <text x="0" y="20" font-family="'Inter', sans-serif" font-size="12" fill="#64748B" font-weight="600">SAÍDAS DO PERÍODO</text>
          <text x="0" y="55" font-family="'Inter', sans-serif" font-weight="800" font-size="30" fill="${expenseColor}">${this.formatBRL(totalExpense)}</text>
        </g>

        <text x="960" y="990" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#374151" letter-spacing="1" text-anchor="middle">Gerado automaticamente pelo agente de inteligência Fynx</text>
      </svg>
    `;

    return this.svgToBase64Png(svgString);
  }

  /**
   * Renderiza a distribuição de categorias (Donut Chart).
   */
  static async renderCategoriesDonut(
    categories: { category: string; value: number }[],
    type: 'income' | 'expense'
  ): Promise<string> {
    const r = 140;
    const cx = 650;
    const cy = 540;
    const circumference = 2 * Math.PI * r;

    // Paletas oficiais do frontend
    const expensePalette = ["#ef4444", "#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#6b7280", "#eab308"];
    const incomePalette = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#14b8a6", "#22c55e", "#6366f1"];
    const palette = type === 'income' ? incomePalette : expensePalette;

    const total = categories.reduce((sum, c) => sum + c.value, 0);

    // Mapeia porcentagens e cores
    const mappedCategories = categories.map((cat, idx) => {
      const percentage = total > 0 ? Math.round((cat.value / total) * 100) : 0;
      return {
        name: this.escapeXml(cat.category),
        amount: cat.value,
        color: palette[idx % palette.length],
        percentage,
      };
    });

    let accumulatedPercentage = 0;
    const slices = mappedCategories.map(cat => {
      const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);
      accumulatedPercentage += cat.percentage;
      return {
        ...cat,
        strokeDasharray,
        strokeDashoffset,
      };
    });

    const svgString = `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0B0D19" />
            <stop offset="100%" stop-color="#030408" />
          </linearGradient>
          <linearGradient id="card-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        <rect width="1920" height="1080" fill="url(#bg-grad)" />
        <circle cx="650" cy="540" r="350" fill="${type === 'income' ? '#8b5cf6' : '#ef4444'}" fill-opacity="0.02" filter="blur(80px)" />

        <text x="960" y="140" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="42" fill="#ffffff" letter-spacing="6" text-anchor="middle">FYNX ANALYTICS</text>
        <text x="960" y="190" font-family="'Inter', 'Segoe UI', sans-serif" font-size="18" fill="#4B5563" letter-spacing="3" text-anchor="middle">
          DISTRIBUIÇÃO DE ${type === 'income' ? 'RECEITAS' : 'DESPESAS'} POR CATEGORIA
        </text>

        <rect x="360" y="250" width="1200" height="600" rx="32" fill="#000000" fill-opacity="0.4" filter="blur(25px)" />
        <rect x="360" y="240" width="1200" height="600" rx="32" fill="#111524" fill-opacity="0.85" stroke="url(#card-border)" stroke-width="1.5" />

        <text x="440" y="320" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="28" fill="#ffffff">
          ${type === 'income' ? 'Entradas por Categoria' : 'Saídas por Categoria'}
        </text>
        <text x="440" y="355" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#94A3B8">Divisão detalhada do período atual</text>

        <!-- Donut Chart Circle -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1E293B" stroke-width="36" />
        ${slices.map(slice => `
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${slice.color}" stroke-width="36"
                  stroke-dasharray="${slice.strokeDasharray}" stroke-dashoffset="${slice.strokeDashoffset}"
                  transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round" />
        `).join('')}

        <text x="${cx}" y="${cy - 10}" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#94A3B8" text-anchor="middle">
          ${type === 'income' ? 'TOTAL ENTRADAS' : 'TOTAL SAÍDAS'}
        </text>
        <text x="${cx}" y="${cy + 25}" font-family="'Inter', sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">${this.formatBRL(total)}</text>

        <!-- Legenda -->
        <g transform="translate(940, 310)">
          ${mappedCategories.slice(0, 7).map((cat, idx) => {
            const yOffset = idx * 68;
            return `
              <g transform="translate(0, ${yOffset})">
                <circle cx="10" cy="20" r="10" fill="${cat.color}" />
                <text x="40" y="26" font-family="'Inter', sans-serif" font-weight="700" font-size="18" fill="#ffffff">${cat.name}</text>
                <text x="360" y="26" font-family="'Inter', sans-serif" font-weight="800" font-size="18" fill="#ffffff" text-anchor="end">${cat.percentage}%</text>
                <text x="480" y="26" font-family="'Inter', sans-serif" font-weight="600" font-size="16" fill="#94A3B8" text-anchor="end">${this.formatBRL(cat.amount)}</text>
                ${idx < mappedCategories.length - 1 ? `<line x1="0" y1="46" x2="480" y2="46" stroke="#1E293B" stroke-width="1" />` : ''}
              </g>
            `;
          }).join('')}
        </g>

        <text x="960" y="980" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#374151" letter-spacing="1" text-anchor="middle">Gerado automaticamente pelo agente de inteligência Fynx</text>
      </svg>
    `;

    return this.svgToBase64Png(svgString);
  }

  /**
   * Renderiza a Leaderboard do Ranking.
   */
  static async renderRanking(
    rankingList: any[],
    currentUserId: number
  ): Promise<string> {
    const LEAGUE_META_LOCAL = {
      bronze: { label: 'Bronze', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
      silver: { label: 'Prata', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.1)' },
      gold: { label: 'Ouro', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.1)' },
      platinum: { label: 'Platina', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.1)' },
      diamond: { label: 'Diamante', color: '#C4FF0E', bg: 'rgba(196, 255, 14, 0.1)' },
    } as const;

    const topFive = rankingList.slice(0, 5);

    const svgString = `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0B0D19" />
            <stop offset="100%" stop-color="#030408" />
          </linearGradient>
          <linearGradient id="card-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="user-highlight-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#9333ea" stop-opacity="0.1" />
          </linearGradient>
        </defs>

        <rect width="1920" height="1080" fill="url(#bg-grad)" />
        <circle cx="960" cy="540" r="300" fill="#8b5cf6" fill-opacity="0.02" filter="blur(80px)" />

        <text x="960" y="140" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="42" fill="#ffffff" letter-spacing="6" text-anchor="middle">FYNX GAMIFICATION</text>
        <text x="960" y="190" font-family="'Inter', 'Segoe UI', sans-serif" font-size="18" fill="#4B5563" letter-spacing="3" text-anchor="middle">RANKING DE INVESTIDORES</text>

        <rect x="360" y="250" width="1200" height="600" rx="32" fill="#000000" fill-opacity="0.4" filter="blur(25px)" />
        <rect x="360" y="240" width="1200" height="600" rx="32" fill="#111524" fill-opacity="0.85" stroke="url(#card-border)" stroke-width="1.5" />

        <text x="440" y="320" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="28" fill="#ffffff">Liga Global</text>
        <text x="440" y="355" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#94A3B8">Classificação de pontuação mensal de economia</text>

        <g transform="translate(440, 390)">
          ${topFive.map((user, idx) => {
            const yOffset = idx * 78;
            const userLeagueKey = (user.league || 'bronze').toLowerCase();
            const meta = LEAGUE_META_LOCAL[userLeagueKey as keyof typeof LEAGUE_META_LOCAL] || LEAGUE_META_LOCAL.bronze;
            const isMe = String(user.userId) === String(currentUserId);
            const formatRank = String(user.position).padStart(2, '0');

            return `
              <g transform="translate(0, ${yOffset})">
                ${isMe ? `
                  <rect x="-20" y="2" width="1080" height="64" rx="16" fill="url(#user-highlight-grad)" stroke="#8b5cf6" stroke-opacity="0.3" stroke-width="1" />
                ` : ''}

                <text x="20" y="42" font-family="'Inter', sans-serif" font-weight="800" font-size="22" 
                      fill="${isMe ? '#e9d5ff' : user.position <= 3 ? '#C4FF0E' : '#52525b'}">${formatRank}</text>

                <circle cx="95" cy="34" r="20" fill="${isMe ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.06)'}" 
                        stroke="${isMe ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.1)'}" stroke-width="1" />
                <text x="95" y="40" font-family="'Inter', sans-serif" font-weight="700" font-size="12" fill="#ffffff" text-anchor="middle">
                  ${this.escapeXml((user.username || 'US').substring(0, 2).toUpperCase())}
                </text>

                <text x="135" y="30" font-family="'Inter', sans-serif" font-weight="700" font-size="18" fill="${isMe ? '#e9d5ff' : '#ffffff'}">
                  ${this.escapeXml(user.username)} ${isMe ? ' (Você)' : ''}
                </text>
                <text x="135" y="48" font-family="'Inter', sans-serif" font-weight="700" font-size="10" fill="#52525b" letter-spacing="1">NÍVEL ${user.level || 1}</text>

                <g transform="translate(560, 18)">
                  <rect x="0" y="0" width="110" height="30" rx="15" fill="${meta.bg}" stroke="${meta.color}" stroke-opacity="0.3" stroke-width="1" />
                  <text x="55" y="20" font-family="'Inter', sans-serif" font-weight="700" font-size="10" fill="${meta.color}" letter-spacing="1.5" text-anchor="middle">
                    ${meta.label.toUpperCase()}
                  </text>
                </g>

                <g transform="translate(760, 36)">
                  ${user.trend === 'up' ? `
                    <path d="M-8 4 L0 -4 L8 4" fill="none" stroke="#34D399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    <text x="14" y="5" font-family="'Inter', sans-serif" font-weight="700" font-size="13" fill="#34D399">+${user.change || 0}</text>
                  ` : user.trend === 'down' ? `
                    <path d="M-8 -4 L0 4 L8 -4" fill="none" stroke="#F87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    <text x="14" y="5" font-family="'Inter', sans-serif" font-weight="700" font-size="13" fill="#F87171">-${user.change || 0}</text>
                  ` : `
                    <line x1="-8" y1="0" x2="8" y2="0" stroke="#52525b" stroke-width="2.5" stroke-linecap="round" />
                  `}
                </g>

                <text x="1020" y="42" font-family="'Inter', sans-serif" font-weight="800" font-size="20" 
                      fill="${isMe ? '#e9d5ff' : '#ffffff'}" text-anchor="end">${(user.score || 0).toLocaleString('pt-BR')}</text>

                ${idx < topFive.length - 1 && !isMe ? `
                  <line x1="-20" y1="68" x2="1040" y2="68" stroke="#1E293B" stroke-width="1" stroke-opacity="0.4" />
                ` : ''}
              </g>
            `;
          }).join('')}
        </g>
        <text x="960" y="990" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#374151" letter-spacing="1" text-anchor="middle">Gerado automaticamente pelo agente de inteligência Fynx</text>
      </svg>
    `;

    return this.svgToBase64Png(svgString);
  }

  static async renderUnifiedDashboard(data: {
    dailyPerformance: { day: string; date: string; income: number; expense: number }[];
    monthlyPerformance: { month: string; income: number; expense: number }[];
    spendingByCategory: { category: string; value: number }[];
    incomeByCategory: { category: string; value: number }[];
  }): Promise<string> {
    const incomeColor = '#8b5cf6'; // Roxo
    const expenseColor = '#84cc16'; // Limão

    // --- 1. Processamento Quadrante 1: Histórico Diário (Area Chart) ---
    const dailyIncomes = data.dailyPerformance.map(d => d.income);
    const dailyExpenses = data.dailyPerformance.map(d => d.expense);
    const dailyMaxVal = Math.max(...dailyIncomes, ...dailyExpenses, 1) * 1.15;
    const dailyStartX = 110;
    const dailyStartY = 480;
    const dailyWidth = 770;
    const dailyHeight = 180;

    const getDailyPoints = (values: number[]) => {
      return values.map((val, idx) => {
        const x = dailyStartX + idx * (dailyWidth / (values.length - 1 || 1));
        const y = dailyStartY - (val / dailyMaxVal) * dailyHeight;
        return `${x},${y}`;
      });
    };

    const dailyIncomePoints = getDailyPoints(dailyIncomes);
    const dailyExpensePoints = getDailyPoints(dailyExpenses);

    const getAreaPathString = (points: string[], startX: number, startY: number, width: number) => {
      if (points.length === 0) return '';
      const firstPoint = points[0]?.split(',') || ['0', '0'];
      const lastPoint = points[points.length - 1]?.split(',') || ['0', '0'];
      return `M ${firstPoint[0] || '0'},${startY} L ${points.join(' L ')} L ${lastPoint[0] || '0'},${startY} Z`;
    };

    const dailyIncomeAreaPath = getAreaPathString(dailyIncomePoints, dailyStartX, dailyStartY, dailyWidth);
    const dailyExpenseAreaPath = getAreaPathString(dailyExpensePoints, dailyStartX, dailyStartY, dailyWidth);

    // --- 2. Processamento Quadrante 3: Histórico Mensal (Bar Chart) ---
    const monthlyIncomes = data.monthlyPerformance.map(m => m.income);
    const monthlyExpenses = data.monthlyPerformance.map(m => m.expense);
    const monthlyMaxVal = Math.max(...monthlyIncomes, ...monthlyExpenses, 1) * 1.15;
    const monthlyStartX = 110;
    const monthlyStartY = 900;
    const monthlyWidth = 770;
    const monthlyHeight = 180;
    const numMonths = data.monthlyPerformance.length || 1;
    const groupWidth = monthlyWidth / numMonths;
    const barWidth = Math.min(24, groupWidth * 0.25);

    let monthlyBarsSvg = '';
    data.monthlyPerformance.forEach((m, idx) => {
      const groupCenter = monthlyStartX + (idx + 0.5) * groupWidth;
      const incVal = m.income;
      const expVal = m.expense;
      const incHeight = (incVal / monthlyMaxVal) * monthlyHeight;
      const expHeight = (expVal / monthlyMaxVal) * monthlyHeight;
      const incX = groupCenter - barWidth - 4;
      const expX = groupCenter + 4;
      const incY = monthlyStartY - incHeight;
      const expY = monthlyStartY - expHeight;

      monthlyBarsSvg += `
        <rect x="${incX}" y="${incY}" width="${barWidth}" height="${incHeight}" rx="4" fill="${incomeColor}" />
        <text x="${incX + barWidth / 2}" y="${incY - 6}" font-family="'Inter', sans-serif" font-weight="700" font-size="10" fill="${incomeColor}" text-anchor="middle">${WhatsappRendererService.formatBRL(incVal)}</text>
        
        <rect x="${expX}" y="${expY}" width="${barWidth}" height="${expHeight}" rx="4" fill="${expenseColor}" />
        <text x="${expX + barWidth / 2}" y="${expY - 6}" font-family="'Inter', sans-serif" font-weight="700" font-size="10" fill="${expenseColor}" text-anchor="middle">${WhatsappRendererService.formatBRL(expVal)}</text>
      `;
    });

    // --- 3. Processamento Quadrantes 2 e 4: Donut Charts (Expenses & Income) ---
    const expensePalette = ["#ef4444", "#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#6b7280", "#eab308"];
    const incomePalette = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#14b8a6", "#22c55e", "#6366f1"];

    const getDonutSlices = (
      categories: { category: string; value: number }[],
      cx: number,
      cy: number,
      r: number,
      palette: string[]
    ) => {
      const circumference = 2 * Math.PI * r;
      // Agrupa em no máximo 4 categorias principais e o resto em "Outros"
      let processed: { category: string; value: number }[] = categories.slice(0, 4);
      if (categories.length > 4) {
        const otherVal = categories.slice(4).reduce((sum, c) => sum + c.value, 0);
        processed.push({ category: 'Outros', value: otherVal });
      }

      const total = processed.reduce((sum, c) => sum + c.value, 0);
      const mapped = processed.map((cat, idx) => {
        const percentage = total > 0 ? Math.round((cat.value / total) * 100) : 0;
        return {
          name: this.escapeXml(cat.category),
          amount: cat.value,
          color: palette[idx % palette.length] || '#ccc',
          percentage,
        };
      });

      let accumulatedPercentage = 0;
      return {
        total,
        slices: mapped.map(slice => {
          const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);
          accumulatedPercentage += slice.percentage;
          return {
            ...slice,
            strokeDasharray,
            strokeDashoffset,
          };
        })
      };
    };

    const donutR = 65;
    const donutExpenses = getDonutSlices(data.spendingByCategory, 1110, 370, donutR, expensePalette);
    const donutIncome = getDonutSlices(data.incomeByCategory, 1110, 790, donutR, incomePalette);

    const svgString = `
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0B0D19" />
            <stop offset="100%" stop-color="#030408" />
          </linearGradient>
          <linearGradient id="card-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="income-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${incomeColor}" stop-opacity="0.2" />
            <stop offset="100%" stop-color="${incomeColor}" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="expense-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${expenseColor}" stop-opacity="0.15" />
            <stop offset="100%" stop-color="${expenseColor}" stop-opacity="0.0" />
          </linearGradient>
          <filter id="neon-glow-income" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="neon-glow-expense" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Background -->
        <rect width="1920" height="1080" fill="url(#bg-grad)" />
        <circle cx="200" cy="200" r="300" fill="${incomeColor}" fill-opacity="0.02" filter="blur(80px)" />
        <circle cx="1720" cy="880" r="400" fill="${expenseColor}" fill-opacity="0.02" filter="blur(100px)" />

        <!-- Header -->
        <text x="960" y="80" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="36" fill="#ffffff" letter-spacing="6" text-anchor="middle">FYNX CONSOLIDADO</text>
        <text x="960" y="120" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#64748B" letter-spacing="3" text-anchor="middle">PAINEL DE DESEMPENHO FINANCEIRO</text>

        <!-- Quadrante 1 Background (Top-Left) -->
        <rect x="60" y="180" width="870" height="380" rx="24" fill="#111524" fill-opacity="0.85" stroke="url(#card-border)" stroke-width="1.5" />
        <text x="110" y="235" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="20" fill="#ffffff">Desempenho Diário</text>
        <text x="110" y="260" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" fill="#64748B">Fluxo de caixa nos últimos 30 dias</text>
        
        <g transform="translate(680, 220)">
          <circle cx="0" cy="0" r="6" fill="${incomeColor}" />
          <text x="15" y="4" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#ffffff">Receitas</text>
          <circle cx="90" cy="0" r="6" fill="${expenseColor}" />
          <text x="105" y="4" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#ffffff">Despesas</text>
        </g>

        <!-- Grid Lines Q1 -->
        <line x1="110" y1="300" x2="880" y2="300" stroke="#1E293B" stroke-dasharray="4" stroke-width="1" />
        <line x1="110" y1="390" x2="880" y2="390" stroke="#1E293B" stroke-dasharray="4" stroke-width="1" />
        <line x1="110" y1="480" x2="880" y2="480" stroke="#334155" stroke-width="1" />

        <!-- Q1 Chart -->
        <path d="${dailyIncomeAreaPath}" fill="url(#income-area-grad)" />
        <path d="${dailyExpenseAreaPath}" fill="url(#expense-area-grad)" />
        <path d="M ${dailyIncomePoints.join(' L ')}" fill="none" stroke="${incomeColor}" stroke-width="3" filter="url(#neon-glow-income)" />
        <path d="M ${dailyExpensePoints.join(' L ')}" fill="none" stroke="${expenseColor}" stroke-width="3" filter="url(#neon-glow-expense)" />

        ${data.dailyPerformance.map((d, idx) => {
          const x = dailyStartX + idx * (dailyWidth / (data.dailyPerformance.length - 1 || 1));
          if (idx % 6 !== 0 && idx !== data.dailyPerformance.length - 1) return '';
          return `<text x="${x}" y="515" font-family="'Inter', sans-serif" font-weight="600" font-size="11" fill="#475569" text-anchor="middle">${d.day}</text>`;
        }).join('')}


        <!-- Quadrante 3 Background (Bottom-Left) -->
        <rect x="60" y="600" width="870" height="380" rx="24" fill="#111524" fill-opacity="0.85" stroke="url(#card-border)" stroke-width="1.5" />
        <text x="110" y="655" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="20" fill="#ffffff">Desempenho Mensal</text>
        <text x="110" y="680" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" fill="#64748B">Comparação nos últimos meses</text>

        <!-- Grid Lines Q3 -->
        <line x1="110" y1="720" x2="880" y2="720" stroke="#1E293B" stroke-dasharray="4" stroke-width="1" />
        <line x1="110" y1="810" x2="880" y2="810" stroke="#1E293B" stroke-dasharray="4" stroke-width="1" />
        <line x1="110" y1="900" x2="880" y2="900" stroke="#334155" stroke-width="1" />

        <!-- Q3 Chart (Bars) -->
        ${monthlyBarsSvg}
        ${data.monthlyPerformance.map((m, idx) => {
          const x = monthlyStartX + (idx + 0.5) * groupWidth;
          return `<text x="${x}" y="935" font-family="'Inter', sans-serif" font-weight="600" font-size="12" fill="#64748B" text-anchor="middle">${m.month.toUpperCase()}</text>`;
        }).join('')}


        <!-- Quadrante 2 Background (Top-Right: Expenses by Category) -->
        <rect x="970" y="180" width="890" height="380" rx="24" fill="#111524" fill-opacity="0.85" stroke="url(#card-border)" stroke-width="1.5" />
        <text x="1010" y="235" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="20" fill="#ffffff">Distribuição de Despesas</text>
        <text x="1010" y="260" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" fill="#64748B">Gastos por categoria no mês atual</text>

        <!-- Q2 Donut Circle -->
        <circle cx="1120" cy="380" r="${donutR}" fill="none" stroke="#1E293B" stroke-width="20" />
        ${donutExpenses.slices.map(slice => `
          <circle cx="1120" cy="380" r="${donutR}" fill="none" stroke="${slice.color}" stroke-width="20"
                  stroke-dasharray="${slice.strokeDasharray}" stroke-dashoffset="${slice.strokeDashoffset}"
                  transform="rotate(-90 1120 380)" stroke-linecap="round" />
        `).join('')}
        <text x="1120" y="375" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="#64748B" text-anchor="middle">DESPESAS</text>
        <text x="1120" y="395" font-family="'Inter', sans-serif" font-weight="800" font-size="15" fill="#ffffff" text-anchor="middle">${WhatsappRendererService.formatBRL(donutExpenses.total)}</text>

        <!-- Q2 Legend -->
        <g transform="translate(1260, 275)">
          ${donutExpenses.slices.map((slice, idx) => {
            const yOffset = idx * 46;
            return `
              <g transform="translate(0, ${yOffset})">
                <circle cx="10" cy="10" r="7" fill="${slice.color}" />
                <text x="30" y="15" font-family="'Inter', sans-serif" font-weight="700" font-size="14" fill="#ffffff">${slice.name}</text>
                <text x="240" y="15" font-family="'Inter', sans-serif" font-weight="800" font-size="14" fill="#ffffff" text-anchor="end">${slice.percentage}%</text>
                <text x="340" y="15" font-family="'Inter', sans-serif" font-weight="600" font-size="13" fill="#64748B" text-anchor="end">${WhatsappRendererService.formatBRL(slice.amount)}</text>
                ${idx < donutExpenses.slices.length - 1 ? `<line x1="0" y1="30" x2="340" y2="30" stroke="#1E293B" stroke-width="1" />` : ''}
              </g>
            `;
          }).join('')}
        </g>


        <!-- Quadrante 4 Background (Bottom-Right: Income by Category) -->
        <rect x="970" y="600" width="890" height="380" rx="24" fill="#111524" fill-opacity="0.85" stroke="url(#card-border)" stroke-width="1.5" />
        <text x="1010" y="655" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="20" fill="#ffffff">Distribuição de Receitas</text>
        <text x="1010" y="680" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" fill="#64748B">Entradas por categoria no mês atual</text>

        <!-- Q4 Donut Circle -->
        <circle cx="1120" cy="800" r="${donutR}" fill="none" stroke="#1E293B" stroke-width="20" />
        ${donutIncome.slices.map(slice => `
          <circle cx="1120" cy="800" r="${donutR}" fill="none" stroke="${slice.color}" stroke-width="20"
                  stroke-dasharray="${slice.strokeDasharray}" stroke-dashoffset="${slice.strokeDashoffset}"
                  transform="rotate(-90 1120 800)" stroke-linecap="round" />
        `).join('')}
        <text x="1120" y="795" font-family="'Inter', sans-serif" font-size="10" font-weight="600" fill="#64748B" text-anchor="middle">RECEITAS</text>
        <text x="1120" y="815" font-family="'Inter', sans-serif" font-weight="800" font-size="15" fill="#ffffff" text-anchor="middle">${WhatsappRendererService.formatBRL(donutIncome.total)}</text>

        <!-- Q4 Legend -->
        <g transform="translate(1260, 695)">
          ${donutIncome.slices.map((slice, idx) => {
            const yOffset = idx * 46;
            return `
              <g transform="translate(0, ${yOffset})">
                <circle cx="10" cy="10" r="7" fill="${slice.color}" />
                <text x="30" y="15" font-family="'Inter', sans-serif" font-weight="700" font-size="14" fill="#ffffff">${slice.name}</text>
                <text x="240" y="15" font-family="'Inter', sans-serif" font-weight="800" font-size="14" fill="#ffffff" text-anchor="end">${slice.percentage}%</text>
                <text x="340" y="15" font-family="'Inter', sans-serif" font-weight="600" font-size="13" fill="#64748B" text-anchor="end">${WhatsappRendererService.formatBRL(slice.amount)}</text>
                ${idx < donutIncome.slices.length - 1 ? `<line x1="0" y1="30" x2="340" y2="30" stroke="#1E293B" stroke-width="1" />` : ''}
              </g>
            `;
          }).join('')}
        </g>

        <!-- Footer -->
        <text x="960" y="1030" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" fill="#334155" letter-spacing="1" text-anchor="middle">Painel Gerado pelo Agente Fynx Inteligência Financeira</text>
      </svg>
    `;

    return WhatsappRendererService.svgToBase64Png(svgString);
  }
}

