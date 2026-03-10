import { useState, useEffect } from "react";

const sections = [
    {
        id: "description",
        number: "01",
        title: "Description of Service",
        intro: "AutoMindz is an AI-powered email outreach platform providing the following core features:",
        bullets: [
            "Bulk and single email sending via Gmail API (OAuth2) with multi-account support and automatic rotation.",
            "AI-powered email composition using Google Gemini, with a rich text editor, merge tags, HTML mode, and live preview.",
            "Contact Finder: automated crawling of publicly accessible websites to discover email addresses.",
            "Email engagement tracking: open tracking, click tracking, and unsubscribe management.",
            "Campaign management: drafting, scheduling, pausing, resuming, and A/B testing of outreach campaigns.",
            "Analytics dashboard with campaign-level performance metrics and visual charts.",
            "GDPR-oriented contact management with suppression list support.",
        ],
        outro: "The service is provided on an \"as-is\" and \"as-available\" basis. Features may evolve over time. We reserve the right to modify, suspend, or discontinue any feature with or without notice.",
    },
    {
        id: "eligibility",
        number: "02",
        title: "Eligibility & Account Registration",
        bullets: [
            "You must be at least 18 years old and legally capable of entering into a binding agreement.",
            "You must provide accurate, current, and complete registration information and keep it updated.",
            "You are fully responsible for all activities that occur under your account.",
            "You must notify us immediately at support@automindz.com upon discovering any unauthorized access.",
            "We reserve the right to suspend or permanently terminate accounts that violate these Terms.",
        ],
    },
    {
        id: "google-oauth",
        number: "03",
        title: "Google OAuth2 & Gmail API Usage",
        callout: "AutoMindz's use of Gmail API data complies with the Google API Services User Data Policy (developers.google.com/terms/api-services-user-data-policy), including Limited Use requirements.",
        bullets: [
            "By connecting a Google account, you authorize AutoMindz to send emails from that Gmail account as directed by your campaigns.",
            "You are responsible for ensuring all emails comply with Google's Gmail Program Policies and Terms of Service.",
            "We do not access, read, or store the contents of your Gmail inbox.",
            "You may disconnect your Gmail account at any time from within the app or via myaccount.google.com/permissions.",
            "Abuse of the Gmail API through AutoMindz (e.g., sending spam) may result in suspension of your Google account by Google, for which AutoMindz bears no liability.",
        ],
    },
    {
        id: "acceptable-use",
        number: "04",
        title: "Acceptable Use Policy",
        content: [
            {
                subtitle: "4.1 Permitted Uses",
                intro: "You may use AutoMindz solely for lawful business email outreach, including:",
                bullets: [
                    "Guest post outreach, link building, and SEO campaigns.",
                    "B2B sales prospecting and legitimate lead generation.",
                    "PR, media relations, and editorial outreach.",
                    "Partnership inquiries, influencer outreach, and collaboration requests.",
                ],
            },
            {
                subtitle: "4.2 Prohibited Uses",
                intro: "You must NOT use AutoMindz to:",
                bullets: [
                    "Send unsolicited commercial email (spam) in violation of CAN-SPAM, GDPR, CASL, or any applicable law.",
                    "Harvest, purchase, or use third-party email lists for mass unsolicited mailing.",
                    "Send phishing, fraudulent, deceptive, or misleading communications.",
                    "Impersonate any person, company, or brand in email communications.",
                    "Distribute malware, viruses, or malicious content via the platform.",
                    "Reverse engineer, decompile, or extract source code from AutoMindz.",
                    "Resell, sublicense, or white-label AutoMindz without prior written consent.",
                ],
            },
        ],
        warning: "Violation of the Acceptable Use Policy may result in immediate account termination without refund and potential legal action.",
    },
    {
        id: "contact-finder",
        number: "05",
        title: "Contact Finder Feature",
        intro: "The Contact Finder crawls websites you provide to discover publicly visible email addresses. By using this feature, you agree that:",
        bullets: [
            "You are solely responsible for verifying compliance with applicable laws and the target website's terms of service.",
            "Discovered contact data must only be used for lawful outreach with a valid legal basis under GDPR, CAN-SPAM, or CASL.",
            "AutoMindz is a tool provider only. We bear no liability for how you use discovered contact information.",
            "All opt-out and unsubscribe requests from discovered contacts must be honored immediately.",
        ],
    },
    {
        id: "email-tracking",
        number: "06",
        title: "Email Tracking & Recipient Obligations",
        intro: "AutoMindz provides open tracking, click tracking, and unsubscribe functionality. As the sender, you are responsible for:",
        bullets: [
            "Disclosing to recipients that email interactions may be tracked, where legally required.",
            "Including a clear, functional unsubscribe link in all marketing emails (included by default).",
            "Processing unsubscribe requests within the timeframe required by law (CAN-SPAM: 10 business days).",
            "Maintaining accurate suppression lists and never re-emailing unsubscribed contacts.",
        ],
        outro: "AutoMindz automatically suppresses contacts who click unsubscribe links generated by our platform.",
    },
    {
        id: "ai-features",
        number: "07",
        title: "AI Features (Google Gemini)",
        bullets: [
            "AI-generated email content may contain errors or inaccuracies. You must review all AI output before sending.",
            "You are solely responsible for the final content of all emails, regardless of whether AI-assisted.",
            "Your prompts are transmitted to Google's Gemini API and are subject to Google's Terms of Service.",
            "Do not input confidential, legally privileged, or sensitive personal information into the AI composer.",
            "AI prompt history is not stored beyond your active session.",
        ],
    },
    {
        id: "intellectual-property",
        number: "08",
        title: "Intellectual Property",
        bullets: [
            "AutoMindz, its logo, interface, code, and all associated intellectual property are owned by AutoMindz.",
            "You retain full ownership of all content, campaigns, templates, and contact data you create within the platform.",
            "By using AutoMindz, you grant us a limited, non-exclusive license to process your content solely to provide the service.",
            "You may not copy, reproduce, or create derivative works of AutoMindz without prior written consent.",
        ],
    },
    {
        id: "liability",
        number: "09",
        title: "Disclaimers & Limitation of Liability",
        content: [
            {
                subtitle: "9.1 Disclaimer of Warranties",
                warning: "AUTOMINDZ IS PROVIDED \"AS IS\" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.",
            },
            {
                subtitle: "9.2 Limitation of Liability",
                intro: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUTOMINDZ SHALL NOT BE LIABLE FOR:",
                bullets: [
                    "Loss of revenue, profits, data, or business opportunities.",
                    "Email deliverability failures, Gmail account suspensions, or Google API quota errors.",
                    "Unauthorized account access due to your failure to secure credentials.",
                    "Legal claims arising from your use of Contact Finder or email tracking features.",
                ],
            },
        ],
        outro: "Our total aggregate liability shall not exceed the amount paid to us in the 12 months preceding the claim, or USD $100, whichever is greater.",
    },
    {
        id: "indemnification",
        number: "10",
        title: "Indemnification",
        intro: "You agree to indemnify and hold harmless AutoMindz and its officers, employees, and agents from claims arising from:",
        bullets: [
            "Your violation of these Terms or any applicable law or regulation.",
            "Your email campaigns, including claims of spam, harassment, or misrepresentation.",
            "Your use of the Contact Finder and any resulting claims from website owners or contacts.",
            "Any content you generate, upload, or send using AutoMindz.",
        ],
    },
    {
        id: "termination",
        number: "11",
        title: "Termination",
        bullets: [
            "You may terminate your account at any time via the account deletion feature or by contacting support.",
            "We may suspend or terminate your account immediately without notice for violations of these Terms.",
            "Upon termination, access to the service ceases immediately and data will be handled per our Privacy Policy.",
            "Indemnification, limitation of liability, and intellectual property clauses survive termination.",
        ],
    },
    {
        id: "anti-spam",
        number: "12",
        title: "Anti-Spam Law Compliance",
        intro: "You are solely responsible for ensuring all use of AutoMindz complies with applicable laws, including:",
        bullets: [
            "CAN-SPAM Act (USA): Requires accurate sender identification, non-deceptive subject lines, a physical address, and a functional opt-out honored within 10 business days.",
            "GDPR (EU/EEA): Requires a lawful basis for processing recipient data. B2B outreach may qualify under legitimate interests, but you must document a Legitimate Interest Assessment (LIA).",
            "CASL (Canada): Requires express or implied consent before sending commercial electronic messages to Canadian recipients.",
            "All Other Applicable Laws: You are responsible for compliance across every jurisdiction where your recipients are located.",
        ],
    },
    {
        id: "modifications",
        number: "13",
        title: "Modifications to Terms",
        intro: "We may update these Terms at any time. Material changes will be posted on our website and communicated via email where applicable. Continued use of AutoMindz after the effective date of updated Terms constitutes acceptance. If you disagree with updated Terms, you must cease using the service.",
    },
    {
        id: "governing-law",
        number: "14",
        title: "Governing Law & Dispute Resolution",
        bullets: [
            "These Terms are governed by the laws of India, without regard to conflict of law provisions.",
            "Disputes shall first be resolved through good-faith negotiation between the parties.",
            "Unresolved disputes shall be submitted to binding arbitration or to the competent courts of Ahmedabad, Gujarat, India.",
            "Nothing prevents either party from seeking injunctive relief to protect intellectual property rights.",
        ],
    },
    {
        id: "contact",
        number: "15",
        title: "Contact Information",
        contact: [
            { label: "Product", value: "AutoMindz — AI-Powered Email Outreach Platform" },
            { label: "Legal Enquiries", value: "legal@automindz.com" },
            { label: "General Support", value: "support@automindz.com" },
            { label: "Website", value: "https://automindz.com" },
        ],
    },
];

export default function TermsAndConditions() {
    const [activeSection, setActiveSection] = useState("");
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const total = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress((window.scrollY / total) * 100);
            const sectionEls = sections.map((s) => document.getElementById(s.id));
            for (let i = sectionEls.length - 1; i >= 0; i--) {
                if (sectionEls[i] && sectionEls[i].getBoundingClientRect().top <= 120) {
                    setActiveSection(sections[i].id);
                    break;
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#F8F9FF", minHeight: "100vh", color: "#1A1A2E" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #F8F9FF; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #F0F2FF; }
        ::-webkit-scrollbar-thumb { background: #435AFF; border-radius: 2px; }
        a { color: #435AFF; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .section-card { background: white; border-radius: 16px; border: 1px solid #E8ECFF; padding: 32px; margin-bottom: 16px; transition: box-shadow 0.2s; }
        .section-card:hover { box-shadow: 0 4px 24px rgba(67,90,255,0.08); }
        .bullet-item { display: flex; gap: 12px; margin-bottom: 10px; align-items: flex-start; }
        .bullet-dot { width: 6px; height: 6px; background: #435AFF; border-radius: 50%; margin-top: 7px; flex-shrink: 0; }
        .callout { background: #EEF2FF; border-left: 3px solid #435AFF; border-radius: 8px; padding: 14px 18px; margin: 12px 0 16px; }
        .warning-box { background: #FFF3F3; border-left: 3px solid #E53935; border-radius: 8px; padding: 14px 18px; margin: 12px 0 16px; }
        .nav-item { display: block; padding: 6px 12px; border-radius: 6px; font-size: 12px; color: #6B7A99; cursor: pointer; transition: all 0.15s; border: none; background: none; text-align: left; width: 100%; line-height: 1.4; }
        .nav-item:hover { color: #435AFF; background: #EEF2FF; }
        .nav-item.active { color: #435AFF; background: #EEF2FF; font-weight: 600; }
        .contact-row { display: flex; gap: 0; border-bottom: 1px solid #F0F2FF; padding: 10px 0; }
        .contact-label { width: 180px; font-weight: 600; font-size: 13px; color: #1A3A6C; flex-shrink: 0; }
        .contact-value { font-size: 13px; color: #444; }
        @media (max-width: 900px) { .layout { flex-direction: column !important; } .sidebar { display: none !important; } }
      `}</style>

            {/* Progress bar */}
            <div style={{ position: "fixed", top: 0, left: 0, height: "3px", width: `${scrollProgress}%`, background: "linear-gradient(90deg, #435AFF, #7B8FFF)", zIndex: 1000, transition: "width 0.1s" }} />

            {/* Top Nav */}
            <div style={{ background: "white", borderBottom: "1px solid #E8ECFF", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#435AFF" }} />
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0D1B3E" }}>AutoMindz</span>
                </div>
                <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
                    <a href="/privacy-policy" style={{ color: "#6B7A99" }}>Privacy Policy</a>
                    <a href="/terms" style={{ color: "#435AFF", fontWeight: 600 }}>Terms & Conditions</a>
                    <a href="/" style={{ color: "#6B7A99" }}>← Back to Home</a>
                </div>
            </div>

            {/* Hero Banner */}
            <div style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #1A3A6C 100%)", padding: "56px 48px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(67,90,255,0.15)", pointerEvents: "none" }} />
                <div style={{ maxWidth: "860px", margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(67,90,255,0.2)", border: "1px solid rgba(67,90,255,0.3)", borderRadius: "20px", padding: "4px 14px", marginBottom: "20px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7B8FFF" }} />
                        <span style={{ fontSize: "12px", color: "#A0AFD4", fontWeight: 500, letterSpacing: "0.05em" }}>LEGAL DOCUMENT</span>
                    </div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "40px", fontWeight: 800, color: "white", marginBottom: "12px", lineHeight: 1.1 }}>Terms & Conditions</h1>
                    <p style={{ color: "#A0AFD4", fontSize: "15px" }}>Effective Date: March 10, 2026 &nbsp;·&nbsp; Last Updated: March 10, 2026</p>
                    <div style={{ background: "rgba(229,57,53,0.15)", border: "1px solid rgba(229,57,53,0.3)", borderRadius: "8px", padding: "12px 16px", marginTop: "20px", maxWidth: "580px" }}>
                        <span style={{ fontSize: "13px", color: "#FFCDD2", lineHeight: 1.6 }}>
                            <strong style={{ color: "#FF8A80" }}>IMPORTANT: </strong>
                            By accessing or using AutoMindz, you agree to be bound by these Terms. If you do not agree, do not use the service.
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="layout" style={{ maxWidth: "1060px", margin: "0 auto", padding: "40px 24px", display: "flex", gap: "32px", alignItems: "flex-start" }}>

                {/* Sidebar */}
                <div className="sidebar" style={{ width: "220px", flexShrink: 0, position: "sticky", top: "72px" }}>
                    <div style={{ background: "white", border: "1px solid #E8ECFF", borderRadius: "12px", padding: "16px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "#9AA5BE", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px", paddingLeft: "12px" }}>Contents</p>
                        {sections.map((s) => (
                            <button key={s.id} className={`nav-item ${activeSection === s.id ? "active" : ""}`}
                                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                                <span style={{ color: "#435AFF", fontWeight: 700, marginRight: "6px" }}>{s.number}</span>{s.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {sections.map((section) => (
                        <div key={section.id} id={section.id} className="section-card">
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #F0F2FF" }}>
                                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "13px", fontWeight: 800, color: "#435AFF", background: "#EEF2FF", borderRadius: "8px", padding: "4px 10px", letterSpacing: "0.05em" }}>{section.number}</span>
                                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0D1B3E", fontFamily: "'Syne', sans-serif" }}>{section.title}</h2>
                            </div>

                            {section.callout && (
                                <div className="callout">
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#435AFF", marginRight: "8px" }}>GOOGLE COMPLIANCE</span>
                                    <span style={{ fontSize: "13px", color: "#444", lineHeight: 1.6 }}>{section.callout}</span>
                                </div>
                            )}

                            {section.warning && (
                                <div className="warning-box">
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#C62828", marginRight: "8px" }}>⚠ IMPORTANT</span>
                                    <span style={{ fontSize: "13px", color: "#555", lineHeight: 1.6 }}>{section.warning}</span>
                                </div>
                            )}

                            {section.intro && <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, marginBottom: "14px" }}>{section.intro}</p>}

                            {section.content && section.content.map((sub, i) => (
                                <div key={i} style={{ marginBottom: "20px" }}>
                                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A6C", marginBottom: "8px" }}>{sub.subtitle}</p>
                                    {sub.warning && (
                                        <div className="warning-box">
                                            <span style={{ fontSize: "13px", color: "#555", lineHeight: 1.6 }}>{sub.warning}</span>
                                        </div>
                                    )}
                                    {sub.intro && <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.7, marginBottom: "10px" }}>{sub.intro}</p>}
                                    {sub.bullets && sub.bullets.map((b, j) => (
                                        <div key={j} className="bullet-item">
                                            <div className="bullet-dot" />
                                            <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.65 }}>{b}</p>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {section.bullets && section.bullets.map((b, i) => (
                                <div key={i} className="bullet-item">
                                    <div className="bullet-dot" />
                                    <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.65 }}>{b}</p>
                                </div>
                            ))}

                            {section.outro && <p style={{ fontSize: "13px", color: "#444", marginTop: "12px", fontStyle: "italic" }}>{section.outro}</p>}

                            {section.contact && (
                                <div style={{ background: "#F8F9FF", borderRadius: "10px", padding: "4px 16px" }}>
                                    {section.contact.map((row, i) => (
                                        <div key={i} className="contact-row">
                                            <span className="contact-label">{row.label}</span>
                                            <span className="contact-value">{row.value.startsWith("http") ? <a href={row.value}>{row.value}</a> : row.value.includes("@") ? <a href={`mailto:${row.value}`}>{row.value}</a> : row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <div style={{ textAlign: "center", padding: "32px 0 16px", color: "#9AA5BE", fontSize: "13px" }}>
                        © {new Date().getFullYear()} AutoMindz · <a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms & Conditions</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
