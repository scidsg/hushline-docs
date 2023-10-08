# Sending Files

By design, Hush Line is a text-only, one-way messenger. We've designed it this way to greatly reduce your attack surface by not opening yourself up to accepting the eventually malicious file. 

There may still be times when you want to receive files, and the best way to do so would be to use [OnionShare](https://onionshare.org) in combination with Hush Line. 

## OnionShare

OnionShare is a free and open-source tool facilitating anonymous peer-to-peer file sharing. It creates an ephemeral onion service that someone can use to access the files you want to share. The service automatically disconnects once the information is downloaded, leaving no trace.

Simply select the files you want to share, click "Start Sharing," and share that address in your Hush Line message. Since the files are being shared directly from the computer running OnionShare, you'll have to keep the app open and the device powered on, otherwise your data will be unavailable. Choose the option to stop sharing after the files have been sent, and keep the app open. Keep in mind that the person you're trying to send a message to may not be able check their email daily, so keeping the app open, maybe for days, is a possibility. When they receive the files, the connection will automatically close. 

<img src="../img/44-onionshare.png">

## Security

When you send files to someone, here are a few good practices:

1. First zip, then encrypt your files with your recipient's public PGP key.
2. Remember to include your OnionShare address and private key in your Hush Line message.