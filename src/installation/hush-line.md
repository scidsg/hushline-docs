# Installing Hush Line

## What you'll need to know for this step

Here is the information you'll need (all of which you should have at this point):
* Your Hush Line email address
* Your app password
* Your public PGP key

### 1. Open The Terminal

On a Mac, open Spotlight search by pressing CMD + Space. Enter "Terminal" and select the application with the same name. 

Enter `ssh hush@hushline.local`, and when prompted, enter the password you created in the first step.

![21-terminal-login](https://github.com/scidsg/project-info/assets/28545431/013192bc-3046-40ce-8335-7021d562a64c)

### 2. Start the script

Once logged in, enter `sudo su` then `curl -sSL https://install.hushline.app | bash` to start the installation.

![21-terminal](https://github.com/scidsg/project-info/assets/28545431/e2729634-6ee7-42bd-8736-d10ef1c4896c)
![22-install-hushline](https://github.com/scidsg/project-info/assets/28545431/1c4b9fa3-758f-4305-ad98-335d761ba508)
![23-prompt](https://github.com/scidsg/project-info/assets/28545431/ed5bf0d1-5a0b-4fa8-8bfa-870504dfc271)

### 3. Add your information

The installer will walk you through everything needed to get Hush Line working. We'll need the following information:

- Gmail address
- SMTP address: smtp.gmail.com
- App password (from prerequisites)
- Port: 465
- Public PGP key (from prerequisites)

When you reach the step to enter your PGP key, after pasting make sure to type "END" on a new line, then press Enter.

![23-key](https://github.com/scidsg/project-info/assets/28545431/920453e9-8bf9-4a40-bb1c-b9f2be095519)

Once the installation completes, you'll see a message that looks like this:
```
✅ Installation complete!

Hush Line is a product by Science & Design.
Learn more about us at https://scidsg.org.
Have feedback? Send us an email at hushline@scidsg.org.

• Hush Line is running
http://5450rww63n5yvp5xzojb41rcx63g3pwaig63ezwp×5x75igzh×4w6qyd…onion
```

![24-finished](https://github.com/scidsg/project-info/assets/28545431/63625c47-a4cf-4195-ba6a-3930c4592fbb)



