import { useState, useEffect } from "react";

const sections = [
    {
        id: "information-we-collect",
        number: "01",
        title: "Information We Collect",
        content: [
            {
                subtitle: "1.1 Information You Provide Directly",
                bullets: [
                    "Account registration details: full name, email address, and password (bcrypt-hashed, never stored in plain text).",
                    "Google OAuth2 credentials: access tokens and refresh tokens for Gmail API integration, encrypted at rest using AES-256.",
                    "Campaign data: email templates, subject lines, merge tags, scheduling settings, and A/B test configurations.",
                    "Contact data: names, email addresses, and website URLs you input or discover via the Contact Finder feature.",
                ],
            },
            {
                subtitle: "1.2 Information Collected Automatically",
                bullets: [
                    "Usage data: pages visited, features used, session duration, and interaction events.",
                    "Device & browser data: IP address, browser type, operating system, and referring URL.",
                    "Email engagement data: open events, click events, and unsubscribe actions linked to your campaigns.",
                    "Server logs: timestamps, error reports, and API call records retained for up to 90 days.",
                ],
            },
            {
                subtitle: "1.3 Information from Third-Party Services",
                bullets: [
                    "Google Account (OAuth2): your name and email address for authentication. We only request scopes required to send email on your behalf.",
                    "Google Gemini API: prompts you send to the AI composer. Prompt history is not stored beyond your active session.",
                    "Contact Finder: publicly available email addresses from websites you submit for crawling.",
                ],
            },
        ],
    },
    {
        id: "how-we-use",
        number: "02",
        title: "How We Use Your Information",
        intro: "We use collected information exclusively for the following purposes:",
        bullets: [
            "To operate the AutoMindz platform — including sending emails on your behalf via the Gmail API.",
            "To enable campaign management, scheduling, A/B testing, and performance analytics.",
            "To power the AI Email Composer (Google Gemini) for generating draft emails based on your inputs.",
            "To run the Contact Finder, crawling publicly accessible web pages for email addresses.",
            "To track email opens, clicks, and unsubscribes for your analytics dashboard.",
            "To authenticate your identity and manage multi-Gmail account connections securely.",
            "To diagnose technical issues, monitor service health, and improve the platform.",
            "To send service notifications, security alerts, and support responses.",
            "To comply with applicable legal and regulatory obligations.",
        ],
    },
    {
        id: "google-api",
        number: "03",
        title: "Google API Services & Gmail Data",
        callout: "AutoMindz's use of information received from Google APIs adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements.",
        bullets: [
            "We only request Gmail scopes necessary for composing and sending emails you explicitly create.",
            "We do NOT read, index, store, or analyze the contents of your existing Gmail inbox.",
            "Gmail OAuth tokens are encrypted using AES-256 before being stored in our database.",
            "You may revoke AutoMindz's Gmail access at any time via myaccount.google.com/permissions.",
            "We do not share your Gmail data with third parties, advertisers, or data brokers.",
            "Gmail data is used solely to provide the email sending functionality you explicitly requested.",
        ],
    },
    {
        id: "contact-finder",
        number: "04",
        title: "Contact Finder & Web Crawling",
        intro: "The Contact Finder crawls websites you submit to discover publicly visible email addresses. You are responsible for ensuring compliance with:",
        bullets: [
            "The terms of service of all websites you crawl.",
            "Applicable anti-spam legislation: CAN-SPAM (USA), CASL (Canada), GDPR (EU/EEA).",
            "The robots.txt directives of target websites.",
            "AutoMindz does not harvest emails for our own use. All discovered contacts belong exclusively to you.",
        ],
    },
    {
        id: "data-security",
        number: "05",
        title: "Data Storage & Security",
        bullets: [
            "All data is stored in MongoDB Atlas, protected by encryption at rest and TLS 1.2+ in transit.",
            "OAuth tokens and sensitive credentials are encrypted with AES-256 prior to database storage.",
            "Passwords are hashed using bcrypt and are never stored in plain text or reversible form.",
            "Background job queues (Bull/Redis via Upstash) are secured with authenticated, TLS-encrypted connections.",
            "We implement JWT-based session authentication, rate limiting, and IP-level access controls.",
        ],
    },
    {
        id: "data-sharing",
        number: "06",
        title: "Data Sharing & Third Parties",
        intro: "We do not sell, rent, or trade your personal data. We share data only in these limited circumstances:",
        bullets: [
            "Service Providers: MongoDB Atlas, Upstash (Redis), Google Cloud (OAuth2 & Gemini AI), hosting providers. These process data on our behalf under their own privacy policies.",
            "Legal Compliance: If required by a court order, law, or government authority.",
            "Business Transfer: In a merger or acquisition, data may transfer to the successor entity with equivalent protections.",
            "With Your Consent: For any other purpose, only with your explicit prior consent.",
        ],
    },
    {
        id: "your-rights",
        number: "07",
        title: "Your Rights & Choices",
        bullets: [
            "Access — Request a copy of the personal data we hold about you.",
            "Correction — Request correction of inaccurate or incomplete data.",
            "Deletion — Request deletion of your account and all associated data.",
            "Portability — Request your campaign data exported in CSV format.",
            "Revoke Google Access — Disconnect any Gmail account at any time via the app or Google settings.",
            "Opt-out of Tracking — Disable open/click tracking on a per-campaign basis.",
        ],
        outro: "To exercise any of these rights, contact us at privacy@automindz.com.",
    },
    {
        id: "email-tracking",
        number: "08",
        title: "Email Tracking & Recipient Privacy",
        intro: "AutoMindz inserts tracking pixels and link wrappers into emails you send. As the sender, you are responsible for:",
        bullets: [
            "Disclosing to recipients that email interactions may be tracked, where legally required.",
            "Providing a functional unsubscribe link in all marketing emails (included by default).",
            "Processing unsubscribe requests within the timeframe required by law (CAN-SPAM: 10 business days).",
            "Maintaining accurate suppression lists and never re-emailing unsubscribed contacts.",
        ],
    },
    {
        id: "data-retention",
        number: "09",
        title: "Data Retention",
        bullets: [
            "Account data is retained for as long as your account remains active.",
            "Campaign data and contact lists are retained until you delete them or close your account.",
            "Server logs are retained for up to 90 days for debugging and security purposes.",
            "Upon account deletion, personal data will be purged within 30 days, except where legal retention is required.",
        ],
    },
    {
        id: "gdpr",
        number: "10",
        title: "GDPR & International Users",
        bullets: [
            "Legal basis for processing: (a) contract performance — to provide the service; (b) legitimate interests — security and improvement; (c) consent — for optional AI features.",
            "You have the right to lodge a complaint with your local data protection authority.",
            "Cross-border data transfers are protected by standard contractual clauses or equivalent safeguards.",
        ],
    },
    {
        id: "changes",
        number: "11",
        title: "Changes to This Policy",
        intro: "We may update this Privacy Policy periodically. Material changes will be communicated via our website and, where appropriate, by email notification. Continued use of AutoMindz after the effective date constitutes acceptance of the revised policy.",
    },
    {
        id: "contact",
        number: "12",
        title: "Contact Us",
        contact: [
            { label: "Product", value: "AutoMindz — AI-Powered Email Outreach Platform" },
            { label: "Privacy Enquiries", value: "privacy@automindz.com" },
            { label: "General Support", value: "support@automindz.com" },
            { label: "Website", value: "https://automindz.com" },
        ],
    },
];

export default function PrivacyPolicy() {
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
            {/* Google Font */}
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
        .callout { background: #EEF2FF; border-left: 3px solid #435AFF; border-radius: 8px; padding: 14px 18px; margin: 16px 0; }
        .nav-item { display: block; padding: 6px 12px; border-radius: 6px; font-size: 13px; color: #6B7A99; cursor: pointer; transition: all 0.15s; border: none; background: none; text-align: left; width: 100%; }
        .nav-item:hover { color: #435AFF; background: #EEF2FF; }
        .nav-item.active { color: #435AFF; background: #EEF2FF; font-weight: 600; }
        .contact-row { display: flex; gap: 0; border-bottom: 1px solid #F0F2FF; padding: 10px 0; }
        .contact-label { width: 180px; font-weight: 600; font-size: 13px; color: #1A3A6C; flex-shrink: 0; }
        .contact-value { font-size: 13px; color: #444; }
        @media (max-width: 900px) { .layout { flex-direction: column !important; } .sidebar { display: none !important; } }
      `}</style>

            {/* Progress bar */}
            <div style={{ position: "fixed", top: 0, left: 0, height: "3px", width: ${'`${scrollProgress}%`'}, background: "linear-gradient(90deg, #435AFF, #7B8FFF)", zIndex: 1000, transition: "width 0.1s" }} />

            {/* Top Nav Bar */}
            <div style={{ background: "white", borderBottom: "1px solid #E8ECFF", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#435AFF" }} />
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#0D1B3E" }}>AutoMindz</span>
                </div>
                <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
                    <a href="/privacy-policy" style={{ color: "#435AFF", fontWeight: 600 }}>Privacy Policy</a>
                    <a href="/terms" style={{ color: "#6B7A99" }}>Terms & Conditions</a>
                    <a href="/" style={{ color: "#6B7A99" }}>← Back to Home</a>
                </div>
            </div>

            {/* Hero Banner */}
            <div style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #1A3A6C 100%)", padding: "56px 48px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(67,90,255,0.15)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -40, left: "40%", width: 200, height: 200, borderRadius: "50%", background: "rgba(67,90,255,0.08)", pointerEvents: "none" }} />
                <div style={{ maxWidth: "860px", margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(67,90,255,0.2)", border: "1px solid rgba(67,90,255,0.3)", borderRadius: "20px", padding: "4px 14px", marginBottom: "20px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7B8FFF" }} />
                        <span style={{ fontSize: "12px", color: "#A0AFD4", fontWeight: 500, letterSpacing: "0.05em" }}>LEGAL DOCUMENT</span>
                    </div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "40px", fontWeight: 800, color: "white", marginBottom: "12px", lineHeight: 1.1 }}>Privacy Policy</h1>
                    <p style={{ color: "#A0AFD4", fontSize: "15px" }}>Effective Date: March 10, 2026 &nbsp;·&nbsp; Last Updated: March 10, 2026</p>
                    <p style={{ color: "#C5CDE8", fontSize: "14px", marginTop: "16px", maxWidth: "580px", lineHeight: 1.7 }}>
                        This Privacy Policy explains how AutoMindz collects, uses, and protects your personal information. We are committed to transparency and responsible data handling.
                    </p>
                </div>
            </div>

            {/* Main Layout */}
            <div className="layout" style={{ maxWidth: "1060px", margin: "0 auto", padding: "40px 24px", display: "flex", gap: "32px", alignItems: "flex-start" }}>

                {/* Sidebar TOC */}
                <div className="sidebar" style={{ width: "220px", flexShrink: 0, position: "sticky", top: "72px" }}>
                    <div style={{ background: "white", border: "1px solid #E8ECFF", borderRadius: "12px", padding: "16px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, color: "#9AA5BE", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px", paddingLeft: "12px" }}>Contents</p>
                        {sections.map((s) => (
                            <button key={s.id} className=${'`nav-item ${activeSection === s.id ? "active" : ""}`'}
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
                            {/* Section Header */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #F0F2FF" }}>
                                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "13px", fontWeight: 800, color: "#435AFF", background: "#EEF2FF", borderRadius: "8px", padding: "4px 10px", letterSpacing: "0.05em" }}>{section.number}</span>
                                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0D1B3E", fontFamily: "'Syne', sans-serif" }}>{section.title}</h2>
                            </div>

                            {/* Callout box */}
                            {section.callout && (
                                <div className="callout">
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#435AFF", marginRight: "8px" }}>GOOGLE COMPLIANCE</span>
                                    <span style={{ fontSize: "13px", color: "#444", lineHeight: 1.6 }}>{section.callout}</span>
                                </div>
                            )}

                            {/* Intro text */}
                            {section.intro && <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, marginBottom: "14px" }}>{section.intro}</p>}

                            {/* Sub-sections */}
                            {section.content && section.content.map((sub, i) => (
                                <div key={i} style={{ marginBottom: "20px" }}>
                                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#1A3A6C", marginBottom: "10px" }}>{sub.subtitle}</p>
                                    {sub.bullets.map((b, j) => (
                                        <div key={j} className="bullet-item">
                                            <div className="bullet-dot" />
                                            <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.65 }}>{b}</p>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {/* Direct bullets */}
                            {section.bullets && section.bullets.map((b, i) => (
                                <div key={i} className="bullet-item">
                                    <div className="bullet-dot" />
                                    <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.65 }}>{b}</p>
                                </div>
                            ))}

                            {/* Outro */}
                            {section.outro && <p style={{ fontSize: "13px", color: "#444", marginTop: "12px", fontStyle: "italic" }}>{section.outro}</p>}

                            {/* Contact table */}
                            {section.contact && (
                                <div style={{ background: "#F8F9FF", borderRadius: "10px", padding: "4px 16px" }}>
                                    {section.contact.map((row, i) => (
                                        <div key={i} className="contact-row">
                                            <span className="contact-label">{row.label}</span>
                                            <span className="contact-value">{row.value.startsWith("http") ? <a href={row.value}>{row.value}</a> : row.value.includes("@") ? <a href=${'`mailto:${row.value}`'}>{row.value}</a> : row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Footer */}
                    <div style={{ textAlign: "center", padding: "32px 0 16px", color: "#9AA5BE", fontSize: "13px" }}>
                        © {new Date().getFullYear()} AutoMindz · <a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms & Conditions</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
