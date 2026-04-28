# 🚨 offSOS.(GOOGLE SOLUTION CHALLENGE 2026)

**offSOS** is a mission-critical crisis reporting web application engineered specifically for extremely low-bandwidth and spotty network environments. It provides a reliable, high-contrast, and fast-loading interface for emergency reporting.

## 🌟 Key Features

- **Ultra-Lightweight & Fast:** Built for resilience using Next.js Server Components and Server Actions for fast, form-based data submission.
- **One-Tap Reporting:** Quickly broadcast your status as "I AM SAFE" (🟢) or "NEED HELP" (🔴).
- **Smart Location:** Automatic GPS integration with an IP-based fallback if permissions fail.
- **Privacy Controls:** Option to hide your exact coordinates from the public feed while still notifying responders.
- **Emergency Categorization:** Specify the type of crisis (Medical, Fire, Trapped, Resources, Security Threat).
- **Live Feed:** Real-time visibility into local crisis reports, automatically pruned to the last 48 hours.
- **Help Received Triage:** Responders or users can mark "Help Received" to resolve active emergencies and clear them from the feed.
- **SMS Fallback:** Built-in shortcut to send an SOS via native SMS if the internet drops entirely..

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Prisma](https://www.prisma.io/) with SQLite
- **Architecture:** Server Actions & React Server Components

## 🚀 Getting Started

To run offSOS locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/offsos.git
cd offsos
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Database
Push the Prisma schema to create your local SQLite database:
```bash
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the live feed and submit test reports.

## 📂 Project Structure

- `app/page.tsx` - The main UI containing the crisis report form and the active Live Feed.
- `app/actions.ts` - Next.js Server Actions handling database operations (submitting and resolving reports).
- `prisma/schema.prisma` - The database schema defining the `Report` model.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome. Feel free to check the issues page if you want to contribute to this crisis management tool.

## 📄 License
This project is open-source and available under the MIT License.
