import { z } from "zod";

export const mappings = {
    "react.js": "react",
    reactjs: "react",
    react: "react",
    "next.js": "nextjs",
    nextjs: "nextjs",
    next: "nextjs",
    "vue.js": "vuejs",
    vuejs: "vuejs",
    vue: "vuejs",
    "express.js": "express",
    expressjs: "express",
    express: "express",
    "node.js": "nodejs",
    nodejs: "nodejs",
    node: "nodejs",
    mongodb: "mongodb",
    mongo: "mongodb",
    mongoose: "mongoose",
    mysql: "mysql",
    postgresql: "postgresql",
    sqlite: "sqlite",
    firebase: "firebase",
    docker: "docker",
    kubernetes: "kubernetes",
    aws: "aws",
    azure: "azure",
    gcp: "gcp",
    digitalocean: "digitalocean",
    heroku: "heroku",
    photoshop: "photoshop",
    "adobe photoshop": "photoshop",
    html5: "html5",
    html: "html5",
    css3: "css3",
    css: "css3",
    sass: "sass",
    scss: "sass",
    less: "less",
    tailwindcss: "tailwindcss",
    tailwind: "tailwindcss",
    bootstrap: "bootstrap",
    jquery: "jquery",
    typescript: "typescript",
    ts: "typescript",
    javascript: "javascript",
    js: "javascript",
    "angular.js": "angular",
    angularjs: "angular",
    angular: "angular",
    "ember.js": "ember",
    emberjs: "ember",
    ember: "ember",
    "backbone.js": "backbone",
    backbonejs: "backbone",
    backbone: "backbone",
    nestjs: "nestjs",
    graphql: "graphql",
    "graph ql": "graphql",
    apollo: "apollo",
    webpack: "webpack",
    babel: "babel",
    "rollup.js": "rollup",
    rollupjs: "rollup",
    rollup: "rollup",
    "parcel.js": "parcel",
    parceljs: "parcel",
    npm: "npm",
    yarn: "yarn",
    git: "git",
    github: "github",
    gitlab: "gitlab",
    bitbucket: "bitbucket",
    figma: "figma",
    prisma: "prisma",
    redux: "redux",
    flux: "flux",
    redis: "redis",
    selenium: "selenium",
    cypress: "cypress",
    jest: "jest",
    mocha: "mocha",
    chai: "chai",
    karma: "karma",
    vuex: "vuex",
    "nuxt.js": "nuxt",
    nuxtjs: "nuxt",
    nuxt: "nuxt",
    strapi: "strapi",
    wordpress: "wordpress",
    contentful: "contentful",
    netlify: "netlify",
    vercel: "vercel",
    "aws amplify": "amplify",
};

/**
 * System prompt for the Gemini-powered AI interviewer.
 * Placeholders: {{questions}}, {{role}}, {{level}}, {{techstack}}
 */
export const INTERVIEW_SYSTEM_PROMPT = `You are a professional job interviewer conducting a real-time voice interview with a candidate applying for a {{level}} {{role}} position. The relevant tech stack is: {{techstack}}.

Your goal is to assess their qualifications, motivation, and fit for the role.

Interview Guidelines:
1. Follow the structured question flow:
{{questions}}

2. Engage naturally & react appropriately:
   - Listen actively to responses and acknowledge them before moving forward.
   - Ask brief follow-up questions if a response is vague or requires more detail.
   - Keep the conversation flowing smoothly while maintaining control.

3. Be professional, yet warm and welcoming:
   - Use official yet friendly language.
   - Keep responses concise and to the point (1-3 sentences max — this is a voice conversation).
   - Avoid robotic phrasing — sound natural and conversational.
   - Do NOT use markdown, bullet points, or special characters in your responses.

4. Answer the candidate's questions professionally:
   - If asked about the role, company, or expectations, provide a clear and relevant answer.
   - If unsure, redirect the candidate to HR for more details.

5. Conclude the interview properly:
   - After all questions have been asked, thank the candidate for their time.
   - Inform them that the company will reach out soon with feedback.
   - End with a clear closing statement like "This concludes our interview. Thank you!"

IMPORTANT: Keep ALL your responses short (1-3 sentences). This is a voice conversation — long responses are not appropriate. Never use markdown formatting, asterisks, bullet points, or numbered lists in your responses.`;

export const INTERVIEW_GREETING = `Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience. Let's get started with the first question.`;

export const feedbackSchema = z.object({
    totalScore: z.number().min(0).max(100),
    performanceBand: z.enum([
        "Excellent",
        "Good",
        "Average",
        "Below Average",
        "Needs Improvement",
    ]),
    categoryScores: z.array(
        z.object({
            name: z.string(),
            score: z.number().min(0).max(100),
            comment: z.string(),
            subMetrics: z.array(
                z.object({
                    name: z.string(),
                    score: z.number().min(0).max(100),
                })
            ),
        })
    ),
    strengths: z.array(
        z.object({
            point: z.string(),
            example: z.string(),
        })
    ),
    areasForImprovement: z.array(
        z.object({
            point: z.string(),
            suggestion: z.string(),
            resourceType: z.enum(["practice", "study", "behavior"]),
            priority: z.enum(["high", "medium", "low"]),
        })
    ),
    detailedSuggestions: z.object({
        immediateActions: z.array(z.string()),
        shortTermGoals: z.array(z.string()),
        longTermDevelopment: z.array(z.string()),
    }),
    sampleIdealAnswers: z
        .array(
            z.object({
                question: z.string(),
                candidateAnswer: z.string(),
                idealAnswer: z.string(),
                gap: z.string(),
            })
        )
        .max(3),
    finalAssessment: z.string(),
    hiringRecommendation: z.enum(["Strong Hire", "Hire", "Maybe", "No Hire"]),
});

export const interviewCovers = [
    "/adobe.png",
    "/amazon.png",
    "/facebook.png",
    "/hostinger.png",
    "/pinterest.png",
    "/quora.png",
    "/reddit.png",
    "/skype.png",
    "/spotify.png",
    "/telegram.png",
    "/tiktok.png",
    "/yahoo.png",
];

export const dummyInterviews: Interview[] = [
    {
        id: "1",
        userId: "user1",
        role: "Frontend Developer",
        type: "Technical",
        techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
        level: "Junior",
        questions: ["What is React?"],
        finalized: false,
        createdAt: "2024-03-15T10:00:00Z",
    },
    {
        id: "2",
        userId: "user1",
        role: "Full Stack Developer",
        type: "Mixed",
        techstack: ["Node.js", "Express", "MongoDB", "React"],
        level: "Senior",
        questions: ["What is Node.js?"],
        finalized: false,
        createdAt: "2024-03-14T15:30:00Z",
    },
];
