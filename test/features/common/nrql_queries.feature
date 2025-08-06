Feature: NRQL Query Execution
  As an AI application
  I want to execute NRQL queries against New Relic data
  So that I can analyze time-series data and custom metrics

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: Execute a simple NRQL query
    Given I have a valid NRQL query "SELECT count(*) FROM Transaction TIMESERIES"
    When I call the "run_nrql_query" tool with the query
    Then the response should contain query results
    And the response should include metadata
    And the response should be valid JSON
    And no errors should be present

  Scenario: Execute NRQL query with specific account
    Given I have a valid NRQL query "SELECT count(*) FROM Transaction"
    And I specify a target account ID
    When I call the "run_nrql_query" tool with the query and account ID
    Then the response should contain data from the specified account
    And the query should be executed against the correct account

  Scenario: Execute complex NRQL query
    Given I have a complex NRQL query with aggregations and filters
    When I call the "run_nrql_query" tool with the complex query
    Then the response should contain aggregated results
    And the response should include facets if applicable
    And the response should include time window information

  Scenario: Handle missing account ID
    Given I have a valid NRQL query
    And no account ID is configured globally
    And no account ID is provided as parameter
    When I call the "run_nrql_query" tool
    Then the response should contain an error message
    And the error should indicate "Account ID must be provided"

  Scenario: Handle invalid NRQL query
    Given I provide an invalid or empty NRQL query
    When I call the "run_nrql_query" tool
    Then the response should contain an error message
    And the error should indicate "Invalid or empty NRQL query provided"

  Scenario: Handle NRQL syntax errors
    Given I provide a NRQL query with syntax errors
    When I call the "run_nrql_query" tool
    Then the response should contain GraphQL errors
    And the errors should indicate the NRQL syntax issue
    And the response should still be valid JSON

  Scenario: Handle time-series queries
    Given I have a NRQL query with TIMESERIES clause
    When I call the "run_nrql_query" tool
    Then the response should include time window metadata
    And the results should be properly time-bucketed
    And the metadata should include begin and end times

  Scenario: Handle facet queries
    Given I have a NRQL query that includes FACET
    When I call the "run_nrql_query" tool
    Then the response should include facets metadata
    And the results should be properly faceted
    And the metadata should indicate available facets

  Scenario: Handle event type queries
    Given I have a NRQL query that references specific event types
    When I call the "run_nrql_query" tool
    Then the response should include eventTypes metadata
    And the metadata should list the event types used

  Scenario Outline: Tool schema validation
    Given I call the "run_nrql_query" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

    Examples:
      | input_type | invalid_value | expected_error |
      | nrql       | null          | Invalid or empty NRQL query provided |
      | nrql       | 123           | Invalid or empty NRQL query provided |
      | target_account_id | "string" | Invalid account ID format |
      | target_account_id | -1       | Invalid account ID format |

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "run_nrql_query" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose
    And the tool should specify that it requires an account ID

  Scenario: Cross-account query support
    Given I have a valid NRQL query
    And I specify a different account ID than the default
    When I call the "run_nrql_query" tool with the different account ID
    Then the query should be executed against the specified account
    And the results should come from the correct account 