import ballerina/http;
import ballerina/jwt;
import ballerina/mime;
import ballerina/time;
import ballerinax/mysql;
import ballerinax/mysql.driver as _;


configurable string host = ?;
configurable int port = ?;
configurable string user = ?;
configurable string password = ?;
configurable string database = ?;
configurable string pdf_extractor_api_key = ?;

type PdfText record {|
    int user_id;
    string file_name;
    string upload_date = time:utcNow().toString();
    string extracted_text;

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

mysql:Client dbClient = check new (
    host = host,
    port = port,
    user = user,
    password = password,
    database = database
);

service /pdf on new http:Listener(8080) {

    resource function post upload(http:Request req) returns error?|string {

        string jwt = "";
        var jwtHeader = req.getHeader("Authorization");
        if jwtHeader is string {
            jwt = jwtHeader.startsWith("Bearer ") ? jwtHeader.substring(7) : jwtHeader;

        }

        jwt:ValidatorConfig validatorConfig = {
            issuer: "pixel",
            audience: "pixelAi-users",
            clockSkew: 60,
            signatureConfig: {
                certFile: "config/cert.pem"
            }
        };


        jwt:Payload result = check jwt:validate(jwt, validatorConfig);

        int? userId = <int?>result["user_id"];

        var bodyParts = req.getBodyParts();
        string fileName = "";
        mime:Entity filePart = new;
        if bodyParts is mime:Entity[] {
            foreach var part in bodyParts {
                var contentDisposition = part.getContentDisposition();
                if contentDisposition is mime:ContentDisposition {
                    fileName = contentDisposition.fileName;
                    filePart = part;
                }
            }
        }
        // Step 1: Upload the PDF file to PDF.co
        // 1. Get presigned URL from PDF.co
        http:Client pdfCoClient = check new ("https://api.pdf.co/v1");
        map<string|string[]> requestHeaders = {"x-api-key": pdf_extractor_api_key};

        string presignPath = string `file/upload/get-presigned-url?name=${fileName}&contenttype=application/octet-stream`;
        http:Response presignRes = check pdfCoClient->get("/" + presignPath, requestHeaders);
        json presignJson = check presignRes.getJsonPayload();

        map<anydata> presignMap = <map<anydata>>presignJson;
        // io:println(presignMap);
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

        return "Pdf uploaded and text extracted successfully";
    }
}

