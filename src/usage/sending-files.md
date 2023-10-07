# Sending Files

By design, Hush Line is a text-only, one-way messenger. We've designed it this way to greatly reduce your attack surface by not opening yourself up to accepting the eventually malicious file. 

There still may be times when you want to receive files, and the best way of doing so would be to use [OnionShare](https://onionshare.org) in combination with Hush Line. 

## OnionShare

OnionShare is a free and open-source tool facilitating anonymous peer-to-peer file sharing. It creates an emphemeral onion service that someone can use to access the files you want to share. Once the information is downloaded, the service automatically disconnects, leaving no trace.

Simply select the files you want to share, click "Start Sharing," and share that address in your Hush Line message. 

<img src="../img/43-onionshare.png">

## Security

When you receive files from someone, here are a few good practices:

1. If possible, provide instructions for users to first zip, then encrypt their files with your public PGP key.
2. When you download the files, save them to an external USB drive, and never your hard drive.
3. Use a dedicated, offline-only (air-gapped) computer to open the files. 
4. Never open the files on your own computer.
