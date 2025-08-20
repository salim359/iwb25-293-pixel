import ballerina/http;
import ballerina/jwt;
import ballerina/sql;


public function generateExam(int pdfId, http:Request req) returns json|NotFoundError|UnauthorizedError|error {

    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult;
    }
    int? userId = <int?>authResult["user_id"];
    string|UnauthorizedError extractedText = ExtractedText(userId, pdfId);
    if extractedText is UnauthorizedError {
        return extractedText; // UnauthorizedError if user does not have access to the PDF document
    }
    string prompt = string `Generate 10 exam questions and their answers for the following text as a valid JSON array. Each object must follow this format:
    [
        {   "title": "title of the exam",
            "question": "Your question here?",
            "answer": "Expected answer",
            "sequence": 1
        }
    ]
    
    Return ONLY the JSON array. No explanations, no markdown, no code blocks.
    
    Text:
    ${extractedText}
    `;
    json openAIReq = {
        "model": modelConfig.model,
        "messages": [
            {"role": "system", "content": "You are an AI that generates exam questions and answers in JSON format from provided text."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1500,
        "temperature": 0.3
    };
    final http:Client openAIClient = check new ("https://api.openai.com/v1", {
        auth: {token: modelConfig.openAiToken},
        timeout: 90
    });

    // Make the API request
    http:Response aiRes = check openAIClient->post("/chat/completions", openAIReq);
    
    // Handle different error status codes
    if (aiRes.statusCode != http:STATUS_OK) {
        if (aiRes.statusCode == 429) {
            return error("OpenAI API rate limit exceeded. Please wait a moment and try again.");
        } else if (aiRes.statusCode == 401) {
            return error("OpenAI API authentication failed. Please check your API key.");
        } else if (aiRes.statusCode == 500) {
            return error("OpenAI API server error. Please try again later.");
        } else {
            return error("OpenAI API request failed with status: " + aiRes.statusCode.toString());
        }
    }

    json|error aiJson = aiRes.getJsonPayload();
    if aiJson is error {
        return error("Failed to parse OpenAI response: " + aiJson.message());
    }
    json|error choices = aiJson.choices;
    if choices is json[] {
        if choices.length() == 0 {
            return error("Choices array is empty");
        }
        json firstChoice = choices[0];
        json|error message = firstChoice.message;

        if message is json {
            json|error content = message.content;
            if content is string {
                json|error exam = checkpanic content.fromJsonString();
                if exam is json[] {
                    json[] examArray = exam;
                    
                    // Insert exam record with pdf_id
                    _ = check dbClient->execute(`INSERT INTO exams (user_id, pdf_id, title) VALUES (${userId}, ${pdfId}, "Generated Exam")`);
                    
                    int examId = check dbClient->queryRow(`SELECT LAST_INSERT_ID()`);

                    foreach var item in examArray {
                        // Process each exam item
                        json|error questionJson = item.question;
                        json|error answerJson = item.answer;
                        json|error sequenceJson = item.sequence;

                        string question = questionJson is string ? questionJson : "";
                        string answer = answerJson is string ? answerJson : "";
                        int sequence = sequenceJson is int ? sequenceJson : 0;

                        // Insert exam question
                        _ = check dbClient->execute(`INSERT INTO exam_question (exam_id, question, answer, sequence) VALUES (${examId}, ${question}, ${answer}, ${sequence})`);
                    }
                    return <json>{"message": examArray.length().toString() + " exam questions generated and stored", "examId": examId};
                } else {
                    return error("Extracted exams is not a JSON array");
                }
            } else {
                return error("Content is not a string");
            }

        }

    }
    return error("Unexpected response format from OpenAI API");

}

public function getExam(int pdfId, http:Request req) returns Exam[]|UnauthorizedError|error {
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult;
    }
    int? userId = <int?>authResult["user_id"];
    int|sql:Error examId = dbClient->queryRow(`SELECT id FROM exams WHERE pdf_id = ${pdfId} AND user_id = ${userId} ORDER BY id DESC LIMIT 1`);
    if examId is sql:Error {
        // Return empty array instead of NotFoundError when no exam exists
        return error("exam Id wrong");
    }
   

    stream<Exam, sql:Error?> examStream = dbClient->query(`SELECT * FROM exam_question WHERE exam_id = ${examId} ORDER BY sequence ASC`, Exam);
    Exam[]|sql:Error examResult = from var exam in examStream
        select exam;
    if examResult is sql:Error {
        // If no exam questions found, return empty array
        return error("No exam questions found");
    }
    return examResult;

}

public function evaluateExam(int pdfId, http:Request req) returns json|UnauthorizedError|error {
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult;
    }
     int? userId = <int?>authResult["user_id"];
  
    // Get the user's answers for the exam
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
    
    // Evaluate the exam
    string|sql:Error correctAnswers = dbClient->queryRow(`SELECT answer FROM exam_question WHERE id = ${questionId} `);
    if correctAnswers is error {
        return error("Failed to retrieve correct answers");
    }
    string|sql:Error questionResult = dbClient->queryRow(`SELECT question FROM exam_question WHERE id = ${questionId}`);
    if questionResult is error {
        return error("Failed to retrieve question text");
    }
    string correctAnswer = correctAnswers is string ? correctAnswers : "";
    string question = questionResult is string ? questionResult : "";

    // evaluate the answer
    json|error evaluationResult = evaluateAnswer(question, correctAnswer, userAnswer);
    if evaluationResult is error {
        return evaluationResult;
    }
    int score = 0;
    boolean answerResult = false;

    if evaluationResult == "yes" {
        score = 10;
        answerResult = true;

    }
    else {
        score = 0;
        answerResult = false;
    }
       record {|int count;|}|error countResult = dbClient->queryRow(
        `SELECT COUNT(*) as count FROM user_progress WHERE user_id = ${userId} AND question_id = ${questionId}`);
    if countResult is error {
        return countResult;
    }

    if countResult.count > 0 {
        // Update existing progress (add score)
        _ = check dbClient->execute(
            `UPDATE user_progress SET score = ${score}, completed_at = CURRENT_TIMESTAMP WHERE user_id = ${userId} AND question_id = ${questionId}`
        );
    } else {
        // Insert new progress
        _ = check dbClient->execute(
            `INSERT INTO user_progress (user_id, question_id, score) VALUES (${userId}, ${questionId}, ${score})`
        );
    }
     _ = check dbClient->execute(
    `UPDATE exam_question SET user_answer = ${userAnswer}, is_user_answer_correct = ${answerResult} WHERE id = ${questionId}`
    );
    
    return {
        "status": answerResult
    };
}
