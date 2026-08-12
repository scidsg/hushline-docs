---
id: account-verification
title: Account Verification
sidebar_position: 8
---

Account verification helps people confirm that a Hush Line tip line belongs to the person or organization it represents. Before requesting verification, complete both the offline LinkedIn check and the self-verified URL check below.

## Step 1. Add a Display Name

In **Settings > Profile**, update your Display Name for authenticity. (Changing it later will remove verified status.)

![Settings](/img/screenshots/artvandelay/auth-artvandelay-settings-profile-desktop-light-fold.png)

## Step 2. Connect With Us on LinkedIn

Connect with the Hush Line reviewer on LinkedIn from your professional account. This check happens outside Hush Line and helps us confirm the identity of the person requesting verification and, for an organization, that they are authorized to represent it.

We will coordinate the LinkedIn connection after you [contact us](https://tips.hushline.app/to/admin). You do not need to share a LinkedIn password or private message with us.

## Step 3. Publish Your Hush Line URL on Your Official Website

On a website you own or officially represent, publish a link to your exact Hush Line profile URL. The link must include `rel="me"` so Hush Line can confirm that the website and tip line refer to each other.

For example:

```html
<a href="https://tips.hushline.app/to/myaccount" rel="me">
  Message us securely on Hush Line
</a>
```

Replace the example URL with the complete URL shown on your Hush Line profile. The link text can be different, but the `href` must match your Hush Line profile URL exactly and the link must include `rel="me"`.

For an organization, publish the link on the organization's official website—not only on the requester's personal website or social profile.

## Step 4. Add the Official Page as a Self-Verified URL

In **Settings > Profile**, scroll to **Profile Details**. Add a label such as “Official website,” then enter the complete HTTPS URL of the page where you published the Hush Line link. Select **Update Bio**.

Hush Line checks that page for the matching `rel="me"` link. When the check succeeds, a checkmark appears beside the URL on your profile. This proves that the Hush Line account and the official website are under related control; it does not by itself grant the account-level Verified badge.

![Extra URL fields](/img/screenshots/artvandelay/auth-artvandelay-settings-profile-desktop-light-window-02.png)

If the checkmark does not appear, confirm that:

- you entered the exact page containing the link, not a different page on the same website;
- both URLs use the exact values shown in the browser, including capitalization and trailing slashes;
- the page is public and available over HTTPS without a redirect; and
- the `rel="me"` link is present in the page's HTML, rather than added only after JavaScript runs.

## Step 5. Request Account Verification

After completing the LinkedIn and self-verified URL checks, contact us from your Hush Line account to request review. Businesses and other organizations should have an authorized representative available.

[Verify Your Account](https://tips.hushline.app/to/admin)

![Message verification](/img/screenshots/guest/guest-profile-admin-desktop-light-fold.png)
