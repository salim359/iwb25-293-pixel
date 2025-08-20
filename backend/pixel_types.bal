import ballerina/constraint;
import ballerina/time;
import ballerina/http;

public type User record {|
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
        value: 8,
        message: "Password must be at least 8 characters long"
    }
    
}
public type Password string;

public type NewUser record {|
    Username username;
    Email email;
    Password password;
    string created_at = time:utcNow().toString();
|};

public type LoginRequest record {|
    string email;
    string password;
|};

public type LoginResponse record {|
    string token;
|};

public type Quiz record {|
    int id;
    int quiz_id;
    string question_text;
    string question_type;
    string options;
    string correct_answer;
    string user_answer?;
    boolean is_user_answer_correct?;
    string created_at = time:utcNow().toString();
|};

public type Flashcard record {|
    int id;
    int topic_id;
    string term;
    string definition;
|};

public type PdfText record {|
    int id;
    int user_id;
    string file_name;
    string upload_date = time:utcNow().toString();
    string extracted_text;
|};



public type Topic record {|
    readonly int id;
    readonly int pdf_id;
    string title;
    string description;
|};

// public type TopicTitle record {|
//     readonly int id;
//     string title;
// |};

public type ErrorDetails record {|
    string message;
    string details?;
    time:Utc timestamp;
|};

public type UnauthorizedError record {|
    *http:Unauthorized;
    ErrorDetails body;
|};

public type NotFoundError record {|
    *http:NotFound;
    ErrorDetails body;
|};

public type UserProgress record {|
    int id;
    int user_id;
    int question_id;
    int score;
    string completed_at = time:utcNow().toString();
|};
public type AnswerPayload record { int questionId; string answer; };

public type Exam record {|
    int id;
    int exam_id;
    string question;
    string answer;
    string user_answer?;
    boolean is_user_answer_correct?;
    int sequence;
|};