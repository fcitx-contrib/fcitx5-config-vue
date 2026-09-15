import { expect, test } from '@playwright/test'
import { dismissNotifications, getConfigNode, getOptionFormItem, initializeApp, openAdvancedConfig, selectAddon } from './util'

const ADDON = 'quickphrase'
const URI = `fcitx://config/addon/${ADDON}`
const QUICK_PHRASE_DIR = '/home/web_user/.local/share/fcitx5/data/quickphrase.d/'

test('only edits one quick phrase cell at a time', async ({ page }) => {
  await initializeApp(page)
  await page.evaluate(({ directory, path }) => {
    window.fcitx.Module.FS.mkdirTree(directory)
    window.fcitx.Module.FS.writeFile(path, 'first-keyword first phrase\nsecond-keyword second phrase\n')
  }, {
    directory: QUICK_PHRASE_DIR,
    path: `${QUICK_PHRASE_DIR}editing.mb`,
  })

  const modal = await openAdvancedConfig(page)
  await selectAddon(page, modal, ADDON)
  const editor = await getConfigNode(page, URI, ['Editor'])

  await dismissNotifications(page)
  await getOptionFormItem(modal, editor.Description!).getByRole('button').click()

  const dialog = page.locator('.n-dialog')
  await dialog.locator('.n-select').click()
  await page.locator('.n-base-select-option').getByText('editing', { exact: true }).click()

  const rows = dialog.locator('.n-data-table-tbody .n-data-table-tr')
  await expect(rows).toHaveCount(2)

  const firstKeyword = rows.nth(0).locator('td').nth(1)
  const firstPhrase = rows.nth(0).locator('td').nth(2)
  const secondKeyword = rows.nth(1).locator('td').nth(1)
  const editors = dialog.locator('.n-data-table').getByRole('textbox')

  await firstKeyword.getByText('first-keyword', { exact: true }).click()
  await expect(firstKeyword.getByRole('textbox')).toHaveValue('first-keyword')
  await expect(editors).toHaveCount(1)

  await firstPhrase.getByText('first phrase', { exact: true }).click()
  await expect(firstPhrase.getByRole('textbox')).toHaveValue('first phrase')
  await expect(editors).toHaveCount(1)

  await secondKeyword.getByText('second-keyword', { exact: true }).click()
  await expect(secondKeyword.getByRole('textbox')).toHaveValue('second-keyword')
  await expect(editors).toHaveCount(1)
})
