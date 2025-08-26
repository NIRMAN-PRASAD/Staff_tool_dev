// frontend/src/components/SkillInput.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SkillInput = ({ selectedSkills, onSkillsChange, authToken }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSuggestions = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/skills/?q=${query}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            // Filter out skills that are already selected
            const filteredSuggestions = response.data.filter(
                (suggestion) => !selectedSkills.includes(suggestion.SkillName)
            );
            setSuggestions(filteredSuggestions);
        } catch (error) {
            console.error("Failed to fetch skills", error);
        } finally {
            setIsLoading(false);
        }
    }, [authToken, selectedSkills]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchSuggestions(inputValue);
        }, 300); // Debounce API calls

        return () => {
            clearTimeout(handler);
        };
    }, [inputValue, fetchSuggestions]);

    const addSkill = (skillName) => {
        const trimmedSkill = skillName.trim();
        if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
            onSkillsChange([...selectedSkills, trimmedSkill]);
        }
        setInputValue('');
        setSuggestions([]);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue) {
            e.preventDefault();
            addSkill(inputValue);
        }
    };

    const removeSkill = (skillToRemove) => {
        onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove));
    };

    return (
        <div>
            <div style={styles.skillContainer}>
                {selectedSkills.map(skill => (
                    <div key={skill} style={styles.skillTag}>
                        {skill}
                        <span onClick={() => removeSkill(skill)} style={styles.removeTag}>×</span>
                    </div>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type skill and press Enter"
                    style={styles.skillInput}
                />
            </div>
            {isLoading && <div style={{fontSize: '12px'}}>Searching...</div>}
            {suggestions.length > 0 && (
                <ul style={styles.suggestionsList}>
                    {suggestions.map(s => (
                        <li key={s.SkillID} onClick={() => addSkill(s.SkillName)} style={styles.suggestionItem}>
                            {s.SkillName}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const styles = {
    skillContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', border: '1px solid #ccc', padding: '8px', borderRadius: '4px', backgroundColor: 'white' },
    skillTag: { display: 'flex', alignItems: 'center', backgroundColor: '#e0e0e0', padding: '5px 10px', borderRadius: '15px', fontSize: '14px' },
    removeTag: { marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold' },
    skillInput: { border: 'none', flex: 1, outline: 'none', minWidth: '150px' },
    suggestionsList: { listStyle: 'none', padding: '0', margin: '5px 0 0 0', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' },
    suggestionItem: { padding: '8px', cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }
};

export default SkillInput;