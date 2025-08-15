import ballerinax/mysql;
import ballerinax/mysql.driver as _;

public final mysql:Client dbClient = check initDbClient();

function initDbClient() returns mysql:Client|error => 
    new (...databaseConfig);