// frontend/src/components/InterviewRoundRow.jsx

import React from 'react';

const InterviewRoundRow = ({ round, index, onRoundChange, onRemoveRound }) => {
    return (
        <div style={styles.container}>
            <div style={styles.roundNumber}>{index + 1}</div>
            <input
                type="text"
                placeholder="Round Name (e.g., Technical)"
                value={round.StageName}
                onChange={(e) => onRoundChange(index, 'StageName', e.target.value)}
                style={styles.input}
                required
            />
            <input
                type="text"
                placeholder="Interviewer (e.g., John Doe - Tech Lead)"
                value={round.InterviewerInfo}
                onChange={(e) => onRoundChange(index, 'InterviewerInfo', e.target.value)}
                style={styles.input}
            />
            <button type="button" onClick={() => onRemoveRound(index)} style={styles.removeButton}>-</button>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '15px',
    },
    roundNumber: {
        flexShrink: 0,
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        color: '#555',
    },
    input: {
        flex: 1,
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px',
        fontSize: '14px',
    },
    removeButton: {
        flexShrink: 0,
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#dc3545',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '18px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: '2px', // Vertically align the dash
    }
};

export default InterviewRoundRow;