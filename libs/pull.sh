#!/bin/bash
# PULL ALL LIBRARIES

function pull {
    echo "----- pull $1 -----"
    cd $PWD/$1
    git pull
    cd ..
}

pull ff-core
pull ff-browser
pull ff-graph
pull ff-ui
pull ff-scene
pull ff-three
