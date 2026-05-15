import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, name = 'AutoMindz', type = 'website', url = 'https://automindz.com' }) {
    const fullTitle = `${title} | ${name}`;
    
    // Add Structured Data Schema
    const schemaOrg = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": name,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={`${url}/og-image.jpg`} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={`${url}/og-image.jpg`} />

            {/* Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(schemaOrg)}
            </script>
        </Helmet>
    );
}
