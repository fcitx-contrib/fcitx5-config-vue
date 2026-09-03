# Playwright tests

The tests exercise this package through the real `fcitx5-online` WebAssembly configuration engine. They expect the two repositories to be siblings by default, so that `fcitx5-online`'s `link:../fcitx5-config-vue` dependency points at this checkout.

Install dependencies in both repositories and install the Playwright browsers:

```sh
pnpm install
pnpm --dir ../fcitx5-online install
pnpm exec playwright install
```

Both repositories need `cache/fcitx5-js.tgz`, as in their normal build setup. Build this package first, followed by the online test engine:

```sh
pnpm run build
pnpm --dir ../fcitx5-online run build
```

The build output can be reused until either repository changes. Run all browsers or just Chromium:

```sh
pnpm test
pnpm run test:chromium
```

Set `FCITX5_ONLINE_DIR` when the online checkout is elsewhere. The test command serves that checkout's existing `dist` directory and shuts the server down after Playwright exits.
