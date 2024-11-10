# Christmas Gift Lottery Generator

Automatically generates yearly Christmas gift assignments for family members.
The system ensures each person gives one gift and that assignments vary each
year.

## Usage

```bash
deno run -A script/santa.ts <decrypt|lottery|build> [options]
```

### Commands

#### decrypt

Decrypts lottery assignments

```bash
deno run -A script/santa.ts decrypt --json <path-to-json>
```

#### lottery

Generates new lottery assignments

```bash
deno run -A script/santa.ts lottery --inputJson <input-json> --outputJson [output-json]
```

#### build

Builds the webpage

```bash
deno run -A script/santa.ts build --buildDir <build-dir> --json <path-to-json>
```

### Arguments

| Command | Argument     | Description                         |
| ------- | ------------ | ----------------------------------- |
| decrypt | --json       | Path to encrypted lottery JSON file |
| lottery | --inputJson  | Path to input json file             |
|         | --outputJson | Where to save the generated lottery |
| build   | --buildDir   | Directory for the built webpage     |
|         | --json       | Path to lottery data JSON file      |

### GitHub Pages Deployment

This project can be automatically deployed to GitHub Pages. Add `[skip ci]` to
your commit message to skip deployment.

```bash
git commit -m "Update content [skip ci]"
```
