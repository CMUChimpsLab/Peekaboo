# #!/bin/bash
# bash reinstall_allnodes.sh
nodearray=(
       "node-red-contrib-peekaboo" 
       )

nodedir=$PWD

cd ~/.node-red

for i in "${nodearray[@]}"
do
    echo "Current directory is $PWD"
	echo "installing ${nodedir}/$i"
    npm install "${nodedir}/$i"
done

# npm install ~/projects/data-centered-privacy/programmingmodel/node-red-contrib-peekaboo
