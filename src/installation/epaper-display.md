# Add an e-ink display (optional)

This isn't necessary to run your Hush Line, but if you'd like to be able to check the status of your Hush Line at a glance, or if you'd like your Hush Line Raspberry Pi to display your Hush Line URL, you might want to add an e-ink display to your Hush Line.

1. Purchase a Waveshare 2.7inch E-Ink Display. Here's [an Amazon link](https://www.amazon.com/gp/product/B075FQKSZ9/ref=ox_sc_act_title_5?smid=A50C560NZEBBE&psc=1).

2. With your Raspberry Pi off, attach the Waveshare display to your Pi's GPIO pins. Make sure it's attached securely.

3. Plug in and start up your Raspberry Pi. On your Raspberry Pi, open the Terminal app. Type or paste this command and then hit enter:
   
   ```
   curl -sSL https://raw.githubusercontent.com/scidsg/hushline/main/scripts/waveshare-2_7in-eink-display.sh | bash
   ```
4. Follow the prompts to enable the SPI interface.
5. When the installation completes, the device will reboot. You should see the Hush Line splash screen, followed by information about your tip line. When everything is running smoothly, you'll see something like this:
   
<img width="350" src="https://github.com/scidsg/hushline/assets/28545431/8fd840d2-c2b9-4ba3-b0f8-bbe105c1baa2">
