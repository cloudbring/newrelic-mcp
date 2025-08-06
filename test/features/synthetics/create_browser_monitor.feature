Feature: Create Simple Browser Monitor
  As an AI application
  I want to create simple browser monitors
  So that I can monitor website availability and performance

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: Create simple browser monitor successfully
    Given I want to create a browser monitor for "https://example.com"
    And I provide a monitor name "Homepage Monitor"
    And I provide locations ["AWS_US_EAST_1"]
    When I call the "create_simple_browser_monitor" tool with the required parameters
    Then the response should contain the new monitor's GUID
    And the response should contain the monitor name
    And the response should contain the monitor URL
    And the response should contain the monitor status
    And the response should be valid JSON
    And no errors should be present

  Scenario: Create browser monitor with all optional parameters
    Given I want to create a browser monitor with all parameters
    And I provide a monitor name "API Health Check"
    And I provide URL "https://api.example.com/health"
    And I provide locations ["AWS_US_EAST_1", "AWS_US_WEST_2"]
    And I provide period "EVERY_5_MINUTES"
    And I provide status "ENABLED"
    And I provide tags [{"key": "team", "value": "frontend"}]
    When I call the "create_simple_browser_monitor" tool with all parameters
    Then the response should contain the new monitor's GUID
    And the response should include all specified parameters
    And the monitor should be created with the correct configuration

  Scenario: Create browser monitor with default parameters
    Given I want to create a browser monitor with minimal parameters
    And I provide only the required parameters (name, URL, locations)
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain the new monitor's GUID
    And the monitor should be created with default period "EVERY_15_MINUTES"
    And the monitor should be created with default status "ENABLED"
    And the monitor should not have any tags

  Scenario: Create browser monitor in specific account
    Given I want to create a browser monitor in a specific account
    And I provide a target account ID
    When I call the "create_simple_browser_monitor" tool with the account ID
    Then the monitor should be created in the specified account
    And the response should indicate the correct account ID

  Scenario: Handle missing required parameters
    Given I call the "create_simple_browser_monitor" tool without required parameters
    When the tool validates the input
    Then the response should contain an error message
    And the error should indicate that required parameters are missing

  Scenario: Handle invalid URL
    Given I provide an invalid URL for the monitor
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain an error message
    And the error should indicate that the URL is invalid

  Scenario: Handle invalid locations
    Given I provide invalid location values
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain an error message
    And the error should indicate that locations must be a list of strings

  Scenario: Handle invalid period
    Given I provide an invalid period value
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain an error message
    And the error should list valid period options

  Scenario: Handle invalid status
    Given I provide an invalid status value
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain an error message
    And the error should indicate that status must be ENABLED or DISABLED

  Scenario: Handle invalid tags format
    Given I provide tags in an invalid format
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain an error message
    And the error should indicate that tags must be a list of key-value objects

  Scenario: Handle missing account ID
    Given no account ID is configured globally
    And no account ID is provided as parameter
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain an error message
    And the error should indicate "Account ID must be provided"

  Scenario: Handle API errors
    Given the New Relic API returns an error during monitor creation
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario: Handle duplicate monitor name
    Given I try to create a monitor with a name that already exists
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain an error message
    And the error should indicate that the monitor name already exists

  Scenario: Handle invalid account ID
    Given I provide an invalid account ID
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain an error message
    And the error should indicate that the account was not found

  Scenario: Validate period options
    Given I want to create monitors with different periods
    When I call the "create_simple_browser_monitor" tool with various periods
    Then the tool should accept valid periods
    And the tool should reject invalid periods
    And the valid periods should include: EVERY_MINUTE, EVERY_5_MINUTES, EVERY_10_MINUTES, EVERY_15_MINUTES, EVERY_30_MINUTES, EVERY_HOUR, EVERY_6_HOURS, EVERY_12_HOURS, EVERY_DAY

  Scenario: Validate location options
    Given I want to create monitors with different locations
    When I call the "create_simple_browser_monitor" tool with various locations
    Then the tool should accept valid location labels
    And the tool should reject invalid location labels
    And the locations should be properly validated against New Relic's available locations

  Scenario: Monitor creation with tags
    Given I want to create a monitor with multiple tags
    And I provide tags [{"key": "team", "value": "frontend"}, {"key": "env", "value": "production"}]
    When I call the "create_simple_browser_monitor" tool
    Then the response should contain the monitor with the specified tags
    And the tags should be properly applied to the monitor

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "create_simple_browser_monitor" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose
    And the tool should specify all required and optional parameters

  Scenario: Tool schema validation
    Given I call the "create_simple_browser_monitor" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

  Scenario: Monitor creation performance
    Given I call the "create_simple_browser_monitor" tool
    When the tool executes the creation
    Then the response should be returned within a reasonable time
    And the monitor should be created successfully
    And the monitor should be immediately available for use

  Scenario: Monitor creation integration
    Given I create a new browser monitor
    When I list synthetic monitors after creation
    Then the new monitor should appear in the list
    And the monitor should have the correct configuration
    And the monitor should be accessible via the entity details resource

  Scenario: Monitor creation with special characters
    Given I want to create a monitor with special characters in the name
    When I call the "create_simple_browser_monitor" tool
    Then the monitor should be created successfully
    And the special characters should be handled properly
    And the monitor name should be preserved correctly

  Scenario: Monitor creation with long names
    Given I want to create a monitor with a very long name
    When I call the "create_simple_browser_monitor" tool
    Then the monitor should be created successfully
    And the long name should be handled properly
    And the name should not be truncated

  Scenario: Monitor creation with complex URLs
    Given I want to create a monitor with a complex URL (with query parameters, etc.)
    When I call the "create_simple_browser_monitor" tool
    Then the monitor should be created successfully
    And the complex URL should be handled properly
    And the URL should be preserved correctly 