const Project = require("../models/Project");

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

const cleanJSON = (text) => {
  let cleaned = String(text || "").trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3);
  return JSON.parse(cleaned.trim());
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

const normalizeFilters = (filters = {}) => {
  const skills = Array.isArray(filters.skills)
    ? filters.skills.filter((skill) => allowedSkills.has(skill))
    : [];

  return {
    location: typeof filters.location === "string" ? filters.location.trim() : "",
    skills,
    facilities: {
      food: Boolean(filters.facilities?.food),
      accommodation: Boolean(filters.facilities?.accommodation),
      insurance: Boolean(filters.facilities?.insurance),
      pf: Boolean(filters.facilities?.pf),
    },
    minWage:
      Number.isFinite(Number(filters.minWage)) && Number(filters.minWage) > 0
        ? Number(filters.minWage)
        : undefined,
    language:
      typeof filters.language === "string" && filters.language.trim()
        ? filters.language.trim()
        : "Hindi",
  };
};

const extractFiltersLocally = (query) => {
  const text = String(query || "");
  const lower = text.toLowerCase();
  const skillMatchers = [
    { skill: "mason", terms: ["राजमिस्त्री", "मिस्त्री", "ईंट", "चिनाई", "mason"] },
    { skill: "carpenter", terms: ["बढ़ई", "बढई", "लकड़ी", "फर्नीचर", "carpenter"] },
    { skill: "electrician", terms: ["इलेक्ट्रीशियन", "बिजली", "तार", "electrician"] },
    { skill: "painter", terms: ["पेंटर", "पेन्टर", "रंग", "पुताई", "painter", "paint"] },
    { skill: "helper", terms: ["हेल्पर", "मजदूर", "सहायक", "helper", "labour", "labor"] },
    { skill: "plumber", terms: ["प्लम्बर", "प्लंबर", "नल", "पाइप", "plumber"] },
    { skill: "welder", terms: ["वेल्डर", "वेल्डिंग", "welder", "welding"] },
    { skill: "driver", terms: ["ड्राइवर", "चालक", "driver"] },
  ];
  const cityMatchers = [
    { city: "Ghaziabad", terms: ["गाजियाबाद", "ghaziabad"] },
    { city: "Akola", terms: ["अकोला", "akola"] },
    { city: "Noida", terms: ["नोएडा", "noida"] },
    { city: "Delhi", terms: ["दिल्ली", "delhi"] },
    { city: "Mumbai", terms: ["मुंबई", "mumbai"] },
    { city: "Pune", terms: ["पुणे", "pune"] },
    { city: "Nagpur", terms: ["नागपुर", "nagpur"] },
    { city: "Gurugram", terms: ["गुरुग्राम", "गुड़गांव", "gurugram", "gurgaon"] },
  ];
  const skills = skillMatchers
    .filter((matcher) => matcher.terms.some((term) => lower.includes(term.toLowerCase())))
    .map((matcher) => matcher.skill);
  const city = cityMatchers.find((matcher) =>
    matcher.terms.some((term) => lower.includes(term.toLowerCase())),
  );
  const wageMatch = text.match(/(?:₹|rs\.?|रुपये|wage|salary|दिहाड़ी)\s*(\d+)|(\d+)\s*(?:₹|rs\.?|रुपये|per day|daily)/i);

  return normalizeFilters({
    location: city?.city || "",
    skills,
    facilities: {
      food: /भोजन|खाना|food/i.test(text),
      accommodation: /रहना|रहने|कमरा|रूम|stay|room|accommodation|आवास/i.test(text),
      insurance: /insurance|बीमा/i.test(text),
      pf: /\bpf\b|पीएफ/i.test(text),
    },
    minWage: wageMatch?.[1] || wageMatch?.[2],
    language: /[अ-ह]/.test(text) ? "Hindi" : "English",
  });
};

const extractFiltersWithAI = async (query) => {
  if (!process.env.GROQ_API_KEY) return extractFiltersLocally(query);

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      ...getGroqHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      temperature: 0,
      max_completion_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract MongoDB job search filters from worker/contractor queries in Hindi, English, Marathi, or mixed language. Return JSON only with keys: location string, skills array using allowed values mason/carpenter/electrician/painter/helper/plumber/welder/driver, facilities object with food/accommodation/insurance/pf booleans, minWage number if stated, language string matching the user's preferred response language.",
        },
        { role: "user", content: query },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq filter extraction error: ${await parseGroqError(response)}`);
  }

  const data = await response.json();
  return normalizeFilters(cleanJSON(data.choices?.[0]?.message?.content));
};

const buildProjectQuery = (filters) => {
  const mongoQuery = { status: "OPEN" };
  const and = [];

  if (filters.location) {
    and.push({ location: { $regex: filters.location, $options: "i" } });
  }
  if (filters.skills.length) {
    and.push({
      $or: [
        { skillType: { $in: filters.skills } },
        { subSkill: { $in: filters.skills } },
      ],
    });
  }
  for (const [facility, required] of Object.entries(filters.facilities)) {
    if (required) and.push({ [`facilities.${facility}`]: true });
  }
  if (filters.minWage) {
    and.push({ wage: { $gte: filters.minWage } });
  }

  if (and.length) mongoQuery.$and = and;
  return mongoQuery;
};

const retrieveMatchingJobs = async (filters) => {
  const strictQuery = buildProjectQuery(filters);
  let jobs = await Project.find(strictQuery)
    .populate("contractorId", "name phone location company")
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  if (!jobs.length && (filters.location || filters.skills.length)) {
    const relaxedQuery = { status: "OPEN" };
    const or = [];
    if (filters.location) {
      or.push({ location: { $regex: filters.location, $options: "i" } });
    }
    if (filters.skills.length) {
      or.push({ skillType: { $in: filters.skills } }, { subSkill: { $in: filters.skills } });
    }
    if (or.length) relaxedQuery.$or = or;
    jobs = await Project.find(relaxedQuery)
      .populate("contractorId", "name phone location company")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
  }

  return jobs;
};

const summarizeJobForAI = (job) => ({
  id: job._id,
  title: job.projectTitle,
  location: job.location,
  wage: job.wage,
  skillType: job.skillType,
  subSkill: job.subSkill,
  facilities: job.facilities || {},
  contractor: job.contractorId?.company || job.contractorId?.name || "Contractor",
  contractorPhone: job.contractorId?.phone || "",
  applyLink: `/projects/${job._id}/apply`,
});

const buildFallbackReply = (query, filters, jobs) => {
  if (!jobs.length) {
    return filters.language === "English"
      ? "I could not find matching open jobs right now. Try another nearby city or a broader skill."
      : "अभी आपके लिए मिलती-जुलती खुली नौकरी नहीं मिली। पास के शहर या थोड़ा अलग कौशल से खोजकर देखें।";
  }

  const heading =
    filters.language === "English"
      ? `I found ${jobs.length} matching jobs for you.`
      : `आपके लिए ${jobs.length} मिलती-जुलती नौकरियां मिली हैं।`;
  const lines = jobs.slice(0, 3).map((job, index) => {
    const facilities = [];
    if (job.facilities?.food) facilities.push(filters.language === "English" ? "food" : "भोजन");
    if (job.facilities?.accommodation) facilities.push(filters.language === "English" ? "stay" : "रहना");
    const extra = facilities.length ? ` + ${facilities.join(", ")}` : "";
    return `${index + 1}. ${job.projectTitle} - ₹${job.wage}/day, ${job.location}${extra} (ID: ${job._id})`;
  });

  return `${heading}\n\n${lines.join("\n")}`;
};

const generateRagResponse = async ({ query, filters, jobs }) => {
  if (!process.env.GROQ_API_KEY) return buildFallbackReply(query, filters, jobs);

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      ...getGroqHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      temperature: 0.3,
      max_completion_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "You are Rozgar Mitra, a friendly job assistant for Indian blue-collar workers and contractors. Use only the retrieved jobs. Keep the answer short, practical, and in the user's preferred language. Mention job title, wage, location, useful facilities, contractor name, and project ID/apply link. If no jobs are found, suggest broadening city or skill.",
        },
        {
          role: "user",
          content: JSON.stringify({
            userQuery: query,
            preferredLanguage: filters.language,
            extractedFilters: filters,
            retrievedJobs: jobs.map(summarizeJobForAI),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq response generation error: ${await parseGroqError(response)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || buildFallbackReply(query, filters, jobs);
};

const transcribeAudioWithGroq = async (file) => {
  const formData = new FormData();
  const audioBlob = new Blob([file.buffer], { type: file.mimetype || "audio/m4a" });

  formData.append("file", audioBlob, file.originalname || "rozgar-mitra-audio.m4a");
  formData.append("model", GROQ_TRANSCRIPTION_MODEL);
  formData.append("response_format", "json");
  formData.append("temperature", "0");

  const response = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: getGroqHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Groq transcription error: ${await parseGroqError(response)}`);
  }

  const data = await response.json();
  return data.text || "";
};

const rozgarMitra = async (req, res) => {
  try {
    let query = req.body?.text || req.body?.query || "";

    if (!query && req.file) {
      if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({
          success: false,
          message: "GROQ_API_KEY is required for voice queries.",
        });
      }
      query = await transcribeAudioWithGroq(req.file);
    }

    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text query or audio file is required.",
      });
    }

    const filters = await extractFiltersWithAI(query);
    const jobs = await retrieveMatchingJobs(filters);
    const reply = await generateRagResponse({ query, filters, jobs });

    res.json({
      success: true,
      query,
      filters,
      reply,
      jobs,
    });
  } catch (error) {
    console.error("Rozgar Mitra error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  rozgarMitra,
};
