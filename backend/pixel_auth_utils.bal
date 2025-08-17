import ballerina/http;
import ballerina/jwt;
import ballerina/sql;
import ballerina/time;
function Authorization(http:Request req) returns jwt:Payload|UnauthorizedError {
    string jwt = "";
    var jwtHeader = req.getHeader("Authorization");
    if jwtHeader is string {
        jwt = jwtHeader.startsWith("Bearer ") ? jwtHeader.substring(7) : jwtHeader;
    }
    if jwt == "" {
        UnauthorizedError unauthorizedError = {
            body: {
                message: "Unauthorized access",
                details: "Missing token",
                timestamp: time:utcNow()
            }
        };
        return unauthorizedError;
    }

    jwt:ValidatorConfig validatorConfig = {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        clockSkew: <decimal>jwtConfig.clockSkew,
        signatureConfig: {
            certFile: jwtConfig.certFile
        }
    };

    jwt:Payload|error result = jwt:validate(jwt, validatorConfig);
    if result is error {
        string details = result.message();
        UnauthorizedError unauthorizedError = {
            body: {
                message: "Unauthorized access",
                details: details,
                timestamp: time:utcNow()
            }
        };
        return unauthorizedError;
    }
    return result;
}

function ExtractedText(int? userId, int pdfId) returns UnauthorizedError|string {

    // Check if the user has access to the PDF document
    string|sql:Error pdfTextResult = dbClient->queryRow(`SELECT extracted_text FROM pdf_documents WHERE user_id = ${userId} and id = ${pdfId}`);

    if pdfTextResult is sql:Error {
        UnauthorizedError unauthorizedError = {
            body: {
                message: "Unauthorized access",
                details: "You do not have permission to access this PDF document",
                timestamp: time:utcNow()
            }
        };
        return unauthorizedError;
    }
    return pdfTextResult;
}

function ExtractedTopic(int topicId) returns NotFoundError|string {

    Topic|sql:Error topicExists = dbClient->queryRow(`SELECT * FROM topics WHERE id = ${topicId}`);
    if topicExists is sql:Error {
        NotFoundError notFoundError = {
            body: {
                message: "Topic not found",
                details: "No topic exists with the given ID",
                timestamp: time:utcNow()
            }
        };
        return notFoundError;
    }
    string description = topicExists.description;
    return description;

}

function IscorrectAnswer(int questionId, string userAnswer) returns int {
    Quiz|sql:Error quizResult = dbClient->queryRow(`SELECT * FROM questions WHERE id = ${questionId}`);
    if quizResult is Quiz {
        string correctAnswer = quizResult.correct_answer;
        // Check if the user's answer matches the correct answer
        if correctAnswer == userAnswer {
            return 10;
        } else {
            return 0;
        }
    } else {
        // If there was an error fetching the quiz, return 0 or handle as needed
        return 0;
    }
}