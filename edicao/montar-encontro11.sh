#!/bin/bash
# Monta o Encontro11 final.
#
# O compartilhamento de tela caiu em 1:09:00 e daquele ponto ao fim so restou o
# audio. Este script mantem o video original ate 1:09:00, troca o video do
# restante pela captura dos testes e preserva o AUDIO ORIGINAL do inicio ao fim.
#
# Nada e reencodado: a captura foi gerada com exatamente os mesmos parametros do
# original (H.264 High, level 4.0, yuv420p, 24 fps, timebase 1/12288), entao a
# montagem e so copia de fluxo. Isso deixa o processo em segundos em vez de
# minutos e, o que mais importa, garante que o audio sai bit a bit igual ao que
# foi gravado no encontro.
set -eu
cd "$(dirname "$0")/.."

ORIGINAL="Encontro11.mp4"
CAPTURA="edicao/screencast.mp4"
SAIDA="Encontro11-editado.mp4"
TMP="edicao/tmp"
CORTE=4140            # 1:09:00 em segundos

[ -f "$ORIGINAL" ] || { echo "nao encontrei $ORIGINAL"; exit 1; }
[ -f "$CAPTURA" ]  || { echo "nao encontrei $CAPTURA"; exit 1; }
mkdir -p "$TMP"

echo "1/4 — separando o video original ate 1:09:00 (copia, sem reencodar)"
ffmpeg -y -nostdin -loglevel warning -i "$ORIGINAL" \
  -t "$CORTE" -an -c:v copy -avoid_negative_ts make_zero "$TMP/parte1.mp4"

echo "2/4 — preparando a captura como segundo trecho"
ffmpeg -y -nostdin -loglevel warning -i "$CAPTURA" \
  -an -c:v copy "$TMP/parte2.mp4"

D1=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/parte1.mp4")
D2=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/parte2.mp4")
DA=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$ORIGINAL")
echo "    trecho original: ${D1}s | captura: ${D2}s | audio do encontro: ${DA}s"

echo "3/4 — juntando os dois trechos de video"
printf "file '%s'\nfile '%s'\n" "parte1.mp4" "parte2.mp4" > "$TMP/lista.txt"
ffmpeg -y -nostdin -loglevel warning -f concat -safe 0 -i "$TMP/lista.txt" \
  -c copy "$TMP/video.mp4"

echo "4/4 — casando com o audio original inteiro"
ffmpeg -y -nostdin -loglevel warning -i "$TMP/video.mp4" -i "$ORIGINAL" \
  -map 0:v:0 -map 1:a:0 -c copy -movflags +faststart "$SAIDA"

echo "=== pronto ==="
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_type,codec_name,width,height,r_frame_rate \
  -of default=nw=1 "$SAIDA"
