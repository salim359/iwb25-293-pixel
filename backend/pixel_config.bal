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

public configurable ModelConfig modelConfig = ?;
public configurable DataBaseConfig databaseConfig = ?;
public configurable string pdf_extractor_api_key = ?;

