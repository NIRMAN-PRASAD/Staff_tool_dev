// frontend/src/components/InterviewRoundRow.jsx

import React from 'react';

const InterviewRoundRow = ({ round, index, onRoundChange, onRemoveRound }) => {
    return (
        <div style={styles.grid}>
            <div style={styles.roundNumber}>{index + 1}</div>
            <input
                type="text"
                placeholder={`e.g., L${index + 1} - Technical Round`}
                value={round.StageName}
                onChange={(e) => onRoundChange(index, 'StageName', e.target.value)}
                style={styles.input}
                required
            />
            <input
                type="text"
                placeholder="e.g., John Doe - Tech Lead"
                value={round.InterviewerInfo}
                onChange={(e) => onRoundChange(index, 'InterviewerInfo', e.target.value)}
                style={styles.input}
            />
            <button type="button" onClick={() => onRemoveRound(index)} style={styles.removeButton}>-</button>
        </div>
    );
};

const styles = {
    grid: { display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' },
    roundNumber: { fontWeight: 'bold', padding: '10px', border: '1px solid #ccc', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    input: { padding: '10px', width: '100%', boxSizing: 'border-box' },
    removeButton: { backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', width: '30px', height: '30px', borderRadius: '50%' }
};

export default InterviewRoundRow;