---
# PLACEHOLDER TEMPLATE — copy this file, rename it, and replace every [PLACEHOLDER].
title: "Combat Robot"
date: 2026-09-01
summary: "Computer vision autonomous combat robot."
cover: /images/projects/example-project-one/coming-soon.webp
video: ""            # e.g. /images/projects/example-project-one/demo.mp4 or a YouTube embed URL
featured: true       # the most recent featured project with a video fills the homepage video slot
tags: [placeholder, cad, fabrication]
---

## Demo

<!-- Video is embedded here (not via frontmatter `video:`) so the homepage keeps the VLM car video in its featured slot. -->
<figure class="drive-test" style="margin:1.5rem 0">
<video controls playsinline muted preload="metadata" poster="/images/projects/example-project-one/drive-test-poster.webp" width="406" height="720" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/example-project-one/drive-test.mp4" type="video/mp4"></video>
<figcaption style="text-align:center">Getting the drive and weapon spinning. It's pretty scary so far. Computer vision coming next.</figcaption>
</figure>

## What I'm designing

### Exterminate: Building an Autonomous Combat Robot

Exterminate started as a 3D-printed PLA prototype to prove out the layout and electronics. An Arduino Nano drives two N20 gear motors through a TB6612 motor driver and controls a brushless spinner weapon through a 40A ESC, all on a 3S battery with a HotRC remote. The next step is to take the driver out of the loop.

<details class="readmore">
<summary></summary>

<p>For the autonomous version, I'm adding a Raspberry Pi 5 with an AI accelerator HAT, plus two onboard cameras facing forward and backward, so the robot can see almost all the way around itself. A YOLO object detector running on the HAT finds the opponent in real time, and a Python control program turns that into steering and throttle commands. It switches between searching, charging, and backing off after a hit, and it remembers which way the opponent went when it leaves the frame. The Pi sends those commands to the Nano, which still handles the motors and weapon. I keep a manual override on the remote, and a failsafe shuts everything down if the Pi ever goes quiet.</p>

<p>The final build will move from PLA to tougher materials like a TPU or UHMW chassis and a hardened steel spinner, with all the electronics on a compact soldered perf board. Follow along as I go from a prototype that drives to a robot that fights on its own.</p>

</details>

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/coming-soon.webp" alt="First CAD pass of the combat robot" width="1600" height="1000" loading="lazy" style="margin:0">
<figcaption>First CAD pass</figcaption>
</figure>

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/cad-v2.webp" alt="Updated CAD of the combat robot" width="1600" height="939" loading="lazy" style="margin:0">
<figcaption>Updated CAD</figcaption>
</figure>

## Design decisions

- I chose an asymmetric horizontal spinner because it's the most aggressive, damage-dealing design, and it pairs well with a computer vision system that can quickly reorient the robot after hits.
- [PLACEHOLDER: decision 2 — the trade-off you made]
- [PLACEHOLDER: decision 3]

## Failed iterations

I tried using cheap brushed N20 motors for the drive, and they stripped out within just a few minutes of use. I'm now upgrading to more powerful motors designed specifically for combat robots.

## Results

[PLACEHOLDER: How did it turn out? Only include real measurements or outcomes. What would you do next?]
