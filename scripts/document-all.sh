#!/bin/sh

# Helpers
./node_modules/.bin/documentation build --document-exported -o src/helpers/helpers.md -f md --markdown-toc false "src/helpers/index.js"

# APIs
./node_modules/.bin/documentation build --document-exported -o src/apis/core/CoreAPI.md -f md  --markdown-toc false "src/apis/core/index.js"