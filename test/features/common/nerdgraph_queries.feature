Feature: NerdGraph Query Execution
  As an AI application
  I want to execute arbitrary NerdGraph queries
  So that I can access New Relic data not covered by specific tools

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: Execute a simple account query
    Given I have a valid NerdGraph query for account information
    When I call the "query_nerdgraph" tool with the query
    Then the response should contain account data
    And the response should be valid JSON
    And no errors should be present

  Scenario: Execute a query with variables
    Given I have a NerdGraph query that requires variables
    And I provide the required variables as a JSON object
    When I call the "query_nerdgraph" tool with the query and variables
    Then the response should contain the expected data
    And the variables should be properly substituted
    And the response should be valid JSON

  Scenario: Handle invalid query
    Given I provide an invalid or empty NerdGraph query
    When I call the "query_nerdgraph" tool
    Then the response should contain an error message
    And the error should indicate "Invalid or empty query provided"

  Scenario: Handle API timeout
    Given the New Relic API takes longer than 45 seconds to respond
    When I call the "query_nerdgraph" tool
    Then the response should contain a timeout error message
    And the error should indicate "NerdGraph API request timed out"

  Scenario: Handle network errors
    Given there is a network connectivity issue
    When I call the "query_nerdgraph" tool
    Then the response should contain a network error message
    And the error should indicate "NerdGraph API request failed"

  Scenario: Handle GraphQL errors
    Given I provide a valid query that returns GraphQL errors
    When I call the "query_nerdgraph" tool
    Then the response should contain the GraphQL errors
    And the errors should be properly formatted
    And the response should still be valid JSON

  Scenario Outline: Tool schema validation
    Given I call the "query_nerdgraph" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

    Examples:
      | input_type | invalid_value | expected_error |
      | query      | null          | Invalid or empty query provided |
      | query      | 123           | Invalid or empty query provided |
      | variables  | "string"      | Invalid variables format |
      | variables  | [1,2,3]       | Invalid variables format |

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "query_nerdgraph" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose 