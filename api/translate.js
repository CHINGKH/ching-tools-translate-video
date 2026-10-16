
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "សូមប្រើ POST request"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "មិនទាន់កំណត់ GEMINI_API_KEY នៅ Vercel ទេ"
    });
  }

  try {
    const { text, sourceLanguage, targetLanguage } =
      req.body || {};

    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 30000
    ) {
      return res.status(400).json({
        error: "សូមបញ្ចូលអត្ថបទចន្លោះពី 1 ដល់ 30000 តួអក្សរ"
      });
    }

    if (
      typeof targetLanguage !== "string" ||
      targetLanguage.length > 60
    ) {
      return res.status(400).json({
        error: "សូមជ្រើសរើសភាសាគោលដៅ"
      });
    }

    const source = String(sourceLanguage || "Auto").slice(0, 60);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text:
                "Translate the following video dialogue naturally. " +
                "Source language: " + source + ". " +
                "Target language: " + targetLanguage + ". " +
                "Preserve the original meaning, character names, " +
                "dialogue order, and tone. Return only the translation.\n\n" +
                text
            }]
          }],
          generationConfig: {
            temperature: 0.2
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
  console.error(
    "Gemini API error:",
    response.status,
    data.error?.message || "Unknown error"
  );

  return res.status(502).json({
    error:
      "Gemini API (" + response.status + "): " +
      (data.error?.message || "Unknown error")
  });
    }

    const translatedText =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!translatedText) {
      return res.status(502).json({
        error: "Gemini មិនបានផ្តល់លទ្ធផលបកប្រែទេ"
      });
    }

    return res.status(200).json({
      success: true,
      sourceLanguage: source,
      targetLanguage,
      translatedText
    });

  } catch (error) {
    console.error("Translation error:", error.message);

    return res.status(500).json({
      error: "មានបញ្ហាក្នុងការបកប្រែ សូមព្យាយាមម្ដងទៀត"
    });
  }
            }
    
