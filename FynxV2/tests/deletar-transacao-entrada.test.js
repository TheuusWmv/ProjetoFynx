// Testes E2E com Selenium WebDriver e Mocha (ESM)
// Para rodar: npm run dev (frontend) e npx mocha tests/deletar-transacao-entrada.test.js

import { Builder, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { parse as parseUrl } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '..', 'output');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function now() { return new Date().toISOString().replace(/[:.]/g, '-'); }

async function saveDebug(driver, name) {
  try {
    const png = await driver.takeScreenshot();
    fs.writeFileSync(path.join(OUT_DIR, `${now()}-${name}.png`), png, 'base64');
    const src = await driver.getPageSource();
    fs.writeFileSync(path.join(OUT_DIR, `${now()}-${name}.html`), src, 'utf8');
  } catch (err) { /* ignore */ }
}

async function tryFind(driverOrElement, selectors, timeoutPer = 2000) {
  for (const sel of selectors) {
    try {
      const el = driverOrElement.wait
        ? await driverOrElement.wait(until.elementLocated(sel), timeoutPer)
        : await driverOrElement.findElement(sel);
      return el;
    } catch (e) { /* next selector */ }
  }
  return null;
}

describe('Fynx - Excluir transação de ENTRADA (E2E) [skip login]', function () {
  this.timeout(120000);
  let driver;
  let mockServer;
  let transactions = [];

  function sendJson(res, status, data) {
    const json = JSON.stringify(data);
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(json);
  }

  function ensureMockServer() {
    return new Promise((resolve) => {
      const server = http.createServer(async (req, res) => {
        // CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          return res.end();
        }

        const { pathname } = parseUrl(req.url || '/', true);
        const ok = (data) => sendJson(res, 200, data);
        const notFound = () => sendJson(res, 404, { error: 'not found' });
        const method = (req.method || 'GET').toUpperCase();

        // helper para ler body
        const readBody = async () => new Promise((resolveBody) => {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try { resolveBody(JSON.parse(body || '{}')); }
            catch { resolveBody({}); }
          });
        });

        // Rotas básicas usadas pelo app
        if (pathname === '/api/v1/dashboard' && method === 'GET') {
          const recent = transactions.slice(-10).reverse();
          return ok({
            overview: [
              { title: 'Total Balance', value: 'R$ 1.000,00', change: '+0%', trend: 'up' },
              { title: 'Monthly Income', value: 'R$ 0,00', change: '+0%', trend: 'up' },
              { title: 'Monthly Expenses', value: 'R$ 0,00', change: '0%', trend: 'down' },
              { title: 'Savings Rate', value: '0%', change: '0%', trend: 'up' },
            ],
            recentTransactions: recent,
            spendingByCategory: [],
            incomeByCategory: [],
            dailyPerformance: [],
            monthlyPerformance: [],
          });
        }

        if (pathname === '/api/v1/dashboard/transactions' && method === 'GET') {
          return ok(transactions);
        }

        if (pathname === '/api/v1/transactions' && method === 'GET') {
          return ok({ data: transactions, total: transactions.length });
        }

        if (pathname === '/api/v1/transactions' && method === 'POST') {
          const body = await readBody();
          const id = transactions.length ? (Number(transactions[transactions.length - 1].id) + 1) : 1;
          const created = {
            id,
            description: body.description || 'Sem descrição',
            type: body.type || 'income',
            status: 'completed',
            amount: Number(body.amount ?? 0),
            date: body.date || new Date().toISOString().slice(0, 10),
            category: body.category || 'Other',
          };
          transactions.push(created);
          return ok(created);
        }

        // DELETE /api/v1/transactions/:id?userId=1
        if (pathname && pathname.startsWith('/api/v1/transactions/') && method === 'DELETE') {
          const idStr = pathname.split('/').pop();
          const idNum = Number(idStr);
          const before = transactions.length;
          transactions = transactions.filter((t) => Number(t.id) !== idNum);
          const removed = before !== transactions.length;
          return ok({ success: removed });
        }

        if (pathname === '/api/v1/goals' && method === 'GET') {
          return ok({ data: [], total: 0 });
        }

        return notFound();
      });

      server.on('error', () => resolve(null)); // Porta já em uso: assume backend real
      server.listen(3001, () => {
        console.log('✓ Mock server rodando em http://localhost:3001');
        console.log(`✓ Transações iniciais semeadas: ${transactions.length} transação(ões)`);
        resolve(server);
      });
    });
  }

  // Tenta ler as transações atuais via API (mock ou backend real). Retorna null se não acessível.
  async function fetchTransactionsAPI() {
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: 3001,
          path: '/api/v1/dashboard/transactions',
          method: 'GET',
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
              resolve(parsed);
            } catch {
              resolve(null);
            }
          });
        }
      );
      req.on('error', () => resolve(null));
      req.end();
    });
  }

  before(async () => {
    // Semeia uma transação de ENTRADA para permitir a exclusão
    const today = new Date().toISOString().slice(0, 10);
    transactions = [
      {
        id: 1,
        description: 'Entrada Teste Selenium',
        type: 'income',
        status: 'completed',
        amount: 100,
        date: today,
        category: 'Salary',
      },
      {
        id: 2,
        description: 'Outra Transação',
        type: 'expense',
        status: 'completed',
        amount: 50,
        date: today,
        category: 'Food',
      },
    ];

    // Sobe mock server se o backend real não estiver rodando (pode desativar via env)
    if (!process.env.E2E_DISABLE_MOCK) {
      mockServer = await ensureMockServer();
    }

    const options = new chrome.Options()
      .addArguments(
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--window-size=1600,1000',
        '--start-maximized'
      );
    // Sempre abre o navegador visível (sem headless)
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    try { await driver.manage().window().maximize(); } catch (e) {}
  });

  after(async () => {
    if (driver) await driver.quit();
    if (mockServer) {
      try { await new Promise((r) => mockServer.close(() => r(null))); } catch {}
    }
  });


  it('deleta UMA transação de ENTRADA via Recent Transactions clicando na lixeira e confirmando na modal', async function () {

    await driver.get(BASE_URL + '/dashboard');
    await driver.sleep(1000);

    // FECHAR O TOUR EM LOOP ATÉ A LISTA APARECER
    const tourCloseSelectors = [
      By.xpath("//button[contains(translate(.,'PRÓXIMOFINALIZARFECHARPULARSKIP','próximofinalizarfecharpularskip'),'próximo') or contains(translate(.,'PRÓXIMOFINALIZARFECHARPULARSKIP','próximofinalizarfecharpularskip'),'finalizar') or contains(translate(.,'PRÓXIMOFINALIZARFECHARPULARSKIP','próximofinalizarfecharpularskip'),'fechar') or contains(translate(.,'PRÓXIMOFINALIZARFECHARPULARSKIP','próximofinalizarfecharpularskip'),'pular') or contains(translate(.,'PRÓXIMOFINALIZARFECHARPULARSKIP','próximofinalizarfecharpularskip'),'skip') ]"),
      By.css('button[aria-label="Fechar"], button[aria-label="Close"], button[aria-label*="tour"]'),
      By.css('.tour-close, .joyride-close, .react-joyride__close-button'),
    ];
    for (let tent = 0; tent < 10; tent++) {
      for (let i = 0; i < 3; i++) {
        const closeBtn = await tryFind(driver, tourCloseSelectors, 700);
        if (closeBtn) {
          try { await closeBtn.click(); } catch (e) { await driver.executeScript('arguments[0].click()', closeBtn); }
          await driver.sleep(300);
        } else {
          break;
        }
      }
      // Verifica se a tabela de transações recentes apareceu
      const table = await tryFind(driver, [
        By.xpath("//table[.//th[contains(.,'Transações Recentes') or contains(.,'Descrição')]]")
      ], 1200);
      if (table) break;
      await driver.sleep(600);
    }


    // Buscar a linha de transação como <div class="grid ..."> com os textos de descrição e tipo
    const rowXpath = "//div[contains(@class,'grid') and .//span[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'entrada teste selenium')] and .//span[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'entrada')]]";
    let incomeRow = await tryFind(driver, [By.xpath(rowXpath)], 12000);

    // Tentar refresh uma vez se não encontrar
    if (!incomeRow) {
      console.log('Nenhuma transação de entrada encontrada, tentando refresh...');
      try { await driver.navigate().refresh(); } catch {}
      await driver.sleep(1500);
      incomeRow = await tryFind(driver, [By.xpath(rowXpath)], 5000);
      if (!incomeRow) {
        await saveDebug(driver, 'no-income-transaction-to-delete');
        console.log('⚠️  Nenhuma transação de ENTRADA "Teste Selenium" encontrada para deletar. Pulando teste...');
        return this.skip();
      }
    }

    console.log('✓ Transação de ENTRADA encontrada, iniciando exclusão...');

    // localizar botão de remover (lixeira) na mesma linha
    let removeBtn = await tryFind(incomeRow, [
      By.xpath(".//button//*[name()='svg' and (contains(@data-icon,'trash') or contains(@class,'trash') or contains(@class,'Trash'))]/ancestor::button"),
      By.xpath(".//button[contains(@aria-label,'excluir') or contains(@aria-label,'deletar') or contains(@aria-label,'remover') or contains(@title,'excluir') or contains(@title,'deletar') or contains(@title,'remover')]"),
      By.css('button svg.lucide-trash, button svg[data-icon="trash"]'),
      By.xpath(".//button") // fallback: único botão na célula de ações
    ], 4000);

    if (!removeBtn) {
      await saveDebug(driver, 'remove-button-not-found');
      throw new Error('Botão de remover transação (lixeira) não encontrado.');
    }

    try { await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", removeBtn); } catch {}
    try { await removeBtn.click(); } catch { await driver.executeScript('arguments[0].click();', removeBtn); }

    await driver.sleep(500);

    // aguardar modal de confirmação
    const dialog = await tryFind(driver, [
      By.xpath("//*[@role='alertdialog' or @role='dialog'][.//*[contains(normalize-space(.),'Excluir transação')]]"),
      By.xpath("//*[contains(normalize-space(.),'Excluir transação') and (ancestor::*[@role='dialog'] or ancestor::*[@role='alertdialog'])]")
    ], 6000);
    if (!dialog) {
      await saveDebug(driver, 'delete-dialog-not-found');
      throw new Error('Modal de confirmação de exclusão não apareceu.');
    }

    // confirmar exclusão
    const confirmBtn = await tryFind(dialog, [
      By.xpath(".//button[normalize-space(.)='Excluir']"),
      By.xpath(".//button[contains(normalize-space(.),'Excluir')]")
    ], 4000);
    if (!confirmBtn) {
      await saveDebug(driver, 'confirm-delete-button-not-found');
      throw new Error('Botão "Excluir" na modal não encontrado.');
    }

    try { await confirmBtn.click(); } catch { await driver.executeScript('arguments[0].click();', confirmBtn); }

    console.log('✓ Confirmou exclusão da transação');
    // Aguarda até 5s para sumir a linha após exclusão
    let rowCount = 0;
    for (let tent = 0; tent < 10; tent++) {
      try { await driver.navigate().refresh(); } catch {}
      await driver.sleep(600);
      // Busca apenas linhas reais de transação (ignorando cabeçalhos)
      const rows = await driver.findElements(By.xpath(rowXpath));
      // Filtra para garantir que contenham exatamente a descrição e tipo esperados
      rowCount = 0;
      for (const row of rows) {
        const desc = await row.getText();
        if (desc.toLowerCase().includes('entrada teste selenium') && desc.toLowerCase().includes('entrada')) {
          rowCount++;
        }
      }
      if (rowCount === 0) break;
    }
    console.log(`Transações de ENTRADA "Teste Selenium" após exclusão: ${rowCount}`);
    if (rowCount > 0) {
      await saveDebug(driver, 'row-not-removed');
      throw new Error('A linha da transação ainda está presente após exclusão.');
    }
    console.log('✓ Teste concluído: clicou na lixeira, confirmou exclusão na modal e linha sumiu.');
  });
});
 
