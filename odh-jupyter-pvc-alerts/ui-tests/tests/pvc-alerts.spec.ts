import { expect, galata, test } from '@jupyterlab/galata';

// ServerConnection appends a cache-busting query parameter.
const usageRoute = '**/odh-jupyter-pvc-alerts/usage*';

test.use({
  autoGoto: false,
  // Galata's default readiness check depends on the removed "Simple" switch.
  waitForApplication: async ({}, use) => {
    await use(async page => {
      await expect(page.locator('#jupyterlab-splash')).toBeHidden();
      await expect(
        page.getByRole('tab', { name: 'Launcher', exact: true })
      ).toBeVisible();
    });
  },
  mockSettings: {
    ...galata.DEFAULT_SETTINGS,
    'odh-jupyter-pvc-alerts:plugin': { pollInterval: 10 }
  }
});

test('warns on high usage and clears after storage recovers', async ({
  page
}) => {
  let percent = 95;
  await page.route(usageRoute, async route => {
    await route.fulfill({
      json: {
        path: '/notebook',
        totalBytes: 100 * 1024 ** 3,
        usedBytes: percent * 1024 ** 3,
        availableBytes: (100 - percent) * 1024 ** 3,
        usagePercent: percent
      }
    });
  });
  await page.goto();
  const warning = page.getByText(/Notebook storage: 95% used/);
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('5 GiB available');

  // Help is keyboard accessible and does not silently dismiss the warning.
  const help = page.getByRole('button', { name: 'How to free up space' });
  await help.focus();
  await help.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('How to free up notebook storage');
  await expect(dialog).toContainText('Storage location: /notebook');
  await expect(dialog).toContainText('this cannot be undone');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(warning).toBeVisible();

  percent = 50;
  await expect(warning).not.toBeVisible({ timeout: 15000 });
});

test('does not warn when storage is healthy', async ({ page }) => {
  await page.route(usageRoute, async route => {
    await route.fulfill({
      json: {
        path: '/notebook',
        totalBytes: 1000,
        usedBytes: 500,
        availableBytes: 500,
        usagePercent: 50
      }
    });
  });
  const checked = page.waitForResponse(usageRoute);
  await page.goto();
  await checked;
  await expect(page.getByText(/Notebook storage: .*% used/)).toHaveCount(0);
});
