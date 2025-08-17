public type ModelConfig record {|
    string openAiToken;
    string model;
|};

public type DataBaseConfig record {|
    string host;
    int port;
    string user;
    string password;
    string database;
|};

public type CorsConfig record {|
    string[] allowOrigins;
    boolean allowCredentials;
    string[] allowHeaders;
    string[] allowMethods;
    string[] exposeHeaders;
    int maxAge;
|};

public type JwtConfig record {|
    string issuer;
    string audience;
    int expTime; // in seconds
    string privateKeyPath;
    int clockSkew; // in seconds
    string certFile;
|};

public configurable ModelConfig modelConfig = ?;
public configurable DataBaseConfig databaseConfig = ?;
public configurable string pdf_extractor_api_key = ?;

// Configuration constants
public configurable int PORT = 8080;
public configurable CorsConfig corsConfig = ?;

// JWT Configuration
public configurable JwtConfig jwtConfig = ?;

