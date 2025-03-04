import React from 'react';

const categories = [
    "Groceries",
    "Utilities",
    "Transportation",
    "Entertainment",
    "Health Care",
    "Housing",
    "Personal Care",
    "Savings",
    "Debt Payments"
];

interface CategorySelectorProps {
    onSelect: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ onSelect }) => {
    return (
        <select onChange={(e) => onSelect(e.target.value)} className="border p-2 rounded">
            <option value="">Select a category</option>
            {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
            ))}
        </select>
    );
};

export default CategorySelector;