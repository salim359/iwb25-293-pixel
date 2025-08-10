learning-app/
│
├── client/                          # ReactJS Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/               # Frontend API calls
│   │   └── App.jsx
│   └── package.json
│
├── server/                          # Ballerina Backend
│   ├── main.bal                     # Main entry point
│   ├── services/
│   │   ├── user_service.bal         # Handles user registration, login
│   │   ├── pdf_service.bal          # Handles PDF upload
│   │   └── quiz_service.bal         # Handles quiz, flashcard, exam generation
│   │
│   ├── modules/                     # Reusable Ballerina modules
│   │   ├── openai_module.bal        # Handles communication with OpenAI API
│   │   └── utils.bal                # Utility functions (PDF parsing, etc.)
│   │
│   ├── data/                        # Database logic
│   │   └── db_client.bal            # DB queries for users, quizzes, etc.
│   │
│   ├── config/
│   │   └── config.toml              # API keys, DB config
│   │
│   ├── storage/                     # For temporarily saving uploaded PDFs
│   └── Ballerina.toml
│
├── README.md
└── .gitignore


| Service Name              | Responsibility                                              |
| ------------------------- | ----------------------------------------------------------- |
| **pdf\_upload**           | Accept PDF files, extract text                              |
| **quiz\_generation**      | Generate quizzes and questions from extracted text (via AI) |
| **flashcard\_generation** | Create flashcards from text/key terms                       |
| **exam\_management**      | Create, serve, and grade mock exams                         |
| **user\_management**      | User registration, login, authentication                    |
| **progress\_tracking**    | Track user quiz/exam progress and scores                    |
| **analytics**             | Provide learning analytics, stats, recommendations          |
| **content\_management**   | Manage uploaded documents, topics, sections                 |

| Table Name          | Description                               |
| ------------------- | ----------------------------------------- |
| **users**           | Stores user info and credentials          |
| **pdf\_documents**  | Metadata about uploaded PDFs              |
| **topics**          | Segments or chapters extracted from PDFs  |
| **quizzes**         | Quiz sets generated from topics           |
| **questions**       | Individual questions in quizzes           |
| **flashcards**      | Flashcards created from topics            |
| **exams**           | Generated exam papers from quizzes        |
| **exam\_questions** | Questions assigned to an exam             |
| **user\_progress**  | Tracks user quiz/exam attempts and scores |

Users
| Column         | Type         | Notes           |
| -------------- | ------------ | --------------- |
| id             | UUID         | Primary key     |
| username       | VARCHAR(50)  | Unique          |
| email          | VARCHAR(100) | Unique          |
| password\_hash | VARCHAR(255) | Hashed password |
| created\_at    | TIMESTAMP    |                 |

pdf\_documents
| Column          | Type      | Notes                          |
| --------------- | --------- | ------------------------------ |
| id              | UUID      | Primary key                    |
| user\_id        | UUID      | Foreign key → users.id         |
| file\_name      | VARCHAR   | Original file name             |
| upload\_date    | TIMESTAMP |                                |
| extracted\_text | TEXT      | Full extracted text (optional) |

topics
| Column     | Type    | Notes                            |
| ---------- | ------- | -------------------------------- |
| id         | UUID    | Primary key                      |
| pdf\_id    | UUID    | Foreign key → pdf\_documents.id  |
| title      | VARCHAR | Topic or section title           |
| start\_pos | INT     | Text position in extracted\_text |
| end\_pos   | INT     | Text position in extracted\_text |

quizes
| Column      | Type      | Notes                   |
| ----------- | --------- | ----------------------- |
| id          | UUID      | Primary key             |
| topic\_id   | UUID      | Foreign key → topics.id |
| title       | VARCHAR   | Quiz title              |
| created\_at | TIMESTAMP |                         |

questions
| Column          | Type    | Notes                          |
| --------------- | ------- | ------------------------------ |
| id              | UUID    | Primary key                    |
| quiz\_id        | UUID    | Foreign key → quizzes.id       |
| question\_text  | TEXT    | Question content               |
| question\_type  | VARCHAR | e.g., 'multiple\_choice', 'tf' |
| options         | JSON    | For multiple-choice options    |
| correct\_answer | VARCHAR | The correct option             |

flashcards
| Column     | Type    | Notes                   |
| ---------- | ------- | ----------------------- |
| id         | UUID    | Primary key             |
| topic\_id  | UUID    | Foreign key → topics.id |
| term       | VARCHAR | Flashcard term          |
| definition | TEXT    | Flashcard definition    |

exams
| Column      | Type      | Notes                  |
| ----------- | --------- | ---------------------- |
| id          | UUID      | Primary key            |
| user\_id    | UUID      | Foreign key → users.id |
| title       | VARCHAR   | Exam title             |
| created\_at | TIMESTAMP |                        |

exam_question
| Column       | Type | Notes                      |
| ------------ | ---- | -------------------------- |
| id           | UUID | Primary key                |
| exam\_id     | UUID | Foreign key → exams.id     |
| question\_id | UUID | Foreign key → questions.id |
| sequence     | INT  | Question order in exam     |

user progress
| Column        | Type      | Notes                       |
| ------------- | --------- | --------------------------- |
| id            | UUID      | Primary key                 |
| user\_id      | UUID      | Foreign key → users.id      |
| quiz\_id      | UUID      | Foreign key → quizzes.id    |
| score         | INT       | Percentage or points scored |
| completed\_at | TIMESTAMP | When quiz/exam completed    |

