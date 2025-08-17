import ballerina/http;
import ballerina/sql;

listener http:Listener pixelListener = new (8080);

// CORS configuration
@http:ServiceConfig {
    cors: {
        allowOrigins: [...corsConfig.allowOrigins],
        allowCredentials: corsConfig.allowCredentials,
        allowHeaders: [...corsConfig.allowHeaders],
        allowMethods: [...corsConfig.allowMethods],
        exposeHeaders: [...corsConfig.exposeHeaders],
        maxAge: <decimal>corsConfig.maxAge
    }
}

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
    
    //upload pdfs
    resource function post pdfs(http:Request req) returns json|UnauthorizedError|error? {
        return pdfUpload(req);
    }
    
    //get all pdfs
    resource function get pdfs(http:Request req) returns json|UnauthorizedError|error {
        return getAllPdfs(req);
    }
      // Generate a summary for a PDF
    resource function post pdfs/[int id]/summaries(http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return generateSummary(id, req);
    }
     // Retrieve a summary for a PDF
    resource function get pdfs/[int id]/summaries(http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return getSummary(id, req);
    }
    // Generate topics for a PDF
    resource function post pdfs/[int id]/topics(http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return generatetopics(id, req);
    }
    
    // Retrieve all topics for a PDF
    resource function get pdfs/[int id]/topics(http:Request req) returns json[]|UnauthorizedError|error {
        return getallTopics(id, req);
    }
     // Retrieve a specific topic by ID
    resource function get topics/[int topicId](http:Request req) returns json|NotFoundError|UnauthorizedError|error {
        return gettopic(topicId, req);
    }
    
    // Generate quizzes for a topic
    resource function post topics/[int topicId]/quizzes(http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return generatequizes(topicId, req);
    }


    // Retrieve all quizzes for a quiz set
    resource function get topics/[int topicId]/quizzes(http:Request req) returns json[]|UnauthorizedError|NotFoundError|error {
        return getquizes(topicId, req);
    }
    
    // Retrieve a specific quiz question
    resource function get questions/[int questionId](http:Request req) returns Quiz|NotFoundError|UnauthorizedError|error {
        return getquiz(questionId, req);
    }
    // Generate flashcards for a topic
    resource function post topics/[int topicId]/flashcards(http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return generateFlashCards(topicId, req);
    }
    
     // Retrieve all flashcards for a topic
    resource function get topics/[int topicId]/flashcards(http:Request req) returns Flashcard[]|sql:Error|UnauthorizedError|NotFoundError {
        return getallFlashcards(topicId, req);
    }
    
    // Retrieve a specific flashcard
    resource function get flashcards/[int flashcardId](http:Request req) returns Flashcard|NotFoundError|UnauthorizedError {
        return getflashcard(flashcardId, req);
    }

    // Add user progress for a quiz set
    resource function post quizzes/progress(http:Request req) returns json|UnauthorizedError|NotFoundError|error {
        return adduserprogress(req);
    }


    // Retrieve overall user progress
    resource function get users/progress(http:Request req) returns json|NotFoundError|UnauthorizedError|error {
        return getuserprogress(req);
    }

    // Retrieve user progress for a specific quiz set
    resource function get quizzes/[int quizId]/progress(http:Request req) returns json|NotFoundError|UnauthorizedError|error {
        return getuserprogressperquizset(quizId, req);
    }
   
    // Generate exam questions for a PDF
    resource function post pdfs/[int pdfId]/examquestions(http:Request req) returns json|NotFoundError|UnauthorizedError|error? {
        return generateExam(pdfId, req);
    }

    // Retrieve exam questions
    resource function get pdfs/[int pdfId]/examquestions(http:Request req) returns Exam[]|NotFoundError|UnauthorizedError|error {
        return getExam(pdfId, req);
    }
    

}