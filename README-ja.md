# nuxt-scroll-restoration

[![npm version][npm-version-src]][npm-version-href]
[![License][license-src]][license-href]

> ブラウザバック時やリロード時にスクロール位置を復元するNuxt 3モジュール

## ライセンス

[Apache 2.0 License](./LICENSE)

<!-- リンク -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-scroll-restoration/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-scroll-restoration
[license-src]: https://img.shields.io/npm/l/nuxt-scroll-restoration.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-scroll-restoration

## 機能

- SPAのページ遷移時やブラウザバック時にスクロール位置を記憶・復元
- ページ編集中や表示中に最新化するためにリロードした後も同じ位置を表示
- 動的に読み込まれるコンテンツにも対応するための遅延スクロール機能搭載
- クライアントサイドのみで動作し、サーバーサイドには影響なし
- History APIをフックして効率的にスクロール位置を管理

## 制約事項

- ブラウザがHistory APIをサポートしている必要があります（ほとんどのモダンブラウザは対応済み）
- 動的コンテンツが遅れて読み込まれる場合、タイミングによっては正確なスクロール位置復元が難しい場合があります
- スクロール復元の最大試行時間は3秒（デフォルト）以内です

## セットアップ

```bash
npm install nuxt-scroll-restoration
```

`nuxt.config.ts`ファイルにモジュールを追加します：

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-scroll-restoration'
  ],
  
  // オプション設定（任意）
  scrollRestoration: {
    scrollRestorationTimeoutMs: 3000, // スクロール位置復元の最大試行時間（ミリ秒）
    tryToScrollIntervalMs: 50        // スクロール位置復元の試行間隔（ミリ秒）
  }
})
```

以上で設定完了です。このモジュールは自動的にスクロール位置の復元機能を有効化します。

## 動作の仕組み

このモジュールは以下の仕組みでスクロール位置を復元します：

1. ブラウザの標準スクロール復元機能（`history.scrollRestoration`）を無効化
2. Historyのstate操作をフックして、現在のスクロール位置を記録
3. ページ遷移後、保存したスクロール位置に復元を試みる
4. 動的コンテンツの読み込みを考慮して、一定時間スクロール復元を繰り返し試行

### シーケンス図

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant NuxtApp as Nuxtアプリ
    participant HistoryAPI as window.history
    participant DOM as DOM

    Browser->>NuxtApp: Nuxtアプリケーションの読み込み
    NuxtApp->>HistoryAPI: scrollRestorationを"manual"に設定
    Note over HistoryAPI: ブラウザの標準スクロール復元を無効化

    NuxtApp->>HistoryAPI: pushStateとreplaceStateをオーバーライド
    Note over HistoryAPI: スクロール位置をstateに保存するフック

    NuxtApp->>NuxtApp: app:mountedフック
    Note over NuxtApp: アプリが完全にマウントされたことを確認

    Browser->>NuxtApp: ナビゲーション実行（リンククリックなど）
    NuxtApp->>HistoryAPI: 現在のスクロール位置を保存するreplaceState呼び出し
    HistoryAPI->>HistoryAPI: state内に__scrollXと__scrollYを保存

    Browser->>NuxtApp: ページリロードまたはナビゲーション実行
    NuxtApp->>NuxtApp: page:finishフック
    Note over NuxtApp: ナビゲーション後にスクロール位置を復元

    NuxtApp->>HistoryAPI: 保存されたスクロール位置をstateから確認
    alt stateに有効なスクロール位置がある場合
        NuxtApp->>DOM: 保存された位置へのスクロール試行
        loop タイムアウトまたはスクロール成功まで
            DOM->>DOM: スクロールが可能か確認
        end
    else 有効なスクロール位置がない場合
        NuxtApp->>DOM: トップ(0, 0)へスクロール
    end

    Browser->>NuxtApp: popstateイベント発生
    NuxtApp->>HistoryAPI: イベントからstateを取得
    HistoryAPI->>NuxtApp: 保存されたスクロール位置を提供
    NuxtApp->>DOM: スクロール位置を復元
```

## 開発

```bash
# 開発環境の起動
npm run dev

# パッケージのビルド
npm run build

# ESLintによるコードチェック
npm run lint

# TypeScriptの型チェック
npm run typecheck

# リントと型チェックを実行
npm run check

# パッケージ公開前の準備（lint、typecheck、build）
npm run prepack

# パッケージのビルドと公開
npm run release
```
