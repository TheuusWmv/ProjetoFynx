import { test, expect } from '@playwright/test';

test.describe('Fynx - Transações (E2E)', () => {
  let transactions: any[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset seed data for test isolation
    transactions = [
      {
        id: 1,
        description: 'Entrada Teste Selenium',
        type: 'income',
        status: 'completed',
        amount: 100,
        date: '2026-06-02',
        category: 'Salary'
      },
      {
        id: 2,
        description: 'Saída Teste Selenium',
        type: 'expense',
        status: 'completed',
        amount: 50,
        date: '2026-06-02',
        category: 'Food'
      }
    ];
    // Inject localStorage token to bypass authentication redirect and tours
    await page.addInitScript(() => {
      window.localStorage.setItem('fynx_token', 'mocked_jwt_token_for_e2e');
      window.localStorage.setItem(
        'fynx_user',
        JSON.stringify({ id: 1, name: 'Usuário Demo', email: 'demo@fynx.com' })
      );
      window.localStorage.setItem('fynx-tour-completed', 'true');
      window.localStorage.setItem('fynx-tour-skipped', 'true');
    });

    // Mock API requests
    await page.route('**/api/v1/dashboard', async (route) => {
      console.log(`[Mock API] GET /dashboard called. Transaction count: ${transactions.length}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          overview: [
            { title: 'Total Balance', value: 'R$ 1.000,00', change: '+0%', trend: 'up' },
            { title: 'Monthly Income', value: 'R$ 0,00', change: '+0%', trend: 'up' },
            { title: 'Monthly Expenses', value: 'R$ 0,00', change: '0%', trend: 'down' },
            { title: 'Savings Rate', value: '0%', change: '0%', trend: 'up' },
          ],
          recentTransactions: transactions.slice(-10).reverse(),
          spendingByCategory: [],
          incomeByCategory: [],
          dailyPerformance: [],
          monthlyPerformance: [],
        }),
      });
    });

    await page.route('**/api/v1/dashboard/transactions', async (route) => {
      console.log(`[Mock API] GET /dashboard/transactions called. Transaction count: ${transactions.length}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(transactions),
      });
    });

    await page.route('**/api/v1/transactions', async (route) => {
      const method = route.request().method();
      console.log(`[Mock API] ${method} /transactions called`);
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: transactions, total: transactions.length }),
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newTx = {
          id: transactions.length ? (Number(transactions[transactions.length - 1].id) + 1) : 1,
          description: body.description || 'Sem descrição',
          type: body.type || 'income',
          status: 'completed',
          amount: Number(body.amount ?? 0),
          date: body.date || '2026-06-02',
          category: body.category || 'Other',
        };
        transactions.push(newTx);
        console.log(`[Mock API] Added transaction: ${newTx.description} (id: ${newTx.id})`);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newTx),
        });
      }
    });

    await page.route(/\/api\/v1\/transactions\/\d+/, async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      console.log(`[Mock API] Intercepted request: ${method} ${url}`);
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/');
      const id = Number(pathParts.pop());
      console.log(`[Mock API] Extracted ID: ${id}`);

      if (method === 'DELETE') {
        const beforeCount = transactions.length;
        transactions = transactions.filter((t) => Number(t.id) !== id);
        console.log(`[Mock API] DELETE executed. Count before: ${beforeCount}, after: ${transactions.length}`);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.route('**/api/v1/goals', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0 }) });
    });
  });

  test('adiciona uma transação de entrada preenchendo todos os campos', async ({ page }) => {
    await page.goto('/dashboard');

    // Click "Adicionar Transação" button
    const addBtn = page.locator('button[aria-label="Adicionar Transação"], button:has-text("Adicionar Transação")').first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Scope to the dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill Description
    const descInput = dialog.locator('input[data-tour="transaction-description"], input[placeholder*="Salário"], input[type="text"]').first();
    await expect(descInput).toBeVisible({ timeout: 5000 });
    await descInput.fill('Entrada Teste Selenium');

    // Fill Amount
    const amountInput = dialog.locator('input[placeholder*="0,00"], input[type="text"]').first();
    await amountInput.fill('100');

    // Select "Entrada" type radio
    const typeRadio = dialog.locator('button[role="radio"][value="income"]');
    await typeRadio.click();

    // Select Category "Salário"
    const categoryTrigger = dialog.locator('button[role="combobox"]').first();
    await categoryTrigger.click();
    const categoryOption = page.locator('[role="option"]:has-text("Salário")').first();
    await categoryOption.click();

    // Save
    const saveBtn = dialog.locator('button[type="submit"]:has-text("Salvar"), button:has-text("Salvar Transação")').first();
    await saveBtn.click();

    // Verify it is in the recent transactions list
    const transactionItem = page.locator('text=Entrada Teste Selenium').first();
    await expect(transactionItem).toBeVisible({ timeout: 10000 });
  });

  test('adiciona uma transação de saída preenchendo todos os campos', async ({ page }) => {
    await page.goto('/dashboard');

    const addBtn = page.locator('button[aria-label="Adicionar Transação"], button:has-text("Adicionar Transação")').first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Scope to the dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const descInput = dialog.locator('input[data-tour="transaction-description"], input[placeholder*="Salário"], input[type="text"]').first();
    await expect(descInput).toBeVisible({ timeout: 5000 });
    await descInput.fill('Saída Teste Selenium');

    const amountInput = dialog.locator('input[placeholder*="0,00"], input[type="text"]').first();
    await amountInput.fill('50');

    // Select "Saída" type radio
    const typeRadio = dialog.locator('button[role="radio"][value="expense"]');
    await typeRadio.click();

    // Select Category "Alimentação"
    const categoryTrigger = dialog.locator('button[role="combobox"]').first();
    await categoryTrigger.click();
    const categoryOption = page.locator('[role="option"]:has-text("Alimentação")').first();
    await categoryOption.click();

    const saveBtn = dialog.locator('button[type="submit"]:has-text("Salvar"), button:has-text("Salvar Transação")').first();
    await saveBtn.click();

    const transactionItem = page.locator('text=Saída Teste Selenium').first();
    await expect(transactionItem).toBeVisible({ timeout: 10000 });
  });

  test('exclui uma transação de entrada via Recent Transactions', async ({ page }) => {
    await page.goto('/dashboard');

    // Find the row containing "Entrada Teste Selenium" precisely
    const row = page.locator('[data-tour="recent-transactions"] div.grid-cols-6').filter({ hasText: 'Entrada Teste Selenium' }).first();
    await expect(row).toBeVisible({ timeout: 5000 });

    // Find and click the delete button in that row
    const deleteBtn = row.locator('button[aria-label="Remover transação"]').first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    // Click confirm in the alert dialog
    const confirmBtn = page.locator('[role="alertdialog"] button:has-text("Excluir")').first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Verify it is no longer visible
    await expect(page.locator('text=Entrada Teste Selenium')).not.toBeVisible({ timeout: 5000 });
  });
});
