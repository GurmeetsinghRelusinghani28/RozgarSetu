const GROQ_API_BASE = process.env.GROQ_API_BASE || "https://api.groq.com/openai/v1";
const GROQ_CHAT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_TRANSCRIPTION_MODEL =
  process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo";

const allowedSkills = new Set([
  "mason",
  "carpenter",
  "electrician",
  "painter",
  "helper",
  "plumber",
  "welder",
  "driver",
]);

const allowedProjectSkills = new Set([
  "mason",
  "carpenter",
  "electrician",
  "painter",
  "helper",
  "plumber",
]);

// Helper to clean up JSON output returned by the AI model.
const cleanJSON = (text) => {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error("Failed to parse clean JSON:", text, error);
    throw new Error("AI output was not valid JSON");
  }
};

const toEnglishNumber = (value) => {
  if (!value) return null;

  const devanagariDigits = "०१२३४५६७८९";
  const normalizedDigits = String(value).replace(/[०-९]/g, (digit) =>
    devanagariDigits.indexOf(digit),
  );

  const parsed = parseInt(normalizedDigits, 10);
  if (!Number.isNaN(parsed)) return parsed;

  const wordNumbers = {
    एक: 1,
    दो: 2,
    तीन: 3,
    चार: 4,
    पांच: 5,
    पाँच: 5,
    छ: 6,
    छह: 6,
    सात: 7,
    आठ: 8,
    नौ: 9,
    दस: 10,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  return wordNumbers[String(value).toLowerCase()] || null;
};

const normalizeProfile = (profile = {}) => {
  const skills = Array.isArray(profile.skills)
    ? profile.skills.filter((skill) => allowedSkills.has(skill))
    : [];

  return {
    name: typeof profile.name === "string" ? profile.name.trim() : "",
    city: typeof profile.city === "string" ? profile.city.trim() : "",
    experience:
      Number.isFinite(Number(profile.experience)) && Number(profile.experience) > 0
        ? Number(profile.experience)
        : 1,
    skills: skills.length ? skills : ["helper"],
  };
};

const parseProfileLocally = (text) => {
  const lowercaseText = text.toLowerCase();

  const skillMatchers = [
    { skill: "mason", terms: ["राजमिस्त्री", "मिस्त्री", "ईंट", "चिनाई", "mason"] },
    { skill: "carpenter", terms: ["बढ़ई", "बढई", "लकड़ी", "फर्नीचर", "carpenter"] },
    { skill: "electrician", terms: ["इलेक्ट्रीशियन", "बिजली", "तार", "electrician"] },
    { skill: "painter", terms: ["पेंटर", "पेन्टर", "रंग", "पुताई", "painter", "paint"] },
    { skill: "helper", terms: ["हेल्पर", "मजदूर", "सहायक", "helper", "labour", "labor"] },
    { skill: "plumber", terms: ["प्लम्बर", "प्लंबर", "नल", "पाइप", "plumber"] },
    { skill: "welder", terms: ["वेल्डर", "वेल्डिंग", "लोहा", "welder", "welding"] },
    { skill: "driver", terms: ["ड्राइवर", "गाड़ी", "चालक", "driver"] },
  ];

  const cityMatchers = [
    { city: "Akola", terms: ["अकोला", "akola"] },
    { city: "Noida", terms: ["नोएडा", "noida"] },
    { city: "Mumbai", terms: ["मुंबई", "mumbai", "बॉम्बे", "bombay"] },
    { city: "Delhi", terms: ["दिल्ली", "delhi"] },
    { city: "Pune", terms: ["पुणे", "pune"] },
    { city: "Nagpur", terms: ["नागपुर", "nagpur"] },
    { city: "Nashik", terms: ["नासिक", "nashik"] },
    { city: "Jaipur", terms: ["जयपुर", "jaipur"] },
    { city: "Gurugram", terms: ["गुरुग्राम", "गुड़गांव", "gurugram", "gurgaon"] },
    { city: "Lucknow", terms: ["लखनऊ", "lucknow"] },
  ];

  const namePatterns = [
    /मेरा नाम\s+(.+?)\s+(?:है|हे|हूं|हूँ|और|,|\.|$)/i,
    /मैं\s+(.+?)\s+(?:हूं|हूँ|है|और|,|\.|$)/i,
    /my name is\s+(.+?)(?:\s+and|,|\.|$)/i,
    /i am\s+(.+?)(?:\s+from|,|\.|$)/i,
  ];

  let name = "";
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      name = match[1].trim();
      break;
    }
  }

  let city = "";
  for (const matcher of cityMatchers) {
    if (matcher.terms.some((term) => lowercaseText.includes(term.toLowerCase()))) {
      city = matcher.city;
      break;
    }
  }

  const experienceMatch = text.match(
    /(\d+|[०-९]+|एक|दो|तीन|चार|पांच|पाँच|छ|छह|सात|आठ|नौ|दस|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:साल|वर्ष|year|years)/i,
  );
  const experience = toEnglishNumber(experienceMatch?.[1]) || 1;

  const skills = skillMatchers
    .filter((matcher) =>
      matcher.terms.some((term) => lowercaseText.includes(term.toLowerCase())),
    )
    .map((matcher) => matcher.skill);

  return normalizeProfile({ name, city, experience, skills });
};

const getProjectSystemPrompt = () => {
  return `You are an AI assistant for RozgarSetu, a blue-collar labor marketplace connecting workers with contractors.
Your task is to analyze a contractor's spoken job requirement and extract project/job posting details into structured JSON.

Allowed skill options in RozgarSetu:
- 'mason' (राजमिस्त्री, मिस्त्री, ईंट, चिनाई)
- 'carpenter' (बढ़ई, लकड़ी, फर्नीचर)
- 'electrician' (इलेक्ट्रीशियन, बिजली, तार)
- 'painter' (पेंटर, रंग-रोगन, पुताई)
- 'helper' (हेल्पर, मजदूर, सहायक)
- 'plumber' (प्लम्बर, नल, पाइप)

Extract these fields:
1. "projectTitle": Short job title, e.g. "House Painting Work". If unclear, create a concise title from the requirement.
2. "location": City/location in standard Latin script/English where possible, e.g. "Akola", "Noida".
3. "startDate": Date in YYYY-MM-DD format if mentioned. If not mentioned, return "".
4. "skillType": One allowed skill key. If unclear, default to "helper".
5. "subSkill": Relevant sub-skill in English if clear, otherwise "".
6. "workerCount": Number of workers required. If not mentioned, default to 1.
7. "wage": Daily wage amount as a number. If not mentioned, return "".
8. "food": true if food is offered, otherwise false.
9. "accommodation": true if stay/room/accommodation is offered, otherwise false.
10. "insurance": true if insurance is offered, otherwise false.
11. "pf": true if PF is offered, otherwise false.
12. "description": A clear one or two sentence job description.

Output MUST be a valid JSON object ONLY. Do not write markdown, headers, or explanations.`;
};

const normalizeProject = (project = {}) => ({
  projectTitle:
    typeof project.projectTitle === "string" ? project.projectTitle.trim() : "",
  location: typeof project.location === "string" ? project.location.trim() : "",
  startDate: typeof project.startDate === "string" ? project.startDate.trim() : "",
  skillType: allowedProjectSkills.has(project.skillType) ? project.skillType : "helper",
  subSkill: typeof project.subSkill === "string" ? project.subSkill.trim() : "",
  workerCount:
    Number.isFinite(Number(project.workerCount)) && Number(project.workerCount) > 0
      ? Number(project.workerCount)
      : 1,
  wage:
    project.wage !== "" && Number.isFinite(Number(project.wage)) && Number(project.wage) > 0
      ? Number(project.wage)
      : "",
  food: Boolean(project.food),
  accommodation: Boolean(project.accommodation),
  insurance: Boolean(project.insurance),
  pf: Boolean(project.pf),
  description:
    typeof project.description === "string" ? project.description.trim() : "",
});

const parseProjectLocally = (text) => {
  const lowercaseText = text.toLowerCase();
  const skillMatchers = [
    { skill: "mason", title: "Masonry Work", terms: ["राजमिस्त्री", "मिस्त्री", "ईंट", "चिनाई", "mason"] },
    { skill: "carpenter", title: "Carpentry Work", terms: ["बढ़ई", "बढई", "लकड़ी", "फर्नीचर", "carpenter"] },
    { skill: "electrician", title: "Electrical Work", terms: ["इलेक्ट्रीशियन", "बिजली", "तार", "electrician"] },
    { skill: "painter", title: "Painting Work", terms: ["पेंटर", "पेन्टर", "रंग", "पुताई", "painter", "paint"] },
    { skill: "helper", title: "Helper Work", terms: ["हेल्पर", "मजदूर", "सहायक", "helper", "labour", "labor"] },
    { skill: "plumber", title: "Plumbing Work", terms: ["प्लम्बर", "प्लंबर", "नल", "पाइप", "plumber"] },
  ];
  const cityMatchers = [
    { city: "Akola", terms: ["अकोला", "akola"] },
    { city: "Noida", terms: ["नोएडा", "noida"] },
    { city: "Mumbai", terms: ["मुंबई", "mumbai", "बॉम्बे", "bombay"] },
    { city: "Delhi", terms: ["दिल्ली", "delhi"] },
    { city: "Pune", terms: ["पुणे", "pune"] },
    { city: "Nagpur", terms: ["नागपुर", "nagpur"] },
    { city: "Gurugram", terms: ["गुरुग्राम", "गुड़गांव", "gurugram", "gurgaon"] },
  ];

  const skillMatch =
    skillMatchers.find((matcher) =>
      matcher.terms.some((term) => lowercaseText.includes(term.toLowerCase())),
    ) || skillMatchers.find((matcher) => matcher.skill === "helper");
  const cityMatch = cityMatchers.find((matcher) =>
    matcher.terms.some((term) => lowercaseText.includes(term.toLowerCase())),
  );
  const workerMatch = text.match(
    /(\d+|[०-९]+|एक|दो|तीन|चार|पांच|पाँच|छ|छह|सात|आठ|नौ|दस|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:worker|workers|मजदूर|कारीगर|लोग|बंदे|आदमी|पेंटर|पेन्टर|मिस्त्री|प्लम्बर|प्लंबर|हेल्पर|बढ़ई|electrician|painter|plumber|helper|carpenter|mason)/i,
  );
  const wageMatch = text.match(
    /(?:₹|rs\.?|रुपये|मजदूरी|वेतन|wage|pay|payment|daily|दिहाड़ी)\s*(\d+|[०-९]+)|(\d+|[०-९]+)\s*(?:₹|rs\.?|रुपये|per day|daily|दिहाड़ी|रोज)/i,
  );

  return normalizeProject({
    projectTitle: skillMatch?.title || "Job Work",
    location: cityMatch?.city || "",
    skillType: skillMatch?.skill || "helper",
    workerCount: toEnglishNumber(workerMatch?.[1]) || 1,
    wage: toEnglishNumber(wageMatch?.[1] || wageMatch?.[2]) || "",
    food: /खाना|भोजन|food/i.test(text),
    accommodation: /रहना|रहने|रुकना|रूम|कमरा|stay|room|accommodation|आवास/i.test(text),
    insurance: /insurance|बीमा/i.test(text),
    pf: /\bpf\b|पीएफ/i.test(text),
    description: text.trim(),
  });
};

const parseGroqError = async (response) => {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body);
    return parsed.error?.message || parsed.message || body;
  } catch {
    return body;
  }
};

const getGroqHeaders = () => ({
  Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
});

const parseProfileWithGroq = async (text) => {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      ...getGroqHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      temperature: 0,
      max_completion_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: `Worker speech text: "${text}"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq chat API error: ${await parseGroqError(response)}`);
  }

  const data = await response.json();
  const resultText = data.choices?.[0]?.message?.content;

  if (!resultText) {
    throw new Error("Groq chat API returned an empty response.");
  }

  console.log(`🤖 Groq response from ${GROQ_CHAT_MODEL}: ${resultText}`);
  return normalizeProfile(cleanJSON(resultText));
};

const parseProjectWithGroq = async (text) => {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      ...getGroqHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      temperature: 0,
      max_completion_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: getProjectSystemPrompt(),
        },
        {
          role: "user",
          content: `Contractor job requirement: "${text}"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq chat API error: ${await parseGroqError(response)}`);
  }

  const data = await response.json();
  const resultText = data.choices?.[0]?.message?.content;

  if (!resultText) {
    throw new Error("Groq chat API returned an empty response.");
  }

  console.log(`🤖 Groq project response from ${GROQ_CHAT_MODEL}: ${resultText}`);
  return normalizeProject(cleanJSON(resultText));
};

const transcribeAudioWithGroq = async (file) => {
  const formData = new FormData();
  const mimeType = file.mimetype || "audio/m4a";
  const filename = file.originalname || "recording.m4a";
  const audioBlob = new Blob([file.buffer], { type: mimeType });

  formData.append("file", audioBlob, filename);
  formData.append("model", GROQ_TRANSCRIPTION_MODEL);
  formData.append("response_format", "json");
  formData.append("temperature", "0");

  const response = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: getGroqHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Groq transcription API error: ${await parseGroqError(response)}`);
  }

  const data = await response.json();
  if (!data.text) {
    throw new Error("Groq transcription API returned an empty transcript.");
  }

  console.log(`🤖 Groq transcription from ${GROQ_TRANSCRIPTION_MODEL}: ${data.text}`);
  return data.text;
};

const getSystemPrompt = () => {
  return `You are an AI assistant for RozgarSetu, a blue-collar labor marketplace connecting workers with contractors.
Your task is to analyze the worker's spoken input (which might be in Hindi, English, Marathi, Haryanvi, Bengali, Bhojpuri, etc.) and extract their profile details into a structured JSON format.

Allowed skill options in RozgarSetu (map any mentioned skill to one or more of these EXACT keys in the JSON array):
- 'mason' (राजमिस्त्री, ईंट, चिनाई)
- 'carpenter' (बढ़ई, लकड़ी, फर्नीचर)
- 'electrician' (इलेक्ट्रीशियन, बिजली, तार)
- 'painter' (पेंटर, रंग-रोगन, पुताई)
- 'helper' (हेल्पर, मजदूर, सहायक)
- 'plumber' (प्लम्बर, नल, पाइप)
- 'welder' (वेल्डर, वेल्डिंग, लोहा)
- 'driver' (ड्राइवर, गाड़ी, चालक)

Extract the following fields from the input:
1. "name": The worker's name. Preserve native script (e.g. Hindi name in Devanagari script, like "सुरेश कुमार") if spoken, otherwise English. If not mentioned, default to "".
2. "city": The location/city. Normalize to standard Latin script/English name (e.g. "Noida", "Mumbai", "Delhi", "Pune"). If not mentioned, default to "".
3. "experience": The number of years of experience mentioned as a number (e.g. 5). If not mentioned or unclear, default to 1.
4. "skills": An array of one or more of the allowed skill keys list above. If none match, default to ["helper"].

Output MUST be a valid JSON object ONLY. Do not write any markdown code fences, headers, or explanations.
Example Output:
{
  "name": "सुरेश कुमार",
  "city": "Noida",
  "experience": 5,
  "skills": ["welder"]
}`;
};

const parseProfileFromText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Text input is required." });
    }

    console.log(`🤖 Parsing profile text: "${text}"`);

    // If Groq key is missing, run our rule-based parser fallback
    if (!process.env.GROQ_API_KEY) {
      console.warn(
        "⚠️ GROQ_API_KEY is not set. Using rule-based parser.",
      );

      return res.json({
        success: true,
        isFallback: true,
        profile: parseProfileLocally(text),
      });
    }

    const profile = await parseProfileWithGroq(text);

    res.json({
      success: true,
      isFallback: false,
      profile,
    });
  } catch (error) {
    console.error("AI text parsing error:", error);
    const { text } = req.body;
    res.json({
      success: true,
      isFallback: true,
      message: "AI service failed, so a local parser filled the profile.",
      profile: parseProfileLocally(text || ""),
    });
  }
};

const parseProfileFromAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Audio file is required." });
    }

    console.log(
      `🤖 Parsing profile audio: filename=${req.file.originalname}, size=${req.file.size} bytes, mimetype=${req.file.mimetype}`,
    );

    if (!process.env.GROQ_API_KEY) {
      console.warn(
        "⚠️ GROQ_API_KEY is not set. Audio parsing needs Groq for transcription.",
      );
      return res.status(500).json({
        success: false,
        message: "GROQ_API_KEY is required to parse recorded voice.",
      });
    }

    const transcript = await transcribeAudioWithGroq(req.file);
    const profile = await parseProfileWithGroq(transcript);

    res.json({
      success: true,
      isFallback: false,
      transcript,
      profile,
    });
  } catch (error) {
    console.error("AI audio parsing error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const parseProjectFromText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Text input is required." });
    }

    console.log(`🤖 Parsing project text: "${text}"`);

    if (!process.env.GROQ_API_KEY) {
      console.warn("⚠️ GROQ_API_KEY is not set. Using rule-based project parser.");
      return res.json({
        success: true,
        isFallback: true,
        project: parseProjectLocally(text),
      });
    }

    const project = await parseProjectWithGroq(text);

    res.json({
      success: true,
      isFallback: false,
      project,
    });
  } catch (error) {
    console.error("AI project text parsing error:", error);
    const { text } = req.body;
    res.json({
      success: true,
      isFallback: true,
      message: "AI service failed, so a local parser filled the project.",
      project: parseProjectLocally(text || ""),
    });
  }
};

const parseProjectFromAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Audio file is required." });
    }

    console.log(
      `🤖 Parsing project audio: filename=${req.file.originalname}, size=${req.file.size} bytes, mimetype=${req.file.mimetype}`,
    );

    if (!process.env.GROQ_API_KEY) {
      console.warn(
        "⚠️ GROQ_API_KEY is not set. Project audio parsing needs Groq for transcription.",
      );
      return res.status(500).json({
        success: false,
        message: "GROQ_API_KEY is required to parse recorded project voice.",
      });
    }

    const transcript = await transcribeAudioWithGroq(req.file);
    const project = await parseProjectWithGroq(transcript);

    res.json({
      success: true,
      isFallback: false,
      transcript,
      project,
    });
  } catch (error) {
    console.error("AI project audio parsing error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  parseProfileFromText,
  parseProfileFromAudio,
  parseProjectFromText,
  parseProjectFromAudio,
};
