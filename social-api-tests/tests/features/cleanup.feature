Feature: Test cleanup

  Scenario: Delete the friendship at the end of testing
    Given the user "Alice" is registered
    And the user "Bob" is registered
    And "Alice" has a session token
    When "Alice" deletes the friendship with "Bob"
    Then the friendship between "Alice" and "Bob" should be deleted successfully