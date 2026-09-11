import { expect, test } from '@playwright/test'
import { expectSavedConfigValue, getConfigNode, getRedo, getReset, getUndo, GLOBAL_CONFIG_URI, openGlobalConfig } from './util'

const PATH = ['Behavior', 'DefaultPageSize']

test.describe('IntegerOption', () => {
  test('steps, clamps, saves, undoes, redoes, and resets a value', async ({ page }) => {
    const modal = await openGlobalConfig(page)
    const state = await getConfigNode(page, GLOBAL_CONFIG_URI, PATH)
    const group = await getConfigNode(page, GLOBAL_CONFIG_URI, PATH.slice(0, 1))
    await modal.locator('.n-menu').getByText(group.Description!, { exact: true }).click()

    const input = modal.getByRole('spinbutton', { name: state.Description })
    const control = input.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " n-input-number ")][1]')
    const decrement = control.getByRole('button').first()
    const increment = control.getByRole('button').last()
    const undo = getUndo(modal)
    const redo = getRedo(modal)
    const initial = Number(state.Value)

    await expect(input).toHaveValue(String(initial))
    await increment.click()
    await expect(input).toHaveValue(String(initial + 1))
    await expectSavedConfigValue(page, GLOBAL_CONFIG_URI, PATH, String(initial + 1))

    await undo.click()
    await expect(input).toHaveValue(String(initial))
    await expect(redo).toBeEnabled()
    await expectSavedConfigValue(page, GLOBAL_CONFIG_URI, PATH, String(initial))

    await redo.click()
    await expect(input).toHaveValue(String(initial + 1))
    await decrement.click()
    await expect(input).toHaveValue(String(initial))

    await input.fill('100')
    await input.press('Tab')
    await expect(input).toHaveValue(state.IntMax!)
    await expectSavedConfigValue(page, GLOBAL_CONFIG_URI, PATH, state.IntMax)

    await modal.getByText(state.Description!, { exact: true }).click({ button: 'right' })
    await getReset(page).click()
    await expect(input).toHaveValue(state.DefaultValue)
    await expectSavedConfigValue(page, GLOBAL_CONFIG_URI, PATH, state.DefaultValue)
  })
})
