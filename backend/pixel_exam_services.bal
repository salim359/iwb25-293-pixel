import ballerina/http;
// import ballerina/io;
import ballerina/jwt;
// import ballerina/sql;

public function generateExam(int pdfId, http:Request req) returns string|NotFoundError|UnauthorizedError|error {

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
        {   "title": "Exam Questions",
            "question_text": "Your question here?",
            "answer_text": "Expected answer",
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

    http:Response aiRes = check openAIClient->post("/chat/completions", openAIReq);
    if aiRes.statusCode != http:STATUS_OK {
        return error("OpenAI API request failed with status: " + aiRes.statusCode.toString());
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
                    _ = check dbClient->execute(
                                `INSERT INTO exams (user_id, title) VALUES (${userId}, "Generated Exam")`
                            );
                    int examId = check dbClient->queryRow(`SELECT LAST_INSERT_ID()`);

                    foreach var item in examArray {
                        // Process each exam item
                        json|error questionJson = item.question_text;
                        json|error answerJson = item.answer_text;
                        json|error sequenceJson = item.sequence;

                        string question = questionJson is string ? questionJson : "";
                        string answer = answerJson is string ? answerJson : "";
                        int sequence = sequenceJson is int ? sequenceJson : 0;

                        // Validate each exam item
                        if question is string && answer is string && sequence is int {
                            _ = check dbClient->execute(
                                `INSERT INTO exam_question (exam_id, question_text, answer_text, sequence) VALUES (
                                    ${examId}, ${question}, ${answer}, ${sequence})`
                            );
                        }
                    }
                    return string `${examArray.length()} exams extracted and stored`;
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

// public function getExam(int examId, http:Request req) returns Exam[]|NotFoundError|UnauthorizedError|error {
//     jwt:Payload|UnauthorizedError authResult = Authorization(req);
//     if (authResult is UnauthorizedError) {
//         return authResult;
//     }
//     int? userId = <int?>authResult["user_id"];
    
//     // Validate user access to the exam
//     anydata|sql:Error examIdCheck = dbClient->queryRow(`SELECT id FROM exams WHERE id = ${examId} AND user_id = ${userId}`);
//     if examIdCheck is sql:Error {
//         if examIdCheck is sql:NoRowsError {
//             return error("Exam not found or you do not have access to it");
//         }
//         return examIdCheck;
//     }
    
//     // Query exam questions
//     stream<Exam, sql:Error> examStream = check dbClient->query(`SELECT * FROM exam_question WHERE exam_id = ${examId} ORDER BY sequence ASC`, Exam);
//     Exam[]|error exam = from var examq in examStream
//             select examq;
//     if exam is error {
//         return exam;
//     }
//     return exam;
// }

