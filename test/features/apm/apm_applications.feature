Feature: APM Applications Management
  As an AI application
  I want to list and access APM application information
  So that I can monitor and manage application performance data

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: List APM applications successfully
    Given I have access to APM applications in my account
    When I call the "list_apm_applications" tool
    Then the response should contain a list of APM applications
    And each application should have a GUID
    And each application should have a name
    And each application should have a language
    And the response should be valid JSON

  Scenario: List APM applications with specific account
    Given I want to list APM applications from a specific account
    When I call the "list_apm_applications" tool with a target account ID
    Then the response should contain applications from the specified account
    And all returned applications should belong to the correct account
    And the search should be limited to the specified account

  Scenario: Handle no APM applications
    Given there are no APM applications in the account
    When I call the "list_apm_applications" tool
    Then the response should contain an empty list
    And the response should indicate zero total count
    And the response should still be valid JSON

  Scenario: Handle missing account ID
    Given no account ID is configured globally
    And no account ID is provided as parameter
    When I call the "list_apm_applications" tool
    Then the response should contain an error message
    And the error should indicate "Account ID must be provided"

  Scenario: Handle invalid account ID
    Given I provide an invalid account ID
    When I call the "list_apm_applications" tool
    Then the response should contain an error message
    And the error should indicate that the account was not found

  Scenario: Handle API errors
    Given the New Relic API returns an error for the APM applications query
    When I call the "list_apm_applications" tool
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario: APM application details
    Given I call the "list_apm_applications" tool
    When I receive the list of applications
    Then each application should include reporting status
    And each application should include alert severity
    And each application should include tags information
    And each application should include language information

  Scenario: Cross-account APM applications
    Given I have access to APM applications in multiple accounts
    When I call the "list_apm_applications" tool without specifying an account
    Then the response should contain applications from the default account
    And the search should be limited to the configured account

  Scenario: APM application pagination
    Given there are more than 250 APM applications in the account
    When I call the "list_apm_applications" tool
    Then the response should include pagination information
    And the response should include a nextCursor if applicable
    And the response should include a total count

  Scenario: APM application filtering
    Given I call the "list_apm_applications" tool
    When I receive the list of applications
    Then the response should only include APM domain applications
    And the response should only include APPLICATION type entities
    And the search should be properly filtered

  Scenario: APM application language information
    Given I call the "list_apm_applications" tool
    When I receive the list of applications
    Then each application should include language information
    And the language should be a valid programming language
    And the language should reflect the application's technology stack

  Scenario: APM application reporting status
    Given I call the "list_apm_applications" tool
    When I receive the list of applications
    Then each application should include reporting status
    And the reporting status should indicate whether the application is currently reporting
    And the reporting status should be accurate

  Scenario: APM application alert severity
    Given I call the "list_apm_applications" tool
    When I receive the list of applications
    Then each application should include alert severity information
    And the alert severity should reflect the current alert state
    And the alert severity should be properly categorized

  Scenario: APM application tags
    Given I call the "list_apm_applications" tool
    When I receive the list of applications
    Then each application should include tags information
    And the tags should be properly structured as key-value pairs
    And the tags should provide useful categorization information

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "list_apm_applications" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose
    And the tool should specify that it requires an account ID

  Scenario: Tool schema validation
    Given I call the "list_apm_applications" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

  Scenario: APM application consistency
    Given I call the "list_apm_applications" tool multiple times
    When I receive the responses
    Then the responses should be consistent
    And the application lists should reflect the current state
    And the responses should be properly formatted

  Scenario: APM application performance
    Given I call the "list_apm_applications" tool
    When the tool executes the query
    Then the response should be returned within a reasonable time
    And the tool should handle large numbers of applications efficiently
    And the response should not be truncated

  Scenario: APM application integration with entity search
    Given I search for APM applications using the entity search tool
    When I compare the results with the APM applications tool
    Then both tools should return consistent information
    And the entity search should find the same APM applications
    And the data should be consistent between tools 