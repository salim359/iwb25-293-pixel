import ballerina/http;
import ballerina/jwt;
import ballerina/sql;
import ballerina/io;
import ballerina/time;
 
 // change this to get quizes per topic only
    public function generatequizes(int topicId,http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        // Step 0: Validate JWT token
        jwt:Payload|UnauthorizedError authResult = Authorization(req);
        if (authResult is UnauthorizedError) {
            return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
        }
        // int? userId = <int?>authResult["user_id"];

        string|NotFoundError topictext = ExtractedTopic(topicId);
        if topictext is NotFoundError {
            return topictext; // NotFoundError if topic does not exist
        }

        string prompt = string `Generate 5 quiz questions for this topic as a valid JSON array. Follow this exact format:
        [
            {
                "title": "Topic Title",
                "questions": [
                    {
                        "question_text": "Your question here?",
                        "question_type": "MCQ",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A"
                    },
                    {
                        "question_text": "Another question here?",
                        "question_type": "Short Answer",
                        "options": [],
                        "correct_answer": "Expected answer"
                    }
                ]
            }
        ]

        IMPORTANT: Return ONLY the JSON array. No explanations, no markdown, no code blocks.
        
        Topic:
        ${topictext}
        `;

        json openAIReq = {
            "model": modelConfig.model,
            "messages": [
                {"role": "system", "content": "You are an assistant that generates quiz questions from text."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1500,
            "temperature": 0.3
        };

        final http:Client openAIClient = check new ("https://api.openai.com/v1", {
            auth: {token: modelConfig.openAiToken},
            timeout: 90
        });

        http:Response aiRes = check openAIClient->post("/chat/completions", openAIReq);
        if aiRes.statusCode != http:STATUS_OK {
            return error("OpenAI API request failed with status: " + aiRes.statusCode.toString());
        }

        json|error aiJson = aiRes.getJsonPayload();
        if (aiJson is error) {
            return error("Failed to parse OpenAI API response");
        }

        json|error choicesResult = aiJson.choices;
        if choicesResult is error {
            return error("Failed to extract choices from OpenAI API response");
        }
        if !(choicesResult is json[]) {
            return error("Choices is not a JSON array");
        }
        json[] choices = <json[]>choicesResult;
        if choices.length() == 0 {
            return error("Choices array is empty");
        }
        json firstChoice = choices[0];
        json|error messageResult = firstChoice.message;
        if (messageResult is error) {
            return error("Failed to extract message from first choice");
        }
        json|error contentResult = messageResult.content;
        if (contentResult is error) {
            return error("Failed to extract content from message");
        }
        if !(contentResult is string) {
            return error("Content is not a string");
        }
        string content = <string>contentResult;
        // Clean the content to extract only valid JSON
        string cleanedContent = content.trim();
        if (cleanedContent.startsWith("```json")) {
            cleanedContent = cleanedContent.substring(7);
        } else if (cleanedContent.startsWith("```")) {
            cleanedContent = cleanedContent.substring(3);
        }
        if (cleanedContent.endsWith("```")) {
            cleanedContent = cleanedContent.substring(0, cleanedContent.length() - 3);
        }
        cleanedContent = cleanedContent.trim();
        int firstBracket = cleanedContent.indexOf("[") ?: -1;
        int lastBracket = cleanedContent.lastIndexOf("]") ?: -1;
        if (firstBracket == -1 || lastBracket == -1 || firstBracket >= lastBracket) {
            return error("No valid JSON array found in the response");
        }
        string jsonContent = cleanedContent.substring(firstBracket, lastBracket + 1);
        // Parse the JSON content with proper error handling
        json|error quizResult = jsonContent.fromJsonString();
        if (quizResult is error) {
            io:println("Raw content: " + content);
            io:println("Cleaned content: " + jsonContent);
            return error("Failed to parse quiz JSON: " + quizResult.message());
        }
        if !(quizResult is json[]) {
            return error("Parsed content is not a JSON array");
        }
        json[] quizArray = <json[]>quizResult;
        // Insert each quiz into the database
        foreach json quiz in quizArray {
            json|error titleResult = quiz.title;
            if (titleResult is error || !(titleResult is string)) {
                continue;
            }
            string title = <string>titleResult;

            sql:ExecutionResult|sql:Error insertResult = dbClient->execute(
                `INSERT INTO quizzes (topic_id, title) VALUES (${topicId}, ${title})`
            );
            if (insertResult is sql:Error) {
                continue;
            }
            // Get the last inserted quiz id
            int quizId = check dbClient->queryRow(`SELECT LAST_INSERT_ID()`);
            // Insert questions for this quiz
            json|error questionsResult = quiz.questions;
            if (questionsResult is json[]) {
                json[] questionsArray = <json[]>questionsResult;
                foreach json question in questionsArray {
                    json|error questionTextResult = question.question_text;
                    json|error questionTypeResult = question.question_type;
                    json|error optionsResult = question.options;
                    json|error correctAnswerResult = question.correct_answer;
                    if (questionTextResult is string && questionTypeResult is string && optionsResult is json[] && correctAnswerResult is string) {
                        string questionText = <string>questionTextResult;
                        string questionType = <string>questionTypeResult;
                        string optionsStr = optionsResult.toJsonString();
                        string correctAnswer = <string>correctAnswerResult;
                        sql:ExecutionResult|sql:Error qInsertResult = dbClient->execute(
                            `INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer) VALUES (${quizId}, ${questionText}, ${questionType}, ${optionsStr}, ${correctAnswer})`
                        );
                        if (qInsertResult is sql:Error) {
                            io:println("Failed to insert question: " + qInsertResult.message());
                            continue;
                        }
                    }
                }
            }
        }

        return {
            "message": "Quizzes generated successfully",
            "quizzes": quizArray
        };

    }

    //get  quizID for a topic
    public function getquizId(int topicId) returns int|NotFoundError {
        int|sql:Error quizIdResult = dbClient->queryRow(`SELECT id FROM quizzes WHERE topic_id = ${topicId}`);
        if quizIdResult is sql:Error {
            NotFoundError notFoundError = {
                body: {
                    message: "Quiz not found",
                    details: "No quiz exists for the given topic ID",
                    timestamp: time:utcNow()
                }
            };
            return notFoundError;
        }
        return <int>quizIdResult; // Return the quiz ID
    }

    //for 1 quiz all questions, by using the topicid get the quiz id and from it get all questions related to 1 quiz id(get all questions)
    public function getquizes(int quizId) returns Quiz[]|error {
        stream<Quiz, sql:Error?> quizStream =
        dbClient->query(`SELECT * FROM questions WHERE quiz_id=${quizId}`, Quiz);

        Quiz[]|sql:Error quizResult = from var quiz in quizStream
            select quiz;

        if quizResult is sql:Error {
            return quizResult;
        }
        return quizResult;

    }

    //get 1 question by question id
    public function getquiz(int questionId) returns Quiz|NotFoundError|error {
        Quiz|sql:Error questionResult = dbClient->queryRow(`SELECT * FROM questions WHERE id = ${questionId}`, Quiz);
        if questionResult is sql:Error {
            NotFoundError notFoundError = {
                body: {
                    message: "Question not found",
                    details: "No question exists with the given ID",
                    timestamp: time:utcNow()
                }
            };
            return notFoundError;
        }
        Quiz quiz = <Quiz>questionResult;

        //check ownership
        return quiz;
    }

    //per topic
