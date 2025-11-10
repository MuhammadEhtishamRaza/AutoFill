
// Key possible label texts/ID fragments mapping
const keyLabelMap = {
  resumeUrl: ["Resume", "Upload Resume", "Upload your resume"],
  coverLetterUrl: ["Cover Letter", "Upload Cover Letter", "cover_letter_label"],
  firstName: ["First Name"],
  lastName: ["Last Name"],
  fullName: ["CC305 Name label"],
  email: ["Email", "Email Address", "E-mail"],
  howDidYouHear: ["How did you hear about us?", "Referral Source", "How did you learn"],
  lastUpdated: ["Disability CC305 Date label"],
  disabilityStatus: ["Disability Disability Status", "Disability Status"],
  veteranStatus: ["Veteran", "VEVRAA"],
  willingToRelocate: ["Willing to Relocate", "Relocation", "Are you open to relocation?"],
  desiredSalary: ["Desired Salary", "Salary Expectation"],
  remoteWorkPreference: ["Remote Work Preference", "Work from Home Preference"],
  authorizedToWork: ["permitted","Authorized", "Authorization"],
  requireSponsorship: ["Require Sponsorship", "Visa Sponsorship Required"],
  street: ["Address Line", "Current Address", "Street Address"],
  city: ["Address City"],
  state: ["Address State", "Province"],
  zipCode: ["Address Zip Code", "Postal Code"],
  country: ["Address Country", "Nation"]
};

// Chrome message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message:", message);
  if (message.type === 'START_AUTOFILL') {
    console.log("Content user data: ", message.userData);
    Autofill(message.userData);
    sendResponse({ status: "success", userData: message.userData });
  }
  return true;
});

// Autofill entry point
const Autofill = async (userData) => {
  callFindLabelAndInput(userData);
  getEmptyInputs(userData);
  await handleFileKeysSequentially(userData);
  // console.log("Empty Input: ",getEmptyInputs())
}

// Recursively call for nested objects
function callFindLabelAndInput(obj, parentKey = '') {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const fullKey = key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
         callFindLabelAndInput(value, fullKey);
      } else {
        // Handle file keys separately
        if (key !== "resumeUrl" || key !== "coverLetterUrl") {
          findLabelandInput(fullKey, value);
        }
      }
    }
  }
}

// Sequence-aware matching with priority
function sequenceMatch(labelText, key) {
  const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
  const keyWords = formattedKey.split(' ').filter(Boolean);
  const labelWords = labelText.toLowerCase().split(/\s+/).filter(Boolean);

  let lastMatchedIndex = -1;
  let matchCount = 0;

  keyWords.forEach(kw => {
    const index = labelWords.findIndex((lw, i) => i > lastMatchedIndex && lw.startsWith(kw));
    if (index !== -1) {
      lastMatchedIndex = index;
      matchCount++;
    }
  });

  return matchCount; // Return the number of matching words
}


function findLabelandInput(key, value) {
  // Handle text / textarea / select inputs
  const labels = document.querySelectorAll('label');
  const possibleLabels = keyLabelMap[key] || [];

  let bestMatch = null;
  let highestScore = 0;

  Array.from(labels).forEach(label => {
      const labelText = label.textContent.trim().toLowerCase();
      const labelId = label.getAttribute("id") || '';
      const formattedLabelId = labelId.replace(/_/g, ' ').toLowerCase();

      let score = 0;

      possibleLabels.forEach(lbl => {
          const lblLower = lbl.toLowerCase();
          if (labelText === lblLower || formattedLabelId === lblLower) score += 10;
          else if (labelText.startsWith(lblLower) || formattedLabelId.startsWith(lblLower)) score += 5;
          else if (labelText.includes(lblLower) || formattedLabelId.includes(lblLower)) score += 2;
      });

      const seqMatchText = sequenceMatch(labelText, key);
      const seqMatchId = sequenceMatch(formattedLabelId, key);
      score += Math.max(seqMatchText, seqMatchId);

      if (score > highestScore) {
          highestScore = score;
          bestMatch = label;
      }
  });

  if (!bestMatch) {
      console.log(`No matching label found for key: ${key}`);
      return;
  }

  // Attempt to find input associated with the best label
  let inputFound = null;

  // Try label "for" attribute
  const bestMatchFor = bestMatch.getAttribute("for");
  if (bestMatchFor) {
      inputFound = document.getElementById(bestMatchFor);
  }

  // Fallback: input inside label
  if (!inputFound) {
      inputFound = bestMatch.querySelector("input, textarea, select");
  }

  // Fallback: input inside parent container
  if (!inputFound) {
      inputFound = bestMatch.closest("div")?.querySelector("input, textarea, select");
  }

  if (!inputFound) {
      console.log(`No input found for key: ${key}`);
      return;
  }
  // Set value and dispatch events
  if (inputFound && inputFound.tagName.toLowerCase() === "input"){
    inputFound.value = value;
    inputFound.dispatchEvent(new Event('input', { bubbles: true }));
    inputFound.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`Input for key "${key}" set successfully:`, inputFound);
  }else if (inputFound && inputFound.tagName.toLowerCase() === "div"){
    const targetInput = inputFound.querySelectorAll("input");
    console.log(targetInput)
    if (targetInput) {
      targetInput[0].value = value;
      targetInput[0].dispatchEvent(new Event('input', { bubbles: true }));
      targetInput[0].dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Input for key "${key}" set successfully:`, targetInput[0]);
    }else{
      console.log(`No input found for key: ${key}`);
    }
  }
}

function getEmptyInputs(userData) {
  const emptyInputs = [];
  const inputs = document.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    if (!input.value) {
      emptyInputs.push(input);
    }
  });

  if (emptyInputs.length > 0) {
    for (let i = 0; i < emptyInputs.length; i++) {
      if (emptyInputs[i].id.includes("phone")) {
        emptyInputs[i].value = userData.phoneNumber;
        emptyInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        emptyInputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Input for key "${emptyInputs[i].id}" set successfully:`, emptyInputs[i]);
      }else if (emptyInputs[i].placeholder && emptyInputs[i].placeholder.includes("country code")) {
        emptyInputs[i].value = userData.currentAddress.country;
        emptyInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        emptyInputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Input for key "${emptyInputs[i].id}" set successfully:`, emptyInputs[i]);
      }else if (emptyInputs[i].id && emptyInputs[i].id.includes("first name")) {
        emptyInputs[i].value = userData.firstName;
        emptyInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        emptyInputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Input for key "${emptyInputs[i].id}" set successfully:`, emptyInputs[i]);
      }else if (emptyInputs[i].id && emptyInputs[i].id.includes("last name")) {
        emptyInputs[i].value = userData.lastName;
        emptyInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        emptyInputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Input for key "${emptyInputs[i].id}" set successfully:`, emptyInputs[i]);
      }else if (emptyInputs[i].id && emptyInputs[i].id.includes("email")) {
        emptyInputs[i].value = userData.email;
        emptyInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        emptyInputs[i].dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Input for key "${emptyInputs[i].id}" set successfully:`, emptyInputs[i]);
      }
    }
  }

  return emptyInputs;
}

function promptFileSelection(input, key) {
    return new Promise((resolve) => {
        if (!input) {
            console.log(`File input not found for ${key}`);
            resolve(null);
            return;
        }

        // Listen for change event (user selected file)
        input.addEventListener('change', function handler() {
            input.removeEventListener('change', handler);
            resolve(input.files[0]); // resolve with selected file
        });

        alert(`Please select the file for ${key} manually.`);
        input.click(); // open file picker
    });
}
async function handleFileKeysSequentially(userData) { 
  // Resume 
  if (userData.resumeUrl) { 
    const resumeInput = document.querySelector( 'div[aria-labelledby="section-header-resume"] input[type=file]' ); 
    if (resumeInput) { 
      await setDummyFile(resumeInput, 'resume.pdf', 
        `%PDF-1.1
        %¥±ë

        1 0 obj
          << /Type /Catalog
            /Pages 2 0 R
          >>
        endobj

        2 0 obj
          << /Type /Pages
            /Kids [3 0 R]
            /Count 1
            /MediaBox [0 0 300 144]
          >>
        endobj

        3 0 obj
          <<  /Type /Page
              /Parent 2 0 R
              /Resources
              << /Font
                  << /F1
                      << /Type /Font
                          /Subtype /Type1
                          /BaseFont /Times-Roman
                      >>
                  >>
              >>
              /Contents 4 0 R
          >>
        endobj

        4 0 obj
          << /Length 55 >>
        stream
          BT
            /F1 18 Tf
            0 0 Td
            (Hello World) Tj
          ET
        endstream
        endobj

        xref
        0 5
        0000000000 65535 f 
        0000000018 00000 n 
        0000000077 00000 n 
        0000000178 00000 n 
        0000000457 00000 n 
        trailer
          <<  /Root 1 0 R
              /Size 5
          >>
        startxref
        565
        %%EOF`); 
    } 
  } 
  // Cover Letter 
  if (userData.coverLetterUrl) { 
    const coverInput = document.querySelector( '.file-upload-Cover_Letter_cover_letter input[type=file]' ); 
    if (coverInput) { 
      await setDummyFile(coverInput, 'coverletter.pdf', 'Dummy cover letter content'); 
    } 
  } 
} 
async function setDummyFile(inputElement, fileName, content) { 
  if (!inputElement) return; 
  const blob = new Blob([content], { type: "application/pdf" }); 
  const file = new File([blob], fileName, { type: "application/pdf" }); 
  const dt = new DataTransfer(); 
  dt.items.add(file); 
  inputElement.files = dt.files; // Trigger change events so React/Vue picks it up 
  inputElement.dispatchEvent(new Event('input', { bubbles: true })); 
  inputElement.dispatchEvent(new Event('change', { bubbles: true })); 
  console.log(`${fileName} set successfully`); 
}