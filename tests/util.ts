import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

const GLOBAL_CONFIG_URI = 'fcitx://config/global'

interface ConfigNode {
  Option?: string
  Description?: string
  Type?: string
  Value?: string
  DefaultValue?: string
  Children?: ConfigNode[]
}

export interface BooleanOptionState {
  groupDescription: string
  description: string
  value: string
  defaultValue: string
}

export async function openGlobalConfig(page: Page) {
  await page.goto('/')

  // Keep these selectors aligned with fcitx5-plugins/tests/util.ts: the online
  // app exposes the config buttons after the WASM engine becomes ready.
  const inputMethodConfigButton = page.locator('.my-column > :first-child > * > :nth-child(2) button')
  await expect(inputMethodConfigButton, 'fcitx5-online should finish initializing').toBeEnabled({ timeout: 60_000 })
  await page.locator('.my-column > :first-child > * > :nth-child(4)').click()

  const modal = page.locator('.n-modal')
  await expect(modal).toBeVisible()
  return modal
}

async function findBooleanOption(page: Page, groupOption: string, option: string): Promise<BooleanOptionState> {
  const state = await page.evaluate(({ uri, groupOption, option }) => {
    const config = window.fcitx.getConfig(uri) as ConfigNode
    const group = config.Children?.find(child => child.Option === groupOption)
    const child = group?.Children?.find(child => child.Option === option)
    if (!group?.Description || !child?.Description || child.Type !== 'Boolean' || child.Value === undefined || child.DefaultValue === undefined) {
      return null
    }
    return {
      groupDescription: group.Description,
      description: child.Description,
      value: child.Value,
      defaultValue: child.DefaultValue,
    }
  }, { uri: GLOBAL_CONFIG_URI, groupOption, option })

  if (!state) {
    throw new Error(`Boolean option ${groupOption}/${option} was not found in the global config`)
  }
  return state
}

export async function selectBooleanOption(page: Page, modal: Locator, groupOption: string, option: string) {
  const state = await findBooleanOption(page, groupOption, option)
  await modal.locator('.n-menu').getByText(state.groupDescription, { exact: true }).click()
  const switchControl = modal.getByRole('switch', { name: state.description })
  await expect(switchControl).toBeVisible()
  return { state, switchControl }
}

export function toggled(value: string) {
  return value === 'True' ? 'False' : 'True'
}

export function expectSwitchValue(switchControl: Locator, value: string) {
  return expect(switchControl).toHaveAttribute('aria-checked', value === 'True' ? 'true' : 'false')
}

export async function readBooleanOption(page: Page, groupOption: string, option: string) {
  const state = await findBooleanOption(page, groupOption, option)
  return state.value
}

export function expectSavedBooleanOption(page: Page, groupOption: string, option: string, value: string) {
  return expect.poll(() => readBooleanOption(page, groupOption, option), {
    message: `${groupOption}/${option} should be saved by the fcitx5 engine`,
  }).toBe(value)
}
