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

function ExtractedTopic(int topicId,int pdfId) returns NotFoundError|string {

    Topic|sql:Error topicExists = dbClient->queryRow(`SELECT * FROM topics WHERE id = ${topicId} AND pdf_id = ${pdfId}`);
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

function AuthorizedPdfAccess(int pdf_id, int? user_id) returns boolean {
    // Check if the user has access to the PDF document
    int|sql:Error pdfAccessResult = dbClient->queryRow(`SELECT id FROM pdf_documents WHERE id = ${pdf_id} AND user_id = ${user_id}`);
    if pdfAccessResult is sql:Error {
        return false;
    }
    return true;
}

 function evaluateAnswer(string question, string answer, string userAnswer) returns json|error {
    string prompt = "Evaluate the following question and answer:\n" +
        "Question: " + question +
        "\nCorrect Answer: " + answer +
        "\nUser's Answer: " + userAnswer +
        "\nDoes the user's answer express the same main idea as the correct answer? Respond with 'yes' or 'no'.";

    json openAIReq = {
        "model": modelConfig.model,
        "messages": [
            {"role": "system", "content": "You are an AI that evaluates if a user's answer expresses the same main idea as the correct answer. Respond  with 'yes' or 'no'."},
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

        json|error firstChoice = choices[0];
        if firstChoice is json {
            return firstChoice.message.content;
        } else {
            return error("Invalid choice format");
        }
    }
    return error("Failed to extract choices from OpenAI API response");
}
