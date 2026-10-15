#!/bin/bash
# contact.sh <video> <outdir> [step]  — one frame every <step> s (default 2) + labelled contact sheets of 12
V=$1; OUT=$2; STEP=${3:-2}
mkdir -p "$OUT"; rm -f "$OUT"/f_*.jpg
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
t=1
while (( $(echo "$t < $D" | bc -l) )); do
  ffmpeg -v error -y -ss $t -i "$V" -frames:v 1 -vf "scale=360:-1,drawtext=fontfile=$(dirname $0)/../remotion/public/fonts/Inter-600.ttf:text='${t}s':x=8:y=8:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@0.6" "$OUT/f_$(printf %05.1f $t).jpg"
  t=$(echo "$t + $STEP" | bc)
done
ls "$OUT"/f_*.jpg | split -l 15 - "$OUT/list_"
i=1; for L in "$OUT"/list_*; do montage $(cat $L) -tile 5x -geometry +3+3 -background '#222' "$OUT/sheet_$i.jpg"; i=$((i+1)); rm $L; done
ls "$OUT"/sheet_*.jpg
