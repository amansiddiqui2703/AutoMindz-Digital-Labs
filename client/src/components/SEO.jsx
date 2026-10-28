import { Helmet } from 'react-helmet-async';

const DEFAULT_DOMAIN = 'https://automindzdigitallabs.online';

export default function SEO({
    title,
    description,
    name = 'AutoMindz',
    type = 'website',
    url = DEFAULT_DOMAIN,
    image = null,
    keywords = '',
    noIndex = false,
    customSchema = null,
}) {
    const fullTitle = title.includes(name) ? title : `${title} | ${name}`;
    const canonicalUrl = url.startsWith('http') ? url : `${DEFAULT_DOMAIN}${url}`;
    const ogImage = image || `${DEFAULT_DOMAIN}/og-image.jpg`;

    // Rich default Schema.org JSON-LD
    const schemaOrg = customSchema || {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": name,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "url": DEFAULT_DOMAIN,
        "description": description,
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "category": "Freemium"
        },
        "creator": {
            "@type": "Organization",
            "name": "AutoMindz Digital Labs",
            "url": DEFAULT_DOMAIN
        }
    };

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={canonicalUrl} />
            
            {/* Robots Directive */}
            <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content="AutoMindz Digital Labs" />
            <meta property="og:locale" content="en_US" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={fullTitle} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(schemaOrg)}
            </script>
        </Helmet>
    );
}
