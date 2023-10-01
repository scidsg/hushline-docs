# Threat Modeling

To determine the kind of installation to proceed with, first think about your use case. Are you a journalist? Educator? Employer? Is your source's physical safety in danger, or are they reporting issues, including government corruption? Or will your community members provide feedback about a product or service? 

## Low Threats

If you need a tip line and it's a relatively low-risk scenario, we recommend making it easy for your community to access your Hush Line. For example, a business owner may want to deploy to a subdomain of their primary website so that users know it's officially associated with their brand. 

A real example is Investigative Data, whose official URL is investigativedata.io with Hush Line reachable at hello.investigativedata.org.

💼 Small to medium businesses
🏫 Schoolhouses
🎈 Conference organizers

## Medium Threats

Medium threats include higher priority scenarios but might not be at the level of requiring advanced censorship circumvention techniques. In this case, you might want to deploy to a public domain. Since every deployment includes an onion address, you'll always have the option for higher-risk scenarios like public companies or government contractors.

📈 Publicly traded businesses
🩺 Law or doctor's offices
🚨 Domestic abuse hotlines

## High Threats

High threats are where someone's physical safety can be in danger. Consider a whistleblower leaking evidence of nation-state abuses or a journalist dedicated to reporting on corruption in authoritarian governments. For these cases, we recommend using a Tor-only deployment. Rather than a VPS, someone may wish to deploy to a physical device they possess, like a Raspberry Pi.

📰 Journalists
🆘 Government whistleblowers
🚔 Locations with internet censorship
