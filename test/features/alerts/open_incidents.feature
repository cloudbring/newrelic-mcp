Feature: Open Incidents Management
  As an AI application
  I want to list and manage open alert incidents
  So that I can monitor and respond to alert violations

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: List open incidents successfully
    Given I have open incidents in my account
    When I call the "list_open_incidents" tool
    Then the response should contain a list of open incidents
    And each incident should have an incident ID
    And each incident should have a title
    And each incident should have a priority
    And each incident should have a state
    And the response should be valid JSON

  Scenario: List open incidents with specific account
    Given I want to list open incidents from a specific account
    When I call the "list_open_incidents" tool with a target account ID
    Then the response should contain incidents from the specified account
    And all returned incidents should belong to the correct account
    And the search should be limited to the specified account

  Scenario: List open incidents by priority
    Given I want to list only critical incidents
    When I call the "list_open_incidents" tool with priority "CRITICAL"
    Then the response should contain only critical incidents
    And all returned incidents should have priority "CRITICAL"
    And no incidents with other priorities should be included

  Scenario: List open incidents by different priorities
    Given I want to list incidents by different priorities
    When I call the "list_open_incidents" tool with various priority filters
    Then the tool should accept "CRITICAL", "WARNING", and "INFO" priorities
    And the tool should filter incidents correctly by priority
    And the tool should handle case sensitivity properly

  Scenario: Handle no open incidents
    Given there are no open incidents in the account
    When I call the "list_open_incidents" tool
    Then the response should contain an empty list
    And the response should indicate zero total count
    And the response should still be valid JSON

  Scenario: Handle missing account ID
    Given no account ID is configured globally
    And no account ID is provided as parameter
    When I call the "list_open_incidents" tool
    Then the response should contain an error message
    And the error should indicate "Account ID must be provided"

  Scenario: Handle invalid account ID
    Given I provide an invalid account ID
    When I call the "list_open_incidents" tool
    Then the response should contain an error message
    And the error should indicate that the account was not found

  Scenario: Handle invalid priority
    Given I provide an invalid priority value
    When I call the "list_open_incidents" tool
    Then the response should contain an error message
    And the error should list valid priority options

  Scenario: Handle API errors
    Given the New Relic API returns an error for the open incidents query
    When I call the "list_open_incidents" tool
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario: Incident details
    Given I call the "list_open_incidents" tool
    When I receive the list of incidents
    Then each incident should include policy name information
    And each incident should include condition name information
    And each incident should include entity information
    And each incident should include timestamps

  Scenario: Cross-account open incidents
    Given I have access to open incidents in multiple accounts
    When I call the "list_open_incidents" tool without specifying an account
    Then the response should contain incidents from the default account
    And the search should be limited to the configured account

  Scenario: Incident pagination
    Given there are more than 50 open incidents in the account
    When I call the "list_open_incidents" tool
    Then the response should include pagination information
    And the response should include a nextCursor if applicable
    And the response should include a total count

  Scenario: Incident priority filtering
    Given I call the "list_open_incidents" tool with priority filters
    When I receive the filtered list of incidents
    Then the response should only include incidents matching the priority filter
    And the filter should be applied correctly
    And the filter should be case-sensitive

  Scenario: Incident entity information
    Given I call the "list_open_incidents" tool
    When I receive the list of incidents
    Then each incident should include entity information
    And the entity information should include GUID, name, and type
    And the entity information should be accurate

  Scenario: Incident timestamps
    Given I call the "list_open_incidents" tool
    When I receive the list of incidents
    Then each incident should include startedAt timestamp
    And each incident should include updatedAt timestamp
    And the timestamps should be in a valid format

  Scenario: Incident description and violation URL
    Given I call the "list_open_incidents" tool
    When I receive the list of incidents
    Then each incident should include a description
    And each incident should include a violation URL
    And the description should provide context about the incident
    And the violation URL should link to the violation details

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "list_open_incidents" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose
    And the tool should specify that it requires an account ID

  Scenario: Tool schema validation
    Given I call the "list_open_incidents" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

  Scenario: Incident consistency
    Given I call the "list_open_incidents" tool multiple times
    When I receive the responses
    Then the responses should be consistent
    And the incident lists should reflect the current state
    And the responses should be properly formatted

  Scenario: Incident performance
    Given I call the "list_open_incidents" tool
    When the tool executes the query
    Then the response should be returned within a reasonable time
    And the tool should handle large numbers of incidents efficiently
    And the response should not be truncated

  Scenario: Incident integration with alert policies
    Given I have open incidents in my account
    When I list alert policies
    Then the incidents should reference the correct alert policies
    And the policy information should be consistent between tools

  Scenario: Incident priority validation
    Given I test various priority values
    When I call the "list_open_incidents" tool with different priorities
    Then the tool should accept valid priorities (CRITICAL, WARNING, INFO)
    And the tool should reject invalid priorities
    And the tool should handle case sensitivity correctly

  Scenario: Incident pagination handling
    Given there are many open incidents in the account
    When I call the "list_open_incidents" tool multiple times with pagination
    Then each page should contain the expected number of incidents
    And the pagination should work correctly
    And no incidents should be duplicated across pages
    And all incidents should be accessible through pagination

  Scenario: Incident cross-account access
    Given I have access to open incidents in multiple accounts
    When I call the "list_open_incidents" tool with different account IDs
    Then the tool should return incidents from the specified account
    And the tool should handle account access permissions correctly
    And the tool should provide appropriate error messages for inaccessible accounts

  Scenario: Incident data integrity
    Given I call the "list_open_incidents" tool
    When I receive the list of incidents
    Then each incident should have a unique incident ID
    And each incident should have a valid title
    And each incident should have a valid priority
    And each incident should have state "OPEN"
    And the data should be consistent and complete

  Scenario: Incident search performance
    Given I search for incidents with various priority filters
    When I call the "list_open_incidents" tool with different filters
    Then the search should be fast and responsive
    And the search should return results quickly
    And the search should handle complex filter scenarios efficiently

  Scenario: Incident integration with entity details
    Given I have open incidents associated with entities
    When I access entity details for those entities
    Then the entity details should include recent alert violations
    And the alert violations should match the open incidents
    And the incident information should be consistent between tools

  Scenario: Incident state validation
    Given I call the "list_open_incidents" tool
    When I receive the list of incidents
    Then all incidents should have state "OPEN"
    And no closed or acknowledged incidents should be included
    And the state should be consistent across all incidents 