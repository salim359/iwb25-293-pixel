import ballerina/http;
import ballerina/jwt;
import ballerina/sql;
import ballerina/time;
 
 public function  generatetopics(int id,http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
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
                        return { message: "Topics generated successfully", topics: topicsArray };
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
    public function getallTopics(int id,http:Request req) returns json[]|UnauthorizedError|error {
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

     public function  gettopic(int topicId,http:Request req) returns json|error|NotFoundError|UnauthorizedError {
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

   