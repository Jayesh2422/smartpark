import React from 'react';
import ToggleSegment from './ToggleSegment';

const RADIUS_OPTIONS = [
    { label: '1 km', value: 1 },
    { label: '3 km', value: 3 },
    { label: '5 km', value: 5 },
];

export default function RadiusSelector({ selected, onSelect }) {
    return <ToggleSegment options={RADIUS_OPTIONS} selected={selected} onSelect={onSelect} />;
}
