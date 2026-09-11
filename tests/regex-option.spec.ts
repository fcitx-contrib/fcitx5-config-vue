import { expect, test } from '@playwright/test'
import { dismissNotifications, enableInputMethods, expectSavedConfigValue, getConfigNode, installPlugin, openInputMethodConfig, selectInputMethod } from './util'

const PLUGIN_ZIP = 'cache/chinese-addons.zip'
const PINYIN_URI = 'fcitx://config/inputmethod/pinyin'
const WBX_URI = 'fcitx://config/inputmethod/wbx'

test.describe('regular-expression StringOption', () => {
  test.setTimeout(60_000)

  test('validates regular expressions in lists and standalone strings', async ({ page }) => {
    await installPlugin(page, PLUGIN_ZIP, 'chinese-addons')
    await enableInputMethods(page, ['pinyin', 'wbx'])
    const modal = await openInputMethodConfig(page, 'pinyin')
    const listState = await getConfigNode(page, PINYIN_URI, ['QuickPhraseTriggerRegex'])
    const list = modal.getByRole('list', { name: listState.Description })

    await dismissNotifications(page)
    await list.getByRole('button', { name: 'Add item', exact: true }).click()
    const listInput = list.getByRole('textbox', { name: listState.Description }).last()
    await listInput.fill('[')
    await expect(list.getByText('Invalid regular expression', { exact: true })).toBeVisible()
    await listInput.fill('[a]')
    await expect(list.getByText('Invalid regular expression', { exact: true })).toBeHidden()
    await expectSavedConfigValue(page, PINYIN_URI, ['QuickPhraseTriggerRegex'], { ...listState.Value, [Object.keys(listState.Value).length]: '[a]' })

    await selectInputMethod(page, modal, 'wbx')
    const stringState = await getConfigNode(page, WBX_URI, ['AutoSelectRegex'])
    const input = modal.getByRole('textbox', { name: stringState.Description })
    await dismissNotifications(page)
    await input.fill('[')
    await expect(modal.getByText('Invalid regular expression', { exact: true })).toBeVisible()
    await input.fill('[a]')
    await expect(modal.getByText('Invalid regular expression', { exact: true })).toBeHidden()
    await expectSavedConfigValue(page, WBX_URI, ['AutoSelectRegex'], '[a]')
  })
})
