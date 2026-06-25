import os
import re
import shutil
import json
import yaml
import time
from PIL import Image
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List

# ==========================================
# 1. Environment & API Setup
# ==========================================
def load_env():
    """Load GEMINI_API_KEY from .env file if it exists."""
    if os.path.exists(".env"):
        print("Loading environment variables from .env file...")
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip().strip('"').strip("'")

load_env()
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("\nWARNING: GEMINI_API_KEY is not set in environment or .env file.")
    print("Please set it in a .env file: GEMINI_API_KEY=your_actual_key\n")
    client = None
else:
    client = genai.Client(api_key=api_key)

# ==========================================
# 2. Helper to call Gemini with Retry
# ==========================================
def call_gemini_with_retry(model, contents, config, max_retries=6, initial_delay=5):
    """
    Call Gemini API with retry and exponential backoff for 429 Rate Limits.
    """
    delay = initial_delay
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            # Add a small delay after a successful request to avoid hitting limits
            time.sleep(3)
            return response
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                print(f"      [429 Rate Limit] Retrying in {delay}s (attempt {attempt + 1}/{max_retries})...")
                time.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                # If not a rate limit error, raise immediately
                raise e
    raise Exception("Max retries exceeded for Gemini API call due to rate limits.")

# ==========================================
# 3. Configuration Parser & Types
# ==========================================
class BoundingBox(BaseModel):
    id: str = Field(description="Identifier of the diagram, matching the placeholder in the text, e.g. [FIGURE_0]")
    box_2d: List[int] = Field(description="Bounding box coordinates as [ymin, xmin, ymax, xmax] normalized on 0 to 1000 scale.")

class OCRResponse(BaseModel):
    text: str = Field(description="Transcribed Markdown and LaTeX text with [FIGURE_0] placeholders for diagrams.")
    diagrams: List[BoundingBox] = Field(default_factory=list, description="List of detected diagrams with bounding boxes.")

class SolverResponse(BaseModel):
    level: str = Field(description="Must be exactly the level string from configuration.md, e.g. 'ประถม (G1-G6)', 'มัธยมต้น (G7-G9)', or 'มัธยมปลาย (G10-G12)'")
    difficulty: int = Field(description="Difficulty score from 1 (easy) to 5 (very hard) relative to the grade level's scope")
    subject: str = Field(description="Classified subject name based on rules (e.g. 'คณิตศาสตร์', 'วิทยาศาสตร์พื้นฐาน', 'ฟิสิกส์', 'เคมี', 'ชีวะ', 'โลกและอวกาศ')")
    topic_id: str = Field(description="The exact topic ID selected from the configuration rules")
    topic_name: str = Field(description="The exact Thai name of the topic matching topic_id")
    explanation: str = Field(description="Detailed explanation of the solution. Math shows step-by-step; Science explains thought process and reasons.")
    answer: str = Field(description="The final concise answer.")

def parse_configuration_md(path="configuration.md"):
    """Parse configuration.md to get the subjects and topics."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"Configuration file not found at {path}")
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract YAML frontmatter
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if not match:
        raise ValueError("Could not parse YAML frontmatter from configuration.md")
    
    yaml_content = match.group(1)
    config = yaml.safe_load(yaml_content)
    return config.get("system_config", {})

# Helper to map grade to configuration levels and Thai display
def get_level_info(grade_str, subject_code):
    """
    Returns level_id for config query, and Thai display string for output.
    Level: ประถม(G1-G6), มัธยมต้น(G7-G9), มัธยมปลาย(G10-G12)
    """
    grade_num = int(re.search(r"\d+", grade_str).group())
    
    if 1 <= grade_num <= 6:
        level_id = "primary"
        level_th = "ประถม (G1-G6)"
    elif 7 <= grade_num <= 9:
        level_id = "lower_secondary" if subject_code.lower() == "math" else "secondary"
        level_th = "มัธยมต้น (G7-G9)"
    elif 10 <= grade_num <= 12:
        level_id = "upper_secondary" if subject_code.lower() == "math" else "secondary"
        level_th = "มัธยมปลาย (G10-G12)"
    else:
        raise ValueError(f"Unsupported grade: {grade_str}")
        
    return level_id, level_th

def get_allowed_topics_and_categories(config, subject_code, grade_str):
    """
    Generate dynamic listing of categories and topics to restrict model choice.
    Returns: (subject_id, allowed_list_text)
    """
    subject_id = "mathematics" if subject_code.lower() == "math" else "science"
    level_id, _ = get_level_info(grade_str, subject_code)
    
    # Find matching subject in configuration
    subject_data = None
    for sub in config.get("subjects", []):
        if sub["id"] == subject_id:
            subject_data = sub
            break
            
    if not subject_data:
        return subject_id, "No subject configuration found."
        
    # Find level data
    level_data = None
    for lvl in subject_data.get("levels", []):
        if lvl["id"] == level_id or (subject_id == "science" and level_id in ["lower_secondary", "upper_secondary"] and lvl["id"] == "secondary"):
            level_data = lvl
            break
            
    if not level_data:
        return subject_id, "No level configuration found."
        
    lines = []
    if subject_id == "mathematics":
        lines.append("Allowed Topics for Mathematics:")
        for topic in level_data.get("topics", []):
            lines.append(f"- ID: {topic['id']} | Name: {topic['name_th']} ({topic.get('description', '')})")
    else:  # science
        # If primary
        grade_num = int(re.search(r"\d+", grade_str).group())
        if 1 <= grade_num <= 6:
            lines.append("Subject Category: วิทยาศาสตร์พื้นฐาน")
            for cat in level_data.get("categories", []):
                if cat["id"] == "general_science":
                    for topic in cat.get("topics", []):
                        lines.append(f"- ID: {topic['id']} | Name: {topic['name_th']} ({topic.get('description', '')})")
        else:
            # secondary Science
            lines.append("Allowed Subject Categories and Topics (G7-G12):")
            for cat in level_data.get("categories", []):
                # Map cat ID to Thai display
                cat_th_map = {
                    "general_science": "วิทยาศาสตร์ทั่วไป",
                    "physics": "ฟิสิกส์",
                    "chemistry": "เคมี",
                    "biology": "ชีวะ",
                    "earth_and_space": "โลกและอวกาศ"
                }
                cat_th = cat_th_map.get(cat["id"], cat.get("name_th", cat["id"]))
                lines.append(f"\n* Category (Subject): {cat_th} (ID: {cat['id']})")
                for topic in cat.get("topics", []):
                    lines.append(f"  - Topic ID: {topic['id']} | Topic Name: {topic['name_th']} ({topic.get('description', '')})")
                    
    return subject_id, "\n".join(lines)

# ==========================================
# 4. OCR and Diagram Cropping (Step 2)
# ==========================================
def run_ocr_and_crop(image_path, folder_name, question_no):
    """
    Run OCR on the question image using gemini-2.5-flash.
    Detects diagrams, crops them, saves them, and returns transcribed Markdown + LaTeX text.
    """
    print(f"  Running OCR & Crop for {folder_name} - Q{question_no}...")
    
    img = Image.open(image_path)
    width, height = img.size
    
    ocr_prompt = """
    Analyze the provided question image.
    Your tasks are:
    1. Transcribe the entire text, math symbols, and formulas. Use Markdown formatting.
       - Use LaTeX for mathematical notation (e.g. $x^2 + y = 0$ inline, or $$...$$ for block display).
       - Ensure LaTeX syntax is clean and correct.
       - If there are figures/drawings/geometry diagrams/charts that cannot be represented as text, replace them with a placeholder like [FIGURE_0], [FIGURE_1] at their exact location in the text.
    2. Identify the bounding boxes of any figures, drawings, charts, or illustrations in the image.
       - Bounding boxes must be [ymin, xmin, ymax, xmax] on a 0 to 1000 scale relative to the image size.
       - Do not include text equations or formula blocks as figures. Only actual diagrams/drawings.
    """
    
    # We use gemini-flash-latest for both OCR and solving to stay on the free tier quota
    response = call_gemini_with_retry(
        model="gemini-flash-latest",
        contents=[img, ocr_prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=OCRResponse,
        )
    )
    
    try:
        result = json.loads(response.text)
    except Exception as e:
        print(f"    Failed to parse JSON response from Gemini OCR: {e}")
        result = {"text": response.text, "diagrams": []}
        
    transcribed_text = result.get("text", "")
    diagrams = result.get("diagrams", [])
    
    # Crop and save diagrams if any
    for idx, diag in enumerate(diagrams):
        box = diag.get("box_2d")
        if box and len(box) == 4:
            ymin, xmin, ymax, xmax = box
            # Convert normalized 0-1000 scale to pixel coordinates
            left = int(xmin * width / 1000)
            top = int(ymin * height / 1000)
            right = int(xmax * width / 1000)
            bottom = int(ymax * height / 1000)
            
            # Ensure crop box is within image bounds and valid
            left = max(0, min(left, width - 1))
            top = max(0, min(top, height - 1))
            right = max(left + 1, min(right, width))
            bottom = max(top + 1, min(bottom, height))
            
            crop_filename = f"{folder_name}_{question_no}_crop_{idx}.png"
            crop_path = os.path.join("images", crop_filename)
            
            try:
                cropped_img = img.crop((left, top, right, bottom))
                cropped_img.save(crop_path)
                print(f"    Cropped diagram {diag.get('id')} saved to {crop_path}")
                
                # Replace placeholder in text with actual Markdown image link
                placeholder = diag.get("id")
                img_markdown = f"![illustration](../images/{crop_filename})"
                transcribed_text = transcribed_text.replace(placeholder, img_markdown)
            except Exception as crop_err:
                print(f"    Error cropping diagram {diag.get('id')}: {crop_err}")
                
    return transcribed_text

# ==========================================
# 5. Professor Solving & Categorizing (Step 3)
# ==========================================
def run_professor_solver(image_path, transcribed_text, folder_name, question_no, config, folder_metadata):
    """
    Run the university lecturer solver using gemini-2.5-flash.
    Reads configuration.md, categorizes the subject and topic, solves the question,
    and returns a structured JSON answer.
    """
    print(f"  Running Professor Solver for {folder_name} - Q{question_no}...")
    
    img = Image.open(image_path)
    subject_code = folder_metadata["subject_code"]
    grade_str = folder_metadata["grade"]
    
    # Get configuration restrictions
    subject_id, allowed_schema_text = get_allowed_topics_and_categories(config, subject_code, grade_str)
    _, level_th = get_level_info(grade_str, subject_code)
    
    solver_prompt = f"""
    You are an expert University Professor in Mathematics and Science teaching at a leading university.
    Your task is to analyze the provided question image and its transcribed text, determine its metadata, solve it, and write a detailed explanation.
    
    Here is the transcribed text of the question (use this for text and LaTeX context):
    ---
    {transcribed_text}
    ---
    
    Here is the level of this exam folder:
    Grade Level Display: {level_th}
    Grade: {grade_str}
    
    Use the following Subject and Topic mapping rules based on configuration.md:
    {allowed_schema_text}
    
    Follow these instructions carefully:
    1. Determine the 'difficulty' level from 1 to 5 (1 = easiest, 5 = hardest) based on the target grade level knowledge.
    2. Classify the 'subject':
       - If the exam is Math, 'subject' MUST be 'คณิตศาสตร์'
       - If the exam is Sci:
         - If grade is G1-G6, 'subject' MUST be 'วิทยาศาสตร์พื้นฐาน'
         - If grade is G7-G12, analyze the question context and categorize it into exactly one of: 'วิทยาศาสตร์ทั่วไป', 'ฟิสิกส์', 'เคมี', 'ชีวะ', or 'โลกและอวกาศ'.
    3. Match and select the exact 'topic_id' and 'topic_name' from the allowed topics in the configuration listing above. Ensure topic_id matches the selected subject category.
    4. Write a detailed solution under 'explanation':
       - If the subject is Mathematics, show the step-by-step mathematical calculations and reasoning using LaTeX.
       - If the subject is Science, explain the core concepts, reasoning, and thinking process behind the answer using Markdown and LaTeX where appropriate.
       - Adopt a university lecturer tone: precise, educational, and thorough, but matching the knowledge level of {grade_str}.
    5. Provide the final concise answer under 'answer' (e.g. '15', 'ข.', '250', etc.)
    """
    
    # We use gemini-flash-latest as the solver because the free tier API key has stable quota limits.
    # gemini-flash-latest is highly intelligent and capable of solving G7-G12 math/science questions.
    response = call_gemini_with_retry(
        model="gemini-flash-latest",
        contents=[img, solver_prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SolverResponse,
        )
    )
    
    try:
        result = json.loads(response.text)
    except Exception as e:
        print(f"    Failed to parse JSON response from Professor Solver: {e}")
        # Return fallback dict
        result = {
            "level": level_th,
            "difficulty": 3,
            "subject": "คณิตศาสตร์" if subject_code.lower() == "math" else "วิทยาศาสตร์",
            "topic_id": "unknown",
            "topic_name": "ไม่ระบุ",
            "explanation": response.text,
            "answer": "ไม่พบคำตอบ"
        }
        
    return result

# ==========================================
# 6. Core Pipeline Orchestrator
# ==========================================
def parse_folder_name(folder_name):
    """
    Parse folder name like '{ชื่อการสอบ}_{วิชา}_{ปี พ.ศ.}_{ระดับชั้น}'
    e.g. 'TEDET_Math_2557_G7' -> {exam_name: TEDET, subject_code: Math, year: 2557, grade: G7}
    """
    parts = folder_name.split("_")
    if len(parts) >= 4:
        return {
            "exam_name": parts[0],
            "subject_code": parts[1],
            "year": int(parts[2]) if parts[2].isdigit() else parts[2],
            "grade": parts[3]
        }
    raise ValueError(f"Folder name '{folder_name}' does not match expected format")

def process_pending_jobs():
    """Main pipeline execution loop."""
    print("Starting DaddyTutor Mock-Exam Pipeline (Phase 1)...")
    
    if not client:
        print("ERROR: GenAI client is not initialized. Please set GEMINI_API_KEY in your .env file.")
        return
        
    # 1. Create output dirs if not exist
    os.makedirs("questions", exist_ok=True)
    os.makedirs("answers", exist_ok=True)
    os.makedirs("images", exist_ok=True)
    os.makedirs("complete-job", exist_ok=True)
    
    # 2. Parse configuration.md
    try:
        config = parse_configuration_md()
        print("Successfully parsed configuration.md")
    except Exception as e:
        print(f"Error parsing configuration.md: {e}")
        return
        
    # 3. Scan pending-job folder
    pending_dir = "pending-job"
    if not os.path.exists(pending_dir):
        print(f"Directory {pending_dir} does not exist.")
        return
        
    job_folders = [f for f in os.listdir(pending_dir) if os.path.isdir(os.path.join(pending_dir, f))]
    if not job_folders:
        print("No pending job folders found in 'pending-job'.")
        return
        
    print(f"Found {len(job_folders)} job folders to process: {job_folders}")
    
    for folder in job_folders:
        folder_path = os.path.join(pending_dir, folder)
        print(f"\nProcessing Folder: {folder}")
        
        try:
            folder_metadata = parse_folder_name(folder)
        except Exception as e:
            print(f"  Skipping folder '{folder}' due to name format error: {e}")
            continue
            
        # Get all image files in the folder and sort numerically (1.png, 2.png, ..., 30.png)
        img_extensions = ('.png', '.jpg', '.jpeg')
        img_files = [f for f in os.listdir(folder_path) if f.lower().endswith(img_extensions)]
        
        def extract_number(filename):
            name = os.path.splitext(filename)[0]
            num_match = re.search(r'\d+', name)
            return int(num_match.group()) if num_match else 9999
            
        img_files = sorted(img_files, key=extract_number)
        print(f"  Found {len(img_files)} question images.")
        
        all_completed = True
        for img_file in img_files:
            question_no = os.path.splitext(img_file)[0]
            question_filepath = os.path.join(folder_path, img_file)
            
            # File outputs
            question_md_filename = f"{folder}_{question_no}.md"
            answer_md_path = os.path.join("answers", question_md_filename)
            
            # Skip if already processed (resumability)
            if os.path.exists(answer_md_path):
                print(f"  Q{question_no} already processed. Skipping.")
                continue
                
            try:
                # --- Step 2: OCR & Crop ---
                transcribed_text = run_ocr_and_crop(question_filepath, folder, question_no)
                
                # --- Step 3: Solve & Analyze ---
                solve_result = run_professor_solver(
                    question_filepath, transcribed_text, folder, question_no, config, folder_metadata
                )
                
                # Write answer markdown with YAML Frontmatter, Question and Explanation
                with open(answer_md_path, "w", encoding="utf-8") as a_file:
                    a_file.write("---\n")
                    a_file.write(f"exam_name: \"{folder_metadata['exam_name']}\"\n")
                    a_file.write(f"subject: \"{solve_result.get('subject')}\"\n")
                    a_file.write(f"level: \"{solve_result.get('level')}\"\n")
                    a_file.write(f"grade: \"{folder_metadata['grade']}\"\n")
                    a_file.write(f"year: {folder_metadata['year']}\n")
                    a_file.write(f"difficulty: {solve_result.get('difficulty')}\n")
                    a_file.write(f"topic_id: \"{solve_result.get('topic_id')}\"\n")
                    a_file.write(f"topic_name: \"{solve_result.get('topic_name')}\"\n")
                    a_file.write(f"answer: \"{solve_result.get('answer')}\"\n")
                    a_file.write("---\n\n")
                    
                    a_file.write("# คำถาม\n\n")
                    a_file.write(transcribed_text)
                    a_file.write("\n\n")
                    
                    a_file.write("# คำอธิบายและวิธีทำ\n\n")
                    a_file.write(solve_result.get("explanation", ""))
                    a_file.write("\n")
                print(f"    Saved answer markdown with question to {a_file.name}")
                
            except Exception as err:
                print(f"  Error processing Q{question_no} in folder {folder}: {err}")
                all_completed = False
                break
                
        # 5. Move folder to complete-job if all questions successfully processed
        if all_completed and img_files:
            dest_folder_path = os.path.join("complete-job", folder)
            try:
                shutil.move(folder_path, dest_folder_path)
                print(f"Successfully processed all questions. Moved folder {folder} to {dest_folder_path}")
            except Exception as move_err:
                print(f"Error moving folder {folder} to complete-job: {move_err}")
        else:
            print(f"Folder {folder} processing was incomplete or encountered errors. Not moving.")

if __name__ == "__main__":
    process_pending_jobs()
