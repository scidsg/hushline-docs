# Using an existing email account

In our installation process, you created a new email account for Hush Line to use. 

We acknowledge that you may wish to use an existing email account for Hush Line. Maybe you even already have a PGP key-pair associated with an existing email address and you want Hush Line to use that. That's possible, but here are some things to consider.

## Something to consider: The email account's password

As you may remember from the Hush Line installation process, you generated an "app password" so that Hush Line could send emails from (and to) your Hush Line email account. Currently, this app password is stored (unencrypted) on your Raspberry Pi. This means that if an attacker were to be able to gain physical or network access to your Raspberry PI, they could read and steal this app password.

Crucially, your Hush Line messages would remain safely unreadable to this attacker, since all Hush Line messages are encrypted with PGP, the private key for which is not on your Raspberry Pi. 

However, if you want to use an email account for Hush Line that has other, unencrypted sensitive information in its inbox, this might be an issue.

## A way to mitigate this password issue

If you find yourself in this situation, here a setup you can take to protect your email account.

In this example, let's say that you want to use JSmith@gmail.com to read your Hush Line messages. 

1. Create a new email account for Hush Line, just as instructed in the typical installation process. In our example, let's say it's smith.tipline@gmail.com
2. When installing Hush Line and the prompt asks your for email address, enter "smith.tipline@gmail.com". Generate an app password for smith.tipline@gmail.com and provide that to Hush Line.
3. BUT, when Hush Line asks you for the URL of your public PGP key, provide the public key associated with JSmith@gmail.com.
4. Use GMail to have smith.tipline@gmail.com forward all messages to JSmith@gmail.com.

With this setup in place, here's how Hush Line will work:

* On your Hush Line form, Hush Line will display JSmith@gmail.com to community members.
* When a community member submits a Hush Line message, Hush Line will encrypt the message using the PGP key for JSmith@gmail.com, BUT Hush Line will send an email to smith.tipline@gmail.com.
* GMail will automatically forward this email to JSmith@gmail.com, where you can decrypt and read the message.

Again, the benefit here is that the app password you provided to Hush Line is for your new tipline account (an inbox where all emails are encrypted), NOT your more important JSmith@gmail.com account.


