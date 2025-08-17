import ballerina/http;
import ballerina/io;
import ballerina/jwt;
import ballerina/sql;
import ballerina/time;

// change this to get quizes per topic only
public function generatequizes(int topicId, http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
    // Step 0: Validate JWT token
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];
    int|sql:Error pdfId = dbClient->queryRow(`SELECT pdf_id from topics where id=${topicId}`);
    if pdfId is sql:Error {
        NotFoundError notFoundError = {
            body: {message: "PDF not found", details: "pdf_id not found", timestamp: time:utcNow()}
        };
        return notFoundError;
    }
    boolean authorizationPdfAccess = AuthorizedPdfAccess(pdfId, userId);

    if (authorizationPdfAccess is false) {
        UnauthorizedError unauthorizedError = {
            body: {message: "Unauthorized access", details: "You do not have permission to access this PDF document", timestamp: time:utcNow()}
        };
        return unauthorizedError;
    }

    string|NotFoundError topictext = ExtractedTopic(topicId, pdfId);

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
        "message": "Quizzes generated successfully"
    };

}

//get  quizID for a topic
public function getquizId(int topicId) returns int|NotFoundError {
    stream<record {|int id;|}, sql:Error?> quizIdStream = dbClient->query(`SELECT id FROM quizzes WHERE topic_id = ${topicId}`);
    record {|int id;|}[]|sql:Error quizIdRows = from var row in quizIdStream
        select row;
    if quizIdRows is sql:Error {
        NotFoundError notFoundError = {
            body: {
                message: "Quiz not found",
                details: "No quiz exists for the given topic ID",
                timestamp: time:utcNow()
            }
        };
        return notFoundError;
    }
    int latestId = -1;
    foreach var row in quizIdRows {
        if row.id > latestId {
            latestId = row.id;
        }
    }
    if latestId == -1 {
        NotFoundError notFoundError = {
            body: {
                message: "Quiz not found",
                details: "No quiz exists for the given topic ID",
                timestamp: time:utcNow()
            }
        };
        return notFoundError;
    }
    return latestId;
}

//for 1 quiz all questions, by using the topicid get the quiz id and from it get all questions related to 1 quiz id(get all questions)
public function getquizes(int topicId, http:Request req) returns json[]|NotFoundError|UnauthorizedError|error {

    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult;
    }
    int userId = <int>authResult["user_id"];

    int|NotFoundError quizId = getquizId(topicId);
    if quizId is NotFoundError {
        return quizId;
    }

    stream<Quiz, sql:Error?> quizStream =
        dbClient->query(`SELECT * FROM questions WHERE quiz_id=${quizId}`, Quiz);

    Quiz[]|sql:Error quizResult = from var quiz in quizStream
        select quiz;

    if quizResult is sql:Error {
        return quizResult;
    }

    int|sql:Error pdfId = dbClient->queryRow(`SELECT pdf_id FROM topics WHERE id = ${topicId}`);
    if pdfId is sql:Error {
        NotFoundError notFoundError = {
            body: {message: "PDF not found", details: "No PDF exists with the given ID", timestamp: time:utcNow()}
        };
        return notFoundError;
    }
    boolean authorizationPdfAccess = AuthorizedPdfAccess(pdfId, userId);
    if (authorizationPdfAccess is false) {
        UnauthorizedError unauthorizedError = {
            body: {message: "Unauthorized access", details: "You do not have permission to access this PDF document", timestamp: time:utcNow()}
        };
        return unauthorizedError;
    }

    json[] questions = [];
    foreach var q in quizResult {
        json[] opts = [];
        if q.options is string {
            json|error arr = (<string>q.options).fromJsonString();
            if arr is json[] {
                foreach var opt in <json[]>arr {
                    opts.push(opt);
                }
            }
        }
        questions.push({
            id: q.id,
            question_type: q.question_type,
            question: q.question_text,
            answer: q.correct_answer,
            options: opts
        });
    }
    return questions;

}

//get 1 question by question id
public function getquiz(int questionId, http:Request req) returns Quiz|UnauthorizedError|NotFoundError|error {

    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult;
    }
    int userId = <int>authResult["user_id"];

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
    int quizId = quiz.quiz_id;
    int|sql:Error topicId = dbClient->queryRow(`SELECT topic_id FROM quizzes WHERE id = ${quizId}`);
    if topicId is sql:Error {
        NotFoundError notFoundError = {
            body: {message: "Topic not found", details: "No topic exists with the given ID", timestamp: time:utcNow()}
        };
        return notFoundError;
    }
    int|sql:Error pdfId = dbClient->queryRow(`SELECT pdf_id FROM topics WHERE id = ${topicId}`);
    if pdfId is sql:Error {
        NotFoundError notFoundError = {
            body: {message: "PDF not found", details: "No PDF exists with the given ID", timestamp: time:utcNow()}
        };
        return notFoundError;
    }
    boolean authorizationPdfAccess = AuthorizedPdfAccess(pdfId, userId);
    if (authorizationPdfAccess is false) {
        UnauthorizedError unauthorizedError = {
            body: {message: "Unauthorized access", details: "You do not have permission to access this PDF document", timestamp: time:utcNow()}
        };
        return unauthorizedError;
    }

    return quiz;
}

//per topic
// after getting 1 question call this with the selected option
public function adduserprogress(http:Request req) returns json|UnauthorizedError|NotFoundError|error {
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult;
    }
    int userId = <int>authResult["user_id"];

    // Parse answer from request body
    json|error body = req.getJsonPayload();
    if body is error {
        return error("Invalid request body");
    }
    AnswerPayload|error payload = body.fromJsonWithType(AnswerPayload);
    if payload is error {
        return error("Invalid payload structure");
    }
    int questionId = payload.questionId;
    string userAnswer = payload.answer;
    // get the question
    Quiz|sql:Error Result = dbClient->queryRow(`SELECT * FROM questions WHERE id = ${questionId}`, Quiz);
    if Result is sql:Error {
        NotFoundError notFoundError = {
            body: {
                message: "Question not found",
                details: "No question exists with the given ID",
                timestamp: time:utcNow()
            }
        };
        return notFoundError;
    }
    string question = (<Quiz>Result).question_text;
    string answer = (<Quiz>Result).correct_answer;
    int quizId = (<Quiz>Result).quiz_id;

    // evaluate the answer
    json|error evaluationResult = evaluateAnswer(question, answer, userAnswer);
    if evaluationResult is error {
        return evaluationResult;
    }
    int score = 0;
    string answerResult = "";
    
    if evaluationResult == "yes" {
        score = 10;
        answerResult = "Correct";
        
    }
    else {
        score = 0;
        answerResult = "Incorrect";
    }
    // Check if a progress record exists
    record {|int count;|}|error countResult = dbClient->queryRow(
        `SELECT COUNT(*) as count FROM user_progress WHERE user_id = ${userId} AND quiz_id = ${quizId}`);
    if countResult is error {
        return countResult;
    }

    if countResult.count > 0 {
        // Update existing progress (add score)
        _ = check dbClient->execute(
            `UPDATE user_progress SET score = score + ${score}, completed_at = CURRENT_TIMESTAMP WHERE user_id = ${userId} AND quiz_id = ${quizId}`
        );
    } else {
        // Insert new progress
        _ = check dbClient->execute(
            `INSERT INTO user_progress (user_id, quiz_id, score) VALUES (${userId}, ${quizId}, ${score})`
        );
    }
        
    return {
        "message":"User progress updated successfully",
        "status":answerResult,
        "answer":answer
        };
}

public function getuserprogressperquizset(int topicId, http:Request req) returns json|NotFoundError|UnauthorizedError|error {
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];
    int|NotFoundError quizId = getquizId(topicId);
    io:println(quizId);
    if quizId is NotFoundError {
        return quizId; // NotFoundError if quiz does not exist
    }

    UserProgress|error userProgress = dbClient->queryRow(`SELECT * FROM user_progress WHERE user_id = ${userId} AND quiz_id = ${quizId}`, UserProgress);
    if userProgress is error {
        return {score: 0};
    }
    return {score: userProgress.score};
}

public function getuserprogress(http:Request req) returns json|NotFoundError|UnauthorizedError|error {
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];
    UserProgress|error userProgress = dbClient->queryRow(`SELECT * FROM user_progress WHERE user_id = ${userId}`, UserProgress);
    if userProgress is error {
        if userProgress is sql:NoRowsError {
            NotFoundError userNotFound = {
                body: {
                    message: "User progress not found",
                    details: "No progress exists for the given user ID",
                    timestamp: time:utcNow()
                }
            };
            return userNotFound;
        }
        return userProgress;
    }
    return {score: userProgress.score};
}



