# General Prerequisites 

## Contents

1. [Software](#software)
2. [Creating Keys](#creating-keys)
3. [App Password](#app-password)

## Software

### 1. Tor Browser

Your Hush Line has the option to only be reachable via the Tor Browser. It's not only the most private but also the easiest to set up and deploy.

![3-tor-browser](https://github.com/scidsg/project-info/assets/28545431/dba5de25-383c-443d-b31e-8e55fc5dd8a1)

### 2. Gmail

We'll use Gmail for its high reliability. If you don't already have an account, create one. It's also not a bad idea to have an email address separate from your personal account.

### 3. Mailvelope

To decrypt Hush Line messages, we'll use Mailvelope, which integrates with Gmail, adding PGP functionality; add the extension to [Firefox](https://addons.mozilla.org/en-US/firefox/addon/mailvelope/) or [Chrome](https://chrome.google.com/webstore/detail/mailvelope/kajibbejlbohfaggdiogboambcijhkke).

![4-mailvelope](https://github.com/scidsg/project-info/assets/28545431/eabf6c60-50ca-40ce-b217-30fe0451cda1)

Open the extension in your browser and click "Let's Start."

![5-mailvelope](https://github.com/scidsg/project-info/assets/28545431/dd630fae-ad1e-4b0e-8760-5d3e85707f44)

## Creating Keys

### What is PGP? Let's use a non-technical metaphor

Here's how I like to think of PGP: Once set up, you'll have a very special envelope that people can put their messages inside of. What makes these envelopes so special is that it can only be opened by one specific letter opener. 

Now let's say we want to receive secret messages from your friend Bob. First, you give Bob plenty of your special envelopes. (We do not give Bob the letter opener, since you don't want Bob to be able to open mail intended for you.) Bob writes his message, places it in one of your envelopes, and sends it to you. When you receive the sealed envelope, you use your letter opener to open it, confidence that no one else was able to read its contents along the way. 

### 4. Create your keys

To create our envelopes and letter opener, we're going to use our Mailvelope extension. 

Click on "Generate Keys." Give your key a name, enter your Gmail address, and create a strong password.

![6-mailvelope-setup](https://github.com/scidsg/project-info/assets/28545431/1f12555c-bf2f-4f54-8826-22460384e2cf)

![7-generate-key](https://github.com/scidsg/project-info/assets/28545431/73eb943b-5e0a-4fcd-a159-b2b688b3ab89)

![8-key-created](https://github.com/scidsg/project-info/assets/28545431/c4450938-4ab5-4446-9202-a0c2c148838d)

### 5. Verify your email address

Before using your key, you'll have to verify your email address. Look for a message from `Mailvelope Key Server` in your Gmail inbox.

![9-verify-email](https://github.com/scidsg/project-info/assets/28545431/65e11fb4-9788-4cd2-bfe3-bebed1a1d0a1)

The message is encrypted, and when opened, you'll be prompted for your Mailvelope password to read the email. After entering your password, click the link.

![10-decrypt-message](https://github.com/scidsg/project-info/assets/28545431/6cfc1efa-ddc1-4109-b7ce-72cf996e6441)

### 6. Copy your PGP key

After confirming that your email was verified, click on the supplied URL.

![11-confirmation](https://github.com/scidsg/project-info/assets/28545431/e3a55242-d5f1-47db-947b-f75d6a55809f)

Your PGP Key is in the grey box, beginning with `-----BEGIN PGP PUBLIC KEY BLOCK-----` and ending with `-----END PGP PUBLIC KEY BLOCK-----`. Copy your entire key into a notepad for easy access.

![12-public-key](https://github.com/scidsg/project-info/assets/28545431/6ba01973-8fdc-43e1-83a4-5f9152d77a66)
![13-copy-key](https://github.com/scidsg/project-info/assets/28545431/fe400d7a-8dbd-44e4-b360-4f92839caf83)

## App Password

### 7. Create an app password

Hush Line has a mail server installed to encrypted send messages to your email address. You'll need SMTP information, as well as a password. You should never use your main account password; instead, create app-specific passwords. These are essentially purpose-made for single applications. 

From your Gmail account, click on your avatar to access your account-level options. Select `Manage Google Account`.

![14-profile-menu](https://github.com/scidsg/project-info/assets/28545431/bc6f8df3-313b-404d-8911-5fa66785eccb)

Next, click on the Security tab on the left, then scroll to the bottom of the page to find App Passwords.

![15-security](https://github.com/scidsg/project-info/assets/28545431/21cc352e-dc8d-468c-8e98-affe3a382193)
![16-app-passwords](https://github.com/scidsg/project-info/assets/28545431/ecc35f89-c513-4ac3-8e1e-65504ede406f)

Click on App Passwords, then enter a name, then click Create. A dialog will pop up with your app-specfic password. Copy it to a notepad for easy access.

![17-create-password](https://github.com/scidsg/project-info/assets/28545431/9136b863-f24c-495d-9ffa-32adfe15fa05)
![18-copy-password](https://github.com/scidsg/project-info/assets/28545431/b448db84-78e5-4194-a23e-aa62b8449661)

🎉 Congratulations, you're now ready to install Hush Line!
