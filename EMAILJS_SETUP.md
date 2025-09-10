# EmailJS Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Add Email Service
1. In dashboard, click "Email Services" → "Add New Service"
2. Choose "Gmail" (or your email provider)
3. Follow the Gmail setup:
   - Enable 2-factor authentication on Gmail
   - Generate an "App Password" for EmailJS
   - Use your Gmail address and the app password
4. **Copy the Service ID** (looks like: `service_abc123`)

### Step 3: Create Email Template
1. Go to "Email Templates" → "Create New Template"
2. Use this template:

**Subject:** `New Contact from {{from_name}}`

**Body:**
```
Hello Atishay,

You received a new message from your website:

Name: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

---
Sent from your portfolio website
```

3. **Copy the Template ID** (looks like: `template_xyz789`)

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. **Copy your Public Key** (looks like: `user_abcdef123456`)

### Step 5: Update Code
Replace these lines in `src/App.js`:

```javascript
const serviceId = 'service_xxxxxxx'; // Replace with your Service ID
const templateId = 'template_xxxxxxx'; // Replace with your Template ID  
const publicKey = 'your_public_key'; // Replace with your Public Key
```

## Alternative: Use Environment Variables (Recommended)

Create a `.env` file in your project root:

```
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
```

Then update the code to use environment variables:

```javascript
const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
```

## Testing
1. Save your changes
2. Restart your development server: `npm start`
3. Fill out the contact form and submit
4. Check your email inbox!

## Troubleshooting
- Make sure all three credentials are correct
- Check that your email service is properly connected
- Verify the template variables match: `{{from_name}}`, `{{from_email}}`, `{{message}}`
- Check browser console for detailed error messages
