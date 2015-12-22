#!/bin/bash
-sed -r -i '' -e '1,$s/\{%\/?literal%\}//g' webappandroid/webappandroid.html

fis release -c --md5 2 -o

