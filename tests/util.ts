import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const GLOBAL_CONFIG_URI = 'fcitx://config/global'
export const THEME_CONFIG_URI = 'fcitx://config/addon/webpanel'
const ADDON_CONFIG_URI = 'fcitx://config/addon/'

export interface ConfigNode {
  Option?: string
  Description?: string
  Type?: string
  Value?: any
  DefaultValue?: any
  IsEnum?: string
  IntMax?: string
  IntMin?: string
  Enum?: Record<string, string>
  EnumI18n?: Record<string, string>
  Children?: ConfigNode[]
}

interface OptionState {
  description: string
  value: string
  defaultValue: string
}

export interface BooleanOptionState {
  groupDescription: string
  description: string
  value: string
  defaultValue: string
}

export interface StringOptionState {
  groupDescription: string
  description: string
  value: string
  defaultValue: string
}

export interface EnumOptionState extends OptionState {
  options: {
    label: string
    value: string
  }[]
}

export async function waitForEngine(page: Page) {
  // Keep these selectors aligned with fcitx5-plugins/tests/util.ts: the online
  // app exposes the config buttons after the WASM engine becomes ready.
  const inputMethodConfigButton = page.locator('.my-column > :first-child > * > :nth-child(2) button')
  await expect(inputMethodConfigButton, 'fcitx5-online should finish initializing').toBeEnabled({ timeout: 60_000 })
}

export async function dismissNotifications(page: Page) {
  const closeButtons = page.locator('.n-notification__close')
  await closeButtons.evaluateAll(buttons => buttons.forEach(button => (button as HTMLElement).click()))
}

export async function initializeApp(page: Page) {
  await page.goto('/')
  await waitForEngine(page)
}

async function openConfigFromStatusArea(page: Page, buttonIndex: number) {
  await page.locator(`.my-column > :first-child > * > :nth-child(${buttonIndex})`).click()

  const modal = page.locator('.n-modal')
  await expect(modal).toBeVisible()
  return modal
}

async function openConfig(page: Page, buttonIndex: number) {
  await initializeApp(page)
  return openConfigFromStatusArea(page, buttonIndex)
}

export function openGlobalConfig(page: Page) {
  return openConfig(page, 4)
}

export function openThemeConfig(page: Page) {
  return openConfig(page, 5)
}

export async function installPlugin(page: Page, zipPath: string, plugin: string) {
  await initializeApp(page)
  const modal = await openConfigFromStatusArea(page, 6)
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    modal.locator('.n-upload-trigger').click(),
  ])
  await fileChooser.setFiles(zipPath)
  await expect(page.locator('.n-message').getByText(`Installed ${plugin}`, { exact: true }), `${plugin} should be installed`).toBeVisible({ timeout: 60_000 })
  await page.keyboard.press('Escape')
  await expect(modal).toBeHidden()
  await waitForEngine(page)
}

export function openAdvancedConfig(page: Page) {
  return openConfigFromStatusArea(page, 7)
}

export async function enableInputMethods(page: Page, inputMethods: string[]) {
  await page.evaluate((inputMethods) => {
    const enabled = window.fcitx.getInputMethods().map(inputMethod => inputMethod.name)
    const updated = [...new Set([...enabled, ...inputMethods])]
    if (updated.length !== enabled.length) {
      window.fcitx.setInputMethods(updated)
      window.fcitx.updateInputMethods()
    }
  }, inputMethods)
  await expect.poll(() => page.evaluate((inputMethods) => {
    const enabled = new Set(window.fcitx.getInputMethods().map(inputMethod => inputMethod.name))
    return inputMethods.every(inputMethod => enabled.has(inputMethod))
  }, inputMethods), {
    message: `${inputMethods.join(', ')} should be enabled`,
    timeout: 60_000,
  }).toBeTruthy()
  await waitForEngine(page)
}

export async function selectInputMethod(page: Page, modal: Locator, inputMethod: string) {
  const displayName = await page.evaluate((inputMethod) => {
    return window.fcitx.getInputMethods().find(candidate => candidate.name === inputMethod)?.displayName
  }, inputMethod)
  if (!displayName) {
    throw new Error(`Input method ${inputMethod} was not found`)
  }
  await modal.locator('.n-menu').getByText(displayName, { exact: true }).click()
}

export async function openInputMethodConfig(page: Page, inputMethod: string) {
  const modal = await openConfigFromStatusArea(page, 2)
  await selectInputMethod(page, modal, inputMethod)
  return modal
}

export async function selectAddon(page: Page, modal: Locator, addon: string) {
  const name = await page.evaluate((addon) => {
    return window.fcitx.getAddons().flatMap(category => category.addons).find(candidate => candidate.id === addon)?.name
  }, addon)
  if (!name) {
    throw new Error(`Addon ${addon} was not found`)
  }
  await modal.locator('.n-menu').getByText(name, { exact: true }).click()
}

export async function getConfigNode(page: Page, uri: string, path: string[]): Promise<ConfigNode> {
  const node = await page.evaluate(({ uri, path }) => {
    let current = window.fcitx.getConfig(uri) as ConfigNode
    for (const option of path) {
      const child = current.Children?.find(candidate => candidate.Option === option)
      if (!child) {
        return null
      }
      current = child
    }
    return current
  }, { uri, path })
  if (!node) {
    throw new Error(`Config option ${path.join('/')} was not found at ${uri}`)
  }
  return node
}

export async function readConfigValue(page: Page, uri: string, path: string[]) {
  return (await getConfigNode(page, uri, path)).Value
}

export function expectSavedConfigValue(page: Page, uri: string, path: string[], value: any) {
  return expect.poll(() => readConfigValue(page, uri, path), {
    message: `${path.join('/')} should be saved by the fcitx5 engine`,
  }).toEqual(value)
}

export function getOptionFormItem(modal: Locator, description: string) {
  return modal.getByText(description, { exact: true }).first().locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " n-form-item ")][1]')
}

export function getUndo(container: Locator) {
  return container.getByRole('button', { name: 'Undo', exact: true })
}

export function getRedo(container: Locator) {
  return container.getByRole('button', { name: 'Redo', exact: true })
}

export function getReset(container: Page | Locator, type: 'menu' | 'button' = 'menu') {
  if (type === 'button') {
    return container.getByRole('button', { name: 'Reset to default', exact: true })
  }
  return container.locator('.n-dropdown-menu').getByText('Reset to default', { exact: true })
}

async function findOption(page: Page, uri: string, groupOption: string, option: string, type: string): Promise<BooleanOptionState | StringOptionState> {
  const state = await page.evaluate(({ uri, groupOption, option, type }) => {
    const config = window.fcitx.getConfig(uri) as ConfigNode
    const group = config.Children?.find(child => child.Option === groupOption)
    const child = group?.Children?.find(child => child.Option === option)
    if (!group?.Description || !child?.Description || child.Type !== type || child.Value === undefined || child.DefaultValue === undefined) {
      return null
    }
    return {
      groupDescription: group.Description,
      description: child.Description,
      value: child.Value,
      defaultValue: child.DefaultValue,
    }
  }, { uri, groupOption, option, type })

  if (!state) {
    throw new Error(`${type} option ${groupOption}/${option} was not found at ${uri}`)
  }
  return state
}

export async function selectBooleanOption(page: Page, modal: Locator, groupOption: string, option: string) {
  const state = await findOption(page, GLOBAL_CONFIG_URI, groupOption, option, 'Boolean')
  await modal.locator('.n-menu').getByText(state.groupDescription, { exact: true }).click()
  const switchControl = modal.getByRole('switch', { name: state.description })
  await expect(switchControl).toBeVisible()
  return { state, switchControl }
}

export async function selectStringOption(page: Page, modal: Locator, groupOption: string, option: string) {
  const state = await findOption(page, THEME_CONFIG_URI, groupOption, option, 'String')
  await modal.locator('.n-menu').getByText(state.groupDescription, { exact: true }).click()
  const input = modal.getByRole('textbox', { name: state.description })
  await expect(input).toBeVisible()
  return { state, input }
}

async function findEnumOption(page: Page, addon: string, option: string): Promise<EnumOptionState> {
  const state = await page.evaluate(({ addon, option, uri }) => {
    const config = window.fcitx.getConfig(`${uri}${addon}`) as ConfigNode
    const child = config.Children?.find(child => child.Option === option)
    const isEnum = child?.Type === 'Enum' || (child?.Type === 'String' && child.IsEnum === 'True')
    if (!child?.Description || !isEnum || child.Value === undefined || child.DefaultValue === undefined || !child.Enum) {
      return null
    }
    return {
      description: child.Description,
      value: child.Value,
      defaultValue: child.DefaultValue,
      options: Object.entries(child.Enum).map(([key, value]) => ({
        label: (child.EnumI18n || child.Enum!)[key],
        value,
      })),
    }
  }, { addon, option, uri: ADDON_CONFIG_URI })

  if (!state) {
    throw new Error(`Enum option ${option} was not found for addon ${addon}`)
  }
  return state
}

export async function selectEnumOption(page: Page, modal: Locator, addon: string, option: string) {
  const state = await findEnumOption(page, addon, option)
  await dismissNotifications(page)
  const select = modal.getByRole('combobox', { name: state.description })
  await expect(select).toBeVisible()
  return { state, select }
}

export async function chooseEnumValue(page: Page, select: Locator, label: string) {
  await select.click()
  await page.locator('.n-base-select-option').getByText(label, { exact: true }).click()
}

export function expectEnumValue(select: Locator, label: string) {
  return expect(select).toContainText(label)
}

export function toggled(value: string) {
  return value === 'True' ? 'False' : 'True'
}

export function expectSwitchValue(switchControl: Locator, value: string) {
  return expect(switchControl).toHaveAttribute('aria-checked', value === 'True' ? 'true' : 'false')
}

export async function readBooleanOption(page: Page, groupOption: string, option: string) {
  const state = await findOption(page, GLOBAL_CONFIG_URI, groupOption, option, 'Boolean')
  return state.value
}

export function expectSavedBooleanOption(page: Page, groupOption: string, option: string, value: string) {
  return expect.poll(() => readBooleanOption(page, groupOption, option), {
    message: `${groupOption}/${option} should be saved by the fcitx5 engine`,
  }).toBe(value)
}

export async function readStringOption(page: Page, groupOption: string, option: string) {
  const state = await findOption(page, THEME_CONFIG_URI, groupOption, option, 'String')
  return state.value
}

export function expectSavedStringOption(page: Page, groupOption: string, option: string, value: string) {
  return expect.poll(() => readStringOption(page, groupOption, option), {
    message: `${groupOption}/${option} should be saved by the fcitx5 engine`,
  }).toBe(value)
}

export async function readEnumOption(page: Page, addon: string, option: string) {
  const state = await findEnumOption(page, addon, option)
  return state.value
}

export function expectSavedEnumOption(page: Page, addon: string, option: string, value: string) {
  return expect.poll(() => readEnumOption(page, addon, option), {
    message: `${addon}/${option} should be saved by the fcitx5 engine`,
  }).toBe(value)
}
