import re
import PyPDF2
import docx

def read_resume_text(file_path):
    text = ""
    try:
        if file_path.lower().endswith('.pdf'):
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text
        elif file_path.lower().endswith('.docx'):
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\\n"
        else:
            return None
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return None
    return text.lower()

def local_resume_check(resume_file_path, keywords):
    if not keywords:
        return { "match_score_percent": 0, "found_keywords": [], "message": "No keywords provided for checking." }
    
    resume_text = read_resume_text(resume_file_path)
    if resume_text is None:
        return { "match_score_percent": 0, "found_keywords": [], "message": "Could not read or process the resume file." }

    found_keywords = set()
    for keyword in keywords:
        if re.search(r'\b' + re.escape(keyword.lower()) + r'\b', resume_text):
            found_keywords.add(keyword)
    
    score = len(found_keywords)
    match_percentage = (score / len(keywords)) * 100 if keywords else 0

    return { "match_score_percent": round(match_percentage, 2), "found_keywords": list(found_keywords) }

def generate_local_feedback(found_keywords):
    if not found_keywords:
        return "The resume did not match any of the required keywords."

    skills_text = ", ".join(found_keywords)
    return (
        f"This is a promising resume, showing a good match for skills like: {skills_text}. "
        "These are valuable assets for the role. To further improve, ensure these skills are highlighted "
        "prominently with examples in the project experience section."
    )
