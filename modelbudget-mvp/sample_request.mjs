const response = await fetch("http://127.0.0.1:8787/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer local-modelbudget-key"
  },
  body: JSON.stringify({
    model: "auto",
    messages: [
      {
        role: "user",
        content: "Summarize this repo and explain the test error. Do not inspect .env or secrets."
      }
    ]
  })
});

console.log(JSON.stringify(await response.json(), null, 2));
