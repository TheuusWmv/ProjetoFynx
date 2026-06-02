import { test, expect } from '@playwright/test';

test.describe('Fynx - Criar Meta (E2E)', () => {
  let goals = [
    {
      id: 1,
      title: 'Viagem para Europa',
      category: 'Outros',
      targetAmount: 15000,
      currentAmount: 0,
      period: 'monthly',
      startDate: '2026-06-02',
      endDate: '2027-06-02',
      description: 'Meta de viagem'
    }
  ];

  test.beforeEach(async ({ page }) => {
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

    // Intercept backend API routes to mock behavior
    await page.route('**/api/v1/dashboard', async (route) => {
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
          recentTransactions: [],
          spendingByCategory: [],
          incomeByCategory: [],
          dailyPerformance: [],
          monthlyPerformance: [],
        }),
      });
    });

    await page.route('**/api/v1/goals*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            spendingGoals: goals
          }),
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newGoal = {
          id: goals.length + 1,
          title: body.title || 'Meta sem título',
          category: body.category || 'Outros',
          targetAmount: Number(body.target_amount ?? body.targetAmount ?? 0),
          currentAmount: 0,
          period: body.period || 'monthly',
          startDate: body.start_date || body.startDate || '2026-06-02',
          endDate: body.end_date || body.target_date || body.endDate || '2026-06-02',
          description: body.description || '',
        };
        goals.push(newGoal);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(newGoal),
        });
      }
    });

    // Mock other minor GET endpoints called by frontend
    await page.route('**/api/v1/transactions/categories', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
  });

  test('acessa Goals pelo menu e cria uma nova meta preenchendo todos os campos', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');

    // Click Goals link in sidebar/navigation
    const goalsLink = page.locator('a[href="/goals"], a:has-text("Goals"), nav a[href*="goals"]').first();
    await expect(goalsLink).toBeVisible({ timeout: 5000 });
    await goalsLink.click();

    // Click "+ Nova Meta" button
    const createGoalBtn = page.locator('button:has-text("+ Nova Meta"), button:has-text("Criar Primeira Meta"), button:has-text("Criar Meta")').first();
    await expect(createGoalBtn).toBeVisible({ timeout: 5000 });
    await createGoalBtn.click();

    // Scope to the dialog container
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill form fields
    const nameInput = dialog.locator('input[placeholder*="Viagem"], input[placeholder*="Carro"], #goal-name').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Viagem para Europa Nova');

    const valueInput = dialog.locator('input[placeholder*="R$"], #target-value').first();
    await valueInput.fill('20000');

    const descInput = dialog.locator('textarea, #description').first();
    await descInput.fill('Meta de viagem para conhecer a Europa no próximo ano - Nova E2E');

    const dateInput = dialog.locator('#target-date, input[placeholder*="dd/mm/aaaa"]').first();
    await dateInput.fill('02/06/2027');

    // Click save button inside modal
    const saveBtn = dialog.locator('button:has-text("Salvar Meta")').first();
    await saveBtn.click();

    // Verify the new goal is shown in the list
    const newGoalElement = page.locator('text=Viagem para Europa Nova').first();
    await expect(newGoalElement).toBeVisible({ timeout: 10000 });
  });
});
