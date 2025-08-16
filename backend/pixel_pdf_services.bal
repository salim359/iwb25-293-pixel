import ballerina/http;
import ballerina/jwt;
import ballerina/sql;
import ballerina/time;
import ballerina/mime;

    public function  pdfUpload(http:Request req) returns error?|json|UnauthorizedError {       // Step 0: Validate JWT token
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
        return {id: lastInsertedId};
    }

    public function  generateSummary(int id,http:Request req) returns json|NotFoundError|UnauthorizedError|error? {

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
                        return  {"message": "Summary was updated successfully"};
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

    public function  getSummary(int id,http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
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

   