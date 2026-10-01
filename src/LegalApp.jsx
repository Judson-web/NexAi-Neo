import React from "react";

const services={
  "kingshot-manual":{label:"Kingshot Manual Redeemer",summary:"Manual gift-code redemption for a Kingshot Player ID."},
  "kingshot-auto":{label:"Kingshot Auto Redeem",summary:"Registration and automatic processing of active Kingshot gift codes."},
};

export default function LegalApp({type}){
  const key=new URLSearchParams(location.search).get("service");
  const service=services[key]||services["kingshot-manual"];
  const privacy=type==="privacy";
  const base="/";
  const serviceKey=key||"kingshot-manual";
  return <div className="app legal-app">
    <header>
      <a className="brand" href={base}><span className="brand-mark">{"K"}</span><span>{privacy?"Privacy":"Terms"} · {service.label}</span></a>
      <div className="header-right"><a className="legal-back" href={base}>← Back</a></div>
    </header>
    <main>
      <section className="legal-hero">
        <div className="eyebrow"><span/>{privacy?"PRIVACY NOTICE":"TERMS OF USE"}</div>
        <h1>{privacy?"Privacy, made clear.":"Terms, without the clutter."}</h1>
        <p className="hero-copy">{service.summary}</p>
        <div className="legal-tabs"><a className={!privacy?"active":""} href={"/terms?service="+serviceKey}>Terms</a><a className={privacy?"active":""} href={"/privacy?service="+serviceKey}>Privacy</a></div>
      </section>
      <section className="legal-body">
        <h2>Accessibility</h2>
        <p>We aim to make this site usable with keyboard navigation, readable text, clear labels, responsive layouts, and reduced-motion preferences where practical. Some features depend on third-party services or browser capabilities and may not provide the same accessibility experience. If you encounter an accessibility barrier, you can contact the site operator with the page and feature involved so it can be reviewed.</p>

        <h2>About this service</h2>
        <p>This is an independent community project created and operated by Judson. It is not operated, sponsored, endorsed, or affiliated with Century Games, Kingshot, Discord, or any other platform referenced by the tools.</p>

        {privacy?<><h2>What we handle</h2>
        <p>The Kingshot services may process the information needed to provide their features. Depending on the service, this can include Player ID, kingdom ID, player name, avatar URL, submitted gift codes, redemption results, timestamps, and support requests. Auto Redeem also keeps the registration state and processing history needed to prevent duplicate work, track redemption outcomes, and operate the service reliably. The auto-redeem service stores registered player information so scheduled processing can work after you leave the site. Input fields use client-side format checks to catch common mistakes before submission. These checks are a convenience feature, not a privacy or security boundary; the service may also validate submitted data server-side before processing it.</p>
        }        <h2>Support requests</h2>
        <p>If you submit a request to remove an auto-redeem registration, the Player ID and the reason you provide are processed so an administrator can review the request. Do not include passwords, payment details, authentication codes, or other sensitive information in a support request.</p>
        <h2>Advertising and measurement</h2>
        <p>Some pages may display sponsored banner advertisements. The service records basic ad delivery measurements such as impressions and clicks. Clicking an advertisement may pass through this service's tracking endpoint before you are sent to the advertiser's destination URL. The advertiser's own privacy practices apply after you leave this service.</p>
        <h2>Technical information</h2>
        <p>Like most web services, requests may be processed by hosting, database, security, analytics, or other infrastructure providers needed to operate the service. These providers may process technical information such as IP address, request metadata, device or browser information, and timestamps as part of normal operation, security, reliability, and abuse prevention. Public announcement content and other site content may also be fetched by your browser from the service infrastructure.</p>
        <h2>Retention and removal</h2>
        <p>Information is retained only as needed to operate the relevant feature, maintain security, resolve support issues, or keep necessary service records. Redemption and operational records may be retained after a player registration is removed when they are needed for auditing, duplicate prevention, abuse prevention, troubleshooting, or service integrity. For an auto-redeem registration, you can use the removal request form on the Auto Redeem page. A removal request does not necessarily erase records that must be retained for security, fraud prevention, accounting, or legal reasons.</p>
        <h2>Third-party services</h2>
        <p>The tools may interact with third-party services and APIs, including game services, hosting infrastructure, databases, content delivery networks, Discord-related services, and advertising destinations. Information sent to a third party is handled according to the relevant third party’s own terms and privacy notice. We do not control third-party data practices.</p>
        <h2>Changes</h2>
        <p>This notice may be updated when the service, data handling, or legal requirements change. The effective date below indicates the latest revision.</p>
        </>:<><h2>Use of the service</h2>
        <p>Use the service only for lawful and legitimate personal or community purposes. You are responsible for the Player IDs, codes, URLs, and other information you submit. Input forms may use client-side format validation to provide immediate feedback, but valid-looking input is not a guarantee that a request will be accepted or processed. Do not submit passwords, payment information, authentication codes, or private credentials.</p>
        <h2>Kingshot redemption</h2>
        <p>Gift codes are controlled by the underlying game service. Codes can expire, reach usage limits, be region or account restricted, or be rejected without notice. We do not guarantee that a submitted code will work or that an automatic redemption attempt will succeed.</p>
        <h2>Auto Redeem</h2>
        <p>Auto Redeem is an intentional feature of this service. When you register a Player ID, you authorize the service to periodically process eligible gift codes for that registered player using the information required by the redemption workflow. Automation is permitted for ordinary, authorized redemption; using automation to bypass safeguards or interfere with the service is not.</p>
        <h2>Auto Redeem rules</h2>
        <p>You may use Auto Redeem for a Player ID you are authorized to operate. You must not register another person's Player ID without permission, submit passwords or private credentials, bypass rate limits or cooldowns, rotate identities or keys to evade restrictions, flood the redemption system, intentionally create duplicate work, manipulate requests or redemption results, probe protected endpoints, harvest private data, or interfere with the service or upstream systems.</p>
        <p>Do not use Auto Redeem for malware, credential theft, phishing, fraud, harassment, denial-of-service activity, unauthorized account automation, or attempts to obtain rewards outside the normal redemption process. Public gift-code discovery is intended only to identify legitimate codes for ordinary redemption. Third-party and Kingshot rules, eligibility requirements, availability limits, and technical restrictions continue to apply.</p>
        <p>We may throttle, suspend, revoke, or block registrations, API keys, IP addresses, or other access when reasonably necessary to prevent abuse, protect the service or users, respond to security incidents, or enforce these rules. A normal personal or community integration that periodically redeems eligible public gift codes for an authorized Player ID is permitted; automation itself is not treated as abuse merely because it is automated.</p>
        <p>You can request removal of an Auto Redeem registration through the support form. You are responsible for ensuring that you have the right to use the Player ID you submit.</p>
        {key==="developer-api"&&<><h2>Developer API</h2><p>Developer API access is provided for server-side integrations, including automated redemption services, scheduled jobs, Discord bots, community tools, and other software that periodically submits eligible gift codes for authorized Player IDs. Automated API use is permitted and is an intended use of the API, provided that the integration remains within the documented limits and these acceptable-use rules.</p><h2>Automated API redemption</h2><p>You may use the API to build an automatic redemption flow for a Player ID you are authorized to operate. A normal integration may discover legitimate public gift codes, queue eligible codes, submit redemption requests on a schedule, handle ordinary retryable responses, and persist results to prevent unnecessary duplicate requests.</p><h2>API backfill</h2><p>Backfill is an intended use of the Developer API. An integration may catch up on eligible gift codes that became available while its worker was offline, while a player was not yet registered, during a temporary service interruption, or for another legitimate reason a code was missed. Backfill must use the normal redemption flow and the same authorization, quota, rate-limit, cooldown, eligibility, and duplicate-prevention controls as ordinary redemption. Only codes that are still eligible should be attempted. Backfill must not be used to replay requests indefinitely, circumvent limits, or create unnecessary load.</p><p>Automation must not be used to bypass quotas, authentication, cooldowns, rate limits, worker controls, IP restrictions, duplicate-prevention mechanisms, or other safeguards. Do not rotate API keys, accounts, IP addresses, or identities for the purpose of evading limits. Do not intentionally flood the API, generate duplicate jobs, hammer an upstream service, or repeatedly retry requests after the service has indicated that they should stop.</p><h2>Developer API acceptable use</h2><p>Do not share API keys publicly, embed them in browser or mobile client code, commit them to repositories, or expose them to untrusted users. Do not use the API for unauthorized account automation, credential theft, phishing, fraud, malware, harassment, denial-of-service activity, endpoint probing, private-data harvesting, request or signature manipulation, or attempts to obtain rewards outside the normal redemption process.</p><p>You are responsible for protecting your keys, using only authorized Player IDs, respecting upstream Kingshot and third-party rules, and implementing reasonable retry/backoff behavior. We may throttle, suspend, revoke, or block API keys, accounts, IP addresses, or other access when necessary to prevent abuse, respond to security incidents, protect service availability, or enforce these terms.</p><h2>API limits and availability</h2><p>Developer API keys are currently limited to up to 3 active keys per account, with documented per-key request limits. Limits may change as the service evolves. A successful authentication does not guarantee that a redemption will succeed; the upstream game service controls code validity, availability, eligibility, and redemption outcomes.</p></>}        <h2>Advertising</h2>
        <p>Some pages may contain sponsored advertisements. Advertisements are provided by third parties and may link to external websites. We do not make the third party's products, services, claims, policies, or availability part of these terms. Your interactions with an advertiser are governed by the advertiser's own terms.</p>
        <h2>Availability and changes</h2>
        <p>The service is provided on an as-available basis. Features, APIs, gift-code sources, advertisements, and integrations may change, be interrupted, or be removed without notice. We do not guarantee uninterrupted access, accuracy of third-party data, or successful redemption.</p>
        <h2>Third-party platforms</h2>
        <p>Kingshot, Century Games, Discord, and other referenced platforms remain the property of their respective owners. This project does not claim official status or authorization from those owners.</p>
        <h2>Acceptable use</h2>
        <p>Do not abuse, overload, probe, bypass security controls, interfere with other users, attempt unauthorized access, or use the service to distribute malicious or unlawful content.</p>
        <h2>Changes to these terms</h2>
        <p>These terms may be updated as the service changes. Continued use after an updated version is published means you are using the service under the revised terms.</p>
        </>}

        <h2>No affiliation</h2>
        <p>This project is independent and should not be represented as an official Century Games, Kingshot, or Discord service. Product names, logos, and trademarks remain the property of their respective owners.</p>
        <p className="legal-note">This notice describes the current operation of this independent community service and is not legal advice. Effective: October 1, 2026.</p>
      </section>
    </main>
    <footer><span>© 2026 Judson · Independent community service</span><span><a href={"/terms?service="+serviceKey}>Terms</a> · <a href={"/privacy?service="+serviceKey}>Privacy</a></span></footer>
  </div>
}
