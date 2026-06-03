const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure color constants for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m'
};

function formatHeader(title) {
  const line = '='.repeat(80);
  return `${colors.bright}${colors.blue}${line}\n${title}\n${line}${colors.reset}\n`;
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `${dateStr}_${timeStr}`;
}

const SECURITY_SCAN_CATALOG = {
  dependencies: {
    title: 'Dependencias e supply chain',
    owasp: 'OWASP A06:2021 - Vulnerable and Outdated Components',
    description: 'Verifica se pacotes de terceiros possuem vulnerabilidades conhecidas ou se o projeto nao usa lockfile para fixar versoes instaladas.',
    examples: ['npm audit', 'package lockfile', 'pacotes vulneraveis', 'integridade da instalacao']
  },
  secrets: {
    title: 'Segredos e credenciais',
    owasp: 'OWASP A02/A07:2021 - Cryptographic Failures / Identification and Authentication Failures',
    description: 'Procura credenciais, tokens, chaves privadas, strings de conexao e senhas hardcoded que poderiam permitir acesso indevido.',
    examples: ['API keys', 'tokens JWT/Bearer', 'senhas em codigo', 'chaves privadas']
  },
  code_patterns: {
    title: 'Padroes perigosos de codigo',
    owasp: 'OWASP A03:2021 - Injection',
    description: 'Busca construcoes associadas a injecao de codigo, SQL injection, XSS e desserializacao insegura.',
    examples: ['eval/exec', 'SQL por concatenacao', 'innerHTML inseguro', 'pickle/yaml inseguro']
  },
  configuration: {
    title: 'Configuracao de seguranca',
    owasp: 'OWASP A05:2021 - Security Misconfiguration',
    description: 'Valida configuracoes inseguras, como debug exposto, CORS perigoso e ausencia de headers de protecao HTTP.',
    examples: ['CSP', 'HSTS', 'X-Frame-Options', 'CORS', 'debug mode']
  }
};

// Global state to collect data for HTML report
const reportData = {
  timestamp: new Date().toLocaleString('pt-BR'),
  duration: 0,
  backend: {
    status: 'pending',
    summary: { total: 0, passed: 0, failed: 0 },
    tests: [],
    rawLog: ''
  },
  security: {
    status: 'pending',
    summary: { critical: 0, high: 0, medium: 0, total: 0 },
    checks: [],
    findings: [],
    rawLog: ''
  },
  frontend: {
    status: 'pending',
    summary: { total: 0, passed: 0, failed: 0 },
    tests: [],
    rawLog: ''
  }
};

const startTime = Date.now();

// Helper to run a command and stream output
function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    console.log(`${colors.bright}${colors.yellow}👉 Executando: ${command} ${args.join(' ')}${colors.reset}\n`);
    
    const child = spawn(command, args, {
      shell: true,
      ...options
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdoutData += chunk;
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderrData += chunk;
      process.stderr.write(chunk);
    });

    child.on('close', (code) => {
      resolve({ code, stdout: stdoutData, stderr: stderrData });
    });
  });
}

async function start() {
  console.clear();
  console.log(formatHeader('🚀 INICIANDO ORQUESTRADOR DE TESTES E SEGURANÇA - FYNX'));
  
  // 1. Backend Tests
  console.log(formatHeader('🧪 ETAPA 1/3: TESTES DE INTEGRAÇÃO DO BACKEND (VITEST)'));
  const vitestReportPath = path.join(__dirname, 'temp_vitest_report.json');
  
  // Ensure any old temp reports are deleted
  if (fs.existsSync(vitestReportPath)) {
    fs.unlinkSync(vitestReportPath);
  }

  const backendResult = await runCommand('npx', [
    'vitest', 'run', 
    '--reporter=default', 
    '--reporter=json', 
    `--outputFile="${vitestReportPath}"`
  ], {
    cwd: path.join(__dirname, '../FynxApi')
  });

  reportData.backend.rawLog = backendResult.stdout + '\n' + backendResult.stderr;

  if (fs.existsSync(vitestReportPath)) {
    try {
      const rawJson = fs.readFileSync(vitestReportPath, 'utf8');
      const vitestData = JSON.parse(rawJson);
      
      reportData.backend.status = vitestData.success ? 'passed' : 'failed';
      reportData.backend.summary = {
        total: vitestData.numTotalTests || 0,
        passed: vitestData.numPassedTests || 0,
        failed: vitestData.numFailedTests || 0
      };

      // Extract test details
      if (vitestData.testResults) {
        vitestData.testResults.forEach(suite => {
          const suiteName = path.basename(suite.name);
          suite.assertionResults.forEach(test => {
            reportData.backend.tests.push({
              suite: suiteName,
              title: test.title,
              status: test.status,
              duration: test.duration,
              error: test.failureMessages && test.failureMessages.length > 0 ? test.failureMessages.join('\n') : null
            });
          });
        });
      }
      
      // Clean up temp file
      fs.unlinkSync(vitestReportPath);
    } catch (e) {
      reportData.backend.status = 'error';
      console.error(`${colors.red}Erro ao parsear resultados do Vitest:${colors.reset}`, e);
    }
  } else {
    reportData.backend.status = 'failed';
  }

  console.log(`\n${colors.bright}${colors.green}✅ Fim dos testes do backend. Status: ${reportData.backend.status.toUpperCase()}${colors.reset}\n`);

  // 2. Security Scan
  console.log(formatHeader('🛡️ ETAPA 2/3: ANÁLISE DE SEGURANÇA E VULNERABILIDADES'));
  const securityResult = await runCommand('python', [
    '.agent/skills/vulnerability-scanner/scripts/security_scan.py', '.'
  ], {
    cwd: path.join(__dirname, '..')
  });

  reportData.security.rawLog = securityResult.stdout + '\n' + securityResult.stderr;

  try {
    const firstBrace = securityResult.stdout.indexOf('{');
    const lastBrace = securityResult.stdout.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonStr = securityResult.stdout.substring(firstBrace, lastBrace + 1);
      const securityData = JSON.parse(jsonStr);
      
      const securityFindingCount = (securityData.summary && securityData.summary.total_findings) || 0;
      reportData.security.status = securityFindingCount > 0 ? 'warning' : 'passed';
      reportData.security.summary = {
        critical: (securityData.summary && securityData.summary.critical) || 0,
        high: (securityData.summary && securityData.summary.high) || 0,
        medium: (securityData.summary && securityData.summary.medium) || 0,
        total: (securityData.summary && securityData.summary.total_findings) || 0
      };

      reportData.security.checks = Object.entries(SECURITY_SCAN_CATALOG).map(([scannerKey, meta]) => {
        const scanObj = securityData.scans && securityData.scans[scannerKey];
        const findings = scanObj && Array.isArray(scanObj.findings) ? scanObj.findings : [];
        const hasCritical = findings.some(f => f.severity === 'critical');
        const hasHigh = findings.some(f => f.severity === 'high');
        const hasFindings = findings.length > 0;

        return {
          scannerKey,
          title: meta.title,
          owasp: meta.owasp,
          description: meta.description,
          examples: meta.examples,
          status: scanObj ? scanObj.status : 'Nao executado',
          result: !scanObj ? 'not-run' : hasCritical ? 'critical' : hasHigh ? 'high' : hasFindings ? 'warning' : 'passed',
          findingsCount: findings.length
        };
      });

      // Extract details
      const extractFindings = (scannerKey, typeLabel) => {
        const scanObj = securityData.scans && securityData.scans[scannerKey];
        if (scanObj && scanObj.findings) {
          scanObj.findings.forEach(f => {
            reportData.security.findings.push({
              type: typeLabel,
              file: f.file || f.issue || 'N/A',
              line: f.line || 0,
              severity: f.severity || 'medium',
              description: f.pattern || f.issue || f.recommendation || '',
              snippet: f.snippet || '',
              recommendation: f.recommendation || 'Verifique o padrão no código'
            });
          });
        }
      };

      extractFindings('secrets', 'Exposição de Segredos');
      extractFindings('code_patterns', 'Risco de Código');
      extractFindings('configuration', 'Configuração Insegura');
      extractFindings('dependencies', 'Dependencias Vulneraveis');
    } else {
      reportData.security.status = 'warning';
    }
  } catch (e) {
    reportData.security.status = 'error';
    console.error(`${colors.red}Erro ao parsear scanner de segurança:${colors.reset}`, e);
  }

  console.log(`\n${colors.bright}${colors.green}✅ Fim do scan de segurança. Status: ${reportData.security.status.toUpperCase()}${colors.reset}\n`);

  // 3. Frontend Tests
  console.log(formatHeader('💻 ETAPA 3/3: TESTES END-TO-END DO FRONTEND (PLAYWRIGHT - HEADED)'));
  const playwrightReportPath = path.join(__dirname, 'temp_playwright_report.json');

  if (fs.existsSync(playwrightReportPath)) {
    fs.unlinkSync(playwrightReportPath);
  }

  const frontendResult = await runCommand('npx', [
    'playwright', 'test', '--reporter=list,json'
  ], {
    cwd: path.join(__dirname, '../FynxV2'),
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT_NAME: playwrightReportPath
    }
  });

  reportData.frontend.rawLog = frontendResult.stdout + '\n' + frontendResult.stderr;

  if (fs.existsSync(playwrightReportPath)) {
    try {
      const rawJson = fs.readFileSync(playwrightReportPath, 'utf8');
      const pwData = JSON.parse(rawJson);

      const hasFailures = pwData.stats && pwData.stats.unexpected > 0;
      reportData.frontend.status = hasFailures ? 'failed' : 'passed';
      reportData.frontend.summary = {
        total: (pwData.stats && pwData.stats.expected + pwData.stats.unexpected + pwData.stats.skipped) || 0,
        passed: (pwData.stats && pwData.stats.expected) || 0,
        failed: (pwData.stats && pwData.stats.unexpected) || 0
      };

      // Recursive spec detail collection
      const parsePlaywrightSuites = (suite, fileName = '') => {
        const file = suite.file || fileName;
        if (suite.specs) {
          suite.specs.forEach(spec => {
            const testResult = spec.tests && spec.tests[0] && spec.tests[0].results && spec.tests[0].results[0];
            const cleanLogs = testResult && testResult.stdout ? testResult.stdout.map(l => l.text).join('') : '';
            
            reportData.frontend.tests.push({
              file: path.basename(file),
              title: spec.title,
              status: testResult ? testResult.status : 'unknown',
              duration: testResult ? testResult.duration : 0,
              logs: cleanLogs,
              error: testResult && testResult.errors && testResult.errors.length > 0 ? testResult.errors.map(err => err.message).join('\n') : null
            });
          });
        }
        if (suite.suites) {
          suite.suites.forEach(subSuite => parsePlaywrightSuites(subSuite, file));
        }
      };

      if (pwData.suites) {
        pwData.suites.forEach(s => parsePlaywrightSuites(s));
      }

      fs.unlinkSync(playwrightReportPath);
    } catch (e) {
      reportData.frontend.status = 'error';
      console.error(`${colors.red}Erro ao parsear relatórios do Playwright:${colors.reset}`, e);
    }
  } else {
    reportData.frontend.status = 'failed';
  }

  console.log(`\n${colors.bright}${colors.green}✅ Fim dos testes do frontend. Status: ${reportData.frontend.status.toUpperCase()}${colors.reset}\n`);

  // Finalize Duration
  reportData.duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Generate HTML Report
  generateHtmlReport();
}

function generateHtmlReport() {
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = getTimestamp();
  const reportFileName = `${timestamp}-report.html`;
  const reportPath = path.join(reportsDir, reportFileName);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fynx Test Dashboard & Feedback</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
        },
      },
    }
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: #0f172a;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col custom-scroll">

  <!-- Header -->
  <header class="bg-slate-900 border-b border-slate-800 shadow-md">
    <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
          <i data-lucide="activity" class="w-6 h-6"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Fynx <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium">Test Suite</span>
          </h1>
          <p class="text-xs text-slate-400">Feedback unificado de qualidade, integração e segurança</p>
        </div>
      </div>
      
      <div class="flex items-center gap-6 text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 self-start md:self-auto">
        <div class="flex items-center gap-1.5">
          <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span>Executado em: <strong class="text-slate-200" id="header-timestamp"></strong></span>
        </div>
        <div class="h-4 w-px bg-slate-800"></div>
        <div class="flex items-center gap-1.5">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span>Duração: <strong class="text-slate-200" id="header-duration"></strong>s</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
    <!-- Sidebar Navigation -->
    <nav class="md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 border-b md:border-b-0 border-slate-800">
      <button onclick="switchTab('overview')" id="btn-overview" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
        <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
        <span>Visão Geral</span>
      </button>
      <button onclick="switchTab('backend')" id="btn-backend" class="tab-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition duration-200 hover:bg-slate-900 border border-transparent text-slate-400">
        <div class="flex items-center gap-3">
          <i data-lucide="server" class="w-4 h-4"></i>
          <span>Backend (Vitest)</span>
        </div>
        <span id="badge-backend" class="text-[10px] px-2 py-0.5 rounded-full font-semibold"></span>
      </button>
      <button onclick="switchTab('security')" id="btn-security" class="tab-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition duration-200 hover:bg-slate-900 border border-transparent text-slate-400">
        <div class="flex items-center gap-3">
          <i data-lucide="shield-check" class="w-4 h-4"></i>
          <span>Segurança (Scan)</span>
        </div>
        <span id="badge-security" class="text-[10px] px-2 py-0.5 rounded-full font-semibold"></span>
      </button>
      <button onclick="switchTab('frontend')" id="btn-frontend" class="tab-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition duration-200 hover:bg-slate-900 border border-transparent text-slate-400">
        <div class="flex items-center gap-3">
          <i data-lucide="chrome" class="w-4 h-4"></i>
          <span>Frontend (E2E)</span>
        </div>
        <span id="badge-frontend" class="text-[10px] px-2 py-0.5 rounded-full font-semibold"></span>
      </button>
      <button onclick="switchTab('logs')" id="btn-logs" class="tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 hover:bg-slate-900 border border-transparent text-slate-400">
        <i data-lucide="file-text" class="w-4 h-4"></i>
        <span>Logs Brutos</span>
      </button>
    </nav>

    <!-- Tab Contents -->
    <section class="flex-1 min-w-0">
      
      <!-- TAB: Overview -->
      <div id="tab-overview" class="tab-content space-y-8">
        
        <!-- Status Card Alert -->
        <div id="overview-alert" class="p-6 rounded-2xl border flex items-start gap-4">
          <div id="overview-alert-icon" class="p-3 rounded-xl text-white"></div>
          <div class="flex-1">
            <h3 id="overview-alert-title" class="font-bold text-lg text-white"></h3>
            <p id="overview-alert-desc" class="text-sm text-slate-300 mt-1"></p>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Testes Backend</p>
              <h4 class="text-2xl font-bold mt-1 text-white" id="stat-backend-tests">0 / 0</h4>
              <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span class="inline-block w-2 h-2 rounded-full" id="stat-backend-dot"></span>
                <span id="stat-backend-text">Aguardando</span>
              </p>
            </div>
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
              <i data-lucide="server" class="w-6 h-6"></i>
            </div>
          </div>
          
          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Scanner Segurança</p>
              <h4 class="text-2xl font-bold mt-1 text-white" id="stat-security-tests">0 alertas</h4>
              <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span class="inline-block w-2 h-2 rounded-full" id="stat-security-dot"></span>
                <span id="stat-security-text">Aguardando</span>
              </p>
            </div>
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
              <i data-lucide="shield" class="w-6 h-6"></i>
            </div>
          </div>
          
          <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Testes E2E Frontend</p>
              <h4 class="text-2xl font-bold mt-1 text-white" id="stat-frontend-tests">0 / 0</h4>
              <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span class="inline-block w-2 h-2 rounded-full" id="stat-frontend-dot"></span>
                <span id="stat-frontend-text">Aguardando</span>
              </p>
            </div>
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
              <i data-lucide="chrome" class="w-6 h-6"></i>
            </div>
          </div>
        </div>

        <!-- Suite Executive Summary Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div class="p-5 border-b border-slate-800 flex justify-between items-center">
            <h4 class="font-bold text-white">Resumo Executivo das Suítes</h4>
            <i data-lucide="layers" class="w-4 h-4 text-slate-400"></i>
          </div>
          <div class="divide-y divide-slate-800">
            <!-- Backend Row -->
            <div class="p-5 flex items-center justify-between hover:bg-slate-850 transition">
              <div class="flex items-center gap-4">
                <div class="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg" id="sum-backend-icon-bg">
                  <i data-lucide="server" class="w-5 h-5"></i>
                </div>
                <div>
                  <h5 class="text-sm font-semibold text-white">Integração do API Backend (Vitest)</h5>
                  <p class="text-xs text-slate-400 mt-0.5">Rotas HTTP do Express e conexões SQLite de teste</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-xs text-slate-400">Taxa de Sucesso</p>
                  <p class="text-sm font-bold text-white" id="sum-backend-rate">0%</p>
                </div>
                <span id="sum-backend-badge" class="text-xs px-3 py-1 rounded-full font-medium"></span>
              </div>
            </div>
            <!-- Security Row -->
            <div class="p-5 flex items-center justify-between hover:bg-slate-850 transition">
              <div class="flex items-center gap-4">
                <div class="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg" id="sum-security-icon-bg">
                  <i data-lucide="shield" class="w-5 h-5"></i>
                </div>
                <div>
                  <h5 class="text-sm font-semibold text-white">Análise Estática de Vulnerabilidades</h5>
                  <p class="text-xs text-slate-400 mt-0.5">Verificação de vazamento de segredos e padrões inseguros</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-xs text-slate-400">Avisos</p>
                  <p class="text-sm font-bold text-white" id="sum-security-rate">0</p>
                </div>
                <span id="sum-security-badge" class="text-xs px-3 py-1 rounded-full font-medium"></span>
              </div>
            </div>
            <!-- Frontend Row -->
            <div class="p-5 flex items-center justify-between hover:bg-slate-850 transition">
              <div class="flex items-center gap-4">
                <div class="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg" id="sum-frontend-icon-bg">
                  <i data-lucide="chrome" class="w-5 h-5"></i>
                </div>
                <div>
                  <h5 class="text-sm font-semibold text-white">Simulações de Usuário E2E (Playwright)</h5>
                  <p class="text-xs text-slate-400 mt-0.5">Criação de metas, transações e interações visuais</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-xs text-slate-400">Taxa de Sucesso</p>
                  <p class="text-sm font-bold text-white" id="sum-frontend-rate">0%</p>
                </div>
                <span id="sum-frontend-badge" class="text-xs px-3 py-1 rounded-full font-medium"></span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- TAB: Backend -->
      <div id="tab-backend" class="tab-content hidden space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-bold text-white">Testes do Backend (Vitest)</h3>
            <p class="text-xs text-slate-400">Suíte executada contra as APIs do FynxApi</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400" id="backend-count-summary"></span>
          </div>
        </div>

        <div class="space-y-4" id="backend-tests-container">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- TAB: Security -->
      <div id="tab-security" class="tab-content hidden space-y-6">
        <div>
          <h3 class="text-lg font-bold text-white">Resultados da Análise de Segurança</h3>
          <p class="text-xs text-slate-400">Vulnerabilidades de código e credenciais expostas</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div class="flex items-center justify-between gap-4 mb-4">
            <div>
              <h4 class="font-bold text-white">Cobertura OWASP Top 10</h4>
              <p class="text-xs text-slate-400">Tipos de verificacoes executadas pelo scanner estatico.</p>
            </div>
            <i data-lucide="shield-check" class="w-5 h-5 text-indigo-300"></i>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" id="security-checks-container">
            <!-- Dynamically populated -->
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                <th class="p-4 w-28">Severidade</th>
                <th class="p-4 w-36">Tipo</th>
                <th class="p-4">Arquivo & Linha</th>
                <th class="p-4">Identificado / Recomendação</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800" id="security-findings-container">
              <!-- Dynamically populated -->
            </tbody>
          </table>
          <div id="security-empty-state" class="hidden p-8 text-center text-slate-500">
            <i data-lucide="check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-50"></i>
            <p class="font-medium text-slate-300">Nenhum achado de seguranca foi encontrado!</p>
            <p class="text-xs text-slate-500 mt-1">Todas as verificacoes mapeadas acima passaram sem vulnerabilidades estaticas conhecidas.</p>
          </div>
        </div>
      </div>

      <!-- TAB: Frontend -->
      <div id="tab-frontend" class="tab-content hidden space-y-6">
        <div class="flex justify-between items-center">
          <!-- Main text -->
          <div>
            <h3 class="text-lg font-bold text-white">Testes do Frontend E2E (Playwright)</h3>
            <p class="text-xs text-slate-400">Fluxos executados visualmente em navegador Chrome</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400" id="frontend-count-summary"></span>
          </div>
        </div>

        <div class="space-y-4" id="frontend-tests-container">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- TAB: Logs -->
      <div id="tab-logs" class="tab-content hidden space-y-6">
        <div>
          <h3 class="text-lg font-bold text-white">Logs Brutos de Execução</h3>
          <p class="text-xs text-slate-400">Visualização direta da saída do terminal para depuração profunda</p>
        </div>

        <div class="flex gap-2 border-b border-slate-800 pb-2">
          <button onclick="switchLogSubtab('log-backend')" id="btn-log-backend" class="log-subtab-btn text-xs font-semibold px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400">
            Backend
          </button>
          <button onclick="switchLogSubtab('log-security')" id="btn-log-security" class="log-subtab-btn text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-900 text-slate-400">
            Segurança
          </button>
          <button onclick="switchLogSubtab('log-frontend')" id="btn-log-frontend" class="log-subtab-btn text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-900 text-slate-400">
            Frontend E2E
          </button>
        </div>

        <div id="log-backend" class="log-subtab-content bg-slate-950 border border-slate-800 p-5 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-300 max-h-[600px] custom-scroll">
          <pre id="pre-log-backend"></pre>
        </div>
        
        <div id="log-security" class="log-subtab-content hidden bg-slate-950 border border-slate-800 p-5 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-300 max-h-[600px] custom-scroll">
          <pre id="pre-log-security"></pre>
        </div>
        
        <div id="log-frontend" class="log-subtab-content hidden bg-slate-950 border border-slate-800 p-5 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-300 max-h-[600px] custom-scroll">
          <pre id="pre-log-frontend"></pre>
        </div>
      </div>

    </section>
  </main>

  <!-- Footer -->
  <footer class="bg-slate-900 border-t border-slate-800 py-6 mt-12">
    <div class="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500">
      <span>Dashboard gerado automaticamente por <strong>Antigravity AI Kit</strong> &copy; 2026</span>
    </div>
  </footer>

  <!-- Injected Data -->
  <script>
    window.testResults = ${JSON.stringify(reportData)};
  </script>

  <!-- Tab and Rendering Scripts -->
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderDashboard();
      lucide.createIcons();
    });

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.add('hidden'); });
      document.getElementById('tab-' + tabId).classList.remove('hidden');
      
      document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.className = "tab-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition duration-200 hover:bg-slate-900 border border-transparent text-slate-400";
      });
      
      var activeBtn = document.getElementById('btn-' + tabId);
      if (tabId === 'overview' || tabId === 'logs') {
        activeBtn.className = "tab-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400";
      } else {
        activeBtn.className = "tab-btn w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition duration-200 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400";
      }
    }

    function switchLogSubtab(subtabId) {
      document.querySelectorAll('.log-subtab-content').forEach(function(el) { el.classList.add('hidden'); });
      document.getElementById(subtabId).classList.remove('hidden');
      
      document.querySelectorAll('.log-subtab-btn').forEach(function(btn) {
        btn.className = "log-subtab-btn text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-900 text-slate-400";
      });
      
      document.getElementById('btn-' + subtabId).className = "log-subtab-btn text-xs font-semibold px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400";
    }

    function toggleExpand(id) {
      var el = document.getElementById(id);
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }

    function renderDashboard() {
      var data = window.testResults;
      
      document.getElementById('header-timestamp').innerText = data.timestamp;
      document.getElementById('header-duration').innerText = data.duration;

      var backendSuccess = data.backend.status === 'passed';
      var securitySuccess = data.security.status === 'passed';
      var frontendSuccess = data.frontend.status === 'passed';

      var getBadgeClass = function(status) {
        if (status === 'passed') return 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400';
        if (status === 'failed') return 'bg-rose-500/10 border border-rose-500/25 text-rose-400';
        if (status === 'warning') return 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
        return 'bg-slate-500/10 border border-slate-500/25 text-slate-400';
      };

      var badgeBackend = document.getElementById('badge-backend');
      badgeBackend.innerText = data.backend.summary.passed + '/' + data.backend.summary.total;
      badgeBackend.className = badgeBackend.className + ' ' + getBadgeClass(data.backend.status);

      var badgeSecurity = document.getElementById('badge-security');
      badgeSecurity.innerText = data.security.summary.total;
      badgeSecurity.className = badgeSecurity.className + ' ' + getBadgeClass(data.security.status);

      var badgeFrontend = document.getElementById('badge-frontend');
      badgeFrontend.innerText = data.frontend.summary.passed + '/' + data.frontend.summary.total;
      badgeFrontend.className = badgeFrontend.className + ' ' + getBadgeClass(data.frontend.status);

      document.getElementById('stat-backend-tests').innerText = data.backend.summary.passed + ' / ' + data.backend.summary.total;
      document.getElementById('stat-backend-dot').className = document.getElementById('stat-backend-dot').className + ' ' + (backendSuccess ? 'bg-emerald-500' : 'bg-rose-500');
      document.getElementById('stat-backend-text').innerText = backendSuccess ? 'Passou' : 'Com Falhas';

      document.getElementById('stat-security-tests').innerText = data.security.summary.total + ' Alertas';
      document.getElementById('stat-security-dot').className = document.getElementById('stat-security-dot').className + ' ' + (securitySuccess ? 'bg-emerald-500' : 'bg-amber-500');
      document.getElementById('stat-security-text').innerText = securitySuccess ? 'Seguro' : 'Vulnerabilidades';

      document.getElementById('stat-frontend-tests').innerText = data.frontend.summary.passed + ' / ' + data.frontend.summary.total;
      document.getElementById('stat-frontend-dot').className = document.getElementById('stat-frontend-dot').className + ' ' + (frontendSuccess ? 'bg-emerald-500' : 'bg-rose-500');
      document.getElementById('stat-frontend-text').innerText = frontendSuccess ? 'Passou' : 'Com Falhas';

      var isAllOk = backendSuccess && securitySuccess && frontendSuccess;
      var alertContainer = document.getElementById('overview-alert');
      var alertIcon = document.getElementById('overview-alert-icon');
      var alertTitle = document.getElementById('overview-alert-title');
      var alertDesc = document.getElementById('overview-alert-desc');

      if (isAllOk) {
        alertContainer.className = alertContainer.className + ' bg-emerald-500/10 border-emerald-500/20';
        alertIcon.className = alertIcon.className + ' bg-emerald-500';
        alertIcon.innerHTML = '<i data-lucide="smile"></i>';
        alertTitle.innerText = 'Suíte de Testes Aprovada com Sucesso!';
        alertDesc.innerText = 'Todos os testes de integração do backend, cenários E2E do frontend e escaneamento de segurança passaram com 100% de sucesso.';
      } else {
        alertContainer.className = alertContainer.className + ' bg-rose-500/10 border-rose-500/20';
        alertIcon.className = alertIcon.className + ' bg-rose-500';
        alertIcon.innerHTML = '<i data-lucide="frown"></i>';
        alertTitle.innerText = 'Problemas ou Falhas Encontradas';
        alertDesc.innerText = 'A suíte detectou falhas de execução nos testes do frontend/backend ou possui alertas de segurança ativos que requerem revisão imediata.';
      }

      var setSumRow = function(key, successRate, label) {
        document.getElementById('sum-' + key + '-rate').innerText = successRate;
        var badge = document.getElementById('sum-' + key + '-badge');
        badge.innerText = label;
        badge.className = badge.className + ' ' + getBadgeClass(data[key].status);
        
        var iconBg = document.getElementById('sum-' + key + '-icon-bg');
        if (data[key].status === 'passed') {
          iconBg.className = 'p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg';
        } else if (data[key].status === 'failed') {
          iconBg.className = 'p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg';
        } else {
          iconBg.className = 'p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg';
        }
      };

      var backendRate = data.backend.summary.total ? Math.round((data.backend.summary.passed / data.backend.summary.total) * 100) + '%' : '0%';
      setSumRow('backend', backendRate, data.backend.status.toUpperCase());
      
      var secLabel = data.security.summary.critical > 0 ? 'CRÍTICO' : (data.security.summary.high > 0 ? 'RISCO ALTO' : 'SEGURO');
      setSumRow('security', data.security.summary.total + ' alertas', secLabel);

      var frontendRate = data.frontend.summary.total ? Math.round((data.frontend.summary.passed / data.frontend.summary.total) * 100) + '%' : '0%';
      setSumRow('frontend', frontendRate, data.frontend.status.toUpperCase());

      // Render Backend Tests
      var backendContainer = document.getElementById('backend-tests-container');
      document.getElementById('backend-count-summary').innerText = 'Total: ' + data.backend.summary.total + ' | Passaram: ' + data.backend.summary.passed + ' | Falharam: ' + data.backend.summary.failed;
      
      if (data.backend.tests.length === 0) {
        backendContainer.innerHTML = '<div class="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">Nenhum teste de backend encontrado.</div>';
      } else {
        var groupedBackend = {};
        data.backend.tests.forEach(function(t) {
          if (!groupedBackend[t.suite]) groupedBackend[t.suite] = [];
          groupedBackend[t.suite].push(t);
        });

        var bIndex = 0;
        for (var suiteName in groupedBackend) {
          var tests = groupedBackend[suiteName];
          var suiteId = 'b-suite-' + (bIndex++);
          var suiteFailed = tests.some(function(t) { return t.status === 'failed'; });
          var statusIcon = suiteFailed ? '<i data-lucide="x-circle" class="w-4 h-4 text-rose-400"></i>' : '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>';
          var headerBorder = suiteFailed ? 'border-rose-500/20' : 'border-slate-800';
          var bgHeader = suiteFailed ? 'bg-rose-500/5' : 'bg-slate-900';

          var htmlSuite = '<div class="border ' + headerBorder + ' rounded-2xl overflow-hidden shadow-sm">' +
            '<div onclick="toggleExpand(\\\'' + suiteId + '\\\')" class="p-4 ' + bgHeader + ' flex items-center justify-between cursor-pointer select-none">' +
              '<div class="flex items-center gap-3">' +
                statusIcon +
                '<span class="text-sm font-bold text-white">' + suiteName + '</span>' +
              '</div>' +
              '<div class="flex items-center gap-3">' +
                '<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 font-semibold">' + tests.length + ' testes</span>' +
                '<i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>' +
              '</div>' +
            '</div>' +
            '<div id="' + suiteId + '" class="p-5 bg-slate-950 border-t border-slate-900 divide-y divide-slate-900">';

          tests.forEach(function(test) {
            var isTestOk = test.status === 'passed';
            var testIcon = isTestOk ? '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>' : '<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-400"></i>';
            var durationColor = test.duration > 150 ? 'text-amber-400' : 'text-slate-500';
            
            htmlSuite += '<div class="py-3 flex flex-col gap-2">' +
              '<div class="flex items-center justify-between text-xs">' +
                '<div class="flex items-center gap-2">' +
                  testIcon +
                  '<span class="font-medium text-slate-200">' + test.title + '</span>' +
                '</div>' +
                '<span class="' + durationColor + ' font-mono">' + test.duration + 'ms</span>' +
              '</div>' +
              (!isTestOk && test.error ? 
                '<div class="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl mt-2 text-[10px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">' +
                  test.error +
                '</div>' : '') +
            '</div>';
          });

          htmlSuite += '</div></div>';
          backendContainer.innerHTML += htmlSuite;
        }
      }

      // Render Security
      var securityContainer = document.getElementById('security-findings-container');
      var securityEmptyState = document.getElementById('security-empty-state');
      var securityChecksContainer = document.getElementById('security-checks-container');

      if (securityChecksContainer) {
        securityChecksContainer.innerHTML = '';
        (data.security.checks || []).forEach(function(check) {
          var result = check.result || 'not-run';
          var badgeClass = 'bg-slate-500/10 border border-slate-500/25 text-slate-300';
          var resultLabel = 'Nao executado';
          var resultIcon = 'circle-help';

          if (result === 'passed') {
            badgeClass = 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300';
            resultLabel = 'Passou';
            resultIcon = 'check-circle';
          } else if (result === 'critical') {
            badgeClass = 'bg-rose-500/10 border border-rose-500/25 text-rose-300';
            resultLabel = 'Critico';
            resultIcon = 'alert-triangle';
          } else if (result === 'high') {
            badgeClass = 'bg-orange-500/10 border border-orange-500/25 text-orange-300';
            resultLabel = 'Alto';
            resultIcon = 'alert-triangle';
          } else if (result === 'warning') {
            badgeClass = 'bg-amber-500/10 border border-amber-500/25 text-amber-300';
            resultLabel = 'Aviso';
            resultIcon = 'alert-circle';
          }

          var examples = (check.examples || []).map(function(item) {
            return '<span class="text-[10px] px-2 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">' + escapeHtml(item) + '</span>';
          }).join('');
          var findingsCount = check.findingsCount || 0;
          var findingsLabel = findingsCount === 1 ? '1 achado' : findingsCount + ' achados';

          var checkHtml = '<div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">' +
            '<div class="flex items-start justify-between gap-3">' +
              '<div class="min-w-0">' +
                '<div class="flex items-center gap-2">' +
                  '<i data-lucide="' + resultIcon + '" class="w-4 h-4 text-slate-400 shrink-0"></i>' +
                  '<p class="font-bold text-white">' + escapeHtml(check.title || '') + '</p>' +
                '</div>' +
                '<p class="text-[11px] text-indigo-300 mt-1">' + escapeHtml(check.owasp || '') + '</p>' +
              '</div>' +
              '<span class="shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold ' + badgeClass + '">' + resultLabel + '</span>' +
            '</div>' +
            '<p class="text-xs text-slate-300 leading-relaxed">' + escapeHtml(check.description || '') + '</p>' +
            '<div class="flex flex-wrap gap-2">' + examples + '</div>' +
            '<div class="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800 pt-3">' +
              '<span>' + findingsLabel + '</span>' +
              '<span class="font-mono text-slate-300">' + escapeHtml(check.status || '') + '</span>' +
            '</div>' +
          '</div>';

          securityChecksContainer.innerHTML += checkHtml;
        });
      }
      
      if (data.security.findings.length === 0) {
        securityEmptyState.classList.remove('hidden');
      } else {
        data.security.findings.forEach(function(f) {
          var getSevColor = function(s) {
            if (s === 'critical') return 'bg-rose-500/10 border border-rose-500/25 text-rose-400 font-bold';
            if (s === 'high') return 'bg-orange-500/10 border border-orange-500/25 text-orange-400 font-semibold';
            return 'bg-amber-500/10 border border-amber-500/25 text-amber-400';
          };

          var rowHtml = '<tr class="hover:bg-slate-900/50 transition">' +
            '<td class="p-4 align-top">' +
              '<span class="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ' + getSevColor(f.severity) + '">' + escapeHtml(f.severity || '') + '</span>' +
            '</td>' +
            '<td class="p-4 align-top font-medium text-slate-300">' + escapeHtml(f.type || '') + '</td>' +
            '<td class="p-4 align-top font-mono text-slate-400">' +
              '<span class="text-indigo-400">' + escapeHtml(f.file || '') + '</span><span class="text-slate-600">:' + escapeHtml(String(f.line || 0)) + '</span>' +
            '</td>' +
            '<td class="p-4 align-top space-y-2">' +
              '<p class="font-medium text-slate-200">' + escapeHtml(f.description || '') + '</p>' +
              (f.snippet ? '<div class="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-[10px] font-mono text-slate-400 overflow-x-auto">' + escapeHtml(f.snippet) + '</div>' : '') +
              '<p class="text-xs text-indigo-400/90 flex items-center gap-1">' +
                '<i data-lucide="help-circle" class="w-3.5 h-3.5"></i>' +
                '<span><strong>Recomendacao:</strong> ' + escapeHtml(f.recommendation || '') + '</span>' +
              '</p>' +
            '</td>' +
          '</tr>';
          securityContainer.innerHTML += rowHtml;
        });
      }

      // Render Frontend Tests
      var frontendContainer = document.getElementById('frontend-tests-container');
      document.getElementById('frontend-count-summary').innerText = 'Total: ' + data.frontend.summary.total + ' | Passaram: ' + data.frontend.summary.passed + ' | Falharam: ' + data.frontend.summary.failed;

      if (data.frontend.tests.length === 0) {
        frontendContainer.innerHTML = '<div class="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">Nenhum teste de frontend encontrado.</div>';
      } else {
        var groupedFrontend = {};
        data.frontend.tests.forEach(function(t) {
          if (!groupedFrontend[t.file]) groupedFrontend[t.file] = [];
          groupedFrontend[t.file].push(t);
        });

        var fIndex = 0;
        for (var fileName in groupedFrontend) {
          var tests = groupedFrontend[fileName];
          var specId = 'f-spec-' + (fIndex++);
          var specFailed = tests.some(function(t) { return t.status === 'failed' || t.status === 'unexpected'; });
          var statusIcon = specFailed ? '<i data-lucide="x-circle" class="w-4 h-4 text-rose-400"></i>' : '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>';
          var headerBorder = specFailed ? 'border-rose-500/20' : 'border-slate-800';
          var bgHeader = specFailed ? 'bg-rose-500/5' : 'bg-slate-900';

          var htmlSpec = '<div class="border ' + headerBorder + ' rounded-2xl overflow-hidden shadow-sm">' +
            '<div onclick="toggleExpand(\\\'' + specId + '\\\')" class="p-4 ' + bgHeader + ' flex items-center justify-between cursor-pointer select-none">' +
              '<div class="flex items-center gap-3">' +
                statusIcon +
                '<span class="text-sm font-bold text-white">' + fileName + '</span>' +
              '</div>' +
              '<div class="flex items-center gap-3">' +
                '<span class="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 font-semibold">' + tests.length + ' fluxos</span>' +
                '<i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>' +
              '</div>' +
            '</div>' +
            '<div id="' + specId + '" class="p-5 bg-slate-950 border-t border-slate-900 divide-y divide-slate-900">';

          tests.forEach(function(test, tIndex) {
            var isTestOk = test.status === 'passed' || test.status === 'expected';
            var testIcon = isTestOk ? '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>' : '<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-400"></i>';
            var logId = specId + '-log-' + tIndex;
            var durationInSeconds = (test.duration / 1000).toFixed(2);
            
            htmlSpec += '<div class="py-4 flex flex-col gap-2">' +
              '<div class="flex items-center justify-between text-xs">' +
                '<div class="flex items-center gap-2">' +
                  testIcon +
                  '<span class="font-medium text-slate-200">' + test.title + '</span>' +
                '</div>' +
                '<div class="flex items-center gap-3">' +
                  (test.logs ? 
                    '<button onclick="toggleExpand(\\\'' + logId + '\\\')" class="text-[10px] hover:text-indigo-400 text-slate-400 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1 font-medium bg-slate-900">' +
                      '<i data-lucide="terminal" class="w-3 h-3"></i> Logs da Intercepção' +
                    '</button>' : '') +
                  '<span class="text-slate-500 font-mono">' + durationInSeconds + 's</span>' +
                '</div>' +
              '</div>' +
              (test.logs ? 
                '<div id="' + logId + '" class="hidden bg-slate-900/60 border border-slate-800 p-4 rounded-xl mt-2 text-[10px] font-mono text-slate-300 max-h-48 overflow-y-auto custom-scroll whitespace-pre-wrap">' +
                  escapeHtml(test.logs) +
                '</div>' : '') +
              (!isTestOk && test.error ? 
                '<div class="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl mt-2 text-[10px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">' +
                  test.error +
                '</div>' : '') +
            '</div>';
          });

          htmlSpec += '</div></div>';
          frontendContainer.innerHTML += htmlSpec;
        }
      }

      document.getElementById('pre-log-backend').innerText = data.backend.rawLog || 'Nenhum log gravado.';
      document.getElementById('pre-log-security').innerText = data.security.rawLog || 'Nenhum log gravado.';
      document.getElementById('pre-log-frontend').innerText = data.frontend.rawLog || 'Nenhum log gravado.';
    }

    function escapeHtml(text) {
      var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(reportPath, html, 'utf8');

  console.log(formatHeader('✨ COMPILAÇÃO CONCLUÍDA E RELATÓRIO HTML GERADO!'));
  console.log(`${colors.bright}${colors.green}🎉 Concluído com sucesso!${colors.reset}`);
  console.log(`${colors.bright}📂 Relatório HTML unificado e detalhado salvo em:${colors.reset}`);
  console.log(`   ${colors.bright}${colors.blue}${reportPath}${colors.reset}\n`);
  console.log(`${colors.bright}${colors.yellow}Dica: Você pode dar um duplo clique no arquivo acima para abri-lo em qualquer navegador.${colors.reset}\n`);

  // Check if there are failures to determine exit code
  const hasFailures = reportData.backend.status === 'failed' || 
                        reportData.backend.status === 'error' || 
                        reportData.security.status === 'warning' ||
                        reportData.security.status === 'error' ||
                        reportData.frontend.status === 'failed' || 
                        reportData.frontend.status === 'error';
  
  process.exit(hasFailures ? 1 : 0);
}

start();
