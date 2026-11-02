---
title: "VLM Car"
date: 2026-10-14
summary: "A small Arduino robot car I drive by talking to it, guided by an overhead webcam."
repo: https://github.com/blake-henderson1819/vlm-car
pinned: false
featured: false
tags: [arduino, computer-vision, voice]
---

<p class="ph">[PLACEHOLDER: photos or demo video]</p>

A small Arduino Uno robot car with an L293D motor driver and two TT gear motors. A Logitech webcam mounted over my table watches from above and finds the car by an ArUco marker on its roof.

A Mac app I call Car Control shows the live camera view and turns commands into motor commands sent over USB serial. I can drive it with on-screen buttons or WASD, or just talk to it: speech-to-text runs locally with faster-whisper.

## What it can do

- **Find objects by name.** Grounding DINO tiny finds things like "lighter" or "mouse" in the camera image, with Gemma via Ollama as a fallback for things DINO misses.
- **Bulldoze.** Say "lighter, bulldoze" and it aims at the target, drives toward it, and rams it.
- **Go home.** Say "go home" and it turns until its rear points at a home spot in the corner of the frame, then backs straight in.
- **Edge guard.** If a move would push the car too close to the edge of the frame, it backs away instead.
- **Moods.** Praise gets a happy chirp, insults get a sad beep.

## Limitations

It needs even lighting, since glare on the marker breaks tracking. Position is 2D from one fixed camera, and moves are timed open-loop, so battery level changes how far it goes.
