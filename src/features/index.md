# Hush Line's Features

## **1. PGP Email Encryption**
To enhance the security of communications, Hush Line integrates the PGP (Pretty Good Privacy) protocol. This ensures that every email message is encrypted, offering a secure channel even if the message's content becomes intercepted.

## **2. Simple, Guided Setup**
Ease of setup is paramount, and Hush Line’s installation script automates the configuration process. From package installations to system settings, the script takes care of the nuances, ensuring a hassle-free experience.

## **3. Tor-Ready**
For users who prioritize anonymity, Hush Line is equipped to function seamlessly over the Tor network. Upon setup, a hidden Tor service is established, directing traffic to the local server. This provides an onion address, allowing users to access the platform anonymously.

## **4. Automatic HTTPS Certificates**
With cyber threats on the rise, secure connections are crucial. Hush Line integrates `certbot`, automatically fetching and installing HTTPS certificates. This ensures encrypted communication between the user's browser and the Hush Line server.

## **5. Intrusion Detection**
Hush Line integrates Fail2Ban, an intrusion prevention tool, designed to scan log files for malicious activity. If any is detected, `fail2ban` imposes a temporary ban on the suspicious IP, thereby fortifying the platform against brute-force attacks.

## **6. Firewall**
The Uncomplicated Firewall (UFW) is incorporated into Hush Line's framework. This firewall tool simplifies the process of managing iptables, ensuring that only approved traffic can access the server.

## **7. Automatic Updates**
Outdated systems are a breeding ground for vulnerabilities. Hush Line leverages the `unattended-upgrades` package to automate system updates. This ensures that the system always runs the latest security patches and software versions.

## **8. IP Address Scrubbing**
Respecting user privacy, Hush Line has provisions to scrub IP addresses from incoming requests. This means that user location and network information are not stored or logged, enhancing user anonymity.

## **9. Hardened Nginx Security Headers**
The platform is served using `nginx`, and the server is configured with security-hardened headers. These headers protect users from various web vulnerabilities like cross-site scripting and clickjacking, ensuring a secure browsing experience.

## **10. No Account Needed**
Emphasizing ease of use and privacy, Hush Line eliminates the need for account creation. Users can immediately start messaging without the burden of sign-ups or the risk of personal data storage.

## **11. New Censorship-Resistance Research**
Hush Line configures a [sauteed onions](sauteed-onions.org) domain when deploying to a public website like a .com, .org, etc. Sauteed Onions is a new method for making your onion address more censorship resistant by binding it to your domain name using HTTPS certificates, creating a new domain that looks like: `addressforyouronion.acme.com`. Now, when someone uses a certificate search tool like [crt.sh](https://crt.sh/) and looks for your domain name, they'll find your onion address, too.