import ballerina/http;

public enum Species {
    Dog,
    Cat
}

public enum Gender {
    Male,
    Female,
    Unknnown
}

public enum Status {
    reported,
    adopted,
    lost,
    found
}
public enum Role{
    Reporter,
    Adoptee,
    AnimalWelfare,
    Donator
}
// User types
public type Pet record {|
    readonly int id;
    string name;
    Species species;
    string breed?;
    string age?;
    Gender gender;
    string photoUrl?;
    string description;
    string location;
    Status status; 
|};

public type User record{|
    readonly int id;
    string username;
    string email;
    string password;
    Role role;
    int points = 0;
|};

public type Shelter record{|
    readonly int id;
    string name;
    string address;
    string latitude?;
    string 
    int capacity;
|};


// Tables
public final table< Reporter> key(id) reportersTable = table [
    {id: "R1", name: "Alice", contact: "alice@email.com", points: 10},
    {id: "R2", name: "Bob", contact: "bob@email.com", points: 20}
];

public final table<Adoptee> key(id) adopteesTable = table [
    {id: "A1", name: "Charlie", contact: "charlie@email.com", points: 15}
];

public final table<AnimalWelfare> key(id) welfareTable = table [
    {id: "W1", name: "Happy Paws", location: "City Center", points: 100}
];

public final table<Donator> key(id) donatorsTable = table [
    {id: "D1", name: "Dana", contact: "dana@email.com", points: 50}
];

public final table<Pet> key(petId) petsTable = table [
    {petId: "P1", name: "Max", species: "Dog", description: "Friendly stray", location: "Park", status: "reported", reporterId: "R1"},
    {petId: "P2", name: "Milo", species: "Cat", description: "Lost kitten", location: "Downtown", status: "reported", reporterId: "R2"}
];
public type ConflictingPetIdsError record {|
    *http:Conflict;
    ErrorMsg body;
|};

public type ErrorMsg record {|
    string errmsg;
|};
public type InvalidPetIdError record {|
    *http:NotFound;
    ErrorMsg body;
|};
//get all user data
service /petadoption on new http:Listener(9000) {
    resource function get pets() returns Pet[] {
        return petsTable.toArray();
    }

    resource function get adoptees() returns Adoptee[] {
        return adopteesTable.toArray();
    }

    resource function get AnimalWelfare() returns AnimalWelfare[] {
        return welfareTable.toArray();
    }

    resource function get Donators() returns Donator[] {
        return donatorsTable.toArray();
    }

    resource function get Reporters() returns Reporter[] {
        return reportersTable.toArray();

    }

    resource function post pet(@http:Payload Pet[] pets)
                                    returns Pet[]|ConflictingPetIdsError {

        string[] conflictingPetIds = from Pet pet in pets
            where petsTable.hasKey(pet.petId)
            select pet.petId;

        if conflictingPetIds.length() > 0 {
            return {
                body: {
                    errmsg: string:'join(" ", "Conflicting Pet IDs:", ...conflictingPetIds)
                }
            };
        } else {
            pets.forEach(pet => petsTable.add(pet));
            return pets;
        }
    }
    resource function get pets/[string petId]() returns Pet|InvalidPetIdError {
        Pet? pet = petsTable[petId];
        if pet is () {
            return {
                body: {
                    errmsg: string `Invalid Pet ID: ${petId}`
                }
            };
        }
        return pet;
    }

}




