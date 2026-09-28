import React from "react";
import { ArrowLeft, ShieldCheck, Database, Image as ImageIcon } from "lucide-react";

const ICON_URL="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/ee/d2/22/eed22297-9313-d8b0-52c8-95f42a2795b2/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/0x0ss-85.png";

const services={
  "kingshot-manual":{
    label:"Kingshot Manual Redeemer",
    summary:"Manual gift-code redemption for a Kingshot Player ID.",
    collect:"When you use this page, we receive the Player ID and gift code you submit. The Player ID is used to retrieve the current kingdom/player information needed to process the request. Redemption results and basic request information may be retained for service operation and troubleshooting.",
    use:"We use the submitted data to look up the player, submit the redemption request, return the result, prevent abuse, and maintain the service.",
    specific:"This page does not require a Kingshot password or Century Games account credentials. A gift-code redemption can fail, expire, or be rejected by the game service. We do not control Century Games' redemption service."
  },
  "kingshot-auto":{
    label:"Kingshot Auto Redeem",
    summary:"Registration and automatic processing of active Kingshot gift codes.",
    collect:"Registration may store the Player ID, kingdom ID, player name, avatar URL, registration/update timestamps, last redemption time, and redemption status history. If you submit a support request, the Player ID and the reason you provide are stored with the ticket.",
    use:"We use this information to maintain your registration, identify the correct player, process gift codes, record redemption results, and handle support requests.",
    specific:"Automatic redemption is a community service and is not operated by Century Games. You can request that a registration be revoked through the support form. Revocation disables future automatic processing while preserving service records needed for administration."
  },
  "discord-pfp":{
    label:"Discord PFP Extractor",
    summary:"Lookup and download tool for publicly available Discord profile avatar data.",
    collect:"The extractor receives the Discord user ID or profile URL you submit and requests public profile information through our server-side Discord integration. Recent lookup IDs are stored locally in your browser using localStorage; they are not an account or server-side profile.",
    use:"We use the submitted ID to retrieve and display the requested public avatar information and to provide the download/share features.",
    specific:"No Discord password, OAuth login, or client token is requested. We are not affiliated with Discord Inc. Discord names, avatars, and related marks remain the property of their respective owners."
  }
};

function serviceFromUrl(){
  const key=new URLSearchParams(location.search).get("service");
  return services[key]?key:"kingshot-manual";
}

export default function LegalApp({type}){
  const key=serviceFromUrl(), service=services[key], privacy=type==="privacy";
  return <div className="app legal-app">
    <header>
      <a className="brand" href={key==="discord-pfp"?"/extract":"/"}><span className={"brand-mark "+(key!=="discord-pfp"?"ks-brand-mark":"")}>{key==="discord-pfp"?"D":<img src={ICON_URL} alt="Kingshot"/></span><span>{privacy?"Privacy":"Terms"} · {service.label}</span></a>
      <div className="header-right"><a className="legal-back" href={key==="discord-pfp"?"/extract":"/"}><ArrowLeft size={14}/> Back</a></div>
    </header>
    <main>
      <section className="legal-hero">
        <div className="legal-mark">{key==="discord-pfp"?<ImageIcon size={22}/>:<img src={ICON_URL} alt="Kingshot"/>}</div>
        <div className="eyebrow"><span/>{privacy?"PRIVACY NOTICE":"TERMS OF USE"}</div>
        <h1>{privacy?"Privacy, made clear.":"Terms, without the clutter."}</h1>
        <p className="hero-copy">{service.summary}</p>
        <div className="legal-tabs"><a className={!privacy?"active":""} href={"/terms?service="+key}>Terms</a><a className={privacy?"active":""} href={"/privacy?service="+key}>Privacy</a></div>
      </section>

      <section className="legal-grid">
        <article className="legal-card">
          <div className="legal-card-icon"><ShieldCheck size={17}/></div>
          <h2>Independent service</h2>
          <p>This website is an independent community project created by Judson. It is not operated, sponsored, endorsed, or affiliated with Century Games or Kingshot.</p>
        </article>
        <article className="legal-card">
          <div className="legal-card-icon"><ShieldCheck size={17}/></div>
          <h2>Game ownership</h2>
          <p>Kingshot, its game content, artwork, logos, icons, characters, and related intellectual property belong to Century Games Pte. Ltd. and/or its licensors. We use the Kingshot name and icon only to identify the game supported by this community tool.</p>
        </article>
        <article className="legal-card">
          <div className="legal-card-icon"><Database size={17}/></div>
          <h2>{privacy?"What this page handles":"What you agree to"}</h2>
          <p>{privacy?service.collect:"Use the service only with Player IDs, gift codes, profile data, and other information you are authorized to submit. Do not submit passwords, payment information, or another person's private credentials."}</p>
        </article>
      </section>

      <section className="legal-body">
        {privacy ? <>
          <h2>How we use information</h2>
          <p>{service.use}</p>
          <h2>Service-specific information</h2>
          <p>{service.specific}</p>
          <h2>Storage and providers</h2>
          <p>Depending on the feature, information may be processed by our hosting, database, security, and third-party API providers, including Vercel, Supabase, Discord, or Kingshot/Century Games endpoints. Those providers process information under their own terms and privacy policies.</p>
          <h2>Local browser storage</h2>
          <p>The Discord PFP Extractor stores recent lookup IDs locally in your browser to make repeat lookups easier. You can clear that browser storage through your browser's site-data controls.</p>
          <h2>Support and deletion requests</h2>
          <p>For Kingshot Auto Redeem, you can submit a removal request with your Player ID. A revoked registration is disabled rather than immediately erased so the service can preserve operational and redemption history. If you need a specific record removed, use the support channel associated with this project.</p>
        </> : <>
          <h2>Use of the service</h2>
          <p>You may use this site for legitimate personal or community use. You are responsible for entering accurate information and for ensuring that you are authorized to use the Player ID or other data you submit.</p>
          <h2>Redemption and availability</h2>
          <p>We do not guarantee that any gift code will work, remain active, be accepted by Kingshot, or produce a particular reward. Codes may expire, have usage limits, be restricted by kingdom or account, or be rejected by the underlying game service. The site may also be unavailable or changed without notice.</p>
          <h2>Prohibited use</h2>
          <p>Do not abuse the service, attempt to bypass rate limits or security controls, submit credentials or sensitive information, impersonate another person, or use the service for unlawful activity.</p>
          <h2>Intellectual property</h2>
          <p>The software and original interface created for this project belong to their respective authors. Kingshot and all Century Games game assets, branding, artwork, and trademarks remain owned by Century Games Pte. Ltd. and/or its licensors. Nothing on this site transfers ownership of those materials.</p>
          <h2>No affiliation</h2>
          <p>“Kingshot” is referenced solely to identify the game supported by this tool. This project is not an official Century Games service and should not be represented as one.</p>
          <h2>Changes</h2>
          <p>These terms and notices may be updated when the service or its data practices change. The date shown below identifies the current revision.</p>
        </>}
        <div className="legal-source">
          <ShieldCheck size={15}/>
          <span>For the official Century Games terms and privacy policy, visit <a href="https://www.centurygames.com/terms-of-service/" target="_blank" rel="noreferrer">Century Games Terms of Service</a> and <a href="https://www.centurygames.com/privacy-policy/" target="_blank" rel="noreferrer">Century Games Privacy Policy</a>.</span>
        </div>
        <p className="legal-note">This page is an informational notice for this independent community service and is not legal advice. Effective: September 28, 2026.</p>
      </section>
    </main>
    <footer><span>© 2026 Judson · Independent community service</span><span><a href={"/terms?service="+key}>Terms</a> · <a href={"/privacy?service="+key}>Privacy</a></span></footer>
  </div>
}
