# Installing Hush Line

Now go back to your Raspberry. You'll need a monitor and keyboard plugged in for this step.

## What you'll need to know for this step

Here is the information you'll need (all of which you should have at this point):
* Your Hush Line email address
* An [app password](https://support.google.com/accounts/answer/185833?hl=en) for that email address
* The URL of your public PGP key
* The password for your Raspberry Pi

## Installing Hush Line
Over on your Raspberry Pi, you'll need to now open an app called Terminal. Into that app you're going to type this exactly: 

```bash
sudo su
```
and hit enter. You'll be asked for the password for your Raspberry Pi you set earlier (don't worry if nothing happens as you type, just hit enter when you're done typing the password).

Next, type or paste (command+shift+v) this exactly:
```bash
curl -sSL https://install.hushline.app | bash
```

and then hit enter. You should see a flurry of white-on-black text, and then a series of prompts will ask you questions. Here are the answers you should use: 

1. We want to set up Hush Line as "Tor Only"
2. Enter your Hush Line email address we created earlier
3. For SMTP server address, enter `smtp.gmail.com`
4. For password of your email address, enter the App Password you created
5. For SMTP server port, enter `465`
6. For address of your PGP key, enter the keys.openpgp.org URL we saved earlier, which should look like `https://keys.openpgp.org/vks/v1/by-fingerprint/D278DD437B275C8668989A4B425C6C74405C3EB1`.

Once you're finished with the prompts, Hush Line will then be installed on your Raspberry Pi. If all went well, you should see a message similar to this in your Terminal.

```
✅ Installation complete!
                                            
Hush Line is a product by Science & Design. 
Learn more about us at https://scidsg.org.
Have feedback? Send us an email at hushline@scidsg.org.

● Hush Line is running
http://vfalkrrucjb7pztjskfumnqytpze5iimu4i2t2ygwv6ntylvylt2flad.onion
```

To visit your Hush Line, over on your computer [download the Tor Browser](https://torproject.org/download) and enter the `.onion` address that you see. You should see your new Hush Line form to submit information privately and securely.

Note that you can now unplug the keyboard and monitor from your Raspberry Pi.
