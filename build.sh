#!/usr/bin/bash

out_dir=$1
echo "compiling to $out_dir"
rm -r "$out_dir"
npx tsc --outDir "$out_dir"
[ -d "$out_dir/sass" ] || mkdir "$out_dir/sass"
cp ./src/sass/_mixins.scss "$out_dir/sass"
echo done
