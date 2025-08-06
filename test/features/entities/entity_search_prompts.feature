Feature: Entity Search Query Generation
  As an AI application
  I want to generate NerdGraph query conditions for entity searches
  So that I can build complex search queries programmatically

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: Generate query for entity name search
    Given I want to search for an entity by name "my-application"
    When I call the "generate_entity_search_query" prompt with the entity name
    Then the response should contain a valid query condition
    And the query condition should include "name = 'my-application'"
    And the response should be a string

  Scenario: Generate query with domain filter
    Given I want to search for an entity by name "my-app" in the "APM" domain
    When I call the "generate_entity_search_query" prompt with name and domain
    Then the response should contain a valid query condition
    And the query condition should include "name = 'my-app'"
    And the query condition should include "domain = 'APM'"
    And the conditions should be joined with " AND "

  Scenario: Generate query with type filter
    Given I want to search for an entity by name "web-server" of type "HOST"
    When I call the "generate_entity_search_query" prompt with name and type
    Then the response should contain a valid query condition
    And the query condition should include "name = 'web-server'"
    And the query condition should include "type = 'HOST'"
    And the conditions should be joined with " AND "

  Scenario: Generate query with account ID
    Given I want to search for an entity within a specific account ID
    When I call the "generate_entity_search_query" prompt with account ID
    Then the response should contain a valid query condition
    And the query condition should include "accountId = {account_id}"
    And the account ID should be properly formatted

  Scenario: Generate query with multiple criteria
    Given I want to search for an entity with name "api-service" in "APM" domain of type "APPLICATION"
    When I call the "generate_entity_search_query" prompt with multiple criteria
    Then the response should contain a valid query condition
    And the query condition should include all specified criteria
    And all conditions should be properly joined with " AND "

  Scenario: Generate query with default account
    Given I want to search for an entity by name "my-app"
    And a default account ID is configured
    When I call the "generate_entity_search_query" prompt without specifying account
    Then the response should include the default account ID
    And the query condition should include "accountId = {default_account_id}"

  Scenario: Generate query without account specification
    Given I want to search for an entity by name "my-app"
    And no account ID is specified or configured
    When I call the "generate_entity_search_query" prompt
    Then the response should not include an account ID condition
    And the query condition should only include the name condition

  Scenario: Handle special characters in entity name
    Given I want to search for an entity with name containing special characters
    When I call the "generate_entity_search_query" prompt with the name
    Then the response should properly escape special characters
    And the query condition should be valid for NerdGraph
    And no SQL injection vulnerabilities should exist

  Scenario: Handle invalid account ID
    Given I provide an invalid account ID to the prompt
    When I call the "generate_entity_search_query" prompt
    Then the response should contain an error message
    And the error should indicate that the account ID is invalid

  Scenario: Handle empty entity name
    Given I provide an empty entity name to the prompt
    When I call the "generate_entity_search_query" prompt
    Then the response should still be a valid query condition
    And the response should handle the empty name appropriately

  Scenario: Generate query for cross-account search
    Given I want to search for an entity across multiple accounts
    When I call the "generate_entity_search_query" prompt without account restriction
    Then the response should not include an account ID condition
    And the query condition should allow cross-account search

  Scenario: Prompt discovery
    When I request the list of available prompts
    Then the "generate_entity_search_query" prompt should be present
    And the prompt should have the correct schema definition
    And the prompt should have a description explaining its purpose
    And the prompt should specify all available parameters

  Scenario: Prompt parameter completion
    Given I start typing parameters for the "generate_entity_search_query" prompt
    When I request parameter completion
    Then the system should suggest valid parameter values
    And the suggestions should include valid entity types
    And the suggestions should include valid domain values
    And the suggestions should include valid account IDs

  Scenario: Prompt argument validation
    Given I call the "generate_entity_search_query" prompt with invalid arguments
    When the prompt validates the input
    Then the prompt should reject invalid inputs
    And provide appropriate error messages
    And the error messages should be helpful for correction

  Scenario: Generate complex query conditions
    Given I want to generate a complex query with multiple filters
    When I call the "generate_entity_search_query" prompt with complex criteria
    Then the response should contain a properly formatted query condition
    And all specified criteria should be included
    And the query condition should be valid for NerdGraph execution

  Scenario: Query condition format consistency
    Given I generate multiple query conditions with different parameters
    When I examine the generated query conditions
    Then all query conditions should follow the same format
    And the conditions should use consistent syntax
    And the conditions should be compatible with NerdGraph entitySearch

  Scenario: Handle domain-specific query generation
    Given I generate query conditions for different domains
    When I examine the generated conditions
    Then the conditions should be appropriate for each domain
    And the conditions should include domain-specific filters when specified
    And the conditions should be valid for the respective domain

  Scenario: Query condition reusability
    Given I generate a query condition using the prompt
    When I use the generated condition in an entity search
    Then the search should execute successfully
    And the search should return the expected results
    And the query condition should be properly formatted for NerdGraph 