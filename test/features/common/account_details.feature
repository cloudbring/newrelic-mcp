Feature: Account Details Resource
  As an AI application
  I want to access basic account information
  So that I can understand the New Relic account context

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: Retrieve account details successfully
    Given I have a valid New Relic account ID
    When I access the "newrelic://account_details" resource
    Then the response should contain account information
    And the response should include the account ID
    And the response should include the account name
    And the response should be valid JSON
    And no errors should be present

  Scenario: Handle missing account ID configuration
    Given no account ID is configured globally
    When I access the "newrelic://account_details" resource
    Then the response should contain an error message
    And the error should indicate "NEW_RELIC_ACCOUNT_ID not configured"

  Scenario: Handle invalid account ID
    Given an invalid account ID is configured
    When I access the "newrelic://account_details" resource
    Then the response should contain an error message
    And the error should indicate that the account was not found

  Scenario: Handle API errors
    Given the New Relic API returns an error for the account query
    When I access the "newrelic://account_details" resource
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario: Resource discovery
    When I request the list of available resources
    Then the "newrelic://account_details" resource should be present
    And the resource should have the correct MIME type
    And the resource should have a description explaining its purpose

  Scenario: Resource content format
    Given I access the "newrelic://account_details" resource
    When I receive the resource content
    Then the content should be in JSON format
    And the content should have the MIME type "application/json"
    And the JSON should contain a "data" wrapper
    And the data should contain account information

  Scenario: Resource metadata
    When I access the "newrelic://account_details" resource
    Then the resource should include metadata
    And the metadata should indicate the content type
    And the metadata should include the resource URI
    And the metadata should include a description

  Scenario: Cross-account support
    Given I have access to multiple New Relic accounts
    When I access the "newrelic://account_details" resource
    Then the response should contain information for the configured account
    And the account ID should match the configured value

  Scenario: Sensitive data exclusion
    Given I access the "newrelic://account_details" resource
    When I receive the account details
    Then the response should not contain sensitive information like license keys
    And the response should only include basic account information

  Scenario: Resource caching
    Given I access the "newrelic://account_details" resource multiple times
    When I receive the responses
    Then each response should contain the same account information
    And the responses should be consistent

  Scenario: Resource availability
    Given the MCP server is running
    When I check for available resources
    Then the "newrelic://account_details" resource should be available
    And the resource should be accessible without additional parameters 