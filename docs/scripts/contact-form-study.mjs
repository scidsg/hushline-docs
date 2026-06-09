#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import * as cheerio from 'cheerio';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INPUT = path.resolve(
  SCRIPT_DIR,
  '../research/contact-form-study-2026/tranco-XLPJN-top500.csv',
);
const DEFAULT_OUTPUT = path.resolve(
  SCRIPT_DIR,
  '../static/data/contact-form-study-2026.json',
);
const CONTACT_TERMS = [
  'contact',
  'contact us',
  'customer service',
  'customer support',
  'feedback',
  'get in touch',
  'help',
  'media inquiry',
  'press',
  'report a problem',
  'send a message',
  'support',
  'tip',
];
const CONTACT_FIELD_PATTERN =
  /(message|comment|question|inquir|feedback|details|description|subject|reason|body|content|issue|request)/i;
const IDENTITY_FIELD_PATTERN =
  /(name|email|e-mail|phone|mobile|address|company|organization|organisation|account|username|member|customer|order)/i;
const HIGH_RISK_IDENTITY_PATTERN =
  /(phone|mobile|street|address|account|username|member.?id|customer.?id|order.?id|social.?security|passport|government.?id)/i;
const NON_MESSAGE_FIELD_PATTERN =
  /(captcha|recaptcha|hcaptcha|honeypot|(^|[_-])hp([_-]|$)|search)/i;
const TRACKER_HOST_PATTERNS = [
  /(^|\.)adobedtm\.com$/i,
  /(^|\.)clarity\.ms$/i,
  /(^|\.)doubleclick\.net$/i,
  /(^|\.)facebook\.net$/i,
  /(^|\.)google-analytics\.com$/i,
  /(^|\.)googletagmanager\.com$/i,
  /(^|\.)hotjar\.com$/i,
  /(^|\.)hubspot\.com$/i,
  /(^|\.)mixpanel\.com$/i,
  /(^|\.)segment\.(com|io)$/i,
  /(^|\.)sentry\.io$/i,
];
const KNOWN_MULTI_LABEL_SUFFIXES = new Set([
  'ac.uk',
  'co.jp',
  'co.nz',
  'co.uk',
  'com.au',
  'com.br',
  'com.cn',
  'com.mx',
  'com.sg',
  'edu.au',
  'gov.uk',
  'net.au',
  'org.au',
  'org.uk',
]);

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    limit: 500,
    concurrency: 8,
    timeoutMs: 12000,
    chromeUrl: 'http://127.0.0.1:9222',
    browserChecks: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];
    if (current === '--input' && next) args.input = next;
    if (current === '--output' && next) args.output = next;
    if (current === '--limit' && next) args.limit = Number(next);
    if (current === '--concurrency' && next) args.concurrency = Number(next);
    if (current === '--timeout-ms' && next) args.timeoutMs = Number(next);
    if (current === '--chrome-url' && next) args.chromeUrl = next;
    if (current === '--no-browser-checks') args.browserChecks = false;
    if (current !== '--no-browser-checks' && current.startsWith('--')) index += 1;
  }
  return args;
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function registrableDomain(hostname) {
  const labels = hostname.toLowerCase().replace(/\.$/, '').split('.');
  if (labels.length <= 2) return labels.join('.');
  const lastTwo = labels.slice(-2).join('.');
  if (KNOWN_MULTI_LABEL_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    return labels.slice(-3).join('.');
  }
  return lastTwo;
}

function sameParty(firstUrl, secondUrl) {
  try {
    return (
      registrableDomain(new URL(firstUrl).hostname) ===
      registrableDomain(new URL(secondUrl).hostname)
    );
  } catch {
    return false;
  }
}

function normalizeSpace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function contactScore(text, href) {
  const value = `${normalizeSpace(text)} ${href}`.toLowerCase();
  let score = 0;
  for (const term of CONTACT_TERMS) {
    if (value.includes(term)) score += term === 'contact' ? 8 : 4;
  }
  if (/\/(contact|support|feedback|help)(\/|$|\?)/i.test(href)) score += 10;
  if (/privacy|terms|careers|jobs|login|signin|signup|register/i.test(value)) score -= 8;
  if (/mailto:|tel:|javascript:/i.test(href)) score -= 20;
  return score;
}

function trackerHosts(urls) {
  const hosts = new Set();
  for (const value of urls) {
    try {
      const hostname = new URL(value).hostname;
      if (TRACKER_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
        hosts.add(hostname);
      }
    } catch {
      // Ignore malformed URLs.
    }
  }
  return [...hosts].sort();
}

function parseCsp(headers) {
  const csp = headers['content-security-policy'] ?? '';
  const directives = new Map();
  for (const segment of csp.split(';')) {
    const [name, ...values] = segment.trim().split(/\s+/);
    if (name) directives.set(name.toLowerCase(), values);
  }
  return {
    present: Boolean(csp),
    formAction: directives.has('form-action'),
    frameAncestors: directives.has('frame-ancestors'),
    raw: csp,
  };
}

function inspectForm($, element, pageUrl, pageLooksContact) {
  const form = $(element);
  const fields = form.find('input, textarea, select').toArray().map((field) => {
    const node = $(field);
    const id = node.attr('id');
    const label = id
      ? normalizeSpace(
          $('label')
            .filter((_, candidate) => $(candidate).attr('for') === id)
            .first()
            .text(),
        )
      : normalizeSpace(node.closest('label').text());
    return {
      tag: field.tagName?.toLowerCase() ?? '',
      type: (node.attr('type') ?? '').toLowerCase(),
      name: node.attr('name') ?? '',
      id: id ?? '',
      label,
      placeholder: node.attr('placeholder') ?? '',
      required: node.is('[required]') || node.attr('aria-required') === 'true',
    };
  });
  const visibleFieldText = fields
    .filter((field) => field.type !== 'hidden')
    .map((field) =>
      [field.name, field.id, field.label, field.placeholder, field.type].join(' '),
    )
    .join(' ');
  const actionValue = form.attr('action') || pageUrl;
  const isSearchForm =
    /(^|[/?#&])(search|query)([/=?&#]|$)/i.test(actionValue) ||
    fields.some(
      (field) =>
        field.type === 'search' ||
        (/^(q|query|search|searchterm|search_term)$/i.test(field.name) &&
          !CONTACT_FIELD_PATTERN.test(visibleFieldText)),
    );
  const hasFreeformField = fields.some((field) => {
    const key = [field.name, field.id, field.label, field.placeholder].join(' ');
    if (NON_MESSAGE_FIELD_PATTERN.test(key)) return false;
    return field.tag === 'textarea';
  });
  const hasMessageField =
    !isSearchForm &&
    hasFreeformField &&
    (CONTACT_FIELD_PATTERN.test(visibleFieldText) || pageLooksContact);
  let action = pageUrl;
  try {
    action = new URL(actionValue, pageUrl).href;
  } catch {
    // Retain page URL for malformed or script-owned actions.
  }
  const requiredIdentity = fields
    .filter(
      (field) =>
        field.required &&
        IDENTITY_FIELD_PATTERN.test(
          [field.name, field.id, field.label, field.placeholder, field.type].join(
            ' ',
          ),
        ),
    )
    .map((field) => field.name || field.id || field.type || field.label);
  const requiredHighRiskIdentity = fields
    .filter(
      (field) =>
        field.required &&
        HIGH_RISK_IDENTITY_PATTERN.test(
          [field.name, field.id, field.label, field.placeholder].join(' '),
        ),
    )
    .map((field) => field.name || field.id || field.label);
  return {
    action,
    method: (form.attr('method') || 'get').toLowerCase(),
    hasMessageField,
    fieldCount: fields.length,
    requiredFieldCount: fields.filter((field) => field.required).length,
    requiredIdentity,
    requiredHighRiskIdentity,
    fields,
  };
}

function inspectHtml(html, pageUrl, headers) {
  const $ = cheerio.load(html);
  const pageText = normalizeSpace($('body').text()).toLowerCase();
  const pageLooksContact =
    /\/(contact|support|feedback|help|report|tip)(\/|$|\?)/i.test(pageUrl) ||
    /\b(contact us|contact support|send (us )?a message|get in touch|submit feedback)\b/i.test(
      `${$('title').text()} ${$('h1').first().text()}`,
    );
  const links = $('a[href]')
    .toArray()
    .map((element) => {
      const href = $(element).attr('href') ?? '';
      let url = '';
      try {
        url = new URL(href, pageUrl).href;
      } catch {
        return null;
      }
      return {
        text: normalizeSpace($(element).text()),
        url,
        score: contactScore($(element).text(), href),
      };
    })
    .filter(Boolean)
    .filter((link) => /^https?:/i.test(link.url))
    .sort((left, right) => right.score - left.score);
  const forms = $('form')
    .toArray()
    .map((element) => inspectForm($, element, pageUrl, pageLooksContact))
    .filter((form) => form.hasMessageField);
  const scripts = $('script[src]')
    .toArray()
    .map((element) => {
      try {
        return new URL($(element).attr('src'), pageUrl).href;
      } catch {
        return '';
      }
    })
    .filter(Boolean);
  const iframes = $('iframe[src]')
    .toArray()
    .map((element) => {
      const node = $(element);
      try {
        return {
          src: new URL(node.attr('src'), pageUrl).href,
          title: normalizeSpace(node.attr('title')),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const csp = parseCsp(headers);
  return {
    links,
    forms,
    scripts,
    iframes,
    trackerHosts: trackerHosts(scripts),
    thirdPartyScriptHosts: [
      ...new Set(
        scripts
          .filter((url) => !sameParty(pageUrl, url))
          .map((url) => new URL(url).hostname),
      ),
    ].sort(),
    csp,
    privacyLink: links.some((link) => /privacy|data protection/i.test(link.text)),
    retentionDisclosure: /\b(retain|retention|delete|deletion|stored for)\b/i.test(
      pageText,
    ),
    encryptionDisclosure:
      /\b(end-to-end encrypt|client-side encrypt|encrypted in (your|the) browser|encrypt(ed)? before (it|the message|your message) (leaves|is sent)|recipient.?s public key)\b/i.test(
        pageText,
      ),
  };
}

async function fetchPage(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.8',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      },
    });
    const contentType = response.headers.get('content-type') ?? '';
    const headers = Object.fromEntries(
      [...response.headers.entries()].map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    );
    if (!contentType.includes('text/html')) {
      return {
        ok: false,
        status: response.status,
        finalUrl: response.url,
        error: `non-html:${contentType || 'unknown'}`,
        headers,
      };
    }
    const html = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      html,
      headers,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      finalUrl: url,
      error: error.name === 'AbortError' ? 'timeout' : normalizeSpace(error.message),
      headers: {},
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverDomain(entry, timeoutMs) {
  const startedAt = Date.now();
  let homepage = await fetchPage(`https://${entry.domain}/`, timeoutMs);
  if (!homepage.ok && homepage.status === null) {
    homepage = await fetchPage(`http://${entry.domain}/`, timeoutMs);
  }
  const result = {
    rank: entry.rank,
    domain: entry.domain,
    homepage: {
      status: homepage.status,
      finalUrl: homepage.finalUrl,
      error: homepage.error ?? null,
    },
    contactPage: null,
    form: null,
    discovery: 'none',
    selectedContactLink: null,
    browserCheck: null,
    elapsedMs: 0,
  };
  if (!homepage.ok || !homepage.html) {
    result.elapsedMs = Date.now() - startedAt;
    return result;
  }

  const homepageInspection = inspectHtml(
    homepage.html,
    homepage.finalUrl,
    homepage.headers,
  );
  let contactPage = homepage;
  let contactInspection = homepageInspection;
  let discovery = homepageInspection.forms.length ? 'homepage-form' : 'none';
  if (!homepageInspection.forms.length) {
    const candidate = homepageInspection.links.find(
      (link) => link.score > 0 && sameParty(homepage.finalUrl, link.url),
    );
    const externalCandidate = homepageInspection.links.find(
      (link) => link.score >= 8,
    );
    const selected = candidate ?? externalCandidate;
    if (selected) {
      result.selectedContactLink = selected.url;
      const fetched = await fetchPage(selected.url, timeoutMs);
      if (fetched.ok && fetched.html) {
        contactPage = fetched;
        contactInspection = inspectHtml(
          fetched.html,
          fetched.finalUrl,
          fetched.headers,
        );
        discovery = 'contact-link';
      }
    }
  }

  let form = contactInspection.forms[0] ?? null;
  if (!form) {
    const likelyIframe = contactInspection.iframes.find((iframe) =>
      /contact|support|feedback|form|message|inquir|help|report|tip/i.test(
        `${iframe.src} ${iframe.title}`,
      ),
    );
    if (likelyIframe) {
      const fetched = await fetchPage(likelyIframe.src, timeoutMs);
      if (fetched.ok && fetched.html) {
        const iframeInspection = inspectHtml(
          fetched.html,
          fetched.finalUrl,
          fetched.headers,
        );
        if (iframeInspection.forms.length) {
          contactPage = fetched;
          contactInspection = iframeInspection;
          form = iframeInspection.forms[0];
          discovery = 'contact-iframe';
        }
      }
    }
  }

  result.discovery = discovery;
  result.contactPage = {
    status: contactPage.status,
    finalUrl: contactPage.finalUrl,
    https: contactPage.finalUrl.startsWith('https://'),
    samePartyAsHomepage: sameParty(homepage.finalUrl, contactPage.finalUrl),
    csp: contactInspection.csp,
    thirdPartyScriptHosts: contactInspection.thirdPartyScriptHosts,
    trackerHosts: contactInspection.trackerHosts,
    privacyLink: contactInspection.privacyLink,
    retentionDisclosure: contactInspection.retentionDisclosure,
    encryptionDisclosure: contactInspection.encryptionDisclosure,
  };
  if (form) {
    result.form = {
      ...form,
      httpsAction: form.action.startsWith('https://'),
      samePartyAction: sameParty(contactPage.finalUrl, form.action),
    };
    result.formFingerprint = hash(
      [
        contactPage.finalUrl,
        form.action,
        form.method,
        ...form.fields.map((field) =>
          [field.tag, field.type, field.name, field.id].join(':'),
        ),
      ].join('|'),
    );
  }
  result.elapsedMs = Date.now() - startedAt;
  return result;
}

class CdpConnection {
  constructor(webSocketUrl) {
    this.socket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, {once: true});
      this.socket.addEventListener('error', reject, {once: true});
    });
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const {resolve, reject} = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result ?? {});
        return;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  async send(method, params = {}, sessionId = undefined) {
    await this.ready;
    const id = this.nextId;
    this.nextId += 1;
    const payload = {id, method, params};
    if (sessionId) payload.sessionId = sessionId;
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, {resolve, reject});
    });
    this.socket.send(JSON.stringify(payload));
    return promise;
  }

  onMessage(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    this.socket.close();
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function browserCanaryCheck(cdp, record) {
  if (!record.contactPage?.finalUrl) return null;
  const {targetId} = await cdp.send('Target.createTarget', {url: 'about:blank'});
  const {sessionId} = await cdp.send('Target.attachToTarget', {
    targetId,
    flatten: true,
  });
  const requests = [];
  const contexts = new Map();
  const removeListener = cdp.onMessage((message) => {
    if (message.sessionId !== sessionId) return;
    if (message.method === 'Network.requestWillBeSent') {
      requests.push({
        ...message.params.request,
        frameId: message.params.frameId,
        resourceType: message.params.type,
      });
    }
    if (message.method === 'Runtime.executionContextCreated') {
      const context = message.params.context;
      if (context.auxData?.isDefault) {
        contexts.set(context.auxData.frameId, context.id);
      }
    }
  });

  try {
    await Promise.all([
      cdp.send('Page.enable', {}, sessionId),
      cdp.send('Runtime.enable', {}, sessionId),
      cdp.send('Network.enable', {}, sessionId),
    ]);
    await cdp.send(
      'Page.navigate',
      {url: record.contactPage.finalUrl},
      sessionId,
    );
    await sleep(5000);
    const frameTree = await cdp.send('Page.getFrameTree', {}, sessionId);
    const frameIds = [];
    const collectFrames = (node) => {
      frameIds.push(node.frame.id);
      for (const child of node.childFrames ?? []) collectFrames(child);
    };
    collectFrames(frameTree.frameTree);
    const token = `HL-CANARY-${hash(`${record.rank}:${record.domain}`)}`;
    const syntheticEmail = `contact-form-study+${hash(record.domain)}@example.com`;
    const syntheticName = 'Contact Form Study';
    const syntheticPhone = '2025550147';
    const canaryValues = {
      message: token,
      email: syntheticEmail,
      name: syntheticName,
      phone: syntheticPhone,
    };
    const encodedTokens = Object.entries(canaryValues).flatMap(([type, value]) =>
      [
        value,
        encodeURIComponent(value),
        Buffer.from(value).toString('base64'),
      ].map((encoded) => ({type, encoded})),
    );
    const before = requests.length;
    let filledFieldCount = 0;
    let formContextUrl = null;
    let formFrameId = null;

    for (const frameId of frameIds) {
      const contextId = contexts.get(frameId);
      if (!contextId) continue;
      try {
        const evaluated = await cdp.send(
          'Runtime.evaluate',
          {
            contextId,
            returnByValue: true,
            expression: `(() => {
              const contactPattern = ${CONTACT_FIELD_PATTERN.toString()};
              const identityPattern = ${IDENTITY_FIELD_PATTERN.toString()};
              const highRiskIdentityPattern = ${HIGH_RISK_IDENTITY_PATTERN.toString()};
              const nonMessagePattern = ${NON_MESSAGE_FIELD_PATTERN.toString()};
              const pageLooksContact =
                /\\/(contact|support|feedback|help|report|tip)(\\/|$|\\?)/i.test(location.href) ||
                /\\b(contact us|contact support|send (us )?a message|get in touch|submit feedback)\\b/i.test(
                  [document.title, document.querySelector('h1')?.textContent].join(' ')
                );
              const forms = [...document.forms];
              const form = forms.find((candidate) => {
                const fields = [...candidate.querySelectorAll('input, textarea, select')];
                const visibleFields = fields.filter(
                  (field) => (field.type || '').toLowerCase() !== 'hidden'
                );
                const isSearch = visibleFields.some((field) =>
                  (field.type || '').toLowerCase() === 'search' ||
                  /^(q|query|search|searchterm|search_term)$/i.test(field.name || '')
                );
                if (isSearch) return false;
                const freeformFields = visibleFields.filter((field) => {
                  const key = [
                    field.name,
                    field.id,
                    field.placeholder,
                    field.closest('label')?.textContent,
                  ].join(' ');
                  if (nonMessagePattern.test(key)) return false;
                  return field.tagName === 'TEXTAREA';
                });
                return freeformFields.length > 0 && (
                  visibleFields.some((field) => contactPattern.test(
                  [field.name, field.id, field.placeholder,
                   field.closest('label')?.textContent].join(' ')
                  )) || pageLooksContact
                );
              });
              if (!form) return {found: false, url: location.href, count: 0};
              const fields = [...form.querySelectorAll('input, textarea, select')].map(
                (field) => {
                  const key = [
                    field.name,
                    field.id,
                    field.placeholder,
                    field.type,
                    field.closest('label')?.textContent,
                  ].join(' ');
                  const required =
                    field.required || field.getAttribute('aria-required') === 'true';
                  return {
                    tag: field.tagName.toLowerCase(),
                    type: (field.type || '').toLowerCase(),
                    name: field.name || '',
                    id: field.id || '',
                    label: (field.closest('label')?.textContent || '').trim(),
                    placeholder: field.placeholder || '',
                    required,
                    identity: required && identityPattern.test(key),
                    highRiskIdentity:
                      required && highRiskIdentityPattern.test(key),
                  };
                }
              );
              const setValue = (field, value) => {
                const prototype = field instanceof HTMLTextAreaElement
                  ? HTMLTextAreaElement.prototype
                  : HTMLInputElement.prototype;
                const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
                descriptor?.set?.call(field, value);
                field.dispatchEvent(new Event('input', {bubbles: true}));
                field.dispatchEvent(new Event('change', {bubbles: true}));
                field.dispatchEvent(new Event('blur', {bubbles: true}));
              };
              let count = 0;
              for (const field of form.querySelectorAll('input, textarea')) {
                const type = (field.type || '').toLowerCase();
                if (field.disabled || field.readOnly ||
                    ['hidden', 'submit', 'button', 'reset', 'file', 'password',
                     'checkbox', 'radio'].includes(type)) continue;
                const key = [field.name, field.id, field.placeholder, type].join(' ');
                let value = '${token}';
                if (type === 'email' || /email|e-mail/i.test(key)) {
                  value = '${syntheticEmail}';
                } else if (type === 'tel' || /phone|mobile/i.test(key)) {
                  value = '${syntheticPhone}';
                } else if (/name/i.test(key)) {
                  value = '${syntheticName}';
                }
                setValue(field, value);
                count += 1;
              }
              return {
                found: true,
                url: location.href,
                count,
                form: {
                  action: form.action || location.href,
                  method: (form.method || 'get').toLowerCase(),
                  fields,
                },
              };
            })()`,
          },
          sessionId,
        );
        if (evaluated.result?.value?.found) {
          filledFieldCount = evaluated.result.value.count;
          formContextUrl = evaluated.result.value.url;
          formFrameId = frameId;
          const renderedForm = evaluated.result.value.form;
          record.form = {
            action: renderedForm.action,
            method: renderedForm.method,
            hasMessageField: true,
            fieldCount: renderedForm.fields.length,
            requiredFieldCount: renderedForm.fields.filter(
              (field) => field.required,
            ).length,
            requiredIdentity: renderedForm.fields
              .filter((field) => field.identity)
              .map((field) => field.name || field.id || field.type || field.label),
            requiredHighRiskIdentity: renderedForm.fields
              .filter((field) => field.highRiskIdentity)
              .map((field) => field.name || field.id || field.label),
            fields: renderedForm.fields.map(
              ({identity, highRiskIdentity, ...field}) => field,
            ),
            httpsAction: renderedForm.action.startsWith('https://'),
            samePartyAction: sameParty(
              evaluated.result.value.url,
              renderedForm.action,
            ),
          };
          record.formFingerprint = hash(
            [
              evaluated.result.value.url,
              renderedForm.action,
              renderedForm.method,
              ...renderedForm.fields.map((field) =>
                [field.tag, field.type, field.name, field.id].join(':'),
              ),
            ].join('|'),
          );
          break;
        }
      } catch {
        // Cross-origin and transient frames may disappear during inspection.
      }
    }

    if (formContextUrl) await sleep(3500);
    const postInputRequests = requests.slice(before);
    const canaryRequests = postInputRequests.filter((request) => {
      const haystack = `${request.url}\n${request.postData ?? ''}`;
      return encodedTokens.some((candidate) =>
        haystack.includes(candidate.encoded),
      );
    });
    const thirdPartyCanaryHosts = [
      ...new Set(
        canaryRequests
          .filter((request) => !sameParty(formContextUrl, request.url))
          .map((request) => new URL(request.url).hostname)
          .filter(Boolean),
      ),
    ].sort();
    const renderedScriptHosts = [
      ...new Set(
        requests
          .filter(
            (request) =>
              request.resourceType === 'Script' &&
              request.frameId === formFrameId &&
              !sameParty(formContextUrl, request.url),
          )
          .map((request) => new URL(request.url).hostname)
          .filter(Boolean),
      ),
    ].sort();
    if (!formContextUrl) {
      record.form = null;
      record.formFingerprint = null;
    }
    return {
      tested: filledFieldCount > 0,
      filledFieldCount,
      formContextUrl,
      crossOriginIsolatedFrame:
        Boolean(formContextUrl) &&
        !sameParty(record.contactPage.finalUrl, formContextUrl),
      thirdPartyScriptHosts: renderedScriptHosts,
      observedRequestCountAfterInput: postInputRequests.length,
      canaryRequestCount: canaryRequests.length,
      canaryHosts: [
        ...new Set(canaryRequests.map((request) => new URL(request.url).hostname)),
      ].sort(),
      canaryRequests: canaryRequests.map((request) => {
        const url = new URL(request.url);
        const haystack = `${request.url}\n${request.postData ?? ''}`;
        return {
          host: url.hostname,
          path: url.pathname,
          method: request.method,
          resourceType: request.resourceType,
          matchedCanaryTypes: [
            ...new Set(
              encodedTokens
                .filter((candidate) => haystack.includes(candidate.encoded))
                .map((candidate) => candidate.type),
            ),
          ],
        };
      }),
      thirdPartyCanaryHosts,
      leakedBeforeSubmit: thirdPartyCanaryHosts.length > 0,
    };
  } catch (error) {
    record.form = null;
    record.formFingerprint = null;
    return {
      tested: false,
      error: normalizeSpace(error.message),
      leakedBeforeSubmit: null,
    };
  } finally {
    removeListener();
    await cdp.send('Target.closeTarget', {targetId}).catch(() => {});
  }
}

function scoreRecord(record) {
  if (!record.form) {
    return {
      assessed: false,
      secure: null,
      baselineTransport: null,
      privacyRespecting: null,
      hardened: null,
      criteria: {},
    };
  }
  const criteria = {
    httpsPage: record.contactPage.https,
    postMethod: record.form.method === 'post',
    httpsAction: record.form.httpsAction,
    noThirdPartyScripts:
      record.browserCheck?.tested === true
        ? record.browserCheck.thirdPartyScriptHosts.length === 0
        : record.contactPage.thirdPartyScriptHosts.length === 0,
    noObservedPreSubmitLeak:
      record.browserCheck?.tested === true &&
      record.browserCheck?.leakedBeforeSubmit === false,
    noRequiredHighRiskIdentity:
      record.form.requiredHighRiskIdentity.length === 0,
    cspPresent: record.contactPage.csp.present,
    cspRestrictsFormAction: record.contactPage.csp.formAction,
    cspRestrictsFraming: record.contactPage.csp.frameAncestors,
    privacyNoticeLinked: record.contactPage.privacyLink,
    retentionDisclosed: record.contactPage.retentionDisclosure,
    encryptionDisclosed: record.contactPage.encryptionDisclosure,
  };
  const baselineTransport =
    criteria.httpsPage && criteria.postMethod && criteria.httpsAction;
  const privacyRespecting =
    baselineTransport &&
    criteria.noThirdPartyScripts &&
    criteria.noObservedPreSubmitLeak &&
    criteria.noRequiredHighRiskIdentity;
  const hardened =
    privacyRespecting &&
    criteria.cspPresent &&
    criteria.cspRestrictsFormAction &&
    criteria.cspRestrictsFraming;
  const secure =
    hardened &&
    criteria.retentionDisclosed &&
    criteria.encryptionDisclosed;
  return {
    assessed: true,
    secure,
    baselineTransport,
    privacyRespecting,
    hardened,
    criteria,
  };
}

function aggregate(records) {
  const assessed = records.filter((record) => record.score.assessed);
  const uniqueAssessedByFingerprint = new Map();
  for (const record of assessed) {
    const fingerprint = record.formFingerprint ?? `rank:${record.rank}`;
    if (!uniqueAssessedByFingerprint.has(fingerprint)) {
      uniqueAssessedByFingerprint.set(fingerprint, record);
    }
  }
  const uniqueAssessed = [...uniqueAssessedByFingerprint.values()];
  const count = (predicate) => uniqueAssessed.filter(predicate).length;
  const percentage = (numerator, denominator = uniqueAssessed.length) =>
    denominator ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
  const criterionCounts = {};
  for (const key of Object.keys(assessed[0]?.score.criteria ?? {})) {
    const passing = count((record) => record.score.criteria[key] === true);
    const known = count(
      (record) =>
        record.score.criteria[key] === true ||
        record.score.criteria[key] === false,
    );
    criterionCounts[key] = {
      passing,
      known,
      percent: percentage(passing, known),
    };
  }
  const secure = count((record) => record.score.secure);
  const browserTested = count((record) => record.browserCheck?.tested);
  const leaked = count((record) => record.browserCheck?.leakedBeforeSubmit);
  return {
    rankedDomains: records.length,
    reachableHomepages: records.filter(
      (record) =>
        record.homepage.status >= 200 && record.homepage.status < 400,
    ).length,
    domainsWithAssessedForms: assessed.length,
    assessedForms: uniqueAssessed.length,
    secureForms: secure,
    securePercent: percentage(secure),
    baselineTransportPercent: percentage(
      count((record) => record.score.baselineTransport),
    ),
    privacyRespectingPercent: percentage(
      count((record) => record.score.privacyRespecting),
    ),
    hardenedPercent: percentage(
      count((record) => record.score.hardened),
    ),
    browserTested,
    observedPreSubmitLeaks: leaked,
    observedPreSubmitLeakPercent: percentage(leaked, browserTested),
    criterionCounts,
  };
}

async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(
    Array.from({length: Math.min(concurrency, items.length)}, () => worker()),
  );
  return results;
}

async function loadRanking(filename, limit) {
  const csv = await fs.readFile(filename, 'utf8');
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(0, limit)
    .map((line) => {
      const [rank, domain] = line.split(',');
      return {rank: Number(rank), domain};
    });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ranking = await loadRanking(args.input, args.limit);
  console.log(
    `Discovering contact forms on ${ranking.length} ranked domains with concurrency ${args.concurrency}.`,
  );
  const records = await mapConcurrent(
    ranking,
    args.concurrency,
    async (entry, index) => {
      const result = await discoverDomain(entry, args.timeoutMs);
      const marker = result.form ? 'form' : result.homepage.status ?? 'error';
      console.log(`[${index + 1}/${ranking.length}] ${entry.domain}: ${marker}`);
      return result;
    },
  );

  if (args.browserChecks) {
    const versionResponse = await fetch(`${args.chromeUrl}/json/version`);
    if (!versionResponse.ok) {
      throw new Error(`Chrome DevTools unavailable at ${args.chromeUrl}`);
    }
    const version = await versionResponse.json();
    const cdp = new CdpConnection(version.webSocketDebuggerUrl);
    await cdp.ready;
    try {
      const candidateRecords = records.filter(
        (record) =>
          record.contactPage &&
          (record.form || record.discovery === 'contact-link'),
      );
      console.log(
        `Running rendered-form and non-submitting canary checks on ${candidateRecords.length} candidate pages.`,
      );
      let completedChecks = 0;
      await mapConcurrent(candidateRecords, 4, async (record) => {
        record.browserCheck = await browserCanaryCheck(cdp, record);
        completedChecks += 1;
        console.log(
          `[canary ${completedChecks}/${candidateRecords.length}] ${record.domain}: ${
            record.browserCheck?.tested ? 'tested' : 'not-tested'
          }`,
        );
        return record;
      });
    } finally {
      cdp.close();
    }
  }

  for (const record of records) record.score = scoreRecord(record);
  const output = {
    metadata: {
      studyVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      ranking: {
        provider: 'Tranco',
        listId: 'XLPJN',
        generatedOn: '2026-06-07',
        sourceUrl: 'https://tranco-list.eu/list/XLPJN',
        rankRange: [1, ranking.length],
      },
      protocol: {
        submittedForms: false,
        captchaBypass: false,
        maximumPagesPerDomain: 2,
        syntheticCanaryDomain: 'example.com',
      },
    },
    summary: aggregate(records),
    records,
  };
  await fs.mkdir(path.dirname(args.output), {recursive: true});
  await fs.writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${args.output}`);
  console.log(JSON.stringify(output.summary, null, 2));
}

await main();
