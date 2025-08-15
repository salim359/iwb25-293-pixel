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
        issuer: "pixel",
        audience: "pixelAi-users",
        clockSkew: 60,
        signatureConfig: {
            certFile: "./resources/cert.pem"
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