export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    console.log("OPENAI KEY PRESENT?", !!apiKey);

    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { mode, data } = body || {};

    if (mode !== "gift" || !data) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const prompt = `
You are Presently, an expert gifting assistant.

User details:
- Gender: ${data.gender}
- Budget: ₹${data.amount}
- About: ${data.about}
- Occasion: ${data.occasion}
- Relationship: ${data.relationship}

TASK:
Suggest exactly 15 thoughtful gift ideas.

FORMAT:
1. Gift Name – short reason  
   [View on Amazon](https://www.amazon.in/s?k=Brand+Model+Product)
    - Brand + Model Name

RULES:
- STRICTLY RESPECT THE BUDGET: Do not suggest items that typically cost more than ₹${data.amount}.
- Provide specific Brand and Model names for every suggestion within the budget.
- Give with the product links
- Give only the products which are under the given budget
- Under the link give 2 best brand and product name suggestion
- Use simple search terms
- Avoid duplicates
- Avoid generic items like 'Gift Card' or 'Cash'
- Analyse user details for personalized suggestions
- Analyse in general world and give the best suggestions
- Give the links of the products
- The links should be working , redirect to the product page
- Use Amazon India links (amazon.in)
- The product should be given with the company or the brand name with the model
- Use brand + model name for every product
- Use ONLY Amazon India links (amazon.in)
- NEVER guess product IDs or use /dp/ links
- ALWAYS use Amazon SEARCH links in this format:
  https://www.amazon.in/s?k=Brand+Model+Product
- Do NOT add any intro or conclusion text
- NEVER guess product IDs or use /dp/ links  
`;

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful gifting assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.6
        })
      }
    );

    if (!openaiRes.ok) {
      const txt = await openaiRes.text();
      console.error("OpenAI error:", txt);
      return res.status(500).json({ error: "OpenAI API error", details: txt });
    }

    const json = await openaiRes.json();
    const answer = json.choices?.[0]?.message?.content || "";

    res.status(200).json({ success: true, answer });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server crash", details: err.message });
  }
}
