---
title: "Self-Balancing VESC-Controlled Humanoid"
wip: true
date: 2026-10-29
summary: "A self-balancing hoverboard base with a 3D-printed humanoid on top."
cover: /images/projects/self-balancing-humanoid/electronics.webp
cardImage: /images/projects/self-balancing-humanoid/electronics-card.webp
video: ""
featured: false
tags: [robotics, controls]
---

## Update log

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

### Update · Nov 7, 2026

<figure style="margin:1.5rem 0">
<div style="position:relative;aspect-ratio:16/9;margin:0"><iframe src="https://www.youtube.com/embed/Fmsy0CihHGs?iv_load_policy=3&amp;rel=0" title="Wiring Arduino and ESCs" style="position:absolute;inset:0;width:100%;height:100%;border:1px solid var(--ink)" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
<figcaption>Wiring Arduino and ESCs</figcaption>
</figure>

## What I'm designing

<figure style="margin:1.5rem 0">
<img src="/images/projects/self-balancing-humanoid/cad-render.webp" alt="Initial CAD mockup of a small humanoid on a two-wheeled hoverboard base" width="1600" height="1200" loading="lazy" style="margin:0">
<figcaption>Initial mockup of my idea. Most likely will change in the future.</figcaption>
</figure>

<figure style="margin:1.5rem 0">
<img src="/images/projects/self-balancing-humanoid/teardown.webp" alt="Torn-down hoverboard with its covers off, showing the frame, wiring, and two hub-motor wheels" width="1600" height="1200" loading="lazy" style="margin:0">
<figcaption>The $25 hoverboard, torn down for its frame and hub motors.</figcaption>
</figure>

I tore down this $25 hoverboard with a dead battery to get the frame and hub motors. When I get some time and finish my autonomous combat robot, I'll add inertial measurement units (IMUs) and a VESC motor controller to make the board self-balance.

From there, I'll 3D print a small humanoid with a servo-controlled hinge at the waist so it can lean forward and backward while mounted on the hoverboard. I also plan to give it robotic arms so it can grab objects and place them.
