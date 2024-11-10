

# How to use

The command below will generate a new lottery if one does not exist for the
current year.  Either way, it will always regenerate a new index.html file in
the dist folder.

```sh
deno run -A script/build.ts
```

# Dev

Run the build script when the index template changes:

```sh
deno run --watch=src/index.html -A script/build.ts --buildDir ../dist/christmas/
```