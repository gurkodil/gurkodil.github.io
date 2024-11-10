# Christmas Gift Lottery Generator

Automatically generates yearly Christmas gift assignments for family members.
The system ensures each person gives one gift and that assignments vary each
year.

## Usage

```bash
deno run -A script/build.ts [options]
```

### Options

| Option              | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `--buildDir`        | Path to the build dir, if not provided no index.html will be built  |
| `--generateLottery` | Creates new lottery files for the current year if they do not exist |
| `--decryptFile`     | path to encrypted lottery file, prints result to stdout             |

### Common Commands

Generate new lottery for current year:

```bash
deno run -A script/build.ts --generateLottery
```

Build webpage with existing lottery:

```bash
deno run -A script/build.ts --buildDir dist
```

Local dev with watch command:

```sh
deno run --watch=src/index.html -A script/build.ts --buildDir dist
```

### GitHub Pages Deployment

This project can be automatically deployed to GitHub Pages. Add `[skip ci]` to
your commit message to skip deployment.

```bash
git commit -m "Update content [skip ci]"
```