# Playwright tests

The tests exercise this package through the real `fcitx5-online` WebAssembly configuration engine. They expect the two repositories to be siblings by default.

Install this project's dependencies and the Playwright browsers:

```sh
pnpm install
pnpm exec playwright install
```

Both repositories need `cache/fcitx5-js.tgz`, as in their normal build setup. Build and pack this package, link it into the online test engine's cache, then install and build the test engine:

```sh
pnpm run build
npm pack
mv fcitx5-config-vue-*.tgz fcitx5-config-vue.tgz
ln -sf ../../fcitx5-config-vue/fcitx5-config-vue.tgz ../fcitx5-online/cache/fcitx5-config-vue.tgz
pnpm --dir ../fcitx5-online install
pnpm --dir ../fcitx5-online run build
```

The build output can be reused until either repository changes. Run all browsers or just Chromium:

```sh
pnpm test
pnpm run test:chromium
```

Set `FCITX5_ONLINE_DIR` when the online checkout is elsewhere. The test command serves that checkout's existing `dist` directory and shuts the server down after Playwright exits.
