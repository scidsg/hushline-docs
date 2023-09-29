# Using SSH to access your Raspberry Pi

If you don't want to plug in a monitor and keyboard into your Raspberry Pi every time you need to use it, you can remotely access using a tool called [SSH](https://en.wikipedia.org/wiki/Secure_Shell).

To do this, you first need to find out your Raspberry Pi's IP address. 

1. Make sure your Raspberry Pi is turned on 
2. Go to your router's admin settings and look for your connected devices. Your device should be named "raspberrypi."
3. Take note of its IP address. Its format might look like "192.168.0.4."
4. (_Optional, but recommended_) Next, while still in your router settings, look for "Address Reservations". This may also be called "Static IP Addresses." Sometimes, when your router or device reboots, your Pi will get assigned a different IP address. We want to assign it an IP so you can have a predictable address in case you need to log back into your Pi. Assign it the IP address it currently has and give it a descriptive name.
    - All routers are different, so look at the manufacturer's instructions if you can't find the settings.
    - For **Netgear routers**, try the _Advanced tab > Setup > LAN Setup > Address Reservations > Add_.
    - For **TP-Link routers**, try _Advanced > DHCP Server > Address Reservation > Add_.
5. Now that you know your Rasberry Pi's IP address, over on another computer, open your Terminal and log in to your Pi using SSH:
   
   ```
   ssh pi@<IP-address>
   ```

Once you enter your password, you should be able to run Terminal commands as if you were on your Raspberry Pi. Convenient!
