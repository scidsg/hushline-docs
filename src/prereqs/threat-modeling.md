# Threat Modeling for Hush Line Deployment

## Introduction
The deployment of an anonymous tip line, like Hush Line, requires an understanding of the environment in which it will be used. Different organizations and individuals face unique threats, and the purpose of this guide is to help you navigate these challenges. By understanding your threat landscape, you can choose the appropriate deployment method that balances accessibility and security for your needs.

## Understanding the Threats
To select the right Hush Line deployment, consider the potential risks and consequences you or your tipsters might face:

### Low Threats
These scenarios typically involve situations where the primary risk is non-targeted threats or generic cyber threats. The fallout from a security breach is minimal. 

We recommend using a VPS and deploying Hush Line as a public domain to a URL like this: `tips.acme.com`.

#### Example Use Cases
- 💼 Small to medium businesses
- 🏫 Schoolhouses
- 🎈 Conference organizers

### Medium Threats
Here, the risks escalate. They include targeted threats but might not require advanced defense measures. 

We recommend using a VPS and deploying Hush Line as a public domain to a URL like this: `tips.acme.com`. When sharing your Hush Line address, include the onion address for people that require higher levels of anonymity.

#### Example Use Cases
- 📈 Publicly traded businesses
- 🩺 Law or doctor's offices
- 🚨 Domestic abuse hotlines

### High Threats
These are scenarios where targeted threats are likely, and consequences can be severe, like endangering someone's physical safety.

We recommend an onion-only deployment for high-threat environments using a VPS or a local device like a Raspberry Pi. If your physical safety isn't guaranteed and device confiscation is possible, you should only use a VPS, as this will provide the greatest protection for your community, tip line, and yourself.

#### Example Use Cases
- 📰 Journalists
- 🆘 Government whistleblowers
- 🚔 Locations with internet censorship

## Malicious Actors & Misinformation
Always be aware that anonymity can be a double-edged sword. While it provides protection for genuine whistleblowers, it can also shield malicious actors. Regularly vet and verify the tips you receive to guard against misinformation campaigns, especially in high-risk scenarios.