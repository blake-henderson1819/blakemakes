---
# PLACEHOLDER TEMPLATE — copy this file, rename it, and replace every [PLACEHOLDER].
title: "Combat Robot"
date: 2026-09-01
summary: "Computer vision autonomous combat robot."
cover: /images/projects/example-project-one/robot-assembled.webp
video: ""            # e.g. /images/projects/example-project-one/demo.mp4 or a YouTube embed URL
featured: true       # the most recent featured project with a video fills the homepage video slot
tags: [placeholder, cad, fabrication]
---

## Update · Oct 29, 2026

### Exterminate Update: It Hunts Now

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/robot-assembled.webp" alt="The assembled robot on a wooden desk under a lamp, with a blue camera mount on top, wiring inside the open chassis, and a blue spinner bar on a motor at the front" width="1600" height="1200" loading="lazy" style="margin:0">
<figcaption>Exterminate, assembled.</figcaption>
</figure>

Exterminate can now find a person and chase them on its own. A Raspberry Pi 5 with a Camera Module 3 Wide runs a YOLOv8 person detector and sends drive commands to the Arduino Nano that runs the motors. The HotRC remote can still take over any time: touch the trigger or wheel and the remote wins, let go and the Pi drives again.

### The stutter problem

The first runs kept dying mid-chase. The Pi's logs showed electrical noise from the drive motors knocking out its USB port, then crashing the whole USB controller. Twisting the motor wires helped a little, but the real fix was dropping USB entirely: the Pi now talks to the Nano over three jumper wires on its serial pins, which can't crash the way USB did. (On a Pi 5, that also meant switching on the right serial port, since the default one points to the debug connector.)

### First chase

Once the link was stable, it locked on and came straight at me, at full power at first. I've since turned the speed down.

<figure style="margin:1.5rem 0">
<video controls playsinline preload="metadata" poster="/images/projects/example-project-one/jumpscare-poster.webp" width="1280" height="720" aria-label="Video: the lights come on and the robot chases me across the floor" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/example-project-one/jumpscare.mp4" type="video/mp4"></video>
<figcaption style="text-align:center">I turn on the light and it comes after me.</figcaption>
</figure>

### Smoother tracking

The first steering overcorrected because detection only runs a few times a second, so the bot was always reacting to where I was. Now it turns in small nudges until I'm centered, then drives straight. It's still a bit clunky. Next up is fast frame-to-frame tracking and smoother steering control.

<figure style="margin:1.5rem 0">
<video controls playsinline preload="metadata" poster="/images/projects/example-project-one/tracking-poster.webp" width="720" height="1280" aria-label="Video: the robot turning to follow me as I walk around the room" style="display:block;margin:0 auto;width:auto;max-width:100%;height:auto;max-height:80vh;border:1px solid var(--rule)"><source src="/images/projects/example-project-one/tracking.mp4" type="video/mp4"></video>
<figcaption style="text-align:center">Tracking me as I walk around the room.</figcaption>
</figure>

### What I learned

- Brushed motors make enough electrical noise to crash a computer's USB, so wire routing matters more than I expected.
- The current drive motors are antweight motors on a roughly 8 lb bot. They push on hard floors but stall on carpet, so Repeat Ultra Mk2 brushless drive is the planned upgrade.
- An upside-down camera swaps left and right, which is why it first turned away from me.

### Next up

Stronger motors, a CNC-cut steel spinner designed for maximum spin energy, and a speaker that says "EXTERMINATE" when it locks on.

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
<img src="/images/projects/example-project-one/cad-exterminate.webp" alt="Updated CAD of the robot with a camera housing on the weapon mount, the Raspberry Pi and electronics inside the chassis, and a purple spinner bar" width="1600" height="891" loading="lazy" style="margin:0">
<figcaption>Updated CAD with the camera on the weapon mount.</figcaption>
</figure>

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/cad-v3.webp" alt="Latest CAD of the combat robot with the Raspberry Pi and electronics inside the chassis and a purple spinner bar on a brushless motor" width="1302" height="984" loading="lazy" style="margin:0">
<figcaption>Latest CAD: the Raspberry Pi and electronics are packed into the chassis, with the spinner on a 2830 1100KV brushless motor.</figcaption>
</figure>

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/cad-v2.webp" alt="Updated CAD of the combat robot" width="1600" height="939" loading="lazy" style="margin:0">
<figcaption>Updated CAD</figcaption>
</figure>

<figure style="margin:1.5rem 0">
<img src="/images/projects/example-project-one/coming-soon.webp" alt="First CAD pass of the combat robot" width="1600" height="1000" loading="lazy" style="margin:0">
<figcaption>First CAD pass</figcaption>
</figure>

## Design decisions

- I chose an asymmetric horizontal spinner because it's the most aggressive, damage-dealing design, and it pairs well with a computer vision system that can quickly reorient the robot after hits.
- [PLACEHOLDER: decision 2 — the trade-off you made]
- [PLACEHOLDER: decision 3]

## Failed iterations

I tried using cheap brushed N20 motors for the drive, and they stripped out within just a few minutes of use. I'm now upgrading to more powerful motors designed specifically for combat robots.

## Results

[PLACEHOLDER: How did it turn out? Only include real measurements or outcomes. What would you do next?]
