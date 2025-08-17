CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pdf_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    file_name VARCHAR(255) NOT NULL,
    upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    extracted_text TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE pdf_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pdf_id INT NOT NULL,
    summary TEXT NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id)
);


CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pdf_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id)
);

CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT,
    title VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options TEXT,
    correct_answer VARCHAR(255),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

CREATE TABLE flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT,
    term VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    pdf_id INT,
    title VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id)
);

CREATE TABLE exam_question (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT,
    sequence INT,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id)
);
CREATE TABLE user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    quiz_id INT,
    score INT,
    completed_at DATETIME  DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);