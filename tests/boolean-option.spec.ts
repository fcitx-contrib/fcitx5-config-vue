import { expect, test } from '@playwright/test'
import { expectSavedBooleanOption, expectSwitchValue, getRedo, getReset, getUndo, openGlobalConfig, selectBooleanOption, toggled } from './util'

const HOTKEY = 'Hotkey'
const ENUMERATE_WITH_TRIGGER_KEYS = 'EnumerateWithTriggerKeys'
const BEHAVIOR = 'Behavior'
const ACTIVE_BY_DEFAULT = 'ActiveByDefault'
const PREEDIT_ENABLED_BY_DEFAULT = 'PreeditEnabledByDefault'

test.describe('BooleanOption', () => {
  test('toggles, saves, undoes, and redoes a value', async ({ page }) => {
    const modal = await openGlobalConfig(page)
    const { state, switchControl } = await selectBooleanOption(page, modal, HOTKEY, ENUMERATE_WITH_TRIGGER_KEYS)
    const undo = getUndo(modal)
    const redo = getRedo(modal)
    const changedValue = toggled(state.value)

    await expectSwitchValue(switchControl, state.value)
    await expect(undo).toBeDisabled()
    await expect(redo).toBeDisabled()

    await switchControl.click()
    await expectSwitchValue(switchControl, changedValue)
    await expect(undo).toBeEnabled()
    await expect(redo).toBeDisabled()
    await expectSavedBooleanOption(page, HOTKEY, ENUMERATE_WITH_TRIGGER_KEYS, changedValue)

    await undo.click()
    await expectSwitchValue(switchControl, state.value)
    await expect(undo).toBeDisabled()
    await expect(redo).toBeEnabled()
    await expectSavedBooleanOption(page, HOTKEY, ENUMERATE_WITH_TRIGGER_KEYS, state.value)

    await redo.click()
    await expectSwitchValue(switchControl, changedValue)
    await expect(undo).toBeEnabled()
    await expect(redo).toBeDisabled()
    await expectSavedBooleanOption(page, HOTKEY, ENUMERATE_WITH_TRIGGER_KEYS, changedValue)
  })

  test('resets one value from its context menu', async ({ page }) => {
    const modal = await openGlobalConfig(page)
    const { state, switchControl } = await selectBooleanOption(page, modal, BEHAVIOR, ACTIVE_BY_DEFAULT)

    if (state.value === state.defaultValue) {
      await switchControl.click()
    }
    await expectSwitchValue(switchControl, toggled(state.defaultValue))
    await expectSavedBooleanOption(page, BEHAVIOR, ACTIVE_BY_DEFAULT, toggled(state.defaultValue))

    await modal.getByText(state.description, { exact: true }).click({ button: 'right' })
    await getReset(page).click()

    await expectSwitchValue(switchControl, state.defaultValue)
    await expectSavedBooleanOption(page, BEHAVIOR, ACTIVE_BY_DEFAULT, state.defaultValue)
  })

  test('resets all values in the current config page', async ({ page }) => {
    const modal = await openGlobalConfig(page)
    const active = await selectBooleanOption(page, modal, BEHAVIOR, ACTIVE_BY_DEFAULT)
    const preedit = await selectBooleanOption(page, modal, BEHAVIOR, PREEDIT_ENABLED_BY_DEFAULT)

    for (const item of [active, preedit]) {
      if (item.state.value === item.state.defaultValue) {
        await item.switchControl.click()
      }
      await expectSwitchValue(item.switchControl, toggled(item.state.defaultValue))
    }

    await getReset(modal, 'button').click()

    await expectSwitchValue(active.switchControl, active.state.defaultValue)
    await expectSwitchValue(preedit.switchControl, preedit.state.defaultValue)
    await expectSavedBooleanOption(page, BEHAVIOR, ACTIVE_BY_DEFAULT, active.state.defaultValue)
    await expectSavedBooleanOption(page, BEHAVIOR, PREEDIT_ENABLED_BY_DEFAULT, preedit.state.defaultValue)
  })
})
