"use client";

import React, { useState, useEffect, useRef } from 'react';

interface AirtableFormProps {
    src: string;
    height?: string;
    borderColor?: string;
}

const AirtableForm: React.FC<AirtableFormProps> = ({ src, height = "533px", borderColor = "#ccc" }) => {
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        const currentIframeRef = iframeRef.current;

        const handleLoad = () => setIsLoading(false);
        if (currentIframeRef) {
            currentIframeRef.addEventListener('load', handleLoad);
        }

        return () => {
            if (currentIframeRef) {
                currentIframeRef.removeEventListener('load', handleLoad);
            }
        };
    }, []);

    return (
        <div className="relative airtable-container">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
                </div>
            )}
            <iframe
                ref={iframeRef}
                className="airtable-embed"
                src={src}
                width="100%"
                height={height}
                style={{ background: "transparent", border: `1px solid ${borderColor}` }}
                title="Airtable Form"
                loading="lazy"
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
};

export default AirtableForm;
