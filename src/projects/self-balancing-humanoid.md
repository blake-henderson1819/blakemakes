---
title: "Self-Balancing Robotic Arm"
wip: true
date: 2026-10-29
summary: "A self-balancing hoverboard base with an SO-101 robotic arm on top."
cover: /images/projects/self-balancing-humanoid/so101-render.webp
coverCaption: "Initial mockup of my idea. Most likely will change in the future."
cardImage: /images/projects/self-balancing-humanoid/electronics-card.webp
video: ""
featured: false
tags: [robotics, controls]
---

## Update log

### Update · Nov 21, 2026

#### Found a dead splitter leg

Loading the right motor's config onto the left ESC threw a truncated-parameters error (FOC values are motor-specific), and the left motor stopped spinning. Then I found the right ESC was only powering on through CAN backfeed from the left ESC, because one leg of my 3-way XT60 splitter was dead, so I moved both ESCs onto the working legs. The left motor still won't spin after reloading its configs, most likely because the Balance app got turned back on.

Next: turn Balance fully off on the left ESC, spin-test both wheels, then retune balancing.

### Update · Nov 19, 2026

#### IMU working, Balance vibrating

The IMU problem turned out to be swapped SDA/SCL. On VESC hardware 4.10 it's SDA to COMM TX and SCL to COMM RX, the opposite of the VESC 6 layout. With that fixed I saved my configs and set up the IMU orientation and the Balance app. Balance vibrated even with lowered gains and the IMU rigidly mounted, and DRV faults kept coming up. Reloading a known-good left motor config made the motor smooth again, and the "ticking" on manual duty commands turned out to be the Balance package overriding them.

### Update · Nov 18, 2026

#### New ESC, both motors spinning

I installed a replacement left ESC, reran FOC detection on both Flipsky Mini 4.20s (left CAN ID 86, right ID 85 with direction inverted), and re-pinned the CAN cable with no 5V wire, so both motors spun. The external IMU wouldn't read on either ESC, even after trying a BMI160 and an LSM6DS3TR-C and resetting the configs.

### Update · Nov 16, 2026

<figure style="margin:1.5rem 0">
<div style="position:relative;aspect-ratio:16/9;margin:0"><iframe src="https://www.youtube.com/embed/bSRBcPby0BQ?iv_load_policy=3&amp;rel=0" title="Robotic arm controlled from my webcam" style="position:absolute;inset:0;width:100%;height:100%;border:1px solid var(--ink)" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
<figcaption>I put together the robotic arm and controlled it from my webcam. The next step is to mount it on the hoverboard and integrate it with the self balancing technology.</figcaption>
</figure>

### Update · Nov 12, 2026

#### CAN bus purgatory

Today I debugged for five hours trying to get the motors to spin smoothly. Below is motor noise I couldn't figure out.

<figure style="margin:1.5rem 0">
<video controls playsinline preload="metadata" poster="/images/projects/self-balancing-humanoid/motor-noise-poster.webp" width="1280" height="720" aria-label="Video: motor noise I couldn't figure out" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/self-balancing-humanoid/motor-noise.mp4" type="video/mp4"></video>
</figure>

### Update · Nov 11, 2026

#### Getting the IMU working

<figure style="margin:1.5rem 0">
<video controls playsinline preload="metadata" poster="/images/projects/self-balancing-humanoid/imu-poster.webp" width="1280" height="720" aria-label="Video: getting the IMU working" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/self-balancing-humanoid/imu.mp4" type="video/mp4"></video>
</figure>

### Update · Nov 10, 2026

#### Getting the Hall Effect ESCs online

<figure style="margin:1.5rem 0">
<video controls playsinline preload="metadata" poster="/images/projects/self-balancing-humanoid/hall-escs-poster.webp" width="1280" height="720" aria-label="Video: getting the Hall Effect ESCs online" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/self-balancing-humanoid/hall-escs.mp4" type="video/mp4"></video>
</figure>

### Update · Nov 7, 2026

<figure style="margin:1.5rem 0">
<div style="position:relative;aspect-ratio:16/9;margin:0"><iframe src="https://www.youtube.com/embed/Fmsy0CihHGs?iv_load_policy=3&amp;rel=0" title="Wiring Arduino and ESCs" style="position:absolute;inset:0;width:100%;height:100%;border:1px solid var(--ink)" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
<figcaption>Wiring Arduino and ESCs</figcaption>
</figure>

## What I'm designing

<figure style="margin:1.5rem 0">
<img src="/images/projects/self-balancing-humanoid/teardown.webp" alt="Torn-down hoverboard with its covers off, showing the frame, wiring, and two hub-motor wheels" width="1600" height="1200" loading="lazy" style="margin:0">
<figcaption>The $25 hoverboard, torn down for its frame and hub motors.</figcaption>
</figure>

I tore down this $25 hoverboard with a dead battery to get the frame and hub motors. The plan is to make the board self-balance using an IMU and the hoverboard's Hall effect motor controllers, then mount an SO-101 open-source robotic arm on top.

The arm is already built and I can control it from my webcam. Next, I'll mount it on the hoverboard and tie it into the balancing system so the robot can stay upright while it reaches for, grabs, and places objects.
