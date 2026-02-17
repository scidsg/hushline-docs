---
id: download-my-data
title: Download Your Data
sidebar_position: 9
---

Hush Line provides a self-serve mechanism to download a complete copy of your account data. No approval, delay, or support request is required.

## Access Location

Navigate to <code>Settings > Advanced</code> to find the **Download My Data** section.

![Advanced Settings](https://github.com/scidsg/hushline-screenshots/blob/main/releases/latest/artvandelay/auth-artvandelay-settings-advanced-desktop-light-fold.png?raw=true)

## What Is Included

The export is delivered as a single ZIP archive containing:

- CSV files for all conversations associated with your account  
- Message metadata necessary for independent review and auditing  
- All stored PGP-encrypted messages in their original encrypted form  

The export is comprehensive. No records are omitted, summarized, or modified.

## Optional PGP Encryption

If you have uploaded a public PGP key, encryption is enabled by default.

When enabled:

- The ZIP archive is encrypted using your public key  
- Only the corresponding private key can decrypt the contents  
- Hush Line never receives or stores your private key  

This allows secure storage or transfer of the export even if the file is copied or intercepted.
