browserify src/scripts/ola-widget.js \
    --outfile src/scripts/ola-widget-bundle.js

browserify src/scripts/config-ola-widget.js \
    --outfile src/scripts/config-ola-widget-bundle.js

tfx extension publish \
    --token $VSTS_MARKETPLACE_TOKEN \
    --rev-version \
    --output-path ./deployments/