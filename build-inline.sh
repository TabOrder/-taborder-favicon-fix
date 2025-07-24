#!/bin/bash
cd frontend && npm install && echo "unsafe-perm=true" > .npmrc && npx react-scripts build && ls -la build/ 