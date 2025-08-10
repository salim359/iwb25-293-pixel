import ballerinax/mysql;
import ballerinax/mysql.driver as _;
import ballerina/io;

configurable string host = "localhost";
configurable int port = 3306;
configurable string user = "root";
configurable string password = "1234";
configurable string database = "pixel";

public function main() returns error? {
    mysql:Client dbClient = check new (
        host = host,
        port = port,
        user = user,
        password = password,
        database = database
    );
    io:println("Connected to the database successfully!");
    check dbClient.close();
}