import ballerina/http;
import ballerina/jwt;
import ballerina/sql;

public function getuserprogress(int pdfId, http:Request req) returns json|NotFoundError|UnauthorizedError|error {
    jwt:Payload|UnauthorizedError authResult = Authorization(req);
    if (authResult is UnauthorizedError) {
        return authResult;
    }
    int? userId = <int?>authResult["user_id"];
    int|sql:Error|() progressCount = dbClient->queryRow(`SELECT SUM(score) FROM user_progress WHERE user_id = ${userId} AND pdf_id = ${pdfId}`);
    if progressCount is sql:Error {
        return progressCount;
    }
    if progressCount is () {
        return {count: 0}; // or handle as needed
    }
    return {count: progressCount};
}

