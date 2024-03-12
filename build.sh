#!/usr/bin/bash

out_dir=$(cat tsconfig.json | jq -r '.compilerOptions.outDir' || echo dist)
rm -r "$out_dir"
npx tsc
[ -d "$out_dir/sass" ] || mkdir "$out_dir/sass"
cp ./src/sass/_mixins.scss "$out_dir/sass"
echo done
