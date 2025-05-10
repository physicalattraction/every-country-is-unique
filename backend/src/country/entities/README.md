# Country Module Entities

## UML Class Diagram

```plantuml
@startuml

class Country {
  code: string
  name: string
  flag: string
}

class Currency {
  code: string
  name: string
}

class Language {
  code: string
  name: string
}

Country "*" -- "*" Currency : currencies
Country "*" -- "*" Language : languages

@enduml
```

## Entity Descriptions

- **Country**: Represents a country with a code, name, flag, and many-to-many relations to currencies and languages.
- **Currency**: Represents a currency with a code and name.
- **Language**: Represents a language with a code and name. 