#!/bin/bash
cd "$(dirname "$0")"; export PATH=$HOME/.dotnet:$PATH; f=0
node export.test.js | tail -1 || f=1
node aiops.test.js | tail -1 || f=1
(cd SiteBuilder.Tests && dotnet test 2>&1 | tail -1) || f=1
exit $f
