# IMPLEMENTATION.md

*Project:* PTC — Eightfold AI Autofill Chrome Extension  
*Author:* Muhammasd Ehtisham Raza  
*Submission:* Muhammad_Ehtisham_Raza_PTC_Eightfold_Autofill.zip  
*Deadline:* Monday, November 10, 2025

---

## Table of contents
1. Summary
2. Folder Structure
3. How it works (architecture & flow)
4. Field coverage & mapping
5. Key implementation details
6. How to run / test (step-by-step)
7. Challenges & known limitations
8. Time spent

---

## 1 — Summary
This Chrome extension automates filling an Eightfold AI multi-step job application (PTC Careers). It detects when the user is on an Eightfold job application page, injects a content script, and fills form fields using label-matching heuristics, DOM traversal, and targeted selectors. It supports common field types (text, select, checkbox, radio, and file upload) and attempts programmatic file uploads where feasible.

Objectives:
- Detect Eightfold application pages and trigger autofill via the extension popup.
- Fill common field types and dispatch events so reactive frameworks pick up changes.
- Attempt to handle file upload inputs programmatically; provide manual fallback when necessary.

---

## 2 — Folder Strucute
Files included in the extension folder:

```
autofill-extension/
├─ manifest.json
├─ popup.html
├─ popup.js
├─ background.js
├─ content.js
├─ test-data.json
├─ icon16.png
└─ icon48.png
```

- manifest.json — MV3 manifest, permissions, and content script declarations.
- popup.html + popup.js — UI with an AutoFill button; loads test-data.json and triggers autofill on the active tab.
- background.js — minimal service worker for MV3 (keeps extension compliant).
- content.js — main autofill logic: listens for messages, finds fields via heuristics, sets values, dispatches events, and performs file handling.
- test-data.json — sample user data used during the demo.

---

## 3 — How it works (architecture & flow)

1. *User action*: Click extension icon → popup.html appears → click *AutoFill*.
2. *Popup*: popup.js fetches test-data.json, ensures content.js is injected using chrome.scripting.executeScript, then sends a message to the content script: { type: "START_AUTOFILL", userData }.
3. *Content script*: content.js receives the message and invokes Autofill(userData).
4. *Autofill process*:
   - Recursively traverse userData keys.
   - Use a keyLabelMap and sequenceMatch() heuristic to find best matching <label> elements.
   - Find and set the associated `<input>`value and dispatch input/change events.
   - For file uploads, attempt to create a File object and assign it using DataTransfer() to input.files.
5. *Finish*: Content script responds with a success message; popup updates status text.

---

## 4 — Field coverage & mapping

The implementation targets the fields outlined in the assessment. The code uses keyLabelMap (expected label fragments) and heuristics; success depends on exact label text and DOM structure.

*Estimated coverage:* The heuristics are designed to fill all the test-data.json key value pairs detected fields in common cases.

---

## 5 — Key implementation details & heuristics

### Label & sequence matching
- keyLabelMap stores expected label fragments for each key to increase matching probability.
- The sequenceMatch(labelText, key) function converts keys to space-separated words and attempts to match them in sequence against the label words, returning a match score.

### Input discovery strategy (ordered)
1. Use the label’s for attribute to find the element by id.
2. If the found elements tag name is input then set the value.
3. If the found elements tag name is div then find childern whose tag is input. If found then set the value. 

### Events & React/Vue compatibility
- After setting .value, the script dispatches input and change events with bubbles: true. This covers many controlled-input scenarios.

### File upload handling
- Attempt to programmatically set input.files using DataTransfer() with a generated File object (e.g., a small dummy PDF). This triggers input/change events afterwards.

### Fallbacks and heuristics
- The script scans for empty inputs and applies fallback logic (e.g., if an input id contains phone, use userData.phone).
- Logs missed fields to the console to help debugging and mapping adjustments.

---

## 6 — How to run /  test (step-by-step)

*Load extension locally*
1. Open Chrome → chrome://extensions.
2. Enable *Developer mode*.
3. Click *Load unpacked* and select the autofill-extension folder.

*Demo flow*
1. Navigate to the PTC job application URL:
   https://ptc.eightfold.ai/careers/apply?pid=137477695724
2. Click the extension icon → popup appears → click *AutoFill*.
3. The popup will load test-data.json and send the data to the page.
4. Observe the page: fields should populate. The file upload fields are managed programmatically.
5. Do *not* submit the application; test only fills fields.

---

## 7 — Challenges & known limitations

### 1) Reactive frameworks and controlled inputs
- Many inputs are controlled by frameworks (React/Vue). Some framework-controlled inputs ignore direct .value changes. Dispatching input/change events helps in this regard.

### 2) File upload restrictions
- Browser and app security/handlers prevent programmatic file selection from behaving identically to a real user. The DataTransfer approach works in many environments. The input file click event can not be triggered for two different input fields. The resume.pdf text data was not accepted as it returns a response of 400 format not supported. So dummy pdf format text is used for resume upload.

### 3) DOM variability
- The extension relies on label text, for or id attributes, and DOM proximity; different label wording, nested component structures, or dynamic rendering have reduced match success.

### 4) Accessibility & internationalization
- The heuristics are English-centric and may not handle localized labels or right-to-left layouts without adjustments.

---


## 8 — Time spent (approximate)
- Design & planning: 2 hours
- Core coding (popup, messaging, label heuristics): 3.5 hours
- File handling & testing: 1.5 hours
- Testing/debugging on sample PTC page: 1 hour
- Documentation & packaging: 1 hours

*Total:* ≈ 9 hours 

---
