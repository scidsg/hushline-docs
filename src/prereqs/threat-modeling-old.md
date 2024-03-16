# Threat Modeling for Hush Line Deployment

## Introduction

Deploying an anonymous tip line, like Hush Line, requires understanding the environment in which it will be used. Different organizations and individuals face unique threats, and this guide aims to help you navigate these challenges. By understanding your threat landscape, you can choose the appropriate deployment method that balances accessibility and security for your needs.

## Understanding the Threats

To select the correct Hush Line deployment, consider the potential risks and consequences you or your tipsters might face:

### Low Threats

These scenarios typically involve the primary risk of non-targeted or generic cyber threats. The fallout from a security breach is minimal. 

We recommend the hosted version of Hush Line, providing an address like: `https://beta.hushline.app/submit_message/scidsg`.

#### Example Use Cases

- 💼 Small to medium businesses
- 🏫 Schoolhouses
- 🎈 Conference organizers

### Medium Threats

Here, the risks escalate. They include targeted threats but might not require advanced defense measures. 

We recommend the hosted version of Hush Line, and prominently displaying both public and onion addresses: `https://beta.hushline.app/submit_message/scidsg` and `http://fx3ewfwnufrfqbqdrbyeb6xwl736olvsfczyv5oqruehwnvk67kthsqd.onion/submit_message/scidsg`.

#### Example Use Cases

- 📈 Publicly traded businesses
- 🩺 Law or doctor's offices
- 🚨 Domestic abuse hotlines

### High Threats

These are scenarios where targeted threats are likely, and consequences can be severe, like endangering someone's physical safety.

We recommend an onion-only deployment for high-threat environments using a VPS or a local device like a Raspberry Pi. If your physical safety isn't guaranteed and device confiscation is possible, you should only use a VPS, as this will provide the greatest protection for your community, tip line, and yourself. VPS providers like [Njalla](https://njal.la) works seamlessly on Tor Browser, and accepts payments in private cryptocurrencies like ZCash and Monero.

#### Example Use Cases

- 📰 Journalists
- 🆘 Government whistleblowers
- 🚔 Locations with internet censorship

## Malicious Actors & Misinformation

If you sign up with our hosted service, we provide human-verified accounts for journalists and newsrooms, so you can have confidence that you're talking to the intended person.

For our self-hosted option, the anonymity it provides can be a double-edged sword. While it provides protection for both journalist and whistleblower, it can also shield malicious actors, as the verification system is only available on the self-hosted version. 

Whistleblowers should always verify the addresses they click on or enter into a browser, and journalists should vet the tips they receive to guard against misinformation campaigns, especially in high-risk scenarios.