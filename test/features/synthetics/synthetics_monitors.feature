Feature: Synthetic Monitors Management
  As an AI application
  I want to list and manage synthetic monitors
  So that I can monitor website and API availability

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: List synthetic monitors successfully
    Given I have synthetic monitors in my account
    When I call the "list_synthetics_monitors" tool
    Then the response should contain a list of synthetic monitors
    And each monitor should have a GUID
    And each monitor should have a name
    And each monitor should have a monitor type
    And each monitor should have a period
    And each monitor should have a status
    And the response should be valid JSON

  Scenario: List synthetic monitors with specific account
    Given I want to list synthetic monitors from a specific account
    When I call the "list_synthetics_monitors" tool with a target account ID
    Then the response should contain monitors from the specified account
    And all returned monitors should belong to the correct account
    And the search should be limited to the specified account

  Scenario: Handle no synthetic monitors
    Given there are no synthetic monitors in the account
    When I call the "list_synthetics_monitors" tool
    Then the response should contain an empty list
    And the response should indicate zero total count
    And the response should still be valid JSON

  Scenario: Handle missing account ID
    Given no account ID is configured globally
    And no account ID is provided as parameter
    When I call the "list_synthetics_monitors" tool
    Then the response should contain an error message
    And the error should indicate "Account ID must be provided"

  Scenario: Handle invalid account ID
    Given I provide an invalid account ID
    When I call the "list_synthetics_monitors" tool
    Then the response should contain an error message
    And the error should indicate that the account was not found

  Scenario: Handle API errors
    Given the New Relic API returns an error for the synthetic monitors query
    When I call the "list_synthetics_monitors" tool
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario: Synthetic monitor details
    Given I call the "list_synthetics_monitors" tool
    When I receive the list of monitors
    Then each monitor should include public locations
    And each monitor should include private locations if applicable
    And each monitor should include tags information
    And each monitor should include monitor type information

  Scenario: Cross-account synthetic monitors
    Given I have access to synthetic monitors in multiple accounts
    When I call the "list_synthetics_monitors" tool without specifying an account
    Then the response should contain monitors from the default account
    And the search should be limited to the configured account

  Scenario: Synthetic monitor pagination
    Given there are more than 250 synthetic monitors in the account
    When I call the "list_synthetics_monitors" tool
    Then the response should include pagination information
    And the response should include a nextCursor if applicable
    And the response should include a total count

  Scenario: Synthetic monitor filtering
    Given I call the "list_synthetics_monitors" tool
    When I receive the list of monitors
    Then the response should only include SYNTH domain monitors
    And the response should only include MONITOR type entities
    And the search should be properly filtered

  Scenario: Synthetic monitor types
    Given I call the "list_synthetics_monitors" tool
    When I receive the list of monitors
    Then each monitor should include monitor type information
    And the monitor types should be valid (e.g., SIMPLE_BROWSER, SCRIPT_API, etc.)
    And the monitor types should reflect the monitoring method

  Scenario: Synthetic monitor periods
    Given I call the "list_synthetics_monitors" tool
    When I receive the list of monitors
    Then each monitor should include period information
    And the periods should be valid (e.g., EVERY_MINUTE, EVERY_5_MINUTES, etc.)
    And the periods should indicate check frequency

  Scenario: Synthetic monitor status
    Given I call the "list_synthetics_monitors" tool
    When I receive the list of monitors
    Then each monitor should include status information
    And the status should be valid (e.g., ENABLED, DISABLED, MUTED)
    And the status should reflect the current state

  Scenario: Synthetic monitor locations
    Given I call the "list_synthetics_monitors" tool
    When I receive the list of monitors
    Then each monitor should include public locations
    And the public locations should be valid location labels
    And private locations should be included if applicable
    And the locations should indicate where the monitor runs

  Scenario: Synthetic monitor tags
    Given I call the "list_synthetics_monitors" tool
    When I receive the list of monitors
    Then each monitor should include tags information
    And the tags should be properly structured as key-value pairs
    And the tags should provide useful categorization information

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "list_synthetics_monitors" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose
    And the tool should specify that it requires an account ID

  Scenario: Tool schema validation
    Given I call the "list_synthetics_monitors" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

  Scenario: Synthetic monitor consistency
    Given I call the "list_synthetics_monitors" tool multiple times
    When I receive the responses
    Then the responses should be consistent
    And the monitor lists should reflect the current state
    And the responses should be properly formatted

  Scenario: Synthetic monitor performance
    Given I call the "list_synthetics_monitors" tool
    When the tool executes the query
    Then the response should be returned within a reasonable time
    And the tool should handle large numbers of monitors efficiently
    And the response should not be truncated

  Scenario: Synthetic monitor integration with entity search
    Given I search for synthetic monitors using the entity search tool
    When I compare the results with the synthetic monitors tool
    Then both tools should return consistent information
    And the entity search should find the same synthetic monitors
    And the data should be consistent between tools

  Scenario: Synthetic monitor integration with entity details
    Given I have a synthetic monitor GUID from the list
    When I access the "newrelic://entity/{guid}" resource with the monitor GUID
    Then the response should contain detailed synthetic monitor information
    And the response should include script content if applicable
    And the response should include comprehensive monitor configuration 