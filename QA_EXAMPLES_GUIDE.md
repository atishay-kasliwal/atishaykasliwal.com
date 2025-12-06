# Q&A Examples Guide

## How It Works

The bot uses **few-shot learning** - it learns from example question-answer pairs you provide. When a user asks a question, the bot:
1. Finds similar questions from your examples
2. Includes those examples in its prompt
3. Responds in the same style and format

## Adding Your Q&A Examples

Edit the file: `public/qa-examples.json`

### Format

```json
{
  "examples": [
    {
      "question": "What is your current role?",
      "answer": "I'm currently working as an AI and Analytics professional at Atrium Health Wake Forest, and I'm also a Research Assistant at Stony Brook University."
    },
    {
      "question": "Tell me about your education",
      "answer": "I'm pursuing my Master's in Data Science at Stony Brook University, and I completed my Bachelor's in CSIT from Symbiosis University in India."
    }
  ]
}
```

### Tips for Best Results

1. **Be Natural**: Write answers as you would actually speak
2. **Keep It Short**: 1-2 sentences per answer (matches bot's style)
3. **First Person**: Use "I", "my", "me" (never mention your name)
4. **Cover Common Questions**: 
   - Work experience
   - Education
   - Skills/technologies
   - Projects
   - Career goals
   - Interests

### Example Categories

- **Work/Experience**: "What companies have you worked for?", "Tell me about your role at Fidelity"
- **Education**: "Where did you study?", "What's your degree?"
- **Skills**: "What technologies do you know?", "What programming languages?"
- **Projects**: "What projects have you worked on?", "Tell me about your research"
- **General**: "What are you looking for?", "Why should I hire you?"

### How Many Examples?

- **Minimum**: 10-20 examples for basic coverage
- **Recommended**: 50-100 examples for good coverage
- **Optimal**: 100-150 examples for comprehensive coverage

The bot will automatically find the 3 most similar examples to each user question and learn from them.

## Testing

After adding examples:
1. Save `qa-examples.json`
2. Refresh your browser
3. Ask questions similar to your examples
4. The bot should match your style!

