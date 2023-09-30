# Install Hush Line on a Raspberry Pi

If you didn't know, your Raspberry Pi doesn't come with an operating system. Don't panic! We're going to install one now called Raspberry Pi OS.

In this section, we'll need the following:

- Raspberry Pi Imager (from prerequisites)
- Raspberry Pi
- microSD Card
- Power Supply

## Prep Your Card

### 1. Raspberry Pi Imager
Open the Raspberry Pi Imager and click `Choose OS > Raspberry Pi OS (other) > Raspberry Pi OS (64-Bit)`.

Insert your microSD card into your computer, and then click `Choose Storage` and select your card.

![19-rpi-imager](https://github.com/scidsg/project-info/assets/28545431/4a05a403-45c8-4a70-be4a-78aac27fea0c)

Before clicking Write, click on the Settings gear in the bottom right of the window. Configure the following settings:

- Hostname = hushline
- Enable SSH with password authentication
- User = Hush
- Set a strong password
- Wifi settings

![20-advanced](https://github.com/scidsg/project-info/assets/28545431/46a822c8-bf5e-40c0-9c45-fcbc19a1c9ad)

## Boot up and log in to Your Pi

### 2. Insert microSD Card

Take your SD card and insert it into your Raspberry Pi. You'll find the SD card slide on the bottom of the board, opposite the ethernet ports.

Plug the power supply into the device and let it boot up.