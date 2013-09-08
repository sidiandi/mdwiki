#!/bin/sh

curBranch=$(git rev-parse --abbrev-ref HEAD)

# Ignore rebase, stash unstaged.
#[[ $curBranch != '(no branch)' ]] &&
# git stash -q --keep-index &&
grunt test

# Check the exit status of grunt.
[[ $? -ne 0 ]] &&
echo "Test failed, can't commit" &&
exit 1

# All is well, stage and restore stash.
# git add .
#git stash pop -q
