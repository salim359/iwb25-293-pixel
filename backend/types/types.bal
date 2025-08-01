// User types
public type Reporter record {|
    readonly string id;
    string name;
    string contact;
    int points;
|};

public type Adoptee record {|
    readonly string id;
    string name;
    string contact;
    int points;
|};

public type AnimalWelfare record {|
    readonly string id;
    string name;
    string location;
    int points;
|};

public type Donator record {|
    readonly string id;
    string name;
    string contact;
    int points;
|};

// Pet entry
public type Pet record {|
    readonly string petId;
    string name;
    string species;
    string description;
    string location;
    string status; // e.g., "reported", "adopted"
    string reporterId;
    string adopteeId?;
|};
