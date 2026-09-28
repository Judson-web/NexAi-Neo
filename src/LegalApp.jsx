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
        <div className="legal-tabs"><a className={!privacy?"active":""} href={"/terms?service="+(key||"kingshot-manual")}>Terms</a><a className={privacy?"active":""} href={"/privacy?service="+(key||"kingshot-manual")}>Privacy</a></div>
      </section>
      <section className="legal-body">
        <h2>Independent service</h2>
        <p>This website is an independent community project created by Judson. It is not operated, sponsored, endorsed, or affiliated with Century Games or Kingshot.</p>
        <h2>Game ownership</h2>
        <p>Kingshot, its game content, artwork, logos, icons, characters, and related intellectual property belong to Century Games Pte. Ltd. and/or its licensors. We use the Kingshot name only to identify the game supported by this community tool.</p>
        {privacy?<><h2>Privacy</h2><p>This page explains the information handled by this independent service. Kingshot Auto Redeem may store Player ID, kingdom ID, player name, avatar URL, timestamps, redemption history, and support requests. Discord PFP Extractor keeps recent lookup IDs locally in the browser.</p></>:<><h2>Use of the service</h2><p>Use the service for legitimate personal or community purposes. Do not submit passwords, payment information, or private credentials.</p><h2>Redemption and availability</h2><p>Gift codes may expire, have usage limits, or be rejected by the underlying game service. Availability is not guaranteed.</p></>}
        <h2>No affiliation</h2>
        <p>This project is not an official Century Games service and should not be represented as one.</p>
        <p className="legal-note">Informational notice for this independent community service; not legal advice. Effective: September 28, 2026.</p>
      </section>
    </main>
    <footer><span>© 2026 Judson · Independent community service</span><span><a href={"/terms?service="+(key||"kingshot-manual")}>Terms</a> · <a href={"/privacy?service="+(key||"kingshot-manual")}>Privacy</a></span></footer>
  </div>
}
