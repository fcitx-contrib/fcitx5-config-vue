import { expect, test } from '@playwright/test'
import { expectSavedStringOption, getRedo, getReset, getUndo, openThemeConfig, selectStringOption } from './util'

const CARET = 'Caret'
const TEXT = 'Text'

test.describe('StringOption', () => {
  test('saves on input without a separate commit step and supports undo and redo', async ({ page }) => {
    const modal = await openThemeConfig(page)
    const { state, input } = await selectStringOption(page, modal, CARET, TEXT)
    const undo = getUndo(modal)
    const redo = getRedo(modal)
    const changedValue = state.value === '.' ? 'x' : '.'

    await expect(input).toHaveValue(state.value)
    await expect(undo).toBeDisabled()
    await expect(redo).toBeDisabled()

    await input.selectText()
    await input.pressSequentially(changedValue)

    // Unlike the native UIs, the web input has no pending edit or explicit
    // commit action: update:value saves while the input is still focused.
    await expect(input).toBeFocused()
    await expect(input).toHaveValue(changedValue)
    await expect(undo).toBeEnabled()
    await expect(redo).toBeDisabled()
    await expectSavedStringOption(page, CARET, TEXT, changedValue)

    await undo.click()
    await expect(input).toHaveValue(state.value)
    await expect(undo).toBeDisabled()
    await expect(redo).toBeEnabled()
    await expectSavedStringOption(page, CARET, TEXT, state.value)

    await redo.click()
    await expect(input).toHaveValue(changedValue)
    await expect(undo).toBeEnabled()
    await expect(redo).toBeDisabled()
    await expectSavedStringOption(page, CARET, TEXT, changedValue)
  })

  test('keeps a manual revert in the undo history', async ({ page }) => {
    const modal = await openThemeConfig(page)
    const { state, input } = await selectStringOption(page, modal, CARET, TEXT)
    const undo = getUndo(modal)

    await input.focus()
    await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(element.value.length, element.value.length))
    await input.pressSequentially('x')
    await expectSavedStringOption(page, CARET, TEXT, `${state.value}x`)

    await input.press('Backspace')
    await expect(input).toHaveValue(state.value)
    await expect(undo).toBeEnabled()
    await expectSavedStringOption(page, CARET, TEXT, state.value)

    await undo.click()
    await expect(input).toHaveValue(`${state.value}x`)
    await expectSavedStringOption(page, CARET, TEXT, `${state.value}x`)
  })

  test('resets one value from its context menu', async ({ page }) => {
    const modal = await openThemeConfig(page)
    const { state, input } = await selectStringOption(page, modal, CARET, TEXT)
    const changedValue = state.defaultValue === '.' ? 'x' : '.'

    await input.fill(changedValue)
    await expectSavedStringOption(page, CARET, TEXT, changedValue)

    await modal.getByText(state.description, { exact: true }).click({ button: 'right' })
    await getReset(page).click()

    await expect(input).toHaveValue(state.defaultValue)
    await expectSavedStringOption(page, CARET, TEXT, state.defaultValue)
  })
})
