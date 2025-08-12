import ballerina/http;

// Define the ResponseErrorInterceptor
service class ResponseErrorInterceptor {
    *http:ResponseErrorInterceptor;

    // Interceptor to handle errors in HTTP responses
    remote function interceptResponseError(http:RequestContext ctx, error err) returns http:Response|error {
        http:Response resp = new;
        resp.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
        
        // Set JSON payload with error details
        json payload = {
            message: "Internal Server Error ",
            details: err.message()
        };
        resp.setJsonPayload(payload);
        
        return resp;
    }
}

// Sample HTTP service to demonstrate the interceptor
service /api on new http:Listener(8081) {
    // Attach the interceptor
    final ResponseErrorInterceptor errorInterceptor = new;

    resource function get greet() returns string|error {
        // Simulate an error by calling doSomething
        check doSomething();
        return "Hello, World!";
    }
}

// Dummy function to simulate an error
function doSomething() returns error? {
    return error("Something went wrong");
}
