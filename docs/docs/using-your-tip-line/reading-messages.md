---
id: reading-messages
title: Reading Messages
sidebar_position: 6
---

## Step 1. Reading Messages Using Proton

The easiest way to use Hush Line is in conjunction with Proton Mail. When you set up your account, you had the option to either paste a PGP key in to your encryption settings, or importing a key directly from Proton's keyserver. Once importing your key, you should have set up notifications. If you chose `Include Message Content` and `Encrypt Message Body` any time you receive a new Hush Line message, the encrypted contents will forward to Proton, where the key to decrypt the message already exists, and will be automatically decrypted in your inbox.

![Hush Line profile address](./proton-message.webp)

## Step 2. Reading Messages In-App Using Mailvelope

If you want to read messages directly in the Hush Line app, you should have followed [Option 2.2 in the Account Setup section of Getting Started](https://hushline.app/library/docs/getting-started/account-setup#option-22-use-with-mailvelope). When you click "Go to Message" on a tip in your inbox, you should see the red Mailvelope seal. Each field is encrypted individually, so you should see multiple seals. When you click one of the seals you'll be prompted to enter the password you created when setting up your key.

![Hush Line Message with Mailvelope](./mailvelope.webp)
