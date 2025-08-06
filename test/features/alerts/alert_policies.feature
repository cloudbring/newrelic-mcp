Feature: Alert Policies Management
  As an AI application
  I want to list and manage alert policies
  So that I can monitor and control alert configurations

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: List alert policies successfully
    Given I have alert policies in my account
    When I call the "list_alert_policies" tool
    Then the response should contain a list of alert policies
    And each policy should have an ID
    And each policy should have a name
    And each policy should have an incident preference
    And the response should be valid JSON

  Scenario: List alert policies with specific account
    Given I want to list alert policies from a specific account
    When I call the "list_alert_policies" tool with a target account ID
    Then the response should contain policies from the specified account
    And all returned policies should belong to the correct account
    And the search should be limited to the specified account

  Scenario: List alert policies with name filter
    Given I want to find policies with name containing "production"
    When I call the "list_alert_policies" tool with a policy name filter
    Then the response should contain only policies matching the filter
    And all returned policies should have names containing the filter string
    And the filter should be case-insensitive

  Scenario: Handle no alert policies
    Given there are no alert policies in the account
    When I call the "list_alert_policies" tool
    Then the response should contain an empty list
    And the response should indicate zero total count
    And the response should still be valid JSON

  Scenario: Handle missing account ID
    Given no account ID is configured globally
    And no account ID is provided as parameter
    When I call the "list_alert_policies" tool
    Then the response should contain an error message
    And the error should indicate "Account ID must be provided"

  Scenario: Handle invalid account ID
    Given I provide an invalid account ID
    When I call the "list_alert_policies" tool
    Then the response should contain an error message
    And the error should indicate that the account was not found

  Scenario: Handle API errors
    Given the New Relic API returns an error for the alert policies query
    When I call the "list_alert_policies" tool
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario: Alert policy details
    Given I call the "list_alert_policies" tool
    When I receive the list of policies
    Then each policy should include incident preference information
    And the incident preferences should be valid (PER_POLICY, PER_CONDITION, PER_CONDITION_AND_TARGET)
    And each policy should include policy ID and name

  Scenario: Cross-account alert policies
    Given I have access to alert policies in multiple accounts
    When I call the "list_alert_policies" tool without specifying an account
    Then the response should contain policies from the default account
    And the search should be limited to the configured account

  Scenario: Alert policy pagination
    Given there are more than 50 alert policies in the account
    When I call the "list_alert_policies" tool
    Then the response should include pagination information
    And the response should include a nextCursor if applicable
    And the response should include a total count

  Scenario: Alert policy filtering
    Given I call the "list_alert_policies" tool with a name filter
    When I receive the filtered list of policies
    Then the response should only include policies matching the filter
    And the filter should be applied correctly
    And the filter should be case-insensitive

  Scenario: Alert policy incident preferences
    Given I call the "list_alert_policies" tool
    When I receive the list of policies
    Then each policy should include incident preference information
    And the incident preferences should be properly categorized
    And the incident preferences should reflect the policy's alert behavior

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "list_alert_policies" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose
    And the tool should specify that it requires an account ID

  Scenario: Tool schema validation
    Given I call the "list_alert_policies" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

  Scenario: Alert policy consistency
    Given I call the "list_alert_policies" tool multiple times
    When I receive the responses
    Then the responses should be consistent
    And the policy lists should reflect the current state
    And the responses should be properly formatted

  Scenario: Alert policy performance
    Given I call the "list_alert_policies" tool
    When the tool executes the query
    Then the response should be returned within a reasonable time
    And the tool should handle large numbers of policies efficiently
    And the response should not be truncated

  Scenario: Alert policy integration with incidents
    Given I have alert policies in my account
    When I list open incidents
    Then the incidents should reference the correct alert policies
    And the policy information should be consistent between tools

  Scenario: Alert policy name filtering edge cases
    Given I test various name filter scenarios
    When I call the "list_alert_policies" tool with different filters
    Then the tool should handle empty filter strings appropriately
    And the tool should handle special characters in filter strings
    And the tool should handle very long filter strings
    And the tool should handle exact matches and partial matches

  Scenario: Alert policy pagination handling
    Given there are many alert policies in the account
    When I call the "list_alert_policies" tool multiple times with pagination
    Then each page should contain the expected number of policies
    And the pagination should work correctly
    And no policies should be duplicated across pages
    And all policies should be accessible through pagination

  Scenario: Alert policy cross-account access
    Given I have access to alert policies in multiple accounts
    When I call the "list_alert_policies" tool with different account IDs
    Then the tool should return policies from the specified account
    And the tool should handle account access permissions correctly
    And the tool should provide appropriate error messages for inaccessible accounts

  Scenario: Alert policy data integrity
    Given I call the "list_alert_policies" tool
    When I receive the list of policies
    Then each policy should have a unique ID
    And each policy should have a valid name
    And each policy should have a valid incident preference
    And the data should be consistent and complete

  Scenario: Alert policy search performance
    Given I search for policies with various name filters
    When I call the "list_alert_policies" tool with different filters
    Then the search should be fast and responsive
    And the search should return results quickly
    And the search should handle complex filter strings efficiently

  Scenario: Alert policy integration with entity details
    Given I have alert policies associated with entities
    When I access entity details for those entities
    Then the entity details should include alert condition information
    And the alert conditions should reference the correct policies
    And the policy information should be consistent between tools 