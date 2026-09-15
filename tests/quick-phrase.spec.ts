import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { dismissNotifications, getConfigNode, getOptionFormItem, initializeApp, openAdvancedConfig, selectAddon } from './util'

const ADDON = 'quickphrase'
const URI = `fcitx://config/addon/${ADDON}`
const QUICK_PHRASE_DIR = '/home/web_user/.local/share/fcitx5/data/quickphrase.d/'
const SYSTEM_QUICK_PHRASE_DIR = '/usr/share/fcitx5/data/quickphrase.d/'

async function openQuickPhrase(page: Page): Promise<Locator> {
  const modal = await openAdvancedConfig(page)
  await selectAddon(page, modal, ADDON)
  const editor = await getConfigNode(page, URI, ['Editor'])

  await dismissNotifications(page)
  await getOptionFormItem(modal, editor.Description!).getByRole('button').click()

  const dialog = page.locator('.n-dialog')
  await expect(dialog).toBeVisible()
  return dialog
}

async function selectQuickPhrase(page: Page, dialog: Locator, name: string): Promise<void> {
  await dialog.locator('.n-select').click()
  await page.locator('.n-base-select-option').getByText(name, { exact: true }).click()
}

async function readFile(page: Page, path: string): Promise<string | null> {
  return page.evaluate((path) => {
    try {
      return window.fcitx.Module.FS.readFile(path, { encoding: 'utf8' })
    }
    catch {
      return null
    }
  }, path)
}

test('uses built-in quick phrase files and toggles disable markers', async ({ page }) => {
  await initializeApp(page)

  const overridePath = `${QUICK_PHRASE_DIR}emoji.mb`
  await page.evaluate(({ directory, path }) => {
    window.fcitx.Module.FS.mkdirTree(directory)
    window.fcitx.Module.FS.writeFile(path, 'local-only local-only phrase\n')
  }, {
    directory: QUICK_PHRASE_DIR,
    path: overridePath,
  })

  const systemFirstPhrase = await page.evaluate((path) => {
    const content = window.fcitx.Module.FS.readFile(path, { encoding: 'utf8' })
    for (const line of content.split('\n')) {
      const match = line.match(/^(\S+)\s+(\S.*)$/)
      if (match)
        return { keyword: match[1], phrase: match[2] }
    }
    return null
  }, `${SYSTEM_QUICK_PHRASE_DIR}emoji.mb`)
  expect(systemFirstPhrase).not.toBeNull()

  const dialog = await openQuickPhrase(page)
  await selectQuickPhrase(page, dialog, 'emoji')

  const rows = dialog.locator('.n-data-table-tbody .n-data-table-tr')
  await expect(rows.first().locator('td').nth(1)).toHaveText(systemFirstPhrase!.keyword)
  await expect(rows.first().locator('td').nth(2)).toHaveText(systemFirstPhrase!.phrase)
  await expect(dialog.getByText('local-only phrase', { exact: true })).toHaveCount(0)

  await selectQuickPhrase(page, dialog, 'emoji-eac')

  const localPath = `${QUICK_PHRASE_DIR}emoji-eac.mb`
  const disabledPath = `${localPath}.disable`
  await expect(dialog.getByRole('button', { name: 'Add item', exact: true })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Remove items', exact: true })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
  await expect(dialog.locator('.n-data-table').getByRole('textbox')).toHaveCount(0)
  expect(await readFile(page, localPath)).toBeNull()
  expect(await readFile(page, disabledPath)).toBeNull()

  await dialog.getByRole('button', { name: 'Disable', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Enable', exact: true })).toBeVisible()
  await expect(rows.first().locator('td').nth(1).locator('span')).toHaveCSS('color', 'rgb(128, 128, 128)')
  await expect(rows.first().locator('td').nth(2).locator('span')).toHaveCSS('color', 'rgb(128, 128, 128)')
  expect(await readFile(page, localPath)).toBeNull()
  expect(await readFile(page, disabledPath)).toBe('')

  await dialog.getByRole('button', { name: 'Enable', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Disable', exact: true })).toBeVisible()
  expect(await readFile(page, localPath)).toBeNull()
  expect(await readFile(page, disabledPath)).toBeNull()
})

test('ignores disable markers for user-only quick phrase files', async ({ page }) => {
  await initializeApp(page)
  await page.evaluate(({ directory, path }) => {
    window.fcitx.Module.FS.mkdirTree(directory)
    window.fcitx.Module.FS.writeFile(path, 'custom-keyword custom phrase\n')
    window.fcitx.Module.FS.writeFile(`${path}.disable`, '')
  }, {
    directory: QUICK_PHRASE_DIR,
    path: `${QUICK_PHRASE_DIR}custom.mb`,
  })

  const dialog = await openQuickPhrase(page)
  await selectQuickPhrase(page, dialog, 'custom')

  await expect(dialog.getByRole('button', { name: 'Add item', exact: true })).toBeEnabled()
  await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeEnabled()
  await expect(dialog.getByRole('button', { name: 'Remove', exact: true })).toBeEnabled()
  await dialog.locator('.n-data-table-tbody').getByRole('checkbox').check()
  await expect(dialog.getByRole('button', { name: 'Remove items', exact: true })).toBeEnabled()
})

test('only edits one quick phrase cell at a time', async ({ page }) => {
  await initializeApp(page)
  await page.evaluate(({ directory, path }) => {
    window.fcitx.Module.FS.mkdirTree(directory)
    window.fcitx.Module.FS.writeFile(path, 'first-keyword first phrase\nsecond-keyword second phrase\n')
  }, {
    directory: QUICK_PHRASE_DIR,
    path: `${QUICK_PHRASE_DIR}editing.mb`,
  })

  const dialog = await openQuickPhrase(page)
  await selectQuickPhrase(page, dialog, 'editing')

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
