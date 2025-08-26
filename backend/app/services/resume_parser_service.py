# app/services/resume_parser_service.py

import io
import PyPDF2  # For PDF files
import docx    # For DOCX files

def extract_text(file_content: bytes, filename: str) -> str:
    """
    Extracts text from an in-memory resume file (PDF or DOCX).

    Args:
        file_content: The raw bytes of the file.
        filename: The name of the file, used to determine the extension.

    Returns:
        The extracted plain text from the document.
        
    Raises:
        ValueError: If the file type is unsupported or if text cannot be extracted.
    """
    # Get the file extension from the filename
    file_extension = filename.split('.')[-1].lower()
    
    if file_extension == 'pdf':
        try:
            # Read the PDF from the in-memory bytes
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            # Join text from all pages
            text = "".join(page.extract_text() or "" for page in pdf_reader.pages)
            if not text.strip():
                raise ValueError("Could not extract any text from the PDF file. It might be an image-based PDF.")
            return text
        except Exception as e:
            # Catch potential errors from PyPDF2
            raise ValueError(f"Error parsing PDF file: {e}")

    elif file_extension == 'docx':
        try:
            # Read the DOCX from the in-memory bytes
            doc = docx.Document(io.BytesIO(file_content))
            # Join text from all paragraphs
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            if not text.strip():
                raise ValueError("The DOCX file appears to be empty.")
            return text
        except Exception as e:
            # Catch potential errors from python-docx
            raise ValueError(f"Error parsing DOCX file: {e}")
    else:
        # If it's not a PDF or DOCX, raise an error
        raise ValueError(f"Unsupported file type: '{file_extension}'. Please upload a PDF or DOCX file.")

# --- IMPORTANT ---
# Yahan se redundant 'analyze_resume_with_ai' function hata diya gaya hai.
# Is file ka kaam ab sirf documents se text nikalna hai.
# Saara AI se juda analysis 'gemini_service.py' file handle karegi.
# Isse aapka code saaf, consistent, aur maintain karne mein aasan rehta hai.