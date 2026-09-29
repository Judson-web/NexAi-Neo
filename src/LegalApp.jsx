import React from "react";

const services={
  "kingshot-manual":{label:"Kingshot Manual Redeemer",summary:"Manual gift-code redemption for a Kingshot Player ID."},
  "kingshot-auto":{label:"Kingshot Auto Redeem",summary:"Registration and automatic processing of active Kingshot gift codes."},
  "discord-pfp":{label:"Discord PFP Extractor",summary:"Lookup and download tool for publicly available Discord profile avatar data."}
};

export default function LegalApp({type}){
  const key=new URLSearchParams(location.search).get("service");
  const service=services[key]||services["kingshot-manual"];
  const privacy=type==="privacy";
  const base=key==="discord-pfp"?"/extract":"/";
  const serviceKey=key||"kingshot-manual";
  return <div className="app legal-app">
    <header>
      <a className="brand" href={base}><span className="brand-mark">{key==="discord-pfp"?"D":"K"}</span><span>{privacy?"Privacy":"Terms"} · {service.label}</span></a>
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
        <h2>About this service</h2>
        <p>This is an independent community project created and operated by Judson. It is not operated, sponsored, endorsed, or affiliated with Century Games, Kingshot, Discord, or any other platform referenced by the tools.</p>

        {privacy?<><h2>What we handle</h2>
        {key==="discord-pfp"?<p>The Discord PFP Extractor is designed to work with publicly available Discord profile information. Recent lookup IDs may be kept locally in your browser to make repeat searches easier. The service does not require you to submit a Discord password or account credentials.</p>:<p>The Kingshot services may process the information needed to provide their features. Depending on the service, this can include Player ID, kingdom ID, player name, avatar URL, submitted gift codes, redemption results, timestamps, and support requests. The auto-redeem service stores registered player information so scheduled processing can work after you leave the site.</p>}
        <h2>Support requests</h2>
        <p>If you submit a request to remove an auto-redeem registration, the Player ID and the reason you provide are processed so an administrator can review the request. Do not include passwords, payment details, authentication codes, or other sensitive information in a support request.</p>
        <h2>Advertising and measurement</h2>
        <p>Some pages may display sponsored banner advertisements. The service records basic ad delivery measurements such as impressions and clicks. Clicking an advertisement may pass through this service's tracking endpoint before you are sent to the advertiser's destination URL. The advertiser's own privacy practices apply after you leave this service.</p>
        <h2>Technical information</h2>
        <p>Like most web services, requests may be processed by hosting, database, security, analytics, or other infrastructure providers needed to operate the service. These providers may process technical information such as IP address, request metadata, device or browser information, and timestamps as part of normal operation, security, and abuse prevention.</p>
        <h2>Retention and removal</h2>
        <p>Information is retained only as needed to operate the relevant feature, maintain security, resolve support issues, or keep necessary service records. For an auto-redeem registration, you can use the removal request form on the Auto Redeem page. A removal request does not necessarily erase records that must be retained for security, fraud prevention, accounting, or legal reasons.</p>
        <h2>Third-party services</h2>
        <p>The tools may interact with third-party services and APIs, including game services, hosting infrastructure, databases, content delivery networks, and advertising destinations. Their handling of information is governed by their respective terms and privacy notices.</p>
        <h2>Changes</h2>
        <p>This notice may be updated when the service, data handling, or legal requirements change. The effective date below indicates the latest revision.</p>
        </>:<><h2>Use of the service</h2>
        <p>Use the service only for lawful and legitimate personal or community purposes. You are responsible for the Player IDs, codes, URLs, and other information you submit. Do not submit passwords, payment information, authentication codes, or private credentials.</p>
        <h2>Kingshot redemption</h2>
        <p>Gift codes are controlled by the underlying game service. Codes can expire, reach usage limits, be region or account restricted, or be rejected without notice. We do not guarantee that a submitted code will work or that an automatic redemption attempt will succeed.</p>
        <h2>Auto Redeem</h2>
        <p>When you register a Player ID for Auto Redeem, you authorize this service to periodically process eligible gift codes for that registered player using the information required by the redemption workflow. You can request removal of a registration through the support form. You are responsible for ensuring that you have the right to use the Player ID you submit.</p>
        <h2>Advertising</h2>
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
        <p>This project is independent and should not be represented as an official Century Games, Kingshot, or Discord service.</p>
        <p className="legal-note">This notice describes the current operation of this independent community service and is not legal advice. Effective: September 29, 2026.</p>
      </section>
    </main>
    <footer><span>© 2026 Judson · Independent community service</span><span><a href={"/terms?service="+serviceKey}>Terms</a> · <a href={"/privacy?service="+serviceKey}>Privacy</a></span></footer>
  </div>
}
