import { expect, test } from '@playwright/test'
import { expectSavedConfigValue, getConfigNode, getUndo, GLOBAL_CONFIG_URI, openGlobalConfig } from './util'

const PATH = ['Hotkey', 'TriggerKeys']

test.describe('KeyOption', () => {
  test('records and saves a key without a separate commit dialog', async ({ page }) => {
    const modal = await openGlobalConfig(page)
    const state = await getConfigNode(page, GLOBAL_CONFIG_URI, PATH)
    const group = await getConfigNode(page, GLOBAL_CONFIG_URI, PATH.slice(0, 1))
    await modal.locator('.n-menu').getByText(group.Description!, { exact: true }).click()

    const list = modal.getByRole('list', { name: state.Description })
    const button = list.getByRole('button', { name: state.Description }).first()
    const undo = getUndo(modal)
    const initialLabel = await button.textContent()
    const changed = 'F8'

    await button.click()
    await expect(button).toHaveText('●')
    await button.press(changed)
    await expect(button).toHaveText(changed)
    await expectSavedConfigValue(page, GLOBAL_CONFIG_URI, PATH, { ...state.Value, 0: changed })

    await undo.click()
    await expect(button).toHaveText(initialLabel!)
    await expectSavedConfigValue(page, GLOBAL_CONFIG_URI, PATH, state.Value)
  })

  test('does not record a key until its button is clicked', async ({ page }) => {
    const modal = await openGlobalConfig(page)
    const state = await getConfigNode(page, GLOBAL_CONFIG_URI, PATH)
    const list = modal.getByRole('list', { name: state.Description })
    const button = list.getByRole('button', { name: state.Description }).first()
    const initialLabel = await button.textContent()

    await expect(button, 'the first KeyOption must be focused to exercise the accidental recording scenario').toBeFocused()
    await page.keyboard.press('F8')

    await expect(button).toHaveText(initialLabel!)
    await expectSavedConfigValue(page, GLOBAL_CONFIG_URI, PATH, state.Value)
  })
})
