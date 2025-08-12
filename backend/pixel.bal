import ballerina/constraint;
import ballerina/crypto;
import ballerina/http;
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
configurable string openAiToken = ?;

type PdfText record {|
    int user_id;
    string file_name;
    string upload_date = time:utcNow().toString();
    string extracted_text;

|};

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
        // Check if PDF exists
        int|sql:Error pdfExists = dbClient->queryRow(`SELECT user_id FROM pdf_documents WHERE id = ${id}`);

        if pdfExists is sql:Error {
            NotFoundError notFoundError = {
                body: {
                    message: "PDF document not found",
                    details: "No PDF document exists with the given ID",
                    timestamp: time:utcNow()
                }
            };
            return notFoundError;
        }
        else {
            if pdfExists != userId {
                UnauthorizedError unauthorizedError = {
                    body: {
                        message: "Unauthorized access",
                        details: "You do not have permission to access this PDF document",
                        timestamp: time:utcNow()
                    }
                };
                return unauthorizedError;
            }
        }
        // Now fetch extracted_text
        string|sql:Error pdfTextResult = dbClient->queryRow(`SELECT extracted_text FROM pdf_documents WHERE id = ${id}`);
        if pdfTextResult is sql:Error {
            NotFoundError notFoundError = {
                body: {
                    message: "PDF document not found",
                    details: "No PDF document exists with the given ID",
                    timestamp: time:utcNow()
                }
            };
            return notFoundError;
        }
        // Initialize OpenAI client
        final http:Client openAIClient = check new ("https://api.openai.com/v1", {
            auth: {
                token: openAiToken
            },
            timeout: 30 // Added timeout for robustness
        });

        // Prepare OpenAI request
        string prompt = "Summarize the following text:\n" + pdfTextResult;
        json openAIReq = {
            "model": "gpt-4-turbo",
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
        int|sql:Error pdfExists = dbClient->queryRow(`SELECT user_id FROM pdf_documents WHERE id = ${id}`);
        if pdfExists is sql:Error {
            NotFoundError notFoundError = {
                body: {
                    message: "PDF document not found",
                    details: "No PDF document exists with the given ID",
                    timestamp: time:utcNow()
                }
            };
            return notFoundError;
        } else {
            if pdfExists != userId {
                UnauthorizedError unauthorizedError = {
                    body: {
                        message: "Unauthorized access",
                        details: "You do not have permission to access this PDF document",
                        timestamp: time:utcNow()
                    }
                };
                return unauthorizedError;
            }
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

        int|sql:Error pdfExists = dbClient->queryRow(`SELECT user_id FROM pdf_documents WHERE id = ${id}`);

        if pdfExists is sql:Error {
            NotFoundError notFoundError = {
                body: {
                    message: "PDF document not found",
                    details: "No PDF document exists with the given ID",
                    timestamp: time:utcNow()
                }
            };
            return notFoundError;
        } else {
            if pdfExists != userId {
                UnauthorizedError unauthorizedError = {
                    body: {
                        message: "Unauthorized access",
                        details: "You do not have permission to access this PDF document",
                        timestamp: time:utcNow()
                    }
                };
                return unauthorizedError;
            }
        }

        // Fetch extracted text
        string|sql:Error pdfTextResult = dbClient->queryRow(`SELECT extracted_text FROM pdf_documents WHERE id = ${id}`);
        if pdfTextResult is sql:Error {
            NotFoundError notFoundError = {
                body: {
                    message: "PDF document not found",
                    details: "No PDF document exists with the given ID",
                    timestamp: time:utcNow()
                }
            };
            return notFoundError;
        }

        string prompt = "Identify the main topics or sections in the following text. For each topic, provide: title, start_pos, end_pos. Return as JSON array. Text:\n" + pdfTextResult;
        json openAIReq = {
            "model": "gpt-4-turbo",
            "messages": [
                {"role": "system", "content": "You are an assistant that extracts topics from text."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 600,
            "temperature": 0.5
        };

        final http:Client openAIClient = check new ("https://api.openai.com/v1", {
            auth: {token: openAiToken},
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
                json|error topics = message.content;
                json[] parsed;
                if topics is json[] {
                    parsed = <json[]>topics;
                } else if topics is string {
                    json|error temp = checkpanic jsonutils:fromJSON(topics);
                    if temp is json[] {
                        parsed = temp;
                    } else {
                        return error("Topics content is not a valid JSON array");
                    }
                } else {
                    return error("Topics content is not a valid JSON array");
                }
                json[] topicRows = [];
                foreach var item in parsed {
                    topicRows.push(item);
                }
                return topicRows;
            }

            else {
                return error("Message field is missing or invalid");
            }
        } else {
            return error("Choices field is missing or not an array");
        }

    }

}

