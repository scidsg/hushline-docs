---
id: personal-server-specs
title: Specs
sidebar_position: 10
---

## High Level Specifications

| Specification       | Details                     |
|---------------------|-----------------------------|
| Operating System    | Ubuntu Server 22.*          |
| Dimensions          | 94 × 66 × 36 mm (W / H / D)   |
| Weight              | 238 g                       |
| Packaged Weight     | 272 g                       |

## Computer Hardware

| Specification          | Details                                                              |
|------------------------|----------------------------------------------------------------------|
| SoC                    | Broadcom BCM2711, Quad-core Cortex-A72 (ARM v8) 64-bit SoC @ 1.8 GHz   |
| Memory                 | 1 GB LPDDR4-3200 SDRAM                                                |
| Wireless               | 2.4 GHz & 5.0 GHz IEEE 802.11ac (disabled for security)              |
| Bluetooth              | Bluetooth 5.0, BLE (disabled for security)                            |
| Ethernet               | Gigabit Ethernet                                                      |
| USB Ports              | 2 × USB 3.0; 2 × USB 2.0 (disabled for security)                       |
| GPIO Header            | Raspberry Pi 40-pin header (used by e-Paper display)                   |
| micro-HDMI® Ports      | 2 × micro-HDMI® (no access)                                           |
| MIPI DSI Display Port  | 2-lane MIPI DSI (no access)                                           |
| MIPI CSI Camera Port   | 2-lane MIPI CSI (no access)                                           |
| Audio/Video Port       | 4-pole stereo audio & composite video (no access)                    |
| Video Codec            | H.265 (4kp60 decode), H.264 (1080p60 decode, 1080p30 encode)          |
| Graphics API           | OpenGL ES 3.1, Vulkan 1.0                                             |
| Storage                | Micro-SD card slot (no access)                                        |
| Power (USB-C)          | 5 V DC via USB-C (min 3 A*)                                           |
| Power (GPIO)           | 5 V DC via GPIO header (min 3 A*)                                     |
| Operating Temperature  | 0 – 50 °C ambient                                                      |

## Case

| Specification     | Details                                              |
|-------------------|------------------------------------------------------|
| Material          | CNC-milled uni-body A606 aluminum (1.5 – 4 mm)        |
| Port Sealing      | All ports sealed except ethernet & power             |
| Front Panel       | Glassy acrylic (5 mm)                                |
| Feet              | HAFELE noise-absorbing                                |
| Thermal Cutouts   | 2 mm cutout each side for improved thermal efficiency |

## Display

| Specification         | Details               |
|-----------------------|-----------------------|
| Type                  | e-Paper               |
| Resolution            | 264 × 176 px          |
| Operating Voltage     | 3.3 V / 5 V           |
| Interface             | SPI                   |
| Outline Dimensions    | 85 × 56 mm            |
| Display Size          | 57.288 × 38.192 mm    |
| Refresh Power         | 24 mW (typical)       |
| Dot Pitch             | 0.217 × 0.217 mm      |
| Display Color         | black, white          |
| Grey Scale            | 4                     |
| Full Refresh Time     | 6 s                   |
| Partial Refresh Time  | 0.3 s                 |
| Standby Current       | < 0.01 µA             |
| Viewing Angle         | > 170°                |
