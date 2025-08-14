import ballerina/http;
import ballerina/sql;

type Pixel service object {
    *http:InterceptableService;
    // users resource
    resource function get users() returns User[]|error;
    resource function get users/[int id]() returns User|NotFoundError|error ;
    resource function post signup(NewUser newUser) returns http:Created|error;
    resource function post login(LoginRequest loginRequest) returns LoginResponse|NotFoundError|UnauthorizedError|error;
    
    //pdf services
    //upload pdf
    resource function post pdfUpload(http:Request req) returns error?|int|UnauthorizedError;
    //summary
    resource function post generatePdfSummary/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error?;
    resource function get getPdfSummary/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error?;
    //topics
    resource function post generateTopics/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error?;
    resource function get getAllTopics/[int id](http:Request req) returns json[]|UnauthorizedError|error;
    resource function get getTopic/[int topicId](http:Request req) returns json|error|NotFoundError|UnauthorizedError;
    //quizes
    resource function post generateQuizes/[int id](http:Request req) returns json|NotFoundError|UnauthorizedError|error?;
    resource function get getQuizId/[int topicId]() returns int|NotFoundError;
    resource function get getQuizes/[int quizId]() returns Quiz[]|error;
    resource function get getQuiz/[int questionId]() returns Quiz|NotFoundError|error;
    //flashcards
    resource function post generateFlashCards/[int topicId](http:Request req) returns json|NotFoundError|UnauthorizedError|error?;
    resource function get getAllFlashcards/[int topicId](http:Request req) returns Flashcard[]|sql:Error|UnauthorizedError|NotFoundError;
    resource function get getFlashcard/[int flashcardId](http:Request req) returns Flashcard|NotFoundError|UnauthorizedError;


  
};