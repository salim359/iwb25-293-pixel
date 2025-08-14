import ballerina/constraint;
import ballerina/crypto;
import ballerina/http;
import ballerina/io;
import ballerina/jwt;
import ballerina/mime;
import ballerina/sql;
import ballerina/time;
import ballerinax/mysql;
import ballerinax/mysql.driver as _;

type User record {|
    readonly int id;
    string username;
    string email;
    string password;
    string created_at = time:utcNow().toString();
|};

@constraint:String {
    minLength: {
        value: 5,
        message: "UserName should have atleast 5 characters"
    },
    maxLength: {
        value: 12,
        message: "UserName can have atmost 12 characters"
    }
}
public type Username string;

@constraint:String {
    pattern: {
        value: re `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`,
        message: "Email must be in a valid format"
    }
}

public type Email string;

@constraint:String {
    minLength: {
        value: 7,
        message: "Password must be at least 7 characters long"
    },
    maxLength: {
        value: 15,
        message: "Password can be at most 15 characters long"
    }
}
type Password string;

public type NewUser record {|

    Username username;
    Email email;
    Password password;
    string created_at = time:utcNow().toString();
|};

type ErrorDetails record {|
    string message;
    string details?;
    time:Utc timestamp;
|};

type UnauthorizedError record {|
    *http:Unauthorized;
    ErrorDetails body;
|};

type NotFoundError record {|
    *http:NotFound;
    ErrorDetails body;
|};

public type LoginRequest record {|
    string email;
    string password;
|};

type LoginResponse record {|
    string token;
|};

configurable string pdf_extractor_api_key = ?;

type PdfText record {|
    int user_id;
    string file_name;
    string upload_date = time:utcNow().toString();
    string extracted_text;

|};

type Topic record {|
    readonly int id;
    readonly int pdf_id;
    string title;
    string description;
|};

type TopicTitle record {|
    readonly int id;
    string title;
|};

type Quiz record {|
    int id;
    int quiz_id;
    string question_text;
    string question_type;
    string options;
    string correct_answer;
    string created_at;
|};

type Flashcard record {|
    int id;
    int topic_id;
    string term;
    string definition;
|};

type ModelConfig record {|
    string openAiToken;
    string model;
|};

configurable ModelConfig modelConfig = ?;

type DataBaseConfig record {|
    string host;
    int port;
    string user;
    string password;
    string database;
|};

configurable DataBaseConfig databaseConfig = ?;
final mysql:Client dbClient = check initDbClient();

function initDbClient() returns mysql:Client|error => new (...databaseConfig);

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

listener http:Listener pixelListener = new (8080);

service Pixel /pixel on pixelListener {

    public function createInterceptors() returns ResponseErrorInterceptor {
        return new ResponseErrorInterceptor();
    }

    resource function get users() returns User[]|error {
        stream<User, sql:Error?> userStream =
            dbClient->query(`SELECT * FROM users`, User);

        return from var user in userStream
            select user;
    }

    resource function get users/[int id]() returns User|NotFoundError|error {
        User|error user = dbClient->queryRow(`SELECT * FROM users WHERE id = ${id}`, User);
        if user is error {
            if user is sql:NoRowsError {
                NotFoundError userNotFound = {
                    body: {
                        message: "User not found",
                        details: "No user exists with the given ID",
                        timestamp: time:utcNow()
                    }
                };
                return userNotFound;
            }
            return user;
        }
        return user;
    }

    resource function post signup(NewUser newUser) returns http:Created|error {
        //validate data
        NewUser|error validation = check constraint:validate(newUser);
        if validation is error {
            return error("Validation failed: " + error:message(validation));
        }
        //hash the password

        string hashed_password = check crypto:hashBcrypt(newUser.password, 14);

        _ = check dbClient->execute(`INSERT INTO users (username, email, password) VALUES (${newUser.username}, ${newUser.email}, ${hashed_password})`);
        return http:CREATED;
    }

    resource function post login(LoginRequest loginRequest) returns LoginResponse|NotFoundError|UnauthorizedError|error {
        User|error user = dbClient->queryRow(`SELECT * FROM users WHERE email = ${loginRequest.email}`, User);

        if user is error {
            if user is sql:NoRowsError {
                NotFoundError userNotFound = {
                    body: {
                        message: "User not found",
                        details: "No user exists with the given ID",
                        timestamp: time:utcNow()
                    }
                };
                return userNotFound;
            }
            return user;

        }
        boolean isValid = check crypto:verifyBcrypt(loginRequest.password, user.password);
        if !isValid {
            UnauthorizedError unauthorizederror = {
                body: {
                    message: "Invalid Password try again",
                    details: "The password is incorrect",
                    timestamp: time:utcNow()
                }
            };
            return unauthorizederror;
        }

        crypto:PrivateKey privateKey = check crypto:decodeRsaPrivateKeyFromKeyFile("./resources/private.key");

        // Generate JWT
        jwt:IssuerConfig issuerConfig = {
            username: "pixel",
            issuer: "pixel",
            audience: "pixelAi-users",
            expTime: 3600 * 24,
            customClaims: {
                user_id: user.id,
                email: user.email
            },
            signatureConfig: {
                algorithm: jwt:RS256,
                config: privateKey
            }
        };

        string jwt = check jwt:issue(issuerConfig);
        return {token: jwt};

    }

    resource function post pdfUpload(http:Request req) returns error?|int|UnauthorizedError {
        // Step 0: Validate JWT token
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

        // 1. Get presigned URL from PDF.co
        http:Client pdfCoClient = check new ("https://api.pdf.co/v1");
        map<string|string[]> requestHeaders = {"x-api-key": pdf_extractor_api_key};

        string presignPath = string `file/upload/get-presigned-url?name=${fileName}&contenttype=application/octet-stream`;
        http:Response presignRes = check pdfCoClient->get("/" + presignPath, requestHeaders);
        json presignJson = check presignRes.getJsonPayload();

        map<anydata> presignMap = <map<anydata>>presignJson;
        if presignMap.hasKey("error") && presignMap["error"] is boolean && presignMap["error"] == true {
            return error(presignMap["message"].toString());
        }

        string presignedUrl = presignMap["presignedUrl"].toString();

        string uploadedFileUrl = presignMap["url"].toString();

        // 2. Upload file to presigned URL
        byte[] fileBytes = check filePart.getByteArray();
        http:Client uploadClient = check new (presignedUrl, {
            httpVersion: http:HTTP_1_1,
            http1Settings: {
                chunking: http:CHUNKING_NEVER
            }
        });
        http:Request uploadRequest = new;
        uploadRequest.setHeader("content-type", "application/octet-stream");
        uploadRequest.setHeader("content-length", fileBytes.length().toString());
        uploadRequest.setBinaryPayload(fileBytes);
        http:Response uploadRes = check uploadClient->put("", uploadRequest);
        if uploadRes.statusCode != 200 {
            return error("Upload failed with status: " + uploadRes.statusCode.toString());
        }

        // 3. Convert uploaded PDF to text
        json convertReq = {
            url: uploadedFileUrl,
            pages: "" // All pages
        };

        http:Response convertRes = check pdfCoClient->post("/pdf/convert/to/text", convertReq, requestHeaders);
        json convertJson = check convertRes.getJsonPayload();
        string extractedText = "";
        map<anydata> convertMap = <map<anydata>>convertJson;
        if convertMap.hasKey("error") && convertMap["error"] is boolean && convertMap["error"] == false {
            if convertMap.hasKey("url") && convertMap["url"] is string {
                string textFileUrl = <string>convertMap["url"];
                http:Client textClient = check new (textFileUrl);
                http:Response textRes = check textClient->get("");
                extractedText = check textRes.getTextPayload();
            } else {
                return error("PDF.co response missing 'url' field or not a string.");
            }
        } else {
            string errMsg = convertMap.hasKey("message") ? convertMap["message"].toString() : "Unknown error from PDF.co";
            return error(errMsg);
        }

        _ = check dbClient->execute(`INSERT INTO pdf_documents (user_id, file_name, upload_date, extracted_text) VALUES (${userId}, ${fileName}, ${time:utcNow()}, ${extractedText})`);

        // Fetch the last inserted ID using SQL
        int lastInsertedId = check dbClient->queryRow(`SELECT LAST_INSERT_ID()`);
        return lastInsertedId;
    }

    resource function post generatePdfSummary/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {

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
                        return "Summary was updated successfully";
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

    resource function get getPdfSummary/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        // Step 0: Validate JWT token
        jwt:Payload|UnauthorizedError authResult = Authorization(req);
        if (authResult is UnauthorizedError) {
            return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
        }
        int? userId = <int?>authResult["user_id"];

        //validate that userid is the one who uploaded the PDF
        // Check if PDF exists
        string|UnauthorizedError pdfTextResult = ExtractedText(userId, id);
        if pdfTextResult is UnauthorizedError {
            return pdfTextResult;
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

    resource function post generateTopics/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        // Step 0: Validate JWT token
        jwt:Payload|UnauthorizedError authResult = Authorization(req);
        if (authResult is UnauthorizedError) {
            return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
        }
        int? userId = <int?>authResult["user_id"];

        string|UnauthorizedError pdfTextResult = ExtractedText(userId, id);
        if pdfTextResult is UnauthorizedError {
            return pdfTextResult;
        }

        string prompt = string `Extract all section or topic titles from the following text. For each title, provide a concise description of the topic. Return ONLY a valid JSON array, no explanation, no markdown, no code block. Example format:
            [
                {
                    "title": "Sample Title",
                    "description": "This is a sample description."
                }
            ]
            Text:
            ${pdfTextResult}`;
        json openAIReq = {
            "model": modelConfig.model,
            "messages": [
                {"role": "system", "content": "You are an assistant that extracts topics from text."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 600,
            "temperature": 0.5
        };

        final http:Client openAIClient = check new ("https://api.openai.com/v1", {
            auth: {token: modelConfig.openAiToken},
            timeout: 30
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
                    json|error topics = checkpanic content.fromJsonString();
                    if topics is json[] {
                        json[] topicsArray = topics;
                        foreach var item in topicsArray {
                            // Process each topic item
                            json|error titleJson = item.title;
                            json|error descriptionJson = item.description;

                            string? title = titleJson is string ? titleJson : ();
                            string? description = descriptionJson is string ? descriptionJson : ();
                            // Validate each topic item
                            if title is string && description is string {
                                // Valid topic item, store it
                                _ = check dbClient->execute(
                                    `INSERT INTO topics (pdf_id, title, description) VALUES (${id}, ${title}, ${description})`
                                );

                            }
                        }
                        return string `${topicsArray.length()} topics extracted and stored`;
                    } else {
                        return error("Extracted topics is not a JSON array");
                    }
                } else {
                    return error("Content is not a string");
                }

            }

        }

    }

    //get all the topics with pdf id
    resource function get getAllTopics/[int id](http:Request req) returns json[]|UnauthorizedError|error {
        jwt:Payload|UnauthorizedError authResult = Authorization(req);
        if (authResult is UnauthorizedError) {
            return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
        }
        stream<TopicTitle, sql:Error?> topicStream =
            dbClient->query(`SELECT title,id FROM topics WHERE pdf_id = ${id}`, TopicTitle);

        return from var topic in topicStream
            select {title: topic.title, id: topic.id};
    }

    //get 1 topic  make this

    resource function get getTopic/[int topicId](http:Request req) returns json|error|NotFoundError|UnauthorizedError {
        // Step 0: Validate JWT token
        jwt:Payload|UnauthorizedError authResult = Authorization(req);
        if (authResult is UnauthorizedError) {
            return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
        }
        // int? userId = <int?>authResult["user_id"];

        Topic|sql:Error topicResult = dbClient->queryRow(`SELECT * FROM topics WHERE id = ${topicId}`, Topic);
        if topicResult is sql:Error {
            NotFoundError notFoundError = {
                body: {
                    message: "Topic not found",
                    details: "No topic exists with the given ID",
                    timestamp: time:utcNow()
                }
            };
            return notFoundError;
        }
        Topic topic = <Topic>topicResult;

        string topicText = topic.description;

        return {"title": topic.title, "description": topicText};
    }

    // change this to get quizes per topic only
    resource function post generateQuizes/[int topicId](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
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
    resource function get getQuizId/[int topicId]() returns int|NotFoundError {
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
    resource function get getQuizes/[int quizId]() returns Quiz[]|error {
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
    resource function get getQuiz/[int questionId]() returns Quiz|NotFoundError|error {
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
    resource function post generateFlashCards/[int topicId](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        // Step 0: Validate JWT token
        jwt:Payload|UnauthorizedError authResult = Authorization(req);
        if (authResult is UnauthorizedError) {
            return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
        }
        // int? userId = <int?>authResult["user_id"];

        // Check if topic exists
        string|NotFoundError extractedTopicResult = ExtractedTopic(topicId);
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
            "message": string `${insertedCount}  flashcards generated and stored successfully`,
            "flashcards": flashcardsArray
        };

    }

    //get all flashcards per topic
    resource function get getAllFlashcards/[int topicId](http:Request req) returns Flashcard[]|sql:Error|UnauthorizedError|NotFoundError {
        // Step 0: Validate JWT token
        jwt:Payload|UnauthorizedError authResult = Authorization(req);
        if (authResult is UnauthorizedError) {
            return authResult; // UnauthorizedError (includes expiry, invalid, or missing token)
        }
        int? userId = <int?>authResult["user_id"];
        // does this topic id belong to the user?
        int|sql:Error pdfIDResult = dbClient->queryRow(`SELECT pdf_id FROM topics WHERE id = ${topicId}`);
        if pdfIDResult is int {
            int pdfID = <int>pdfIDResult;
            int|sql:Error userIDResult = dbClient->queryRow(`SELECT user_id FROM pdf_documents WHERE id = ${pdfID}`);
            if userIDResult is int {
                int userID = <int>userIDResult;
                if (userID == userId) {
                    stream<Flashcard, sql:Error?> flashcardStream =
                        dbClient->query(`SELECT * FROM flashcards WHERE topic_id=${topicId}`, Flashcard);
                    Flashcard[]|sql:Error flashcardResult = from var flashcard in flashcardStream
                        select flashcard;
                    if flashcardResult is sql:Error {
                        return flashcardResult;
                    }
                    return flashcardResult;
                } else {
                    UnauthorizedError unauthorizedError = {
                        body: {message: "User is not authorized to access this resource", details: "User ID does not match", timestamp: time:utcNow()}
                    };
                    return unauthorizedError;
                }
            }
        }
        NotFoundError notFoundError = {
            body: {message: "Flashcard not found", details: "No flashcard exists with the given topic ID", timestamp: time:utcNow()}
        };
        return notFoundError;

    }

    //get 1 flashcard
    resource function get getFlashcard/[int flashcardId](http:Request req) returns Flashcard|NotFoundError|UnauthorizedError {
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
        // Check topic ownership
        int|sql:Error pdfIDResult = dbClient->queryRow(`SELECT pdf_id FROM topics WHERE id = ${flashcard.topic_id}`);
        if pdfIDResult is int {
            int pdfID = <int>pdfIDResult;
            int|sql:Error userIDResult = dbClient->queryRow(`SELECT user_id FROM pdf_documents WHERE id = ${pdfID}`);
            if userIDResult is int {
                int userID = <int>userIDResult;
                if (userID == userId) {
                    return flashcard;
                } else {
                    UnauthorizedError unauthorizedError = {
                        body: {message: "User is not authorized to access this resource", details: "User ID does not match", timestamp: time:utcNow()}
                    };
                    return unauthorizedError;
                }
            }
        }
        NotFoundError notFoundError = {
            body: {message: "Flashcard not found", details: "No flashcard exists with the given topic ID", timestamp: time:utcNow()}
        };
        return notFoundError;

    }
    
    

}
