const Groq = require("groq-sdk")

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

async function askLLM(prompt) {

  try {

    const completion =
      await groq.chat.completions.create({

        model:
          "llama-3.3-70b-versatile",

        messages: [

          {
            role: "user",
            content: prompt
          }

        ],

        temperature: 0.7

      })

    return completion
      .choices[0]
      .message
      .content

  }

  catch (error) {

    console.log(error)

    return "LLM Error"

  }

}

module.exports = {
  askLLM
}