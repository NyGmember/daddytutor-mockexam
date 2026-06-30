import os
import re
import json
import yaml
import shutil
import sqlite3

def parse_yaml(text):
    data = {}
    for line in text.splitlines():
        if not line.strip() or ":" not in line:
            continue
        key, val = line.split(":", 1)
        key = key.strip()
        val = val.strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        data[key] = val
    return data


def update_configuration_and_db(git_root, questions_list):
    config_path = os.path.join(git_root, "configuration.md")
    if not os.path.exists(config_path):
        print(f"Warning: {config_path} not found.")
        return

    with open(config_path, "r", encoding="utf-8") as f:
        config_content = f.read()

    match = re.match(r"^---\s*\n([\s\S]*?)\n---\s*\n", config_content)
    if not match:
        print("Warning: Frontmatter not found in configuration.md")
        return

    yaml_text = match.group(1)
    body_content = config_content[match.end():]
    config_obj = yaml.safe_load(yaml_text)

    # Collect unique topics from questions list
    unique_topics = {}
    for q in questions_list:
        topic_id = q.get("topicId")
        topic_name = q.get("topicNameTh")
        subject_id = q.get("subjectId")
        level_id = q.get("levelId")
        if topic_id and topic_name:
            unique_topics[topic_id] = {
                "name": topic_name,
                "subjectId": subject_id,
                "levelId": level_id
            }

    if not unique_topics:
        return

    # A. Update configuration.md
    modified = False
    subjects_config = config_obj.get("system_config", {}).get("subjects", [])
    
    for t_id, t_info in unique_topics.items():
        sub_id = t_info["subjectId"]
        lvl_id = t_info["levelId"]
        name_th = t_info["name"]

        # find subject
        subject = next((s for s in subjects_config if s.get("id") == sub_id), None)
        if not subject:
            continue

        # find level inside subject
        config_lvl_id = lvl_id.replace("math_", "").replace("sci_", "")
        
        # In configuration.md levels:
        # math maps to level_id directly: primary, lower_secondary, upper_secondary
        # sci maps to: primary, secondary
        if sub_id == "science" and config_lvl_id in ("lower_secondary", "upper_secondary"):
            config_lvl_id = "secondary"

        level = next((l for l in subject.get("levels", []) if l.get("id") == config_lvl_id), None)
        if not level:
            continue

        # For mathematics: topic list is under level["topics"]
        # For science: topic list is under level["categories"][category]["topics"]
        if sub_id == "mathematics":
            if "topics" not in level:
                level["topics"] = []
            
            # Check if topic already exists
            exists = any(t.get("id") == t_id for t in level["topics"])
            if not exists:
                level["topics"].append({
                    "id": t_id,
                    "name_th": name_th,
                    "description": name_th
                })
                modified = True
                print(f"Added topic '{t_id}' to configuration.md under math/{config_lvl_id}")
        else: # science
            categories = level.get("categories", [])
            # For lower_secondary, it maps to category id "general_science"
            # For primary, it also maps to category id "general_science"
            # For others, fallback to first category
            cat_id = "general_science"
            category = next((c for c in categories if c.get("id") == cat_id), None)
            if not category and categories:
                category = categories[0]
            
            if category:
                if "topics" not in category:
                    category["topics"] = []
                exists = any(t.get("id") == t_id for t in category["topics"])
                if not exists:
                    category["topics"].append({
                        "id": t_id,
                        "name_th": name_th,
                        "description": name_th
                    })
                    modified = True
                    print(f"Added topic '{t_id}' to configuration.md under science/{config_lvl_id}/{category.get('id')}")

    if modified:
        class CleanDumper(yaml.SafeDumper):
            def increase_indent(self, flow=False, indentless=False):
                return super(CleanDumper, self).increase_indent(flow, False)

        updated_yaml = yaml.dump(config_obj, Dumper=CleanDumper, allow_unicode=True, sort_keys=False, default_flow_style=False, width=1000)
        with open(config_path, "w", encoding="utf-8") as f:
            f.write(f"---\n{updated_yaml}---\n{body_content}")
        print("Successfully updated configuration.md with new topics!")

    # B. Update SQLite Database
    db_path = os.path.join(git_root, "webapp", "prisma", "dev.db")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            for t_id, t_info in unique_topics.items():
                sub_id = t_info["subjectId"]
                lvl_id = t_info["levelId"]
                name_th = t_info["name"]

                # 1. Ensure Subject exists
                sub_name = "คณิตศาสตร์" if sub_id == "mathematics" else "วิทยาศาสตร์"
                cursor.execute(
                    "INSERT INTO Subject (id, nameTh) VALUES (?, ?) ON CONFLICT(id) DO NOTHING",
                    (sub_id, sub_name)
                )

                # 2. Ensure Level exists
                lvl_name = "ประถมศึกษา" if "primary" in lvl_id else "มัธยมศึกษาตอนต้น" if "lower" in lvl_id else "มัธยมศึกษาตอนปลาย"
                cursor.execute(
                    "INSERT INTO Level (id, nameTh, subjectId) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING",
                    (lvl_id, lvl_name, sub_id)
                )

                # 3. Ensure Topic exists
                cursor.execute(
                    "INSERT INTO Topic (id, nameTh, levelId) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET nameTh=excluded.nameTh, levelId=excluded.levelId",
                    (t_id, name_th, lvl_id)
                )
            
            conn.commit()
            conn.close()
            print("Successfully updated SQLite database with new topics!")
        except Exception as e:
            print(f"Error updating SQLite database: {e}")

def bundle():
    git_root = "d:/Projects/DaddyTutor/Mock-exam"
    answers_dir = os.path.join(git_root, "answers")
    questions_dir = os.path.join(git_root, "questions")
    releases_dir = os.path.join(git_root, "releases")
    version = "1.0.3"
    
    print(f"Bundling all files in {answers_dir} to version {version}...")
    
    questions_list = []
    selected_ids = []
    
    for filename in os.listdir(answers_dir):
        if not filename.endswith(".md"):
            continue
            
        a_path = os.path.join(answers_dir, filename)
        q_id = os.path.splitext(filename)[0]
        selected_ids.append(q_id)
        
        with open(a_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        parts = content.split("---")
        if len(parts) < 3:
            print(f"Error: Invalid format in {filename}")
            continue
            
        yaml_text = parts[1]
        body_text = "---".join(parts[2:]).strip()
        
        # Parse questionText and answerText from body
        question_text = ""
        answer_text = ""
        has_question_header = "# คำถาม" in body_text
        explain_index = body_text.find("# คำอธิบายและวิธีทำ")
        
        if has_question_header and explain_index > -1:
            question_text = body_text[:explain_index].strip()
            # remove the '# คำถาม' prefix
            question_text = re.sub(r"^#\s*คำถาม\s*\n+", "", question_text).strip()
            answer_text = body_text[explain_index + len("# คำอธิบายและวิธีทำ"):].strip()
        else:
            if explain_index > -1:
                answer_text = body_text[explain_index + len("# คำอธิบายและวิธีทำ"):].strip()
            else:
                answer_text = body_text
            
            # fallback to legacy questions folder
            q_path = os.path.join(questions_dir, f"{q_id}.md")
            if os.path.exists(q_path):
                with open(q_path, "r", encoding="utf-8") as q_file:
                    question_text = q_file.read()
                    
        metadata = parse_yaml(yaml_text)
        
        # Extract images
        images = []
        img_regex = r"!\[.*?\]\(\.\./images/([^\)]+)\)"
        for match in re.finditer(img_regex, question_text):
            images.append(match.group(1))
            
        subject = metadata.get("subject", "คณิตศาสตร์")
        level_str = metadata.get("level", "")
        
        subject_id = "mathematics"
        if subject == "วิทยาศาสตร์" or subject.lower() == "science" or subject == "วิทยาศาสตร์พื้นฐาน" or subject == "ฟิสิกส์" or subject == "เคมี" or subject == "ชีวะ" or subject == "โลกและอวกาศ" or subject == "วิทยาศาสตร์ทั่วไป":
            subject_id = "science"
            
        level_id = ""
        if subject_id == "mathematics":
            if "ประถม" in level_str:
                level_id = "math_primary"
            elif "มัธยมปลาย" in level_str or "G10" in level_str:
                level_id = "math_upper_secondary"
            else:
                level_id = "math_lower_secondary"
        else:
            if "ประถม" in level_str:
                level_id = "sci_primary"
            elif "มัธยมปลาย" in level_str or "G10" in level_str:
                level_id = "sci_upper_secondary"
            else:
                level_id = "sci_lower_secondary"
                
        questions_list.append({
            "id": q_id,
            "subjectId": subject_id,
            "levelId": level_id,
            "topicId": metadata.get("topic_id", ""),
            "topicNameTh": metadata.get("topic_name", ""),
            "year": int(metadata.get("year", 2557)),
            "difficulty": int(metadata.get("difficulty", 3)),
            "questionText": question_text,
            "answerText": answer_text,
            "correctAnswer": str(metadata.get("answer", "")),
            "images": images
        })
        
    if not questions_list:
        print("No questions to bundle.")
        return
        
    # Update configuration.md and SQLite database with any new topics
    update_configuration_and_db(git_root, questions_list)
    
    # Write patch
    os.makedirs(releases_dir, exist_ok=True)
    patch_filename = f"patch_{version}.json"
    patch_path = os.path.join(releases_dir, patch_filename)
    
    with open(patch_path, "w", encoding="utf-8") as f:
        json.dump({"questions": questions_list}, f, indent=2, ensure_ascii=False)
        
    print(f"Wrote patch to {patch_path} ({len(questions_list)} questions)")
    
    # Update version.json
    version_path = os.path.join(git_root, "version.json")
    version_catalog = {"releases": []}
    if os.path.exists(version_path):
        with open(version_path, "r", encoding="utf-8") as f:
            try:
                version_catalog = json.load(f)
            except Exception:
                pass
                
    if not isinstance(version_catalog.get("releases"), list):
        version_catalog["releases"] = []
        
    if version not in version_catalog["releases"]:
        version_catalog["releases"].append(version)
        
    with open(version_path, "w", encoding="utf-8") as f:
        json.dump(version_catalog, f, indent=2, ensure_ascii=False)
        
    print("Updated version.json")
    
    # Archive files
    archive_questions_dir = os.path.join(git_root, "archive", "questions")
    archive_answers_dir = os.path.join(git_root, "archive", "answers")
    os.makedirs(archive_questions_dir, exist_ok=True)
    os.makedirs(archive_answers_dir, exist_ok=True)
    
    for q_id in selected_ids:
        q_src = os.path.join(questions_dir, f"{q_id}.md")
        a_src = os.path.join(answers_dir, f"{q_id}.md")
        
        q_dest = os.path.join(archive_questions_dir, f"{q_id}.md")
        a_dest = os.path.join(archive_answers_dir, f"{q_id}.md")
        
        if os.path.exists(q_src):
            shutil.move(q_src, q_dest)
        if os.path.exists(a_src):
            shutil.move(a_src, a_dest)
            
    print(f"Archived {len(selected_ids)} files to archive/")

if __name__ == "__main__":
    bundle()
