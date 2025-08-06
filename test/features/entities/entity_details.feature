Feature: Entity Details Resource
  As an AI application
  I want to retrieve detailed information about specific entities
  So that I can understand the complete state and configuration of New Relic resources

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: Retrieve APM application details
    Given I have a valid APM application GUID
    When I access the "newrelic://entity/{guid}" resource with the GUID
    Then the response should contain APM application details
    And the response should include language information
    And the response should include agent versions
    And the response should include application instances
    And the response should be valid JSON

  Scenario: Retrieve infrastructure host details
    Given I have a valid infrastructure host GUID
    When I access the "newrelic://entity/{guid}" resource with the GUID
    Then the response should contain host details
    And the response should include CPU utilization
    And the response should include memory usage
    And the response should include disk usage
    And the response should include network statistics
    And the response should include operating system information

  Scenario: Retrieve synthetic monitor details
    Given I have a valid synthetic monitor GUID
    When I access the "newrelic://entity/{guid}" resource with the GUID
    Then the response should contain monitor details
    And the response should include monitor type
    And the response should include check period
    And the response should include locations
    And the response should include status information
    And the response should include script content if applicable

  Scenario: Retrieve dashboard details
    Given I have a valid dashboard GUID
    When I access the "newrelic://entity/{guid}" resource with the GUID
    Then the response should contain dashboard details
    And the response should include pages information
    And the response should include widgets information
    And the response should include visualization types
    And the response should include widget configurations

  Scenario: Retrieve browser application details
    Given I have a valid browser application GUID
    When I access the "newrelic://entity/{guid}" resource with the GUID
    Then the response should contain browser application details
    And the response should include serving agent version
    And the response should include application settings
    And the response should include application ID

  Scenario: Retrieve mobile application details
    Given I have a valid mobile application GUID
    When I access the "newrelic://entity/{guid}" resource with the GUID
    Then the response should contain mobile application details
    And the response should include platform information
    And the response should include version details
    And the response should include mobile-specific metrics

  Scenario: Handle invalid GUID
    Given I provide an invalid entity GUID
    When I access the "newrelic://entity/{guid}" resource
    Then the response should contain an error message
    And the error should indicate "Valid entity GUID must be provided"

  Scenario: Handle non-existent entity
    Given I provide a valid GUID format for a non-existent entity
    When I access the "newrelic://entity/{guid}" resource
    Then the response should contain an error message
    And the error should indicate that the entity was not found

  Scenario: Handle API errors
    Given the New Relic API returns an error for the entity query
    When I access the "newrelic://entity/{guid}" resource
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario: Resource discovery
    When I request the list of available resource templates
    Then the "newrelic://entity/{guid}" resource template should be present
    And the resource template should have the correct MIME type
    And the resource template should have a description explaining its purpose
    And the resource template should specify the GUID parameter

  Scenario: Resource content format
    Given I access the "newrelic://entity/{guid}" resource with a valid GUID
    When I receive the resource content
    Then the content should be in JSON format
    And the content should have the MIME type "application/json"
    And the JSON should contain comprehensive entity information
    And the JSON should include common fields like GUID, name, and account ID

  Scenario: Entity-specific information
    Given I access the "newrelic://entity/{guid}" resource for different entity types
    When I receive the entity details
    Then the response should include type-specific information
    And the response should include common fields for all entity types
    And the response should include domain-specific details

  Scenario: Entity relationships
    Given I access the "newrelic://entity/{guid}" resource for an entity with relationships
    When I receive the entity details
    Then the response should include relationship information
    And the relationships should show source and target entities
    And the relationships should include relationship types
    And the relationships should include entity GUIDs and names

  Scenario: Alert information
    Given I access the "newrelic://entity/{guid}" resource for an entity with alerts
    When I receive the entity details
    Then the response should include alert severity information
    And the response should include recent alert violations
    And the response should include alert conditions
    And the response should include policy information

  Scenario: Entity tags
    Given I access the "newrelic://entity/{guid}" resource for an entity with tags
    When I receive the entity details
    Then the response should include tag information
    And the tags should include key-value pairs
    And the tags should be properly structured

  Scenario: Entity reporting status
    Given I access the "newrelic://entity/{guid}" resource
    When I receive the entity details
    Then the response should include reporting status
    And the response should indicate whether the entity is currently reporting
    And the response should include reporting timestamps

  Scenario: Entity permalink
    Given I access the "newrelic://entity/{guid}" resource
    When I receive the entity details
    Then the response should include a permalink
    And the permalink should be a valid New Relic URL
    And the permalink should directly link to the entity in the New Relic UI

  Scenario: Cross-account entity access
    Given I access the "newrelic://entity/{guid}" resource for an entity in a different account
    When I receive the entity details
    Then the response should contain the correct entity information
    And the response should indicate the correct account ID
    And the access should be allowed if the API key has permissions

  Scenario: Resource parameter completion
    Given I start typing a GUID for the "newrelic://entity/{guid}" resource
    When I request parameter completion
    Then the system should suggest valid entity GUIDs
    And the suggestions should be based on accessible entities
    And the suggestions should include entity names for context

  Scenario: Resource caching
    Given I access the "newrelic://entity/{guid}" resource multiple times with the same GUID
    When I receive the responses
    Then each response should contain the same entity information
    And the responses should be consistent
    And the responses should reflect the current state of the entity

  Scenario: Large entity data handling
    Given I access the "newrelic://entity/{guid}" resource for an entity with large amounts of data
    When I receive the entity details
    Then the response should be properly formatted
    And the response should not be truncated
    And the response should include all relevant information
    And the response should be valid JSON despite the size 