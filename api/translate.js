
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "សូមប្រើ POST request"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "មិនទាន់កំណត់ GEMINI_API_KEY"
    });
  }

  try {
    const { text, targetLanguage } = req.body || {};

    if (
      typeof text !== "string" ||
      !text.trim() ||
      typeof targetLanguage !== "string" ||
      !targetLanguage.trim()
    ) {
      return res.status(400).json({
        error: "សូមបញ្ចូលអត្ថបទ និងភាសាគោលដៅ"
      });
    }

    const apiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Translate this text into " +
                targetLanguage +
                ". Return only the translation:\n\n" +
                text
            }]
          }]
        })
      }
    );

    const raw = await apiResponse.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error("Gemini returned non-JSON response");
      return res.status(502).json({
        error: "Gemini បានបញ្ជូនលទ្ធផលមិនត្រឹមត្រូវ"
      });
    }

    if (!apiResponse.ok) {
      console.error("Gemini API status:", apiResponse.status);
      return res.status(502).json({
        error: data.error?.message || "Gemini API មានបញ្ហា"
      });
    }

    const translatedText = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!translatedText) {
      return res.status(502).json({
        error: "Gemini មិនបានផ្តល់លទ្ធផលបកប្រែ"
      });
    }

    return res.status(200).json({
      success: true,
      translatedText
    });
  } catch (error) {
    console.error("Translation error:", error.message);
    return res.status(500).json({
      error: "Backend មានបញ្ហា សូមពិនិត្យ Vercel Logs"
    });
  }
}
