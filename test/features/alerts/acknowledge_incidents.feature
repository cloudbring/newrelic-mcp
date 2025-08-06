Feature: Incident Acknowledgment
  As an AI application
  I want to acknowledge open alert incidents
  So that I can manage incident lifecycle and response

  Background:
    Given the MCP server is running
    And the New Relic API key is configured
    And the New Relic account ID is configured

  Scenario: Acknowledge incident successfully
    Given I have an open incident with ID 12345
    When I call the "acknowledge_alert_incident" tool with the incident ID
    Then the response should contain the acknowledged incident details
    And the incident state should be "ACKNOWLEDGED"
    And the response should include acknowledgedBy information
    And the response should include acknowledgedAt timestamp
    And the response should be valid JSON

  Scenario: Acknowledge incident with message
    Given I have an open incident with ID 12345
    And I want to include an acknowledgment message
    When I call the "acknowledge_alert_incident" tool with incident ID and message
    Then the response should contain the acknowledged incident details
    And the incident should be acknowledged with the provided message
    And the message should be properly stored with the acknowledgment

  Scenario: Acknowledge incident in specific account
    Given I have an open incident in a specific account
    When I call the "acknowledge_alert_incident" tool with incident ID and account ID
    Then the incident should be acknowledged in the specified account
    And the response should indicate the correct account ID

  Scenario: Handle invalid incident ID
    Given I provide an invalid incident ID
    When I call the "acknowledge_alert_incident" tool
    Then the response should contain an error message
    And the error should indicate that a valid positive integer incident ID is required

  Scenario: Handle non-existent incident
    Given I provide a valid incident ID for a non-existent incident
    When I call the "acknowledge_alert_incident" tool
    Then the response should contain an error message
    And the error should indicate that the incident was not found

  Scenario: Handle already acknowledged incident
    Given I try to acknowledge an incident that is already acknowledged
    When I call the "acknowledge_alert_incident" tool
    Then the response should contain an error message
    And the error should indicate that the incident is already acknowledged

  Scenario: Handle closed incident
    Given I try to acknowledge an incident that is already closed
    When I call the "acknowledge_alert_incident" tool
    Then the response should contain an error message
    And the error should indicate that the incident cannot be acknowledged

  Scenario: Handle missing account ID
    Given no account ID is configured globally
    And no account ID is provided as parameter
    When I call the "acknowledge_alert_incident" tool
    Then the response should contain an error message
    And the error should indicate "Account ID must be provided"

  Scenario: Handle invalid account ID
    Given I provide an invalid account ID
    When I call the "acknowledge_alert_incident" tool
    Then the response should contain an error message
    And the error should indicate that the account was not found

  Scenario: Handle API errors
    Given the New Relic API returns an error during incident acknowledgment
    When I call the "acknowledge_alert_incident" tool
    Then the response should contain the API error
    And the error should be properly formatted
    And the response should still be valid JSON

  Scenario: Acknowledge incident without message
    Given I have an open incident with ID 12345
    When I call the "acknowledge_alert_incident" tool without a message
    Then the response should contain the acknowledged incident details
    And the incident should be acknowledged successfully
    And the acknowledgment should be recorded without a message

  Scenario: Acknowledge incident with long message
    Given I have an open incident with ID 12345
    And I provide a very long acknowledgment message
    When I call the "acknowledge_alert_incident" tool with the long message
    Then the response should contain the acknowledged incident details
    And the long message should be properly stored
    And the message should not be truncated

  Scenario: Acknowledge incident with special characters in message
    Given I have an open incident with ID 12345
    And I provide a message with special characters
    When I call the "acknowledge_alert_incident" tool with the special message
    Then the response should contain the acknowledged incident details
    And the special characters should be properly handled
    And the message should be preserved correctly

  Scenario: Tool discovery
    When I request the list of available tools
    Then the "acknowledge_alert_incident" tool should be present
    And the tool should have the correct schema definition
    And the tool should have a description explaining its purpose
    And the tool should specify that it requires an incident ID and account ID

  Scenario: Tool schema validation
    Given I call the "acknowledge_alert_incident" tool with invalid input types
    When the tool validates the input schema
    Then the tool should reject invalid inputs
    And provide appropriate error messages

  Scenario: Incident acknowledgment performance
    Given I call the "acknowledge_alert_incident" tool
    When the tool executes the acknowledgment
    Then the response should be returned within a reasonable time
    And the incident should be acknowledged successfully
    And the acknowledgment should be immediately reflected

  Scenario: Incident acknowledgment integration
    Given I acknowledge an incident
    When I list open incidents after acknowledgment
    Then the acknowledged incident should no longer appear in the open incidents list
    And the incident should have the correct state
    And the acknowledgment should be properly recorded

  Scenario: Incident acknowledgment with different account permissions
    Given I have different levels of account access
    When I try to acknowledge incidents in different accounts
    Then the tool should handle account access permissions correctly
    And the tool should provide appropriate error messages for inaccessible accounts
    And the tool should allow acknowledgment for accessible accounts

  Scenario: Incident acknowledgment data integrity
    Given I acknowledge multiple incidents
    When I check the acknowledgment details
    Then each acknowledgment should have a unique incident ID
    And each acknowledgment should have a valid timestamp
    And each acknowledgment should include the correct user information
    And the acknowledgment data should be consistent and complete

  Scenario: Incident acknowledgment audit trail
    Given I acknowledge an incident with a message
    When I check the incident history
    Then the acknowledgment should be properly recorded
    And the acknowledgment message should be preserved
    And the acknowledgment timestamp should be accurate
    And the acknowledgment user should be correctly identified

  Scenario: Incident acknowledgment edge cases
    Given I test various edge cases for incident acknowledgment
    When I call the "acknowledge_alert_incident" tool with edge case inputs
    Then the tool should handle negative incident IDs appropriately
    And the tool should handle zero incident IDs appropriately
    And the tool should handle very large incident IDs appropriately
    And the tool should handle empty messages appropriately

  Scenario: Incident acknowledgment consistency
    Given I acknowledge an incident
    When I check the incident state multiple times
    Then the incident should consistently show as acknowledged
    And the acknowledgment details should remain consistent
    And the incident should not revert to open state

  Scenario: Incident acknowledgment with concurrent access
    Given multiple users try to acknowledge the same incident
    When the acknowledgment requests are processed
    Then only one acknowledgment should succeed
    And the other requests should receive appropriate error messages
    And the incident should not be acknowledged multiple times

  Scenario: Incident acknowledgment message validation
    Given I try to acknowledge an incident with various message types
    When I call the "acknowledge_alert_incident" tool with different message formats
    Then the tool should accept valid message strings
    And the tool should handle null/undefined messages appropriately
    And the tool should handle empty string messages appropriately
    And the tool should reject invalid message types

  Scenario: Incident acknowledgment integration with entity details
    Given I acknowledge an incident for a specific entity
    When I access the entity details
    Then the entity should reflect the updated incident state
    And the recent alert violations should be updated
    And the acknowledgment should be visible in the entity context 