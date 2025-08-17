import ballerina/http;
import ballerina/io;
import ballerina/jwt;
import ballerina/sql;
import ballerina/time;

//per topic
public function generateFlashCards(int topicId, http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
    // Step 0: Validate JWT token
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    
    int? userId = <int?>authResult["user_id"];

    int|sql:Error pdfId = dbClient->queryRow(`SELECT pdf_id from topics where id=${topicId}`);
    if pdfId is sql:Error{
        NotFoundError notFoundError = {
            body: {message: "PDF not found",details: "pdf_id not found", timestamp: time:utcNow()}
        };
        return notFoundError;
    }
     boolean authorizationPdfAccess = AuthorizedPdfAccess(pdfId,userId);
     
    if (authorizationPdfAccess is false) {
        UnauthorizedError unauthorizedError = {
            body: {message: "Unauthorized access",details: "You do not have permission to access this PDF document", timestamp: time:utcNow()}
        };
        return unauthorizedError;
    }
    
    string|NotFoundError extractedTopicResult = ExtractedTopic(topicId,pdfId);
    if extractedTopicResult is NotFoundError {
        return extractedTopicResult;
    }
    string topicText = <string>extractedTopicResult;

    // Prompt for flashcard generation
    string prompt = string `Generate 10 flashcards from the following text. Respond ONLY with a valid JSON array of objects, no explanation. Each object should have:
        {
            "term": string,
            "definition": string
        }
        Text:\n${topicText}`;

    json openAIReq = {
        "model": modelConfig.model,
        "messages": [
            {"role": "system", "content": "You are an assistant that generates flashcards (term-definition pairs) from text."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 800,
        "temperature": 0.4
    };

    final http:Client openAIClient = check new ("https://api.openai.com/v1", {
        auth: {token: modelConfig.openAiToken},
        timeout: 90
    });

    http:Response aiRes = check openAIClient->post("/chat/completions", openAIReq);
    if aiRes.statusCode != http:STATUS_OK {
        return error("OpenAI API request failed with status: " + aiRes.statusCode.toString());
    }
    // get the content and insert it into the database
    json|error aiJson = aiRes.getJsonPayload();
    if aiJson is error {
        return error("Failed to parse OpenAI response: " + aiJson.message());
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
    json|error flashcardsResult = jsonContent.fromJsonString();
    if (flashcardsResult is error) {
        io:println("Raw content: " + content);
        io:println("Cleaned content: " + jsonContent);
        return error("Failed to parse flashcards JSON: " + flashcardsResult.message());
    }
    if !(flashcardsResult is json[]) {
        return error("Parsed content is not a JSON array");
    }
    json[] flashcardsArray = <json[]>flashcardsResult;

    // Insert each flashcard into the database
    int insertedCount = 0;
    foreach json flashcard in flashcardsArray {
        json|error termResult = flashcard.term;
        json|error definitionResult = flashcard.definition;
        if (termResult is error || definitionResult is error) {
            continue;
        }
        if (!(termResult is string && definitionResult is string)) {
            continue;
        }
        string term = <string>termResult;
        string definition = <string>definitionResult;
        sql:ExecutionResult|sql:Error insertResult = dbClient->execute(
            `INSERT INTO flashcards (topic_id, term, definition) VALUES (${topicId}, ${term}, ${definition})`
            );
        if (insertResult is sql:Error) {
            continue;
        }
        insertedCount += 1;
    }

    return {
        "message": string `${insertedCount}  flashcards generated and stored successfully`
    };

}

//get all flashcards per topic
public function getallFlashcards(int topicId, http:Request req) returns Flashcard[]|UnauthorizedError|NotFoundError {
    // Step 0: Validate JWT token
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];
    // does this topic id belong to the user?
    int|sql:Error pdfId = dbClient->queryRow(`SELECT pdf_id FROM topics WHERE id = ${topicId}`);
    if pdfId is sql:Error {
        NotFoundError notFoundError = {
            body: {message: "PDF document not found", details: "No PDF document exists with the given topic ID", timestamp: time:utcNow()}
        };
        return notFoundError;
    }
    boolean authorizationPdfAccess = AuthorizedPdfAccess(pdfId, userId);
    if authorizationPdfAccess is false {
        UnauthorizedError unauthorizedError = {
            body: {message: "Unauthorized access", details: "You do not have permission to access this PDF document", timestamp: time:utcNow()}
        };
        return unauthorizedError;
    }
    stream<Flashcard, sql:Error?> flashcardStream = dbClient->query(`SELECT * FROM flashcards WHERE topic_id=${topicId}`, Flashcard);
    Flashcard[]|sql:Error flashcardResult = from var card in flashcardStream
        select card;
    if flashcardResult is sql:Error {
        // If no flashcards found, return empty array
        return [];
    }
    return flashcardResult;
}

//get 1 flashcard
public function getflashcard(int flashcardId, http:Request req) returns Flashcard|NotFoundError|UnauthorizedError {
    // Step 0: Validate JWT token
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
    }
    int? userId = <int?>authResult["user_id"];
    
    Flashcard|sql:Error flashcardResult = dbClient->queryRow(`SELECT * FROM flashcards WHERE id = ${flashcardId}`, Flashcard);
    if flashcardResult is sql:Error {
        NotFoundError notFoundError = {
            body: {
                message: "Flashcard not found",
                details: "No flashcard exists with the given ID",
                timestamp: time:utcNow()
            }
        };
        return notFoundError;
    }
    Flashcard flashcard = <Flashcard>flashcardResult;
    
    int|sql:Error pdfId = dbClient->queryRow(`SELECT pdf_id FROM topics WHERE id = ${flashcard.topic_id}`);
    if pdfId is sql:Error {
        NotFoundError notFoundError = {
            body: {message: "PDF document not found", details: "No PDF document exists with the given topic ID", timestamp: time:utcNow()}
        };
        return notFoundError;
    }
    boolean authorizationPdfAccess = AuthorizedPdfAccess(pdfId, userId);
    if authorizationPdfAccess is false {
        UnauthorizedError unauthorizedError = {
            body: {message: "Unauthorized access", details: "You do not have permission to access this PDF document", timestamp: time:utcNow()}
        };
        return unauthorizedError;
    }
    
  return flashcard;

}

