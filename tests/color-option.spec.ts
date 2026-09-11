import { expect, test } from '@playwright/test'
import { expectSavedConfigValue, getConfigNode, getOptionFormItem, getReset, getUndo, openThemeConfig, THEME_CONFIG_URI } from './util'

const PATH = ['LightMode', 'HighlightColor']

test.describe('ColorOption', () => {
  test('selects, saves, undoes, and resets a color', async ({ page }) => {
    const modal = await openThemeConfig(page)
    const state = await getConfigNode(page, THEME_CONFIG_URI, PATH)
    const group = await getConfigNode(page, THEME_CONFIG_URI, PATH.slice(0, 1))
    await modal.locator('.n-menu').getByText(group.Description!, { exact: true }).click()

    const picker = getOptionFormItem(modal, state.Description!).locator('.n-color-picker')
    const undo = getUndo(modal)
    const changed = '#abcdef'

    await expect(picker).toContainText(state.Value)
    await picker.click()
    const hexInput = page.locator('.n-color-picker-panel').getByPlaceholder('HEX')
    await hexInput.fill(changed)
    await hexInput.press('Tab')
    await expect(picker).toContainText(changed)
    await expectSavedConfigValue(page, THEME_CONFIG_URI, PATH, changed)

    await undo.click()
    await expect(picker).toContainText(state.Value)
    await expectSavedConfigValue(page, THEME_CONFIG_URI, PATH, state.Value)

    await picker.click()
    await hexInput.fill(changed)
    await hexInput.press('Tab')
    await modal.getByText(state.Description!, { exact: true }).click({ button: 'right' })
    await getReset(page).click()
    await expect(picker).toContainText(state.DefaultValue)
    await expectSavedConfigValue(page, THEME_CONFIG_URI, PATH, state.DefaultValue)
  })
})
