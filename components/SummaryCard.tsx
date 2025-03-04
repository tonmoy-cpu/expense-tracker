import React from 'react';

interface SummaryCardProps {
    title: string;
    value: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value }) => {
    return (
        <div className="summary-card border p-4 rounded shadow">
            <h3 className="font-bold">{title}</h3>
            <p>{value}</p>
        </div>
    );
};

export default SummaryCard;