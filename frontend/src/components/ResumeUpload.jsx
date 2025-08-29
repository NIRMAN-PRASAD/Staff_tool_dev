// frontend/src/components/ResumeUpload.jsx

import React, { useState, useRef } from 'react';

const ResumeUpload = ({ onFileSelect }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current.click();
    };

    const dropZoneStyle = {
        ...styles.dropZone,
        border: isDragOver ? '2px dashed #007bff' : '2px dashed #ccc',
    };

    return (
        <div 
            style={dropZoneStyle}
            onClick={openFileDialog}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.docx"
            />
            <p style={styles.uploadText}>Drag & Drop Resume or Click to Browse</p>
            <p style={styles.supportedText}>Supported formats: PDF, DOCX</p>
        </div>
    );
};

const styles = {
    dropZone: {
        padding: '40px 20px',
        textAlign: 'center',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'border 0.2s ease-in-out',
        backgroundColor: '#f9f9f9',
    },
    uploadText: {
        margin: 0,
        fontSize: '1.1rem',
        color: '#555',
        fontWeight: 'bold',
    },
    supportedText: {
        margin: '5px 0 0 0',
        fontSize: '0.9rem',
        color: '#888',
    },
};

export default ResumeUpload;