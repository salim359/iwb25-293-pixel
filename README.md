# Pixel Learning App

Pixel is a full-stack learning platform that helps users upload study materials, generate quizzes, flashcards, and mock exams using AI, and track their learning progress.

## Project Structure

```
iwb25-293-pixel/
├── frontend/           # React + TypeScript Frontend
│   ├── components.json
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.js
│   └── src/
│       ├── index.css
│       ├── main.tsx
│       ├── routeTree.gen.ts
│       ├── vite-env.d.ts
│       ├── assets/
│       ├── components/
│       ├── constants/
│       ├── context/
│       ├── lib/
│       ├── routes/
│       └── types/
│
├── backend/            # Ballerina Backend
│   ├── main.bal        # Main entry point
│   ├── pixel_user_services.bal
│   ├── pixel_pdf_services.bal
│   ├── pixel_quiz_services.bal
│   ├── pixel_flashcards_services.bal
│   ├── pixel_exam_services.bal
│   ├── pixel_database.bal
│   ├── pixel_types.bal
│   ├── pixel_auth_utils.bal
│   ├── pixel_config.bal
│   ├── data/
│   │   └── pixel.db
│   ├── db-setup/
│   │   └── init.sql
│   ├── resources/
│   │   ├── cert.pem
│   │   └── private.key
│   ├── target/
│   ├── tests/
└── .gitignore
```

## Main Features

- **PDF Upload & Extraction**: Users upload PDFs, and the backend extracts text for further processing.
- **Quiz Generation**: AI generates quizzes and questions from extracted text.
- **Flashcard Generation**: Key terms are converted into flashcards for quick review.
- **Exam Management**: Users can generate, take, and grade mock exams.
- **User Management**: Registration, login, and authentication.
- **Content Management**: Organizes uploaded documents, topics, and sections.

## Database Tables

| Table Name    | Description                               |
| ------------- | ----------------------------------------- |
| users         | Stores user info and credentials          |
| pdf_documents | Metadata about uploaded PDFs              |
| topics        | Segments or chapters extracted from PDFs  |
| quizzes       | Quiz sets generated from topics           |
| questions     | Individual questions in quizzes           |
| flashcards    | Flashcards created from topics            |
| exams         | Generated exam papers from quizzes        |
| exam_question | Questions assigned to an exam             |
| user_progress | Tracks user quiz/exam attempts and scores |
| pdf_summaries | Stores OpenAI-generated PDF summaries     |

## Backend Services

| Service Name         | Responsibility                                              |
| -------------------- | ----------------------------------------------------------- |
| pdf_upload           | Accept PDF files, extract text                              |
| quiz_generation      | Generate quizzes and questions from extracted text (via AI) |
| flashcard_generation | Create flashcards from text/key terms                       |
| exam_management      | Create, serve, and grade mock exams                         |
| user_management      | User registration, login, authentication                    |         |
| content_management   | Manage uploaded documents, topics, sections                 |

## Getting Started

1. **Install dependencies** for both frontend and backend.
2. **Configure API keys and database** in `backend/resources/` and `backend/config.toml`.
3. **Run the backend** using Ballerina.
4. **Run the frontend** using npm or yarn.
5. **Access the app** via your browser and start learning!
