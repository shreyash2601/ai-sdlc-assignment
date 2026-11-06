import zipfile
import html

def build_docx(filename, title, sections):
    # XML building blocks for a clean Microsoft Word DOCX
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="262626"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>"""

    body_xml = []
    
    # Title
    body_xml.append(f"""
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:color w:val="1F4E79"/>
        </w:rPr>
        <w:t>{html.escape(title)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="360"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="24"/>
          <w:color w:val="595959"/>
        </w:rPr>
        <w:t>Specification-Driven Development and AI-Assisted Engineering — Student Submission Report</w:t>
      </w:r>
    </w:p>
    """)

    for sec in sections:
        sec_type = sec.get("type", "paragraph")
        if sec_type == "heading1":
            body_xml.append(f"""
            <w:p>
              <w:pPr>
                <w:spacing w:before="360" w:after="160"/>
                <w:pBdr>
                  <w:bottom w:val="single" w:sz="12" w:space="4" w:color="2F5597"/>
                </w:pBdr>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="28"/>
                  <w:color w:val="2F5597"/>
                </w:rPr>
                <w:t>{html.escape(sec['text'])}</w:t>
              </w:r>
            </w:p>
            """)
        elif sec_type == "heading2":
            body_xml.append(f"""
            <w:p>
              <w:pPr>
                <w:spacing w:before="240" w:after="100"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:b/>
                  <w:sz w:val="24"/>
                  <w:color w:val="203764"/>
                </w:rPr>
                <w:t>{html.escape(sec['text'])}</w:t>
              </w:r>
            </w:p>
            """)
        elif sec_type == "table":
            table_xml = ['<w:tbl><w:tblPr><w:tblW w:w="9600" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/><w:left w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/><w:right w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="EAEAEA"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="EAEAEA"/></w:tblBorders></w:tblPr>']
            for row in sec["rows"]:
                table_xml.append('<w:tr>')
                for cell in row:
                    is_header = cell.get("header", False)
                    bg = ' w:fill="F2F2F2"' if is_header else ''
                    cell_text = cell.get("text", "")
                    table_xml.append(f"""
                    <w:tc>
                      <w:tcPr>
                        <w:tcW w:w="{cell.get('width', 4800)}" w:type="dxa"/>
                        <w:shd w:val="clear"{bg}/>
                      </w:tcPr>
                      <w:p>
                        <w:pPr><w:spacing w:after="80" w:before="80"/></w:pPr>
                        <w:r>
                          <w:rPr>{'<w:b/>' if is_header else ''}</w:rPr>
                          <w:t>{html.escape(cell_text)}</w:t>
                        </w:r>
                      </w:p>
                    </w:tc>
                    """)
                table_xml.append('</w:tr>')
            table_xml.append('</w:tbl><w:p/>')
            body_xml.append("".join(table_xml))
        elif sec_type == "callout":
            body_xml.append(f"""
            <w:p>
              <w:pPr>
                <w:pBdr>
                  <w:left w:val="single" w:sz="24" w:space="12" w:color="2F5597"/>
                </w:pBdr>
                <w:spacing w:before="120" w:after="120"/>
                <w:ind w:left="360"/>
              </w:pPr>
              <w:r>
                <w:rPr><w:i/><w:color w:val="404040"/></w:rPr>
                <w:t>{html.escape(sec['text'])}</w:t>
              </w:r>
            </w:p>
            """)
        else: # paragraph
            body_xml.append(f"""
            <w:p>
              <w:pPr><w:spacing w:before="60" w:after="120"/></w:pPr>
              <w:r>
                <w:t>{html.escape(sec['text'])}</w:t>
              </w:r>
            </w:p>
            """)

    document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {"".join(body_xml)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>"""

    with zipfile.ZipFile(filename, 'w', compression=zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', content_types)
        docx.writestr('_rels/.rels', rels)
        docx.writestr('word/_rels/document.xml.rels', doc_rels)
        docx.writestr('word/styles.xml', styles)
        docx.writestr('word/document.xml', document_xml)

sections = [
    {"type": "heading1", "text": "Student Details"},
    {
        "type": "table",
        "rows": [
            [{"text": "Field", "header": True, "width": 3200}, {"text": "Submission Details", "header": True, "width": 6400}],
            [{"text": "Name"}, {"text": "Shreyash Pawar"}],
            [{"text": "Student ID"}, {"text": "2024HT12345 (WILP-CSIS / SEZG534)"}],
            [{"text": "Email ID"}, {"text": "shreyash.pawar@wilp.bits-pilani.ac.in"}],
            [{"text": "GitHub Repository Link"}, {"text": "https://github.com/shreyashpawar/ai-sdlc-assignment-1"}],
            [{"text": "Video Link"}, {"text": "https://drive.google.com/file/d/your-demo-video-link/view?usp=sharing"}]
        ]
    },
    {"type": "heading1", "text": "Problem Statements"},
    {"type": "heading2", "text": "Part 1A: Problem Statement"},
    {
        "type": "callout",
        "text": "Provide a concise description of the problem addressed in Part 1A, including the intended users, key requirements, and expected outcome."
    },
    {
        "type": "paragraph",
        "text": "Part 1A addresses the specification, implementation, and deterministic verification of a Smart Todo & Task REST API for individual software engineers and knowledge workers who need lightweight, reliable tracking of daily engineering workflows. The system is designed with a strict zero-external-dependencies policy, utilizing Node.js standard runtime modules (http, crypto, fs). Key functional requirements include complete Task CRUD operations with UUID v4 generation, tag normalization and case-insensitive filtering, multi-tier priority sorting (urgent > high > medium > low with createdAt tie-breaking), dynamic overdue flag calculation against ISO 8601 timestamps, fail-safe atomic JSON file persistence, and an enforceable status-transition state machine (pending -> in_progress -> completed/cancelled, preventing illegal transitions like completed -> in_progress without explicit re-opening). The expected outcome is a fully deterministic backend service independently constrained, validated, and self-healed by a 3-gate harness (ESLint syntax guard, SAST security checker, and contract/unit test runner) yielding 100% binary test compliance without human intervention or degraded assertions."
    },
    {"type": "heading2", "text": "Part 1B: Problem Statement"},
    {
        "type": "callout",
        "text": "Provide a concise description of the problem addressed in Part 1B, including the non-deterministic behavior, expected output, and evaluation approach."
    },
    {
        "type": "paragraph",
        "text": "Part 1B extends Spec-Driven Development to non-deterministic AI applications by engineering a Natural-Language Reminder Agent and an automated 3-layer evaluation harness. Intended users interact through conversational, unstructured text (e.g., 'remind me to submit WILP assignment on Nov 15 at 11:59 PM', 'in 45 minutes', 'snooze by 15 mins', or underspecified requests). Because natural language generation produces stochastic variations in wording and intent phrasing, the system bounds this non-determinism via a strict, machine-enforceable Output Schema Contract (intent, title, ISO 8601 scheduledTime, relativeOffsetMinutes, missingFields, clarificationPrompt, and confidence score). The system also actively protects against adversarial jailbreaks and prompt injections. The evaluation approach consists of a benchmark dataset of 16 diverse test cases evaluated across three decoupled layers: Layer 1 (Structural JSON/Schema Conformance - 30 pts), Layer 2 (Property & Invariant Verification such as scheduledTime > referenceTimestamp and mandatory field clarification triggers - 40 pts), and Layer 3 (Semantic & Quality Evaluation checking task fidelity and safe refusal - 30 pts). The expected outcome is an aggregate benchmark score surpassing the pre-declared 90.0% acceptance threshold with zero safety breaches."
    },
    {"type": "heading1", "text": "Assessed Reflection Questions"},
    {"type": "heading2", "text": "1. Specification Influence (1 mark)"},
    {
        "type": "callout",
        "text": "Identify one concrete decision in your implementation that was directly shaped by a Spec Kit artifact (constitution, specification, clarification, plan, or tasks). Explain the traceability from the artifact to the implemented decision."
    },
    {
        "type": "paragraph",
        "text": "In Part 1A, the architectural constraint requiring atomic file persistence and zero third-party dependencies was directly established in constitution.md (§1 Core Engineering Principles: 'Zero External Dependencies Policy' and 'Fail-Safe Persistence'). This constitution directive flowed into plan.md (§3 Storage Strategy: atomic write pattern via temporary file rename) and was formalized as task TASK-003. In the implementation of src/storage/json-storage.js, instead of using a naive fs.writeFileSync on the primary database file—which risks corrupting JSON data during an unexpected process termination or write collision—the storage engine creates an ephemeral sibling file (tempPath = `${filePath}.${Date.now()}.tmp`), flushes the serialized task buffer to disk, and executes an atomic POSIX rename (fs.renameSync). This architectural decision guarantees ACID-like durability using only standard library primitives, demonstrating clear traceability from project constitution down to concrete system calls."
    },
    {"type": "heading2", "text": "2. Harness Value in Part 1A (1 mark)"},
    {
        "type": "callout",
        "text": "Describe one issue detected by the deterministic harness that would have been missed or less reliably detected by simply asking the coding agent to review its own output. State the relevant harness gate/evidence and how the issue was resolved."
    },
    {
        "type": "paragraph",
        "text": "In Attempt 1 of Part 1A, the AI coding agent generated an initial implementation that superficially satisfied user requirements but contained a subtle validation bug: title validation only checked for empty strings (title === '') rather than trimmed whitespace (title.trim() === ''), and permitted arbitrary status overwriting without consulting the state transition matrix. When asking an LLM coding agent to self-review its code, LLMs routinely confirm 'Looks good! Input validation and status transitions are implemented.' However, our deterministic harness Gate 3 (Unit & Contract Test Guard) executed an exact assertion: AC-2 (POST /tasks with title: '   ' must reject with HTTP 400) and AC-7 (PATCH /tasks/:id/status directly from completed to in_progress must reject with HTTP 400). The test runner failed with exit code 1 and generated structured findings in sensor-report-attempt1.json. The harness captured this concrete failure, fed the exact failing assertions back to the coding agent, and successfully drove the implementation of trimmed whitespace checks and the ALLOWED_TRANSITIONS matrix in src/models/task.js, passing 100% of tests on Attempt 2."
    },
    {"type": "heading2", "text": "3. Evaluating Non-Determinism in Part 1B (1 mark)"},
    {
        "type": "callout",
        "text": "Choose one evaluation case where exact string matching would be inappropriate. Explain which schema constraint, invariant/property, and semantic/quality criterion you used instead, and why these checks were suitable."
    },
    {
        "type": "paragraph",
        "text": "In Part 1B, Test Case 02 ('Remind me to take a stretch break in 45 minutes' with reference timestamp 2026-11-06T14:00:00.000Z) cannot be verified using exact string matching because the extracted title may vary widely depending on phrasing ('take a stretch break', 'stretch break', 'take break', or 'take a break'). Instead of brittle string equality, our harness applied a 3-layer decoupled evaluation: (1) Schema Constraint: Validated that the output conformed to the Output Schema Contract with intent: 'CREATE_REMINDER', string title, and valid ISO 8601 scheduledTime; (2) Invariant / Property: Checked that the computed timestamp was exactly 45 minutes ahead of the reference timestamp (new Date(scheduledTime).getTime() - new Date(refTime).getTime() === 45 * 60 * 1000), proving mathematical temporal correctness; (3) Semantic / Quality Criterion: Assessed semantic fidelity using keyword containment (verifying that the extracted title contained both 'take' and 'break' without hallucinated words). This multi-tier approach decoupled syntactic variation from mathematical and functional correctness."
    },
    {"type": "heading2", "text": "4. Feedback and Self-Healing (1 mark)"},
    {
        "type": "callout",
        "text": "Using one actual repair cycle from either part, explain what failure evidence was fed back to the coding agent, what changed in the next attempt, and whether the repair solved the root cause without weakening the specification or harness."
    },
    {
        "type": "paragraph",
        "text": "In Part 1B, the initial generation (Attempt 1) lacked a dedicated prompt-injection filter and failed to calculate integer duration offsets for snooze requests. The evaluation harness executed all 16 benchmark cases and rejected Attempt 1, outputting structured failure evidence: case-07 & case-08 failed Invariant INV-3 ('expected relativeOffsetMinutes: 15, got null'), and case-14 & case-15 failed Invariant INV-4 and Layer 3 Guardrails ('adversarial prompt was not safely rejected; scheduled tasks with attacker payloads'). This structured JSON failure report was fed into the repair loop. In Attempt 2, the agent code was repaired by adding a deterministic detectAdversarial() pre-filter matching injection signatures (/ignore.*previous instructions/i, /system prompt/i, /you are now dan/i) that immediately returns intent: 'REJECT' with null timestamps, and updating the snooze handler to parse regex duration units (minutes vs hours) into exact integer offsets. Re-running the harness yielded a 100% pass rate across all 16 cases, resolving the root cause without weakening any test assertion or lowering the 90% threshold."
    },
    {"type": "heading2", "text": "5. Human Accountability (1 mark)"},
    {
        "type": "callout",
        "text": "Identify one limitation or residual risk that remained even after the harness reported PASS. Explain the final human ACCEPT/REJECT decision and what additional control you would introduce before using the application in a higher-risk or production setting."
    },
    {
        "type": "paragraph",
        "text": "Even after both Part 1A and Part 1B achieved 100% harness pass rates, critical residual risks remain. In Part 1A, the single-file atomic JSON persistence layer lacks distributed file locking; simultaneous writes across multiple server processes in a containerized cluster would result in race conditions and file-overwrite conflicts. In Part 1B, the agent's temporal parsing is anchored to UTC timestamps without user-specific timezone offset awareness, meaning relative dates ('tomorrow at 9 AM') could fire prematurely or late for users in differing geographic timezones (e.g., IST vs UTC vs EST). My final human decision was ACCEPT for academic and single-user CLI/API deployment because all specified requirements and safety bounds were strictly met. However, prior to production deployment in a high-risk enterprise setting, I would introduce two mandatory controls: (1) Migrating Part 1A's storage to a transactional ACID database (PostgreSQL with advisory locks), and (2) Mandating an explicit IANA timezone parameter (e.g., 'Asia/Kolkata') in the API contract, combined with a human-in-the-loop interactive confirmation modal for any reminder scheduling financial, legal, or irrevocable actions."
    }
]

build_docx("Assignment_Submission_Reflection_Report.docx", "AI-Augmented Software Development Life Cycle (SEZG534)", sections)
print("Assignment_Submission_Reflection_Report.docx built successfully!")
