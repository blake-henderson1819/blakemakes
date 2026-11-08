---
# PLACEHOLDER TEMPLATE — copy this file, rename it, and replace every [PLACEHOLDER].
title: "Autonomous Combat Robot"
wip: true
date: 2026-09-01
repo: https://github.com/blake-henderson1819/exterminate
summary: "Computer vision autonomous combat robot."
homeVideo: https://www.youtube.com/embed/sxFob8HbFJE?iv_load_policy=3&rel=0
cover: /images/projects/example-project-one/robot-white.webp
video: ""            # e.g. /images/projects/example-project-one/demo.mp4 or a YouTube embed URL
pinned: true
introFirst: true   # keeps "What I'm designing" above the cover; cover is shown right after it
featured: true       # the most recent featured project with a video fills the homepage video slot
tags: [placeholder, cad, fabrication]
---

## Overview

### Exterminate: Building an Autonomous Combat Robot

So I'm building a combat robot that can autonomously track and attack targets. I'm calling it Exterminate because one of my favorite shows as a kid was Doctor Who, where militaristic robotic aliens called the Daleks would always shout "EXTERMINATE!" before killing their enemies, and I always thought it was corny and funny.

A camera and a Raspberry Pi 5 running a YOLO detector find the target, and the Pi tells an Arduino Nano how to steer, drive, and spin up the weapon. I can take over with the remote at any time, and a failsafe shuts everything down if the Pi stops talking.

It started as a 3D-printed PLA prototype to prove out the layout and electronics. Now it's moving to real fighting hardware: a machined metal spinner, stronger brushless drive motors, and tougher chassis materials. The updates below follow it from a robot that drives to one that hunts.

<!-- Intro stays first. New updates go below this cover, newest first. -->
<figure class="project__cover"><img src="{{ cover }}" alt="{{ title }} — cover photo" width="1600" height="1000"></figure>

## Update log

### Update · Nov 7, 2026

#### Redoing the electronics

The wiring had turned into a rat's nest from all the prototyping, so I tore it out and redid it. The Arduino Nano now sits on a soldered perf board instead of hanging off loose jumper wires, and everything inside the chassis is rerouted and cleaned up so it's easier to work on and less likely to shake loose.

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/perfboard.webp" alt="Arduino Nano soldered onto a green perf board with header pins, on a spool of solder" width="1600" height="1200" loading="lazy" style="margin:0">
<figcaption>The Nano on its new perf board.</figcaption>
</figure>

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/electronics-redo.webp" alt="Top view into the chassis with the rewired electronics: the Nano on its perf board, a speaker, power connectors, and the receiver" width="1600" height="1200" loading="lazy" style="margin:0">
<figcaption>Everything rewired inside the chassis.</figcaption>
</figure>

### Update · Nov 5, 2026

<div style="position:relative;aspect-ratio:16/9;margin:0 0 1.5rem"><iframe src="https://www.youtube.com/embed/sxFob8HbFJE?iv_load_policy=3&amp;rel=0" title="Exterminate video" style="position:absolute;inset:0;width:100%;height:100%;border:1px solid var(--ink)" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>

### Update · Oct 30, 2026

#### Machining an upgraded spinner

I cut an upgraded spinner bar out of metal plate on a CNC router. The part is still held in by tabs, with chips piled up from the cut.

<link rel="stylesheet" href="/css/slideshow.css">
<div class="ss" role="region" aria-roledescription="carousel" aria-label="Machining the upgraded spinner">
  <div class="ss__slide is-active" data-i="0">
    <img class="ss__media" src="/images/projects/example-project-one/spinner-cnc.webp" alt="Metal spinner bar freshly cut from plate stock on a CNC router, still held by tabs, with a dust hose and chips on the bed" width="1200" height="1600" loading="lazy">
    <p class="ss__cap">Machining a more <em>effective</em> spinner on my friend's CNC table</p>
  </div>
  <div class="ss__slide" data-i="1" hidden aria-hidden="true">
    <img class="ss__media" src="/images/projects/example-project-one/spinner-cut.webp" alt="Close-up of the cut spinner outline in the metal plate, covered in chips and held by a clamp" width="1600" height="1200" loading="lazy">
    <p class="ss__cap">Close-up of the cut, chips everywhere.</p>
  </div>
  <div class="ss__slide" data-i="2" hidden aria-hidden="true">
    <video class="ss__media" controls playsinline preload="metadata" poster="/images/projects/example-project-one/spinner-machining-poster.webp" width="1280" height="720" aria-label="Video: cutting the spinner on the CNC"><source src="/images/projects/example-project-one/spinner-machining.mp4" type="video/mp4"></video>
    <p class="ss__cap">Cutting the spinner.</p>
  </div>
  <div class="ss__bar">
    <button type="button" class="ss__btn ss__prev" aria-label="Previous slide">‹</button>
    <span class="ss__count" aria-live="polite">1 / 3</span>
    <button type="button" class="ss__btn ss__next" aria-label="Next slide">›</button>
  </div>
  <div class="ss__dots" role="tablist" aria-label="Slides">
    <button type="button" class="ss__dot" aria-label="Slide 1" aria-current="true"></button>
    <button type="button" class="ss__dot" aria-label="Slide 2"></button>
    <button type="button" class="ss__dot" aria-label="Slide 3"></button>
  </div>
</div>
<script src="/js/slideshow.js" defer></script>

### Update · Oct 29, 2026 · Turn-only person tracking

<div style="position:relative;aspect-ratio:16/9;margin:0 0 1.5rem"><iframe src="https://www.youtube.com/embed/CEK7YcAtK6Y" title="Exterminate turn-only person tracking" style="position:absolute;inset:0;width:100%;height:100%;border:1px solid var(--ink)" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>

Before letting Exterminate drive at anyone, I'm getting it to just face me. The Pi 5 runs YOLOv8n on the camera feed at about 19 fps and sends turn commands to the Nano 30 times a second. The green box is me, and the cyan line is center. Detection stays locked on, but at nearly 10 lb the current drive motors can only really turn at full power, so tracking is stop-and-go and sometimes overshoots.

Next up: stronger hobbyweight drive motors for smoother turns.

### Update · Oct 29, 2026

#### Exterminate Update: It Hunts Now

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/robot-assembled.webp" alt="The assembled robot on a wooden desk under a lamp, with a blue camera mount on top, wiring inside the open chassis, and a blue spinner bar on a motor at the front" width="1600" height="1200" loading="lazy" style="margin:0">
<figcaption>Exterminate, assembled.</figcaption>
</figure>

Exterminate can now find a person and chase them on its own. A Raspberry Pi 5 with a Camera Module 3 Wide runs a YOLOv8 person detector and sends drive commands to the Arduino Nano that runs the motors. The HotRC remote can still take over any time: touch the trigger or wheel and the remote wins, let go and the Pi drives again.

#### The stutter problem

The first runs kept dying mid-chase. The Pi's logs showed electrical noise from the drive motors knocking out its USB port, then crashing the whole USB controller. Twisting the motor wires helped a little, but the real fix was dropping USB entirely: the Pi now talks to the Nano over three jumper wires on its serial pins, which can't crash the way USB did. (On a Pi 5, that also meant switching on the right serial port, since the default one points to the debug connector.)

#### First chase

Once the link was stable, it locked on and came straight at me, at full power at first. I've since turned the speed down.

<figure style="margin:1.5rem 0">
<video controls playsinline preload="metadata" poster="/images/projects/example-project-one/jumpscare-poster.webp" width="1280" height="720" aria-label="Video: the lights come on and the robot chases me across the floor" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/example-project-one/jumpscare.mp4" type="video/mp4"></video>
<figcaption style="text-align:center">I turn on the light and it comes after me.</figcaption>
</figure>

#### Smoother tracking

The first steering overcorrected because detection only runs a few times a second, so the bot was always reacting to where I was. Now it turns in small nudges until I'm centered, then drives straight. It's still a bit clunky. Next up is fast frame-to-frame tracking and smoother steering control.

<figure style="margin:1.5rem 0">
<video controls playsinline preload="metadata" poster="/images/projects/example-project-one/tracking-poster.webp" width="720" height="1280" aria-label="Video: the robot turning to follow me as I walk around the room" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/example-project-one/tracking.mp4" type="video/mp4"></video>
<figcaption style="text-align:center">Tracking me as I walk around the room.</figcaption>
</figure>

#### What I learned

- Brushed motors make enough electrical noise to crash a computer's USB, so wire routing matters more than I expected.
- The current drive motors are antweight motors on a roughly 8 lb bot. They push on hard floors but stall on carpet, so Repeat Ultra Mk2 brushless drive is the planned upgrade.
- An upside-down camera swaps left and right, which is why it first turned away from me.

#### Next up

Stronger motors, a CNC-cut steel spinner designed for maximum spin energy, and a speaker that says "EXTERMINATE" when it locks on.

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/cad-v2.webp" alt="Updated CAD of the combat robot" width="1600" height="939" loading="lazy" style="margin:0">
<figcaption>Updated CAD</figcaption>
</figure>

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/cad-v3.webp" alt="Latest CAD of the combat robot with the Raspberry Pi and electronics inside the chassis and a purple spinner bar on a brushless motor" width="1302" height="984" loading="lazy" style="margin:0">
<figcaption>Third CAD pass: the Raspberry Pi and electronics are packed into the chassis, with the spinner on a 2830 1100KV brushless motor.</figcaption>
</figure>

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/cad-exterminate.webp" alt="Updated CAD of the robot with a camera housing on the weapon mount, the Raspberry Pi and electronics inside the chassis, and a purple spinner bar" width="1600" height="891" loading="lazy" style="margin:0">
<figcaption>Updated CAD with the camera on the weapon mount.</figcaption>
</figure>

### Demo

<!-- Video is embedded here (not via frontmatter `video:`) so the homepage keeps the VLM car video in its featured slot. -->
<figure class="drive-test" style="margin:1.5rem 0">
<video controls playsinline muted preload="metadata" poster="/images/projects/example-project-one/drive-test-poster.webp" width="406" height="720" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/example-project-one/drive-test.mp4" type="video/mp4"></video>
<figcaption style="text-align:center">Getting the drive and weapon spinning. It's pretty scary so far. Computer vision coming next.</figcaption>
</figure>
