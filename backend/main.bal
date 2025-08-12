import ballerina/http;


type Pixel service object {
    *http:InterceptableService;

    // users resource
    resource function get users() returns User[]|error;
    resource function get users/[int id]() returns User|NotFoundError|error ;
    resource function post signup(NewUser newUser) returns http:Created|error;
    resource function post login(LoginRequest loginRequest) returns LoginResponse|NotFoundError|UnauthorizedError|error;
    
    //pdf services
    resource function post pdfUpload(http:Request req) returns error?|int|UnauthorizedError;
    resource function post generatePdfSummary/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error?;
    resource function get getPdfSummary/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error?;
    resource function post generateTopics/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error?;
    


  
};