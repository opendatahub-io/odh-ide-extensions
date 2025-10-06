import { expect, test } from '@jupyterlab/galata';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('should emit an activation console message', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(message.text());
  });

  await page.goto();

  expect(
    logs.filter(
      s => s === 'JupyterLab extension odh-jupyter-trash-cleanup is activated!'
    )
  ).toHaveLength(1);
});

test('should have a button to empty trash', async ({ page }) => {
  await page.goto();

  const button = page.getByRole('button', { name: 'Empty Trash' });

  expect(button).toBeVisible();
  await expect(button).toBeEnabled();
});



test('should empty the trash', async ({ page }) => {
  await page.goto();


  //Create a random text file and insert it into the trash
  await page.getByRole('menuitem', { name: 'File' }).click();

  const newRow = page.locator('li[data-type="submenu"]:has-text("New")');
  await newRow.waitFor({ state: 'visible' });
  await newRow.hover();
  
  await page.waitForSelector('ul.lm-Menu-content >> li:has-text("Text File")');
  await page.getByRole('menuitem', { name: 'Text File' }).click();
  
  // regex here is used because there potentially could be more untitled.txt
  const fileRow = page.locator('li.jp-DirListing-item span.jp-DirListing-itemText span', {
    hasText: /^untitled.*\.txt$/
  });
  

  // Delete the text file
  await fileRow.click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Move to Trash' }).click();
  await page.getByRole('button', { name: 'Move to Trash' }).click();
  await expect(fileRow).not.toBeVisible();

  const xdgDataHome = process.env.XDG_DATA_HOME
    || path.resolve(__dirname, '..', '..', '..', '.galata-root');
  const trashLocation = path.join(xdgDataHome, 'Trash', 'files');

  if (!fs.existsSync(trashLocation)) {
    throw new Error(`Trash folder not found: ${trashLocation}`);
  } 
  const files = fs.readdirSync(trashLocation);
  expect(files.length).toBeGreaterThan(0);
  

  //Empty the trash
  await page.getByRole('button', { name: 'Empty Trash' }).click();

  const dialog = page.getByRole('dialog', { name: /empty all items from trash/i });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Empty Trash' }).click();
  await expect(dialog).not.toBeVisible();


  // Check if the trash is empty
  await page.waitForTimeout(200);
  const files2 = fs.readdirSync(trashLocation);
  expect(files2.length).toBe(0);
  
});
