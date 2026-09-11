import { expect, test } from '@playwright/test'
import { chooseEnumValue, expectSavedConfigValue, getConfigNode, getRedo, getReset, getUndo, initializeApp, openAdvancedConfig, selectAddon } from './util'

const URI = 'fcitx://config/addon/spell'
const PATH = ['ProviderOrder']

test.describe('ListOption', () => {
  test('removes, adds, edits, moves, undoes, redoes, and resets items', async ({ page }) => {
    await initializeApp(page)
    const modal = await openAdvancedConfig(page)
    await selectAddon(page, modal, 'spell')
    const state = await getConfigNode(page, URI, PATH)
    const list = modal.getByRole('list', { name: state.Description })
    const undo = getUndo(modal)
    const redo = getRedo(modal)

    await expect(list.getByRole('combobox', { name: state.Description })).toHaveCount(3)

    await list.getByRole('button', { name: 'Remove item 2' }).click()
    await expectSavedConfigValue(page, URI, PATH, { 0: 'Presage', 1: 'Enchant' })

    await list.getByRole('button', { name: 'Add item', exact: true }).click()
    const selects = list.getByRole('combobox', { name: state.Description })
    await expect(selects).toHaveCount(3)
    await chooseEnumValue(page, selects.nth(2), 'Custom')
    await expectSavedConfigValue(page, URI, PATH, { 0: 'Presage', 1: 'Enchant', 2: 'Custom' })

    await list.getByRole('button', { name: 'Move item 2 up' }).click()
    await expectSavedConfigValue(page, URI, PATH, { 0: 'Enchant', 1: 'Presage', 2: 'Custom' })

    await undo.click()
    await expectSavedConfigValue(page, URI, PATH, { 0: 'Presage', 1: 'Enchant', 2: 'Custom' })
    await redo.click()
    await expectSavedConfigValue(page, URI, PATH, { 0: 'Enchant', 1: 'Presage', 2: 'Custom' })

    await modal.getByText(state.Description!, { exact: true }).click({ button: 'right' })
    await getReset(page).click()
    await expectSavedConfigValue(page, URI, PATH, state.DefaultValue)
  })
})
