# AI Project Skill Maker

[English](README.md)

AI コーディングエージェント向けに、長く使えるプロジェクト保守用 skill と instruction bundle を生成します。

AI Project Skill Maker は meta-skill です。通常のプロジェクト文書を作るのではなく、将来の AI セッションがリポジトリを理解し、既存のスタイルに沿って変更し、適切な検証を実行し、プロジェクトの意図を保ち、生成物や注意が必要なファイルを不用意に編集しないための、プロジェクト専用の保守ガイドを作ります。

特定のプラットフォームに固定しない設計です。標準テンプレートは AI project maintainer skill として使えます。また、reference adapters により、Codex skill、`AGENTS.md`、`CLAUDE.md`、Cursor rules、将来の assistant instruction file などの形式へ展開できるようにしています。

## Modes

### Genesis Mode

まだ十分なリポジトリ上の証拠がない新規プロジェクト向けのモードです。

maker は開発者に次のような点を確認します。

- 得意な言語と locale の好み
- プロダクトの目標と非目標
- 想定ユーザー
- 技術的な好みと制約
- ドキュメントと公開表現のトーン
- 品質基準と検証への期待
- リリース方針
- 最初の実装マイルストーン

出力される day-one maintainer skill は、開発者が宣言した意図と推奨標準を記録します。ただし、それらを観測済みのリポジトリ事実であるかのようには扱いません。

#### Language and Locale Setup

Genesis mode では最初に、作者がどの言語で考えたりレビューしたりするのが得意かを確認します。そのうえで、以降のインタビューと生成される project-facing references をその言語に寄せるかどうかを聞きます。

作者が希望する場合、maker はその言語でインタビューを続け、生成される references も作者の言語と locale profile に合わせます。たとえば日文プロジェクトでは、`です・ます`、`だ・である`、または技術文書向けの混合スタイルを選べます。また、日本国内向け、グローバルな日本語読者向け、バイリンガルなエンジニア向けなど、対象読者の違いも反映できます。

作者が得意な言語をプロジェクトに使わない場合は、インタビュー言語と出力言語を明示的に選んでもらいます。特に希望がない場合、デフォルトは英語です。

### Repo Mode

既存リポジトリ向けのモードです。

maker はまずリポジトリの signal を収集し、その後、今後の保守目標について少数の追加質問をします。主に次のようなファイルや情報を見ます。

- `README*`、docs、contribution、changelog、license files
- `package.json`、lockfiles、TypeScript/build/test configs
- CI workflows
- scripts、tests、source entry points、generated-file signals
- 利用可能な場合は commit や style の signal

出力は、観測されたプロジェクト事実に基づく長期保守用 maintainer skill になります。

## Evidence Model

生成される project references では、主張を次の種類に分けます。

- `observed_fact`: リポジトリファイル、コマンド、CI、テスト、メタデータ、履歴などから得られる証拠
- `declared_intent`: maintainer が明示した目標、制約、好み
- `recommended_standard`: プロジェクト種別に合うため選ばれた標準
- `inferred_assumption`: 情報が不足している中での慎重な仮定

`observed_fact` は、可能な限り根拠となるファイルパスを引用します。

## Generated Output

project maintainer skill は次のファイルを含みます。

```text
SKILL.md
agents/openai.yaml
references/project-intent.md
references/project-map.md
references/architecture.md
references/coding-standards.md
references/content-style.md
references/workflows.md
references/verification.md
references/release.md
references/generated-files.md
scripts/health-check.* optional
```

生成される Markdown ファイルには、保持される手書き用ブロックが入ります。

```markdown
<!-- BEGIN USER RULES -->
<!-- Add durable project-specific rules here. This block is preserved on refresh. -->
<!-- END USER RULES -->
```

refresh workflow では、この marker の中身を保持します。

## Scripts

リポジトリ signal を収集します。

```bash
node scripts/collect-repo-signals.mjs /path/to/repo > repo-signals.json
```

JSON config から project maintainer skill を生成します。

```bash
node scripts/render-project-skill.mjs \
  --input config.json \
  --output ./my-project-maintainer
```

生成された maintainer skill を検証します。

```bash
node scripts/validate-project-skill.mjs ./my-project-maintainer
```

## Current Focus

最初のバージョンでは、次の領域を優先しています。

- Astro と documentation sites
- TypeScript と Node OSS projects
- documentation-heavy projects
- AI coding agents 向けの再利用可能な maintainer workflows

設計上、`.github/copilot-instructions.md` やその他のプラットフォーム固有 instruction format など、今後の adapters 追加も想定しています。

## License

Apache-2.0
