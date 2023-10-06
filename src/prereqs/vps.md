# VPS Prerequisites 

In this section, you'll need the following things to get Hush Line ready to install:

1. Debit or credit card
2. Digital Ocean, or any other VPS provider

## Digital Ocean

Digital Ocean is an infrastructure service provider that provides a cost-effective way to create your first virtual private server (VPS).

### 1. Create an Account

Go to [digitalocean.com](digitalocean.com) and create an account. You'll need to enter payment information before you can create a VPS.

<img src="../img/29-digital-ocean.png">

### 2. Create a VPS

Digital Ocean calls their VPS option Droplets. To create a droplet click the green "Create" button at the top of the screen, the click "Droplets."

<img src="../img/30-new-droplet.png">

You can configure your server to your desired specifications, but for this guide, we'll choose the following options:

- Location: San Francisco
- Image: Debian 12
- Size: Basic
- CPU: Regular SSD @ $4/mo

Create a strong password, then click "Create Droplet."

<img src="../img/31-create-droplet.png">

After a minute or two, your Droplet should be ready. The "Resources" tab should be visible, and just below, you'll see the IP address for your Droplet.

<img src="../img/32-droplet.png">

### 3. Log In

On a Mac, open Spotlight search by pressing CMD + Space. Enter "Terminal" and select the application with the same name. 

Enter `ssh root@<IP Address>`, and when prompted, enter the password you created in the second step.

<img src="../img/33-terminal.png">

🎉 Congratulations, you're now ready to install Hush Line on Digital Ocean!