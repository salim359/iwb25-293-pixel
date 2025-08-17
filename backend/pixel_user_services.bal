// user_functions.bal
import ballerina/constraint;
import ballerina/crypto;
import ballerina/http;
import ballerina/jwt;
import ballerina/sql;
import ballerina/time;

public function getAllUsers() returns User[]|error {
    stream<User, sql:Error?> userStream =
        dbClient->query(`SELECT * FROM users`, User);

    return from var user in userStream
        select user;
}

public function getUserById(int id) returns User|NotFoundError|error {
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

public function createUser(NewUser newUser) returns http:Created|error {
    NewUser|error validation = check constraint:validate(newUser);
    if validation is error {
        return error("Validation failed: " + error:message(validation));
    }
    string hashed_password = check crypto:hashBcrypt(newUser.password, 14);
    _ = check dbClient->execute(`INSERT INTO users (username, email, password) VALUES (${newUser.username}, ${newUser.email}, ${hashed_password})`);
    return http:CREATED;
}

public function authenticateUser(LoginRequest loginRequest) returns LoginResponse|NotFoundError|UnauthorizedError|error {
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

    crypto:PrivateKey privateKey = check crypto:decodeRsaPrivateKeyFromKeyFile(jwtConfig.privateKeyPath);

    jwt:IssuerConfig issuerConfig = {
        username: jwtConfig.issuer,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        expTime: <decimal>jwtConfig.expTime,
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






