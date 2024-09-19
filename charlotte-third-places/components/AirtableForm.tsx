"use client";

import React, { useState, useEffect } from 'react';

interface AirtableFormProps {
    src: string;
    height?: string;
    borderColor?: string;
}

const AirtableForm: React.FC<AirtableFormProps> = ({ src, height = "533px", borderColor = "#ccc" }) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Ensure the spinner is shown while the iframe loads
        const iframe = document.querySelector('iframe');
        if (iframe) {
            iframe.addEventListener('load', () => setIsLoading(false));
        }
        return () => {
            if (iframe) {
                iframe.removeEventListener('load', () => setIsLoading(false));
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
                className="airtable-embed"
                src={src}
                width="100%"
                height={height}
                style={{ background: "transparent", border: `1px solid ${borderColor}` }}
                title="Airtable Form"
                onLoad={() => setIsLoading(false)}
            >
            </iframe>
        </div>
    );
};

export default AirtableForm;
