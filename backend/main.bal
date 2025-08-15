import ballerina/http;
import ballerina/sql;

listener http:Listener pixelListener = new (8080);

service /pixel on pixelListener {

    resource function get users() returns User[]|error {
        return getAllUsers();
    }

    resource function get users/[int id]() returns User|NotFoundError|error {
        return getUserById(id);
    }

    resource function post signup(NewUser newUser) returns http:Created|error {
        return createUser(newUser);
    }

    resource function post login(LoginRequest loginRequest) returns LoginResponse|NotFoundError|UnauthorizedError|error {
        return authenticateUser(loginRequest);
    }
    resource function post pdfUpload(http:Request req) returns error?|int|UnauthorizedError {
        return pdfUpload(req);
    }
    resource function post generatePdfSummary/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return generateSummary(id, req);
    }
    
    resource function get getPdfSummary/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {

        return getSummary(id, req);
    }
    resource function post generateTopics/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return generatetopics(id, req);
    }
    
    resource function get getAllTopics/[int id](http:Request req) returns json[]|UnauthorizedError|error {
        return getallTopics(id, req);
    }
    resource function get getTopic/[int topicId](http:Request req) returns json|error|NotFoundError|UnauthorizedError {

        return gettopic(topicId, req);
    }
    
    resource function post generateQuizes/[int topicId](http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return generatequizes(topicId, req);
    }
    resource function get getQuizId/[int topicId]() returns int|NotFoundError {

        return getquizId(topicId);
    }
    resource function get getQuizes/[int quizId]() returns Quiz[]|error {
             return getquizes(quizId);
     }
    resource function get getQuiz/[int questionId]() returns Quiz|NotFoundError|error {
        return getquiz(questionId);
    }
    
    resource function get getAllFlashcards/[int topicId](http:Request req) returns Flashcard[]|sql:Error|UnauthorizedError|NotFoundError {
        return getallFlashcards(topicId, req);
    }
    
    resource function get getFlashcard/[int flashcardId](http:Request req) returns Flashcard|NotFoundError|UnauthorizedError {

        return getflashcard(flashcardId, req);
    }
    
    
}