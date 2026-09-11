import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { dismissNotifications, enableInputMethods, expectSavedConfigValue, getConfigNode, getOptionFormItem, getReset, getUndo, installPlugin, openInputMethodConfig } from './util'

const PLUGIN_ZIP = 'cache/chinese-addons.zip'
const PINYIN_URI = 'fcitx://config/inputmethod/pinyin'
const PUNCTUATION_URI = 'fcitx://config/addon/punctuation/punctuationmap/zh_CN'

async function inputValue(input: Locator, value: string) {
  await input.evaluate((element: HTMLInputElement, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

test.describe('EntryOption', () => {
  test.setTimeout(60_000)

  test('edits and saves every field in an entry and supports undo and reset', async ({ page }) => {
    await installPlugin(page, PLUGIN_ZIP, 'chinese-addons')
    await enableInputMethods(page, ['pinyin'])
    const modal = await openInputMethodConfig(page, 'pinyin')
    const punctuation = await getConfigNode(page, PINYIN_URI, ['Punctuation'])
    await dismissNotifications(page)
    await getOptionFormItem(modal, punctuation.Description!).getByRole('button').click()

    const dialog = page.locator('.n-dialog')
    await expect(dialog).toBeVisible()
    const state = await getConfigNode(page, PUNCTUATION_URI, ['Entries'])
    const list = dialog.getByRole('list', { name: state.Description })
    const first = list.locator('.n-list-item').first()
    const key = first.getByRole('textbox', { name: 'Key', exact: true })
    const mapping = first.getByRole('textbox', { name: 'Mapping', exact: true })
    const alternative = first.getByRole('textbox', { name: 'Alternative Mapping', exact: true })
    const undo = getUndo(dialog)

    // EntryOption is reached through an ExternalOption dialog whose focus trap
    // competes with the outer config modal. Dispatch input on the intended
    // field so this test remains scoped to EntryOption behavior.
    await inputValue(mapping, 'X')
    await expectSavedConfigValue(page, PUNCTUATION_URI, ['Entries'], { ...state.Value, 0: { ...state.Value[0], Mapping: 'X' } })
    await undo.evaluate((button: HTMLButtonElement) => button.click())
    await expect(mapping).toHaveValue(state.Value[0].Mapping)
    await expectSavedConfigValue(page, PUNCTUATION_URI, ['Entries'], state.Value)

    await inputValue(alternative, 'Y')
    await expectSavedConfigValue(page, PUNCTUATION_URI, ['Entries'], { ...state.Value, 0: { ...state.Value[0], AltMapping: 'Y' } })
    await undo.evaluate((button: HTMLButtonElement) => button.click())
    await expect(alternative).toHaveValue(state.Value[0].AltMapping)
    await expectSavedConfigValue(page, PUNCTUATION_URI, ['Entries'], state.Value)

    await inputValue(key, '*')
    await expectSavedConfigValue(page, PUNCTUATION_URI, ['Entries'], { ...state.Value, 0: { ...state.Value[0], Key: '*' } })

    await dialog.getByText(state.Description!, { exact: true }).dispatchEvent('contextmenu', { button: 2, clientX: 1, clientY: 1 })
    await getReset(page).evaluate((item: HTMLElement) => item.click())
    await expect(key).toHaveValue(state.DefaultValue[0].Key)
    await expect(mapping).toHaveValue(state.DefaultValue[0].Mapping)
    await expect(alternative).toHaveValue(state.DefaultValue[0].AltMapping)
    await expectSavedConfigValue(page, PUNCTUATION_URI, ['Entries'], state.DefaultValue)
  })
})
