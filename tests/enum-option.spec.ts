import { expect, test } from '@playwright/test'
import { chooseEnumValue, expectEnumValue, expectSavedEnumOption, getRedo, getReset, getUndo, installPlugin, openAdvancedConfig, selectAddon, selectEnumOption } from './util'

const ADDON = 'chttrans'
const PLUGIN = 'chinese-addons'
const PLUGIN_ZIP = 'cache/chinese-addons.zip'

const cases = [
  {
    name: 'static enum',
    option: 'Engine',
    initialValue: 'OpenCC',
    changedValue: 'Native',
  },
  {
    name: 'dynamic enum',
    option: 'OpenCCS2TProfile',
    initialValue: 'default',
    changedValue: 's2t.json',
  },
]

test.describe('EnumOption', () => {
  test.setTimeout(60_000)

  for (const enumCase of cases) {
    test(`${enumCase.name} selects, saves, undoes, redoes, and resets a value`, async ({ page }) => {
      await installPlugin(page, PLUGIN_ZIP, PLUGIN)
      const modal = await openAdvancedConfig(page)
      await selectAddon(page, modal, ADDON)
      const { state, select } = await selectEnumOption(page, modal, ADDON, enumCase.option)
      const undo = getUndo(modal)
      const redo = getRedo(modal)
      const initial = state.options.find(option => option.value === enumCase.initialValue)
      const changed = state.options.find(option => option.value === enumCase.changedValue)

      expect(state.value).toBe(enumCase.initialValue)
      expect(state.defaultValue).toBe(enumCase.initialValue)
      expect(initial, `${enumCase.initialValue} should be an available enum value`).toBeDefined()
      expect(changed, `${enumCase.changedValue} should be an available enum value`).toBeDefined()

      await expectEnumValue(select, initial!.label)
      await expect(undo).toBeDisabled()
      await expect(redo).toBeDisabled()

      await chooseEnumValue(page, select, changed!.label)
      await expectEnumValue(select, changed!.label)
      await expect(undo).toBeEnabled()
      await expect(redo).toBeDisabled()
      await expectSavedEnumOption(page, ADDON, enumCase.option, enumCase.changedValue)

      await undo.click()
      await expectEnumValue(select, initial!.label)
      await expect(undo).toBeDisabled()
      await expect(redo).toBeEnabled()
      await expectSavedEnumOption(page, ADDON, enumCase.option, enumCase.initialValue)

      // Choosing the current value must not create a new history entry or discard the redo entry.
      await chooseEnumValue(page, select, initial!.label)
      await expect(undo).toBeDisabled()
      await expect(redo).toBeEnabled()
      await expectSavedEnumOption(page, ADDON, enumCase.option, enumCase.initialValue)

      await redo.click()
      await expectEnumValue(select, changed!.label)
      await expectSavedEnumOption(page, ADDON, enumCase.option, enumCase.changedValue)

      await modal.getByText(state.description, { exact: true }).click({ button: 'right' })
      await getReset(page).click()
      await expectEnumValue(select, initial!.label)
      await expectSavedEnumOption(page, ADDON, enumCase.option, enumCase.initialValue)
    })
  }
})
