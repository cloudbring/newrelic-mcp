Feature: Entity Search
  As an AI application
  I want to search for New Relic entities across multiple domains
  So that I can find specific applications, hosts, monitors, and other resources

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: Search entities by name
    Given I want to find entities with name containing "my-app"
    When I call the "search_entities" tool with the name parameter
    Then the response should contain matching entities
    And the response should include entity GUIDs
    And the response should include entity names
    And the response should include entity types
    And the response should be valid JSON

  Scenario: Search entities by type
    Given I want to find entities of type "APPLICATION"
    When I call the "search_entities" tool with the entity_type parameter
    Then the response should contain only APPLICATION entities
    And all returned entities should have the correct type
    And the response should include entity details

  Scenario: Search entities by domain
    Given I want to find entities in the "APM" domain
    When I call the "search_entities" tool with the domain parameter
    Then the response should contain only APM domain entities
    And all returned entities should have the correct domain
    And the response should include entity details

  Scenario: Search entities by tags
    Given I want to find entities with tag "env=production"
    When I call the "search_entities" tool with the tags parameter
    Then the response should contain entities with the specified tag
    And the tag filtering should be applied correctly
    And the response should include tag information

  Scenario: Search entities with multiple criteria
    Given I want to find APM applications with name containing "web" and tag "env=prod"
    When I call the "search_entities" tool with multiple criteria
    Then the response should contain entities matching all criteria
    And the search should apply all filters correctly
    And the response should include comprehensive entity details

  Scenario: Search within specific account
    Given I want to search entities within a specific account ID
    When I call the "search_entities" tool with the target_account_id parameter
    Then the response should contain entities from the specified account
    And all returned entities should belong to the correct account
    And the search should be limited to the specified account

  Scenario: Search across all accessible accounts
    Given I want to search across all accounts accessible by my API key
    And I do not specify a target account ID
    When I call the "search_entities" tool
    Then the response should contain entities from multiple accounts
    And the search should not be limited to a single account
    And the response should indicate which account each entity belongs to

  Scenario: Limit search results
    Given I want to limit the number of search results
    When I call the "search_entities" tool with a limit parameter
    Then the response should contain no more than the specified limit
    And the response should include a count of total results
    And the response should include pagination information if applicable

  Scenario: Handle no search criteria
    Given I call the "search_entities" tool without any search criteria
    When the tool validates the input
    Then the response should contain an error message
    And the error should indicate that at least one non-account search criterion is required

  Scenario: Handle invalid account ID
    Given I provide an invalid target_account_id
    When I call the "search_entities" tool
    Then the response should contain an error message
    And the error should indicate that the account ID must be an integer

  Scenario: Handle special characters in search
    Given I search for entities with names containing special characters
    When I call the "search_entities" tool
    Then the search should handle special characters correctly
    And the response should contain matching entities
    And no SQL injection vulnerabilities should exist

  Scenario: Handle empty search results
    Given I search for entities that do not exist
    When I call the "search_entities" tool
    Then the response should contain an empty results list
    And the response should indicate zero total count
    And the response should still be valid JSON

  Scenario: Handle API errors
    Given the New Relic API returns an error during entity search
    When I call the "search_entities" tool
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario Outline: Tool schema validation
    Given I call the "search_entities" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

    Examples:
      | input_type | invalid_value | expected_error |
      | name       | 123           | Invalid name parameter |
      | entity_type | "INVALID_TYPE" | Invalid entity type |
      | domain     | "INVALID_DOMAIN" | Invalid domain |
      | tags       | "string"      | Invalid tags format |
      | limit      | -1            | Invalid limit value |
      | limit      | "string"      | Invalid limit type |

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "search_entities" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose
    And the tool should specify all available parameters

  Scenario: Cross-domain entity support
    Given I search for entities across multiple domains
    When I call the "search_entities" tool
    Then the response should include entities from different domains
    And the response should indicate the domain for each entity
    And the response should include domain-specific information

  Scenario: Entity relationship information
    Given I search for entities that have relationships
    When I call the "search_entities" tool
    Then the response should include relationship information where available
    And the relationships should be properly structured
    And the response should indicate source and target entities 