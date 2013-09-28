git pull
returnCode=$?

if [[ $returnCode == 0 ]] ; then
  npm install
fi
