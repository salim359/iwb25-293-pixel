import ballerina/http;
import ballerina/jwt;
import ballerina/mime;
import ballerina/sql;
import ballerina/time;
// import ballerina/io;

public function pdfUpload(http:Request req) returns error?|json|UnauthorizedError { // Step 0: Validate JWT token
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];

    var bodyParts = req.getBodyParts();
    mime:Entity filePart = new mime:Entity();
    string fileName = "";
    if bodyParts is mime:Entity[] {
        foreach var part in bodyParts {
            var contentDisposition = part.getContentDisposition();
            if contentDisposition is mime:ContentDisposition {
                fileName = contentDisposition.fileName;
                filePart = part;
            }
        }
    }
    
    final http:Client openAIClient = check new ("https://api.openai.com/v1", {
        auth: {
            token: modelConfig.openAiToken
        },
        timeout: 30 // Added timeout for robustness
    });
     // Read the PDF file
    byte[] fileData = check filePart.getByteArray();
    
      // Prepare OpenAI request
    string prompt = "extract text the given pdf:\n" ;
    json openAIReq = {
        "model": modelConfig.model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that extract text concisely from a given pdf."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 300,
        "temperature": 0.7
    };
    // Send request to OpenAI
    http:Response aiRes = check openAIClient->post("/chat/completions", openAIReq);
    if aiRes.statusCode != http:STATUS_OK {
        return error("OpenAI API request failed with status: " + aiRes.statusCode.toString());
    }
    
    json|error aiJson = aiRes.getJsonPayload();
    if aiJson is error {
        return error("Failed to parse OpenAI response: " + aiJson.message());
    }
    return aiJson;
    
    
   

    // _ = check dbClient->execute(`INSERT INTO pdf_documents (user_id, file_name, upload_date, extracted_text) VALUES (${userId}, ${fileName}, ${time:utcNow()}, ${extractedText})`);

    // // Fetch the last inserted ID using SQL
    // int lastInsertedId = check dbClient->queryRow(`SELECT LAST_INSERT_ID()`);
    // return {id: lastInsertedId};
}

public function getAllPdfs(http:Request req) returns json|UnauthorizedError|error {
    // Step 0: Validate JWT token
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];

    stream<PdfText, sql:Error?> pdfStream =
        dbClient->query(`SELECT * FROM pdf_documents WHERE user_id = ${userId}`, PdfText);

    PdfText[]|sql:Error pdfResult = from var pdf in pdfStream
        select pdf;

    if pdfResult is sql:Error {
        return pdfResult;
    }
    json[] pdfs = [];
    foreach var pdf in pdfResult {
        int noOfTopics = check dbClient->queryRow(`SELECT COUNT(*) FROM topics WHERE pdf_id=${pdf.id}`);
        int noOfQuestions = check dbClient->queryRow(`SELECT COUNT(*) FROM questions 
            WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE topic_id IN (
                    SELECT id FROM topics WHERE pdf_id = ${pdf.id}
                )
            )`);
        int noOfcards = check dbClient->queryRow(`SELECT COUNT(*) FROM flashcards WHERE topic_id IN (SELECT id FROM topics WHERE pdf_id=${pdf.id})`);
        pdfs.push({id: pdf.id, name: pdf.file_name, cards: noOfcards, topics: noOfTopics, quizzes: noOfQuestions});
    }
    return pdfs;
}

public function generateSummary(int id, http:Request req) returns json|NotFoundError|UnauthorizedError|error? {

    // Step 0: Validate JWT token
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];

    // validate that userid is the one who uploaded the PDF
    string|UnauthorizedError pdfTextResult = ExtractedText(userId, id);
    if pdfTextResult is UnauthorizedError {
        return pdfTextResult;
    }

    string extractedText = <string>pdfTextResult;

    // Initialize OpenAI client
    final http:Client openAIClient = check new ("https://api.openai.com/v1", {
        auth: {
            token: modelConfig.openAiToken
        },
        timeout: 30 // Added timeout for robustness
    });

    // Prepare OpenAI request
    string prompt = "Summarize the following text:\n" + extractedText;
    json openAIReq = {
        "model": modelConfig.model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that summarizes text concisely."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 300,
        "temperature": 0.7
    };

    // Send request to OpenAI
    http:Response aiRes = check openAIClient->post("/chat/completions", openAIReq);
    if aiRes.statusCode != http:STATUS_OK {
        return error("OpenAI API request failed with status: " + aiRes.statusCode.toString());
    }

    json|error aiJson = aiRes.getJsonPayload();
    if aiJson is error {
        return error("Failed to parse OpenAI response: " + aiJson.message());
    }

    // Extract summary from response
    json|error choices = aiJson.choices;
    if choices is json[] {
        if choices.length() == 0 {
            return error("Choices array is empty");
        }

        json firstChoice = choices[0];
        json|error message = firstChoice.message;
        if message is json {
            json|error summary = message.content;
            if summary is string {
                string|sql:Error existingSummary = dbClient->queryRow(`SELECT summary FROM pdf_summaries WHERE pdf_id = ${id}`);
                if existingSummary is sql:Error {
                    // No summary exists, insert new
                    _ = check dbClient->execute(
                            `INSERT INTO pdf_summaries (pdf_id, summary, generated_at) VALUES (${id}, ${summary}, ${time:utcNow()})`
                        );
                    return "Summary was generated successfully";
                } else {
                    // Summary exists, update it
                    _ = check dbClient->execute(
                            `UPDATE pdf_summaries SET summary = ${summary}, generated_at = ${time:utcNow()} WHERE pdf_id = ${id}`
                        );
                    return {"message": "Summary was updated successfully"};
                }
            } else {
                return error("Summary content is not a string");
            }
        } else {
            return error("Message field is missing or invalid");
        }
    } else {
        return error("Choices field is missing or not an array");
    }
}

public function getSummary(int id, http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
    // Step 0: Validate JWT token
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];

    boolean authorizationPdfAccess = AuthorizedPdfAccess(id,userId);
    if (authorizationPdfAccess is false) {
        UnauthorizedError unauthorizedError = {
            body: {message: "Unauthorized access",details: "You do not have permission to access this PDF document", timestamp: time:utcNow()}
        };
        return unauthorizedError;
    }

    // Fetch the summary from the database
    string|sql:Error summaryResult = dbClient->queryRow(`SELECT summary FROM pdf_summaries WHERE pdf_id = ${id}`);
    if summaryResult is sql:Error {
        NotFoundError notFoundError = {
            body: {
                message: "Summary not found",
                details: "No summary exists for the given PDF ID",
                timestamp: time:utcNow()
            }
        };
        return notFoundError;
    }
    return {"summary": summaryResult};
}

