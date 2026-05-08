from fastapi import FastAPI, File, UploadFile
import os
import uuid
import re

#uvicorn main:app --reload
app = FastAPI()

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def home():
    return {"message": "Server is running"}

def generate_action_plan(text):
    actions = []

    text = text.replace("\n", " ")
    sentences = re.split(r'(?<=[.])\s+', text)

    keywords = [
        "is directed to", "are directed to", "directed to",
        "shall file", "shall submit", "registry is directed",
        "undertaking"
    ]

    for sent in sentences:
        sent = sent.strip()

        if len(sent.split()) < 6:
            continue

        # Skip noise
        if any(word in sent.lower() for word in [
            "stated that", "it is submitted", "learned counsel",
            "police", "incident", "appeared"
        ]):
            continue

        if any(k in sent.lower() for k in keywords):

            action = {}

            
            action["action"] = simplify_action(sent)

            # Deadline
            deadline_match = re.search(
                r'(within\s+\d+\s+(hours?|days?|weeks?|months?)|by\s+\w+\s+\d{1,2},?\s*\d{4}|today|tomorrow)',
                sent,
                re.IGNORECASE
            )
            if deadline_match:
                action["deadline"] = deadline_match.group()

            # Responsible
            resp_match = re.search(
                r'(registry|respondent|petitioner|solicitor general|court|authority)',
                sent,
                re.IGNORECASE
            )
            if resp_match:
                action["responsible"] = resp_match.group()

            actions.append(action)

    # Remove duplicates
    unique = []
    seen = set()
    for a in actions:
        if a["action"] not in seen:
            seen.add(a["action"])
            unique.append(a)

    return unique

def simplify_action(sentence):
    s = sentence.lower()

    if "shall be furnished within" in s:
        return "Submit undertaking within 24 hours"

    if "kea will consider" in s:
        return "KEA to consider eligibility of petitioners"

    if "if the aforesaid undertaking is not furnished" in s:
        return "Non-compliance will affect petitioner eligibility"

    return sentence.strip().rstrip(".")

def extract_basic_info(text):
    data = {}

    # Prefer header-style date
    date_match = re.search(
        r'DATED\s+THIS\s+THE\s+.*?\d{4}',
        text,
        re.IGNORECASE
    )

    if date_match:
        data["date"] = date_match.group()
    else:
        # fallback to numeric date
        date_match = re.search(
            r'\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b',
            text
        )
        if date_match:
            data["date"] = date_match.group()

    # Court name (case insensitive)
    court_match = re.search(
        r'(In the High Court.*|IN THE HIGH COURT.*)',
        text,
        re.IGNORECASE
    )
    if court_match:
        data["court"] = court_match.group().strip()

    # Case number
    case_match = re.search(
        r'(WRIT PETITION NO\.?\s*\d+\s*OF\s*\d{4}|WP\s*No\.?\s*\d+\s*of\s*\d{4})',
        text,
        re.IGNORECASE
    )
    if case_match:
        data["case_number"] = case_match.group().strip()

    # Parties (-Vs-, -vs-, vs)
    party_match = re.search(
        r'(.+?)\s*-?[Vv][Ss]-?\s*(.+)',
        text
    )
    if party_match:
        data["parties"] = (
            party_match.group(1).strip()
            + " vs "
            + party_match.group(2).strip()
        )

    return data

def extract_text_from_pdf(pdf_path):
    images = convert_from_path(
        pdf_path,
        first_page=1,
        last_page=20   # 👈 limit pages
    )

    full_text = ""

    for i, img in enumerate(images):
        print(f"Processing page {i+1}")
        text = pytesseract.image_to_string(img)
        full_text += text

    return full_text


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        return {"error": "Only PDF files allowed"}

    unique_name = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(await file.read())
    

    case_id = insert_case(file.filename, file_path)

    # 🔹 Step 2: Extract text
    extracted_text = extract_text_from_pdf(file_path)

    # 🔹 Step 3: Extract structured data
    structured_data = extract_basic_info(extracted_text)

    # 🔹 Step 4: Generate action plan
    actions = generate_action_plan(extracted_text)

    # 🔹 Step 5: Save extracted data
    insert_extracted_data(case_id, structured_data)

    # 🔹 Step 6: Save actions
    insert_action_plan(case_id, actions)

    try:
        extracted_text = extract_text_from_pdf(file_path)
        structured_data = extract_basic_info(extracted_text)
        action_plan = generate_action_plan(extracted_text)
    except Exception as e:
        return {"error": str(e)}

    return {
        "message": "Stored in DB successfully",
        "case_id": case_id,
        "file_id": unique_name,
        "text_preview": extracted_text[:500],
        "structured_data": structured_data ,
        "action_plan": action_plan
    }
