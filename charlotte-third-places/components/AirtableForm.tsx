import React from 'react';

interface AirtableFormProps {
    src: string;
    height?: string;
    borderColor?: string;
}

const AirtableForm: React.FC<AirtableFormProps> = ({ src, height = "533px", borderColor = "#ccc" }) => {
    return (
        <div className="airtable-container">
            <iframe
                className="airtable-embed"
                src={src}
                width="100%"
                height={height}
                style={{ background: "transparent", border: `1px solid ${borderColor}` }}
                title="Airtable Form"
            >
            </iframe>
        </div>
    );
};

export default AirtableForm;
