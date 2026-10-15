#!/bin/bash
# render.sh <style> — full render via Remotion, then loudness-normalise audio to -14 LUFS (video stream copied)
set -e
STYLE=$1
ROOT=$(cd "$(dirname "$0")/.." && pwd)
JOB=jobs/20261015-gta6
cd "$ROOT/remotion"
npx remotion render Edit "$ROOT/outputs/${STYLE}_raw.mp4" --props="{\"edlFile\":\"$JOB/edl_${STYLE}.json\"}" \
  --codec=h264 --crf=18 --audio-bitrate=192k --concurrency=4 2>&1 | grep -E "Error|error|Encoded [0-9]+/[0-9]+$" | tail -2
cd "$ROOT"
ffmpeg -v error -y -i "outputs/${STYLE}_raw.mp4" -c:v copy -af "loudnorm=I=-14:TP=-1.0:LRA=11" -ar 48000 -c:a aac -b:a 192k \
  -movflags +faststart "outputs/${STYLE}.mp4"
rm -f "outputs/${STYLE}_raw.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact "outputs/${STYLE}.mp4"
