# Setting up an email address for your Hush Line

Let's learn a little more about what Hush Line actually does. 

When a community member hits the Submit button on your Hush Line form, Hush Line does two things: It encrypts their message, and then it emails it to your Hush Line email address, which we're about to set up.

We recommend making a dedicated email account for Hush Line. You can use your organization email system, GMail, or another provider. (Note that this email address will be publicly displayed on your Hush Line site.)

Either way, we need to take some careful steps to ensure Hush Line can use it and that your messages will be properly encrypted. In the steps below, we'll use GMail. We'll also assume you're using a Mac computer.

## Create a new GMail account for Hush Line

1. In your browser, head over to [mail.google.com](mail.google.com/) to create a new GMail account.
2. Once created, turn on 2-factor authentication.
3. Create an ["app password"](https://support.google.com/accounts/answer/185833?hl=en) for Hush Line to use. Write this down for later use.

## Create a PGP key for this email account to use

Next, we need to give Hush Line a way to encrypt our sources' emails so that only we can read messages submitted to Hush Line (and not even Google can read them). To do that, we're going to use an encryption system called PGP, which stands for "Pretty Good Privacy". 

### What is PGP? Let's use a non-technical metaphor

Here's how I like to think of PGP: Once set up, you'll have a very special envelope that people can put their messages inside of. What makes these envelopes so special is that it can only be opened by one specific letter opener. 

Now let's say we want to receive secret messages from your friend Bob. First, you give Bob plenty of your special envelopes. (We do not give Bob the letter opener, since you don't want Bob to be able to open mail intended for you.) Bob writes his message, places it in one of your envelopes, and sends it to you. When you receive the sealed envelope, you use your letter opener to open it, confidence that no one else was able to read its contents along the way. 

### Creating our envelopes and letter opener

IMPORTANT: These next steps you'll need to do on the computer than you want to be able to read your Hush Line messages on. We're here going to assume it's a Mac. 

To create our envelopes and letter opener, we're going to use a browser extension called [Mailvelope](https://mailvelope.com/en/). 

As you can probably guess, the envelopes and letter opener have more technical names in the PGP system. Anyone who knows your **public key** can make your envelopes and the letter opener is called your **private key**. A public key and a private key is called a key-pair.

Use Mailvelope to create a new PGP key. **TO DO: Expand these instructions and add screenshots.**
<!-- Once you've installed GPG Tools, open a tool called GPG Keychain. Click "New" at the top of the window to create a key-pair (a public and private key) for our new Hush Line email address. Enter your Hush Line email address. Then choose a strong password or passphrase for your PGP password -- this will protect your private key (letter opener). -->

Your private key (letter opener) will be stored on the computer you're using to set up this email account. As mentioned above, this means that only someone using this computer will be able to read the messages sent to your Hush Line.

If you or someone else logged in to your Hush Line email address on a different computer (and thus did not have your private key), all your Hush Line messages would remain encrypted and unreadable.

### Uploading our public key (the envelopes)
Next, we need to upload our public key to a website.

**TO DO: How to get public key from Mailvelope to Hush Line...**
<!-- This address verification process will take you to a URL that you will need later. It should look something like `https://keys.openpgp.org/vks/v1/by-fingerprint/D278DD437B275C8668989A4B425C6C74405C3EB1`. This is essentially the URL for your public PGP key. For now, paste it into a note or text file. (If you didn't save it, you can visit [https://keys.openpgp.org](https://keys.openpgp.org/) and search for your Hush Line email address and find it that way). -->

Next, we get to install Hush Line back on our Raspberry Pi.
