import { expect, test } from '@playwright/test'
import { dismissNotifications, enableInputMethods, expectSavedConfigValue, getConfigNode, getReset, installPlugin, openInputMethodConfig, toggled } from './util'

const URI = 'fcitx://config/inputmethod/pinyin'
const PLUGIN_ZIP = 'cache/chinese-addons.zip'

test.describe('GroupOption', () => {
  test.setTimeout(60_000)

  test('resets only the values inside the group', async ({ page }) => {
    await installPlugin(page, PLUGIN_ZIP, 'chinese-addons')
    await enableInputMethods(page, ['pinyin'])
    const modal = await openInputMethodConfig(page, 'pinyin')
    const outside = await getConfigNode(page, URI, ['VAsQuickphrase'])
    const group = await getConfigNode(page, URI, ['Fuzzy'])
    const first = await getConfigNode(page, URI, ['Fuzzy', 'VE_UE'])
    const second = await getConfigNode(page, URI, ['Fuzzy', 'NG_GN'])
    const outsideSwitch = modal.getByRole('switch', { name: outside.Description })
    const firstSwitch = modal.getByRole('switch', { name: first.Description })
    const secondSwitch = modal.getByRole('switch', { name: second.Description })

    await dismissNotifications(page)
    await outsideSwitch.click()
    await firstSwitch.click()
    await secondSwitch.click()
    await expectSavedConfigValue(page, URI, ['VAsQuickphrase'], toggled(outside.Value))
    await expectSavedConfigValue(page, URI, ['Fuzzy', 'VE_UE'], toggled(first.Value))
    await expectSavedConfigValue(page, URI, ['Fuzzy', 'NG_GN'], toggled(second.Value))

    await modal.getByText(group.Description!, { exact: true }).click({ button: 'right' })
    await getReset(page).click()

    await expect(outsideSwitch).toHaveAttribute('aria-checked', toggled(outside.Value) === 'True' ? 'true' : 'false')
    await expect(firstSwitch).toHaveAttribute('aria-checked', first.DefaultValue === 'True' ? 'true' : 'false')
    await expect(secondSwitch).toHaveAttribute('aria-checked', second.DefaultValue === 'True' ? 'true' : 'false')
    await expectSavedConfigValue(page, URI, ['VAsQuickphrase'], toggled(outside.Value))
    await expectSavedConfigValue(page, URI, ['Fuzzy', 'VE_UE'], first.DefaultValue)
    await expectSavedConfigValue(page, URI, ['Fuzzy', 'NG_GN'], second.DefaultValue)
  })
})
