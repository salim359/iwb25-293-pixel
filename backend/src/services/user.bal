import ballerina/constraint;
import ballerina/crypto;
import ballerina/http;
import ballerina/jwt;
import ballerina/sql;
import ballerina/time;
import ballerinax/mysql;
import ballerinax/mysql.driver as _;

configurable string host = ?;
configurable int port = ?;
configurable string user = ?;
configurable string password = ?;
configurable string database = ?;

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
type Username string;

@constraint:String {
    pattern: {
        value: re `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`,
        message: "Email must be in a valid format"
    }
}

type Email string;

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

type NewUser record {|

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

type LoginRequest record {|
    string email;
    string password;
|};

type LoginResponse record {|
    string token;
|};

mysql:Client dbClient = check new (
    host = host,
    port = port,
    user = user,
    password = password,
    database = database
);

service /users on new http:Listener(8080) {
    resource function get .() returns User[]|error {
        stream<User, sql:Error?> userStream =
            dbClient->query(`SELECT * FROM users`, User);

        return from var user in userStream
            select user;
    }

    resource function get [int id]() returns User|NotFoundError|error {
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

        _ = check dbClient->execute(`INSERT INTO users (username, email, password, created_at) VALUES (${newUser.username}, ${newUser.email}, ${hashed_password}, ${newUser.created_at})`);
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
// ../../config/private.key from running from services 
        crypto:PrivateKey privateKey = check crypto:decodeRsaPrivateKeyFromKeyFile("config/private.key");

        // Generate JWT
        jwt:IssuerConfig issuerConfig = {
            username: "pixel",
            issuer: "pixel",
            audience: "pixelAi-users",
            expTime: 3600,
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

}

