#!/bin/bash
# CHECK STATUS OF ALL LIBRARIES

function status {
    echo "----- status $1 -----"
    cd $PWD/$1
    git status -s -b
    cd ..
}

status ff-core
status ff-browser
status ff-graph
status ff-ui
status ff-scene
status ff-three
