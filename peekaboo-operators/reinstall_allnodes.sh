# #!/bin/bash
package="node-red-contrib-peekaboo"
nodedir=$PWD

# Install dependencies
cd $package
npm install

cd ~/.node-red
echo "Current directory is $PWD"
echo "Installing ${nodedir}/${package}"
npm install ${nodedir}/${package}